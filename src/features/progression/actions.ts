"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import {
  badgeCatalogSchema,
  grantBadgeSchema,
  revokeBadgeSchema,
  saveReflectionSchema,
} from "@/features/progression/schemas";
import type { ReflectionState } from "@/features/progression/types";
import { recordAudit } from "@/server/audit";
import { requirePermission, requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { enqueuePushNotification } from "@/server/web-push";

function revalidateProgression(userId?: string) {
  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/notificaciones");
  revalidatePath("/admin/insignias");
  revalidatePath("/admin/usuarios");
  if (userId) {
    revalidatePath(`/admin/usuarios/${userId}`);
  }
}

/**
 * Reflexión personal "¿Qué sentiste en esta etapa?".
 * La persona puede escribir, editar o vaciar su texto en cualquier momento.
 */
export async function saveStageReflectionAction(
  _prevState: ReflectionState,
  formData: FormData,
): Promise<ReflectionState> {
  const user = await requireReadyUser();

  if (user.role === "AA") {
    return {
      error: "Las cuentas AA no registran reflexiones de etapa.",
    };
  }

  const parsed = saveReflectionSchema.safeParse({
    stageCode: readField(formData, "stageCode"),
    content: readField(formData, "content"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const content = parsed.data.content.trim();
  const { stageCode } = parsed.data;

  if (content.length === 0) {
    await prisma.stageReflection.deleteMany({
      where: { userId: user.id, stageCode },
    });

    revalidateProgression();
    return { success: "Reflexión eliminada.", savedAt: null };
  }

  const reflection = await prisma.stageReflection.upsert({
    where: { userId_stageCode: { userId: user.id, stageCode } },
    create: { userId: user.id, stageCode, content },
    update: { content },
    select: { updatedAt: true },
  });

  revalidateProgression();

  return {
    success: "Guardado",
    savedAt: reflection.updatedAt.toISOString(),
  };
}

export async function grantBadgeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("badge:grant");

  const parsed = grantBadgeSchema.safeParse({
    userId: readField(formData, "userId"),
    badgeId: readField(formData, "badgeId"),
    note: readField(formData, "note") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId, badgeId, note } = parsed.data;

  const [target, badge, existing] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, firstName: true, role: true, isActive: true },
    }),
    prisma.badge.findFirst({
      where: { id: badgeId, isActive: true },
      select: { id: true, name: true, code: true, category: true },
    }),
    prisma.userBadge.findFirst({
      where: { userId, badgeId, revokedAt: null },
      select: { id: true },
    }),
  ]);

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  if (target.role === "AA") {
    return {
      error: "Los Adultos Acompañantes no reciben insignias.",
    };
  }

  if (!target.isActive) {
    return {
      error: "Reactiva la cuenta antes de otorgar insignias.",
    };
  }

  if (!badge) {
    return { error: "La insignia no existe o está desactivada." };
  }

  if (existing) {
    return { error: "Esta persona ya tiene esa insignia activa." };
  }

  await prisma.$transaction(async (tx) => {
    const grant = await tx.userBadge.create({
      data: {
        userId,
        badgeId,
        grantedById: actor.id,
        note: note ?? null,
      },
      select: { id: true, grantedAt: true },
    });

    await notifyUser(
      {
        recipientId: userId,
        type: "INSIGNIA_OTORGADA",
        title: `Recibiste la insignia «${badge.name}»`,
        body: note
          ? `Tu Adulto Acompañante dejó una dedicatoria: «${note}»`
          : "Ya está disponible a todo color en tu perfil de progresión.",
        actionUrl: "/perfil",
        entityType: "Badge",
        entityId: badge.id,
        dedupeKey: `badge-grant:${grant.id}`,
        priority: 1,
      },
      tx,
    );

    await recordAudit(
      {
        actor,
        action: "badge.grant",
        entityType: "UserBadge",
        entityId: grant.id,
        after: {
          userId,
          badgeId,
          badgeCode: badge.code,
          badgeName: badge.name,
          category: badge.category,
          note: note ?? null,
        },
      },
      tx,
    );
  });

  // Post-commit: la insignia ya quedó otorgada antes de intentar el push.
  enqueuePushNotification(userId, {
    title: "¡Nueva Insignia Obtenida!",
    body: `Felicidades, has recibido la insignia: ${badge.name}.`,
    url: "/perfil",
    tag: `badge-${badge.code}`,
  });

  revalidateProgression(userId);

  return { success: `Insignia «${badge.name}» otorgada a ${target.firstName}.` };
}

export async function revokeBadgeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("badge:grant");

  const parsed = revokeBadgeSchema.safeParse({
    grantId: readField(formData, "grantId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { grantId } = parsed.data;

  const grant = await prisma.userBadge.findUnique({
    where: { id: grantId },
    select: {
      id: true,
      userId: true,
      badgeId: true,
      revokedAt: true,
      note: true,
      badge: { select: { name: true, code: true } },
    },
  });

  if (!grant) {
    return { error: "La concesión ya no existe." };
  }

  if (grant.revokedAt) {
    return { error: "Esta insignia ya fue revocada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userBadge.update({
      where: { id: grantId },
      data: { revokedAt: new Date(), revokedById: actor.id },
    });

    await recordAudit(
      {
        actor,
        action: "badge.revoke",
        entityType: "UserBadge",
        entityId: grant.id,
        before: { revokedAt: null, note: grant.note },
        after: {
          revokedAt: new Date().toISOString(),
          userId: grant.userId,
          badgeCode: grant.badge.code,
          badgeName: grant.badge.name,
        },
      },
      tx,
    );
  });

  revalidateProgression(grant.userId);

  return { success: `Insignia «${grant.badge.name}» revocada.` };
}

export async function updateBadgeCatalogAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("badge:catalog_manage");

  const parsed = badgeCatalogSchema.safeParse({
    badgeId: readField(formData, "badgeId"),
    name: readField(formData, "name"),
    description: readField(formData, "description"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { badgeId, name, description } = parsed.data;

  const current = await prisma.badge.findUnique({
    where: { id: badgeId },
    select: { id: true, name: true, description: true, code: true },
  });

  if (!current) {
    return { error: "La insignia ya no existe." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.badge.update({
      where: { id: badgeId },
      data: { name, description },
    });

    await recordAudit(
      {
        actor,
        action: "badge.catalog_update",
        entityType: "Badge",
        entityId: badgeId,
        before: { name: current.name, description: current.description },
        after: { name, description },
      },
      tx,
    );
  });

  revalidatePath("/admin/insignias");
  revalidatePath("/perfil");

  return { success: "Catálogo actualizado." };
}
