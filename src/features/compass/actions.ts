"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import {
  adoptTemplateObjectiveSchema,
  compassReflectionSchema,
  createCustomCompassObjectiveSchema,
  mentoringNoteSchema,
  requestCompassConsensusSchema,
  syncOfflineCompassEditsSchema,
  toggleCompassObjectiveSharingSchema,
  updateCompassObjectiveStatusSchema,
  updateCompassObjectiveTextSchema,
} from "@/features/compass/schemas";
import {
  reconcileOfflineObjectiveEdit,
} from "@/features/compass/offline-sync";
import {
  canRequestConsensus,
  canWriteCompass,
  versionsToAppend,
} from "@/features/compass/rules";
import { recordAudit } from "@/server/audit";
import { requireReadyUser, type SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { can } from "@/server/rbac/can";

const WRITE_DENIED =
  "Solo el joven titular puede escribir en su Brújula. Ningún adulto modifica objetivos, estados ni visibilidad.";

function revalidateCompass(targetUserId?: string) {
  revalidatePath("/brujula");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
  if (targetUserId) {
    revalidatePath(`/acompanamiento/${targetUserId}`);
  }
  revalidatePath("/acompanamiento");
}

/**
 * El actor debe ser el titular y tener el permiso de escritura.
 * El AA —incluido el encargado— nunca obtiene `compass:write`.
 */
async function requireCompassWriter(): Promise<
  { actor: SessionUser } | { error: string }
> {
  const actor = await requireReadyUser();

  if (!can(actor, "compass:write") || !canWriteCompass(actor, actor.id)) {
    return { error: WRITE_DENIED };
  }

  return { actor };
}

export async function adoptTemplateObjectiveAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = adoptTemplateObjectiveSchema.safeParse({
    templateId: readField(formData, "templateId"),
    currentText: readField(formData, "currentText") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const template = await prisma.compassObjectiveTemplate.findUnique({
    where: { id: parsed.data.templateId },
    select: {
      id: true,
      code: true,
      area: true,
      intermediateObjective: true,
    },
  });

  if (!template) {
    return { error: "Ese objetivo del catálogo ya no está disponible." };
  }

  const existing = await prisma.userCompassObjective.findFirst({
    where: { userId: actor.id, templateId: template.id },
    select: { id: true },
  });

  if (existing) {
    return {
      error:
        "Ya tienes este objetivo en tu Brújula. Puedes personalizar su redacción desde allí.",
    };
  }

  const currentText =
    parsed.data.currentText?.trim() || template.intermediateObjective;

  await prisma.$transaction(async (tx) => {
    const objective = await tx.userCompassObjective.create({
      data: {
        userId: actor.id,
        area: template.area,
        templateId: template.id,
        currentText,
      },
      select: { id: true },
    });

    await tx.userCompassObjectiveVersion.create({
      data: { objectiveId: objective.id, text: currentText },
    });

    await recordAudit(
      {
        actor,
        action: "compass.objective_adopt",
        entityType: "UserCompassObjective",
        entityId: objective.id,
        after: {
          templateCode: template.code,
          area: template.area,
          currentText,
        },
      },
      tx,
    );
  });

  revalidateCompass(actor.id);
  return { success: "Objetivo adoptado. Ahora es parte de tu Brújula." };
}

export async function updateCompassObjectiveTextAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = updateCompassObjectiveTextSchema.safeParse({
    objectiveId: readField(formData, "objectiveId"),
    currentText: readField(formData, "currentText"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const objective = await prisma.userCompassObjective.findFirst({
    where: { id: parsed.data.objectiveId, userId: actor.id },
    select: {
      id: true,
      currentText: true,
      versions: { select: { text: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!objective) {
    return { error: "Ese objetivo no pertenece a tu Brújula." };
  }

  const nextText = parsed.data.currentText.trim();
  const versions = versionsToAppend(objective.versions, nextText);

  if (versions.length === 0) {
    return { error: "La redacción es la misma que ya tienes guardada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userCompassObjective.update({
      where: { id: objective.id },
      data: { currentText: nextText },
    });

    await tx.userCompassObjectiveVersion.create({
      data: { objectiveId: objective.id, text: versions[0] },
    });

    await recordAudit(
      {
        actor,
        action: "compass.objective_reformulate",
        entityType: "UserCompassObjective",
        entityId: objective.id,
        before: { currentText: objective.currentText },
        after: { currentText: nextText },
      },
      tx,
    );
  });

  revalidateCompass(actor.id);
  return {
    success:
      "Redacción actualizada. Tu versión anterior quedó guardada en el historial.",
  };
}

export async function createCustomCompassObjectiveAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = createCustomCompassObjectiveSchema.safeParse({
    area: readField(formData, "area"),
    terminalObjectiveRef:
      readField(formData, "terminalObjectiveRef") || undefined,
    currentText: readField(formData, "currentText"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const currentText = parsed.data.currentText.trim();

  await prisma.$transaction(async (tx) => {
    const objective = await tx.userCompassObjective.create({
      data: {
        userId: actor.id,
        area: parsed.data.area,
        templateId: null,
        terminalObjectiveRef: parsed.data.terminalObjectiveRef ?? null,
        currentText,
      },
      select: { id: true },
    });

    await tx.userCompassObjectiveVersion.create({
      data: { objectiveId: objective.id, text: currentText },
    });

    await recordAudit(
      {
        actor,
        action: "compass.objective_create",
        entityType: "UserCompassObjective",
        entityId: objective.id,
        after: {
          area: parsed.data.area,
          terminalObjectiveRef: parsed.data.terminalObjectiveRef ?? null,
          currentText,
        },
      },
      tx,
    );
  });

  revalidateCompass(actor.id);
  return { success: "Objetivo propio creado en tu Brújula." };
}

export async function updateCompassObjectiveStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = updateCompassObjectiveStatusSchema.safeParse({
    objectiveId: readField(formData, "objectiveId"),
    status: readField(formData, "status"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const objective = await prisma.userCompassObjective.findFirst({
    where: { id: parsed.data.objectiveId, userId: actor.id },
    select: { id: true, status: true, currentText: true },
  });

  if (!objective) {
    return { error: "Ese objetivo no pertenece a tu Brújula." };
  }

  if (objective.status === parsed.data.status) {
    return { success: "Tu autoevaluación ya estaba guardada así." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userCompassObjective.update({
      where: { id: objective.id },
      data: { status: parsed.data.status },
    });

    await recordAudit(
      {
        actor,
        action: "compass.objective_status",
        entityType: "UserCompassObjective",
        entityId: objective.id,
        before: { status: objective.status },
        after: { status: parsed.data.status },
      },
      tx,
    );
  });

  revalidateCompass(actor.id);
  return { success: "Tu autoevaluación quedó actualizada." };
}

export async function toggleCompassObjectiveSharingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = toggleCompassObjectiveSharingSchema.safeParse({
    objectiveId: readField(formData, "objectiveId"),
    sharedWithCommunity: readField(formData, "sharedWithCommunity"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const objective = await prisma.userCompassObjective.findFirst({
    where: { id: parsed.data.objectiveId, userId: actor.id },
    select: { id: true, sharedWithCommunity: true },
  });

  if (!objective) {
    return { error: "Ese objetivo no pertenece a tu Brújula." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userCompassObjective.update({
      where: { id: objective.id },
      data: { sharedWithCommunity: parsed.data.sharedWithCommunity },
    });

    await recordAudit(
      {
        actor,
        action: "compass.objective_sharing",
        entityType: "UserCompassObjective",
        entityId: objective.id,
        before: { sharedWithCommunity: objective.sharedWithCommunity },
        after: { sharedWithCommunity: parsed.data.sharedWithCommunity },
      },
      tx,
    );
  });

  revalidateCompass(actor.id);
  return {
    success: parsed.data.sharedWithCommunity
      ? "Tu objetivo ahora se comparte con tu comunidad."
      : "Tu objetivo volvió a ser privado.",
  };
}

export async function createCompassReflectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  const parsed = compassReflectionSchema.safeParse({
    objectiveId: readField(formData, "objectiveId"),
    activityId: readField(formData, "activityId"),
    isCycleSelfEvaluation: readField(formData, "isCycleSelfEvaluation"),
    cycleLabel: readField(formData, "cycleLabel") || undefined,
    content: readField(formData, "content"),
    sharedWithAa: readField(formData, "sharedWithAa"),
    sharedWithCommunity: readField(formData, "sharedWithCommunity"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (parsed.data.objectiveId) {
    const objective = await prisma.userCompassObjective.findFirst({
      where: { id: parsed.data.objectiveId, userId: actor.id },
      select: { id: true },
    });
    if (!objective) {
      return { error: "Ese objetivo no pertenece a tu Brújula." };
    }
  }

  const reflection = await prisma.userCompassReflection.create({
    data: {
      userId: actor.id,
      objectiveId: parsed.data.objectiveId ?? null,
      activityId: parsed.data.activityId ?? null,
      isCycleSelfEvaluation: parsed.data.isCycleSelfEvaluation,
      cycleLabel: parsed.data.cycleLabel ?? null,
      content: parsed.data.content.trim(),
      sharedWithAa: parsed.data.sharedWithAa,
      sharedWithCommunity: parsed.data.sharedWithCommunity,
    },
    select: { id: true },
  });

  await recordAudit({
    actor,
    action: "compass.reflection_create",
    entityType: "UserCompassReflection",
    entityId: reflection.id,
    after: {
      objectiveId: parsed.data.objectiveId ?? null,
      activityId: parsed.data.activityId ?? null,
      isCycleSelfEvaluation: parsed.data.isCycleSelfEvaluation,
      sharedWithAa: parsed.data.sharedWithAa,
      sharedWithCommunity: parsed.data.sharedWithCommunity,
    },
  });

  revalidateCompass(actor.id);
  if (parsed.data.activityId) {
    revalidatePath(`/calendario/${parsed.data.activityId}`);
  }
  return {
    success: parsed.data.isCycleSelfEvaluation
      ? "Tu autoevaluación de ciclo quedó guardada."
      : "Tu reflexión quedó guardada en tu Brújula.",
  };
}

export async function requestCompassConsensusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireReadyUser();

  if (!canWriteCompass(actor, actor.id)) {
    return { error: WRITE_DENIED };
  }

  if (!actor.assignedAaId) {
    return {
      error:
        "Todavía no tienes un AA encargado asignado. Puedes seguir escribiendo tu Brújula y solicitar el encuentro cuando lo tengas.",
    };
  }

  if (
    !canRequestConsensus({
      actorId: actor.id,
      targetId: actor.id,
      targetRole: actor.role,
      assignedAaId: actor.assignedAaId,
    })
  ) {
    return { error: WRITE_DENIED };
  }

  const parsed = requestCompassConsensusSchema.safeParse({
    objectiveId: readField(formData, "objectiveId") || undefined,
    message: readField(formData, "message") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (parsed.data.objectiveId) {
    const objective = await prisma.userCompassObjective.findFirst({
      where: { id: parsed.data.objectiveId, userId: actor.id },
      select: { id: true, currentText: true },
    });
    if (!objective) {
      return { error: "Ese objetivo no pertenece a tu Brújula." };
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  await notifyUser({
    recipientId: actor.assignedAaId,
    type: "CONSENSO_SOLICITADO",
    title: `${getDisplayName(actor)} solicita un Encuentro de Consenso`,
    body:
      parsed.data.message?.trim() ||
      "Quiere conversar contigo sobre su Brújula. La autoevaluación y la redacción de sus objetivos siguen siendo suyas.",
    entityType: "UserCompassObjective",
    entityId: parsed.data.objectiveId,
    actionUrl: `/acompanamiento/${actor.id}`,
    priority: 1,
    dedupeKey: `compass-consensus:${actor.id}:${parsed.data.objectiveId ?? "general"}:${today}`,
  });

  revalidatePath("/notificaciones");
  revalidatePath("/acompanamiento");
  revalidatePath(`/acompanamiento/${actor.id}`);

  return {
    success:
      "Tu solicitud de Encuentro de Consenso fue enviada a tu AA encargado.",
  };
}

/**
 * Notas de Acompañamiento (RF-BRU-09).
 *
 * Solo el AA encargado vigente crea, edita y lee el historial completo.
 */
async function requireAssignedAa(studentId: string): Promise<
  | {
      actor: SessionUser;
      student: {
        id: string;
        firstName: string;
        lastName: string;
        preferredName: string | null;
        assignedAaId: string | null;
      };
    }
  | { error: string }
> {
  const actor = await requireReadyUser();

  if (actor.role !== "AA") {
    return { error: "Solo el AA encargado puede escribir notas de acompañamiento." };
  }

  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      assignedAaId: true,
    },
  });

  if (!student || student.assignedAaId !== actor.id) {
    return {
      error:
        "No tienes acceso a la Brújula ni a las notas de este joven: solo su AA encargado puede acompañarlo.",
    };
  }

  return { actor, student };
}

export async function saveMentoringNoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = mentoringNoteSchema.safeParse({
    studentId: readField(formData, "studentId"),
    noteId: readField(formData, "noteId") || undefined,
    content: readField(formData, "content"),
    sharedWithStudent: readField(formData, "sharedWithStudent"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const access = await requireAssignedAa(parsed.data.studentId);
  if ("error" in access) return { error: access.error };
  const { actor, student } = access;

  const content = parsed.data.content.trim();

  if (parsed.data.noteId) {
    const note = await prisma.mentoringNote.findFirst({
      where: { id: parsed.data.noteId, studentId: student.id },
      select: { id: true, content: true, sharedWithStudent: true },
    });

    if (!note) {
      return { error: "Esa nota no pertenece al historial de este joven." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.mentoringNote.update({
        where: { id: note.id },
        data: {
          content,
          sharedWithStudent: parsed.data.sharedWithStudent,
        },
      });

      await recordAudit(
        {
          actor,
          action: "mentoring.note_update",
          entityType: "MentoringNote",
          entityId: note.id,
          before: {
            content: note.content,
            sharedWithStudent: note.sharedWithStudent,
          },
          after: {
            content,
            sharedWithStudent: parsed.data.sharedWithStudent,
          },
        },
        tx,
      );
    });

    revalidateCompass(student.id);
    return { success: "Nota de acompañamiento actualizada." };
  }

  await prisma.$transaction(async (tx) => {
    const note = await tx.mentoringNote.create({
      data: {
        studentId: student.id,
        authorAaId: actor.id,
        content,
        sharedWithStudent: parsed.data.sharedWithStudent,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "mentoring.note_create",
        entityType: "MentoringNote",
        entityId: note.id,
        after: {
          content,
          sharedWithStudent: parsed.data.sharedWithStudent,
        },
      },
      tx,
    );
  });

  revalidateCompass(student.id);
  return {
    success: parsed.data.sharedWithStudent
      ? "Nota guardada y compartida con el joven."
      : "Nota guardada como privada del AA encargado.",
  };
}

/**
 * Sincroniza las ediciones de La Brújula realizadas sin conexión (RF-PWA-02).
 *
 * Cada edición trae el texto base sobre el que se escribió offline. Si el
 * servidor cambió mientras tanto, `reconcileOfflineObjectiveEdit` conserva
 * ambos textos: las versiones del servidor quedan intactas y la redacción
 * offline se agrega como versión sucesiva. Nunca se sobrescribe el historial.
 */
export async function syncOfflineCompassEditsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const writer = await requireCompassWriter();
  if ("error" in writer) return { error: writer.error };
  const { actor } = writer;

  let raw: unknown;
  try {
    raw = JSON.parse(readField(formData, "edits") || "[]");
  } catch {
    return { error: "No pudimos leer las ediciones pendientes." };
  }

  const parsed = syncOfflineCompassEditsSchema.safeParse({ edits: raw });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  let synced = 0;
  let conflicts = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const edit of parsed.data.edits) {
      const objective = await tx.userCompassObjective.findFirst({
        where: { id: edit.objectiveId, userId: actor.id },
        select: {
          id: true,
          currentText: true,
          versions: {
            select: { text: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!objective) {
        skipped += 1;
        continue;
      }

      const reconciliation = reconcileOfflineObjectiveEdit({
        serverCurrentText: objective.currentText,
        serverVersions: objective.versions,
        offlineBaseText: edit.offlineBaseText,
        offlineNewText: edit.offlineNewText,
      });

      if (!reconciliation.shouldAppend) {
        skipped += 1;
        continue;
      }

      for (const version of reconciliation.versionsToAppend) {
        await tx.userCompassObjectiveVersion.create({
          data: {
            objectiveId: objective.id,
            text: version.text,
            createdAt: new Date(version.createdAt),
          },
        });
      }

      await tx.userCompassObjective.update({
        where: { id: objective.id },
        data: { currentText: reconciliation.finalText },
      });

      if (reconciliation.conflict) conflicts += 1;
      synced += 1;

      await recordAudit(
        {
          actor,
          action: "compass.objective_offline_sync",
          entityType: "UserCompassObjective",
          entityId: objective.id,
          before: { currentText: objective.currentText },
          after: {
            currentText: reconciliation.finalText,
            conflict: reconciliation.conflict,
            history: reconciliation.resultingHistory,
          },
        },
        tx,
      );
    }
  });

  revalidateCompass(actor.id);

  if (synced === 0) {
    return {
      success:
        skipped > 0
          ? "No había cambios nuevos por sincronizar. Tus objetivos ya estaban al día."
          : "No había ediciones pendientes.",
    };
  }

  return {
    success:
      conflicts > 0
        ? `Sincronizamos ${synced} edición${synced === 1 ? "" : "es"}. En ${conflicts} caso${conflicts === 1 ? "" : "s"} el objetivo había cambiado en otro dispositivo: conservamos ambas redacciones como versiones sucesivas.`
        : `Sincronizamos ${synced} edición${synced === 1 ? "" : "es"} de La Brújula.`,
  };
}
