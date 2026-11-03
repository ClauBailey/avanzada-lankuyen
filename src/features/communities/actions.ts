"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canEditCommunityIdentity, canManageCommunityRoles, systemRoleForCommunityRole } from "@/lib/community-rules";
import { firstIssue, readField } from "@/lib/form-data";
import { slugify } from "@/lib/slug";
import {
  communityMemberRoleSchema,
  communitySchema,
  communityIdSchema,
} from "@/features/communities/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateCommunities() {
  revalidatePath("/admin/comunidades");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/insignias");
  revalidatePath("/mi-comunidad");
  revalidatePath("/miembros");
  revalidatePath("/", "layout");
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function buildUniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const existing = await prisma.community.findFirst({
      where: {
        slug: candidate,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createCommunityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("community:manage");

  const parsed = communitySchema.safeParse({
    name: readField(formData, "name"),
    motto: readField(formData, "motto") || undefined,
    description: readField(formData, "description") || undefined,
    color: readField(formData, "color") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { name, motto, description, color } = parsed.data;

  const duplicate = await prisma.community.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "Ya existe una comunidad activa con ese nombre." };
  }

  try {
    const slug = await buildUniqueSlug(name);

    await prisma.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: {
          name,
          motto: motto ?? null,
          description: description ?? null,
          color: color ?? "#4527a0",
          slug,
        },
      });

      await recordAudit(
        {
          actor,
          action: "community.create",
          entityType: "Community",
          entityId: created.id,
          after: { name, motto: motto ?? null, description, color, slug },
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Ya existe una comunidad con ese nombre." };
    }
    throw error;
  }

  revalidateCommunities();
  return { success: `Comunidad «${name}» creada.` };
}

export async function updateCommunityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("community:identity_edit");

  const idParsed = communityIdSchema.safeParse({
    id: readField(formData, "id"),
  });

  if (!idParsed.success) {
    return { error: firstIssue(idParsed.error) };
  }

  const { id } = idParsed.data;

  if (!canEditCommunityIdentity(actor, id)) {
    return {
      error: "Solo puedes editar la identidad de tu propia comunidad.",
    };
  }

  const parsed = communitySchema.safeParse({
    name: readField(formData, "name"),
    motto: readField(formData, "motto") || undefined,
    description: readField(formData, "description") || undefined,
    color: readField(formData, "color") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { name, motto, description, color } = parsed.data;

  const current = await prisma.community.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      motto: true,
      description: true,
      color: true,
      slug: true,
    },
  });

  if (!current) {
    return { error: "La comunidad ya no existe." };
  }

  const duplicate = await prisma.community.findFirst({
    where: {
      id: { not: id },
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "Otra comunidad activa ya usa ese nombre." };
  }

  try {
    const slug =
      current.name === name ? current.slug : await buildUniqueSlug(name, id);

    await prisma.$transaction(async (tx) => {
      await tx.community.update({
        where: { id },
        data: {
          name,
          motto: motto ?? null,
          description: description ?? null,
          color: color ?? current.color,
          slug,
        },
      });

      await recordAudit(
        {
          actor,
          action: "community.update",
          entityType: "Community",
          entityId: id,
          before: current,
          after: { name, motto: motto ?? null, description, color, slug },
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Otra comunidad activa ya usa ese nombre." };
    }
    throw error;
  }

  revalidateCommunities();
  return { success: "Comunidad actualizada." };
}

export async function toggleCommunityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("community:manage");

  const parsed = communityIdSchema.safeParse({
    id: readField(formData, "id"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { id } = parsed.data;

  const community = await prisma.community.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true, deletedAt: true },
  });

  if (!community) {
    return { error: "La comunidad ya no existe." };
  }

  const willDeactivate = community.isActive;

  if (!willDeactivate) {
    const duplicate = await prisma.community.findFirst({
      where: {
        id: { not: id },
        name: { equals: community.name, mode: "insensitive" },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (duplicate) {
      return {
        error:
          "No se puede reactivar: otra comunidad activa usa el mismo nombre.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.community.update({
      where: { id },
      data: willDeactivate
        ? { isActive: false, deletedAt: new Date() }
        : { isActive: true, deletedAt: null },
    });

    await recordAudit(
      {
        actor,
        action: willDeactivate ? "community.deactivate" : "community.activate",
        entityType: "Community",
        entityId: id,
        before: { isActive: community.isActive },
        after: { isActive: !willDeactivate },
      },
      tx,
    );
  });

  revalidateCommunities();
  return {
    success: willDeactivate
      ? "Comunidad desactivada. Sus miembros conservan la asignación hasta que los muevas."
      : "Comunidad reactivada.",
  };
}

/**
 * Rotación de cargos internos de una comunidad.
 *
 * AA puede operar en cualquier comunidad; COORDINADOR solo en la propia.
 * Al asignar el cargo interno COORDINADOR se sincroniza el rol de sistema y se
 * retira el cargo a cualquier otra persona para mantener un único coordinador.
 */
export async function setCommunityMemberRoleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("community:roles_manage");

  const parsed = communityMemberRoleSchema.safeParse({
    communityId: readField(formData, "communityId"),
    userId: readField(formData, "userId"),
    role: readField(formData, "role"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { communityId, userId } = parsed.data;
  const role = (parsed.data.role || null) as
    | "COORDINADOR"
    | "SECRETARIO"
    | "TESORERO"
    | "ADMINISTRADOR"
    | null;

  if (!canManageCommunityRoles(actor, communityId)) {
    return {
      error: "Solo puedes rotar cargos en tu propia comunidad.",
    };
  }

  const [community, target] = await Promise.all([
    prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.user.findFirst({
      where: {
        id: userId,
        communityId,
        role: { in: ["PP", "COORDINADOR"] },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        role: true,
        communityRole: true,
      },
    }),
  ]);

  if (!community) return { error: "La comunidad ya no existe." };
  if (!target) {
    return { error: "El miembro no pertenece a esta comunidad." };
  }

  if (target.communityRole === role) {
    return { success: "El cargo ya está asignado." };
  }

  const nextSystemRole = systemRoleForCommunityRole(role);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.communityRoleHistory.updateMany({
      where: { userId, communityId, endedAt: null },
      data: { endedAt: now },
    });

    if (role === "COORDINADOR") {
      const previousCoordinators = await tx.user.findMany({
        where: {
          communityId,
          communityRole: "COORDINADOR",
          id: { not: userId },
          deletedAt: null,
        },
        select: { id: true },
      });

      for (const previous of previousCoordinators) {
        await tx.user.update({
          where: { id: previous.id },
          data: { communityRole: null, role: "PP" },
        });
        await tx.communityRoleHistory.updateMany({
          where: {
            userId: previous.id,
            communityId,
            endedAt: null,
          },
          data: { endedAt: now },
        });
        await recordAudit(
          {
            actor,
            action: "community.role_rotate",
            entityType: "User",
            entityId: previous.id,
            before: { communityRole: "COORDINADOR", role: "COORDINADOR" },
            after: { communityRole: null, role: "PP", communityId },
          },
          tx,
        );
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: { communityRole: role, role: nextSystemRole },
    });

    if (role) {
      await tx.communityRoleHistory.create({
        data: {
          communityId,
          userId,
          role,
          assignedAt: now,
        },
      });
    }

    await recordAudit(
      {
        actor,
        action: role ? "community.role_assign" : "community.role_remove",
        entityType: "User",
        entityId: userId,
        before: {
          communityRole: target.communityRole,
          role: target.role,
        },
        after: {
          communityRole: role,
          role: nextSystemRole,
          communityId,
          communityName: community.name,
        },
      },
      tx,
    );
  });

  revalidateCommunities();

  return {
    success: role
      ? "Cargo interno actualizado y rol de sistema sincronizado."
      : "Cargo interno retirado. La persona vuelve a su rol de pionero o pionera.",
  };
}
