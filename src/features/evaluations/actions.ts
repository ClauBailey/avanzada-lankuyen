"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { activityEvaluationSchema } from "@/features/evaluations/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateEvaluations(activityId: string) {
  revalidatePath("/calendario");
  revalidatePath(`/calendario/${activityId}`);
  revalidatePath("/inicio");
  revalidatePath("/admin/evaluaciones");
  revalidatePath(`/admin/evaluaciones/${activityId}`);
}

export async function submitActivityEvaluationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("activity:evaluate");

  const parsed = activityEvaluationSchema.safeParse({
    activityId: readField(formData, "activityId"),
    affectivityScore: readField(formData, "affectivityScore"),
    corporalityScore: readField(formData, "corporalityScore"),
    spiritualityScore: readField(formData, "spiritualityScore"),
    characterScore: readField(formData, "characterScore"),
    creativityScore: readField(formData, "creativityScore"),
    sociabilityScore: readField(formData, "sociabilityScore"),
    comment: readField(formData, "comment") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const {
    activityId,
    comment,
    ...scores
  } = parsed.data;

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null, isPublished: true },
    select: { id: true, title: true, endsAt: true },
  });

  if (!activity) {
    return { error: "La actividad ya no está disponible." };
  }

  if (activity.endsAt > new Date()) {
    return {
      error: "La evaluación se habilita cuando la actividad haya terminado.",
    };
  }

  const existing = await prisma.activityEvaluation.findUnique({
    where: {
      activityId_userId: { activityId, userId: actor.id },
    },
    select: {
      id: true,
      affectivityScore: true,
      corporalityScore: true,
      spiritualityScore: true,
      characterScore: true,
      creativityScore: true,
      sociabilityScore: true,
      comment: true,
    },
  });

  const values = {
    ...scores,
    comment: comment || null,
  };

  await prisma.$transaction(async (tx) => {
    const evaluation = await tx.activityEvaluation.upsert({
      where: {
        activityId_userId: { activityId, userId: actor.id },
      },
      create: {
        activityId,
        userId: actor.id,
        ...values,
      },
      update: values,
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: existing
          ? "activity.evaluation_update"
          : "activity.evaluation_submit",
        entityType: "ActivityEvaluation",
        entityId: evaluation.id,
        before: existing
          ? {
              activity: activity.title,
              scores: {
                affectivityScore: existing.affectivityScore,
                corporalityScore: existing.corporalityScore,
                spiritualityScore: existing.spiritualityScore,
                characterScore: existing.characterScore,
                creativityScore: existing.creativityScore,
                sociabilityScore: existing.sociabilityScore,
              },
              comment: existing.comment,
            }
          : undefined,
        after: {
          activity: activity.title,
          scores,
          comment: values.comment,
        },
      },
      tx,
    );
  });

  revalidateEvaluations(activityId);

  return {
    success: existing
      ? "Tu evaluación fue actualizada."
      : "¡Gracias! Tu evaluación quedó registrada.",
  };
}
