"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { slugify } from "@/lib/slug";
import { communitySchema, communityIdSchema } from "@/features/communities/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateCommunities() {
  revalidatePath("/admin/comunidades");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/insignias");
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
    description: readField(formData, "description") || undefined,
    color: readField(formData, "color") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { name, description, color } = parsed.data;

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
          description: description ?? null,
          color: color ?? "#4b50a8",
          slug,
        },
      });

      await recordAudit(
        {
          actor,
          action: "community.create",
          entityType: "Community",
          entityId: created.id,
          after: { name, description, color, slug },
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
  const actor = await requirePermission("community:manage");

  const idParsed = communityIdSchema.safeParse({
    id: readField(formData, "id"),
  });

  if (!idParsed.success) {
    return { error: firstIssue(idParsed.error) };
  }

  const parsed = communitySchema.safeParse({
    name: readField(formData, "name"),
    description: readField(formData, "description") || undefined,
    color: readField(formData, "color") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { id } = idParsed.data;
  const { name, description, color } = parsed.data;

  const current = await prisma.community.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, description: true, color: true, slug: true },
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
          after: { name, description, color, slug },
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
