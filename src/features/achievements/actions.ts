"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import {
  createAchievementSchema,
  deleteAchievementSchema,
  grantAchievementSchema,
  revokeAchievementSchema,
} from "@/features/achievements/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";

function revalidateAchievements(username?: string) {
  revalidatePath("/logros");
  revalidatePath("/miembros");
  revalidatePath("/perfil");
  revalidatePath("/notificaciones");
  revalidatePath("/inicio");
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/", "layout");
  if (username) {
    revalidatePath(`/miembros/${username}`);
  }
}

function slugifyCode(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

  return base || "LOGRO";
}

export async function grantAchievementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("achievement:manage");

  const parsed = grantAchievementSchema.safeParse({
    targetUserId: readField(formData, "targetUserId"),
    achievementId: readField(formData, "achievementId"),
    note: readField(formData, "note") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { targetUserId, achievementId, note } = parsed.data;

  const [target, achievement, existing] = await Promise.all([
    prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: {
        id: true,
        username: true,
        firstName: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.achievement.findFirst({
      where: { id: achievementId, isActive: true },
      select: { id: true, title: true, code: true },
    }),
    prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: targetUserId,
          achievementId,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  if (target.role === "AA") {
    return { error: "Los Adultos Acompañantes no reciben logros." };
  }

  if (!target.isActive) {
    return { error: "Reactiva la cuenta antes de otorgar logros." };
  }

  if (!achievement) {
    return { error: "El logro no existe o está desactivado." };
  }

  if (existing) {
    return { error: "Esta persona ya tiene ese logro." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAchievement.create({
      data: {
        userId: targetUserId,
        achievementId,
        awardedById: actor.id,
        note: note ?? null,
      },
    });

    await notifyUser(
      {
        recipientId: targetUserId,
        type: "LOGRO_DESBLOQUEADO",
        title: `¡Has desbloqueado el logro: ${achievement.title}!`,
        body: note
          ? `Tu AA registró este logro con una nota: ${note}`
          : "Tu AA reconoció este logro en tu camino. Revísalo en tu vitrina personal.",
        entityType: "Achievement",
        entityId: achievement.id,
        actionUrl: "/logros",
      },
      tx,
    );

    await recordAudit(
      {
        actor,
        action: "achievement.grant",
        entityType: "UserAchievement",
        entityId: achievement.id,
        after: {
          targetUserId,
          achievementCode: achievement.code,
          note: note ?? null,
        },
      },
      tx,
    );
  });

  revalidateAchievements(target.username);

  return {
    success: `Logro «${achievement.title}» otorgado a ${target.firstName}.`,
  };
}

export async function revokeAchievementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("achievement:manage");

  const parsed = revokeAchievementSchema.safeParse({
    targetUserId: readField(formData, "targetUserId"),
    achievementId: readField(formData, "achievementId"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { targetUserId, achievementId } = parsed.data;

  const [target, achievement, existing] = await Promise.all([
    prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, username: true, firstName: true },
    }),
    prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, title: true, code: true },
    }),
    prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: targetUserId,
          achievementId,
        },
      },
      select: { id: true, note: true },
    }),
  ]);

  if (!target || !achievement) {
    return { error: "El logro o la cuenta ya no existen." };
  }

  if (!existing) {
    return { error: "Esta persona no tiene ese logro." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAchievement.delete({ where: { id: existing.id } });

    await recordAudit(
      {
        actor,
        action: "achievement.revoke",
        entityType: "UserAchievement",
        entityId: achievement.id,
        before: {
          targetUserId,
          achievementCode: achievement.code,
          note: existing.note,
        },
      },
      tx,
    );
  });

  revalidateAchievements(target.username);

  return {
    success: `Logro «${achievement.title}» retirado de ${target.firstName}.`,
  };
}

export async function createAchievementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("achievement:manage");

  const parsed = createAchievementSchema.safeParse({
    title: readField(formData, "title"),
    description: readField(formData, "description"),
    hint: readField(formData, "hint") || undefined,
    icon: readField(formData, "icon"),
    category: readField(formData, "category"),
    visibility: readField(formData, "visibility"),
    points: readField(formData, "points") || "10",
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const data = parsed.data;
  const baseCode = slugifyCode(data.title);

  let code = baseCode;
  let suffix = 2;

  while (
    await prisma.achievement.findUnique({
      where: { code },
      select: { id: true },
    })
  ) {
    code = `${baseCode}_${suffix}`;
    suffix += 1;
  }

  const achievement = await prisma.$transaction(async (tx) => {
    const created = await tx.achievement.create({
      data: {
        code,
        title: data.title,
        description: data.description,
        hint: data.hint ?? null,
        icon: data.icon,
        category: data.category,
        visibility: data.visibility,
        points: data.points,
      },
      select: { id: true, title: true, code: true },
    });

    await recordAudit(
      {
        actor,
        action: "achievement.create",
        entityType: "Achievement",
        entityId: created.id,
        after: {
          code: created.code,
          title: created.title,
          category: data.category,
          visibility: data.visibility,
          points: data.points,
        },
      },
      tx,
    );

    return created;
  });

  revalidateAchievements();

  return { success: `Logro «${achievement.title}» creado en el catálogo.` };
}

/**
 * Elimina un logro del catálogo general. Solo un AA puede hacerlo.
 *
 * `UserAchievement.achievement` usa `onDelete: Cascade`, por lo que las
 * asignaciones y los puntos de rareza asociados desaparecen con el logro.
 */
export async function deleteAchievementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("achievement:manage");

  const parsed = deleteAchievementSchema.safeParse({
    achievementId: readField(formData, "achievementId"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const achievement = await prisma.achievement.findUnique({
    where: { id: parsed.data.achievementId },
    select: {
      id: true,
      code: true,
      title: true,
      category: true,
      visibility: true,
      points: true,
      _count: { select: { unlockedBy: true } },
    },
  });

  if (!achievement) {
    return { error: "El logro ya no existe." };
  }

  await prisma.$transaction(async (tx) => {
    await recordAudit(
      {
        actor,
        action: "achievement.delete",
        entityType: "Achievement",
        entityId: achievement.id,
        before: {
          code: achievement.code,
          title: achievement.title,
          category: achievement.category,
          visibility: achievement.visibility,
          points: achievement.points,
          unlockedCount: achievement._count.unlockedBy,
        },
      },
      tx,
    );

    await tx.achievement.delete({ where: { id: achievement.id } });
  });

  revalidateAchievements();

  return {
    success: `El logro «${achievement.title}» fue eliminado permanentemente.`,
  };
}
