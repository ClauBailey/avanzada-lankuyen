"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import {
  canAccessCommunityLog,
  canEditCommunityLogEntry,
} from "@/lib/community-log-rules";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import { communityLogEntrySchema } from "@/features/compass/schemas";
import { recordAudit } from "@/server/audit";
import { requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { can } from "@/server/rbac/can";

function revalidateCommunityLog() {
  revalidatePath("/mi-comunidad/bitacora");
  revalidatePath("/mi-comunidad");
  revalidatePath("/acompanamiento");
  revalidatePath("/inicio");
}

const ACCESS_DENIED =
  "La Bitácora de Comunidad pertenece solo a los miembros activos de esa comunidad.";

async function requireCommunityMember() {
  const actor = await requireReadyUser();

  if (
    !can(actor, "community_log:manage") ||
    !canAccessCommunityLog(actor, actor.communityId)
  ) {
    return { error: ACCESS_DENIED };
  }

  return { actor };
}

export async function saveCommunityLogEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await requireCommunityMember();
  if ("error" in access) return { error: access.error };
  const { actor } = access;

  const parsed = communityLogEntrySchema.safeParse({
    entryId: readField(formData, "entryId") || undefined,
    title: readField(formData, "title"),
    content: readField(formData, "content"),
    sharedWithAa: readField(formData, "sharedWithAa"),
    sharedWithCoordinators: readField(formData, "sharedWithCoordinators"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const communityId = actor.communityId;
  if (!communityId) {
    return { error: ACCESS_DENIED };
  }

  const values = {
    title: parsed.data.title.trim(),
    content: parsed.data.content.trim(),
    sharedWithAa: parsed.data.sharedWithAa,
    sharedWithCoordinators: parsed.data.sharedWithCoordinators,
  };

  if (parsed.data.entryId) {
    const entry = await prisma.communityLogEntry.findFirst({
      where: { id: parsed.data.entryId, communityId },
      select: {
        id: true,
        communityId: true,
        authorId: true,
        title: true,
        content: true,
        sharedWithAa: true,
        sharedWithCoordinators: true,
      },
    });

    if (
      !entry ||
      !canEditCommunityLogEntry(actor, entry)
    ) {
      return {
        error:
          "Solo puedes editar las entradas que tú escribiste en la bitácora de tu comunidad.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.communityLogEntry.update({
        where: { id: entry.id },
        data: values,
      });

      await recordAudit(
        {
          actor,
          action: "community_log.update",
          entityType: "CommunityLogEntry",
          entityId: entry.id,
          before: {
            title: entry.title,
            content: entry.content,
            sharedWithAa: entry.sharedWithAa,
            sharedWithCoordinators: entry.sharedWithCoordinators,
          },
          after: values,
        },
        tx,
      );
    });

    revalidateCommunityLog();
    return { success: "Entrada de la bitácora actualizada." };
  }

  await prisma.$transaction(async (tx) => {
    const entry = await tx.communityLogEntry.create({
      data: {
        communityId,
        authorId: actor.id,
        authorNameSnapshot: getDisplayName(actor).slice(0, 160),
        ...values,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "community_log.create",
        entityType: "CommunityLogEntry",
        entityId: entry.id,
        after: values,
      },
      tx,
    );
  });

  revalidateCommunityLog();
  return { success: "Entrada guardada en la bitácora de tu comunidad." };
}
