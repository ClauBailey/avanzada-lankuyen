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
  revalidatePath("/perfil");
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
    objectiveAchievementLevel: readField(
      formData,
      "objectiveAchievementLevel",
    ),
    experiencedAreas: formData
      .getAll("experiencedAreas")
      .filter((value): value is string => typeof value === "string"),
    organizationFeedback: readField(formData, "organizationFeedback") || undefined,
    emotionalResonance: readField(formData, "emotionalResonance") || undefined,
    learningsForNextTime:
      readField(formData, "learningsForNextTime") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { activityId, experiencedAreas, ...rest } = parsed.data;

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      deletedAt: null,
      ...(actor.role === "AA" ? {} : { isPublished: true }),
    },
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
      objectiveAchievementLevel: true,
      experiencedAreas: true,
      organizationFeedback: true,
      emotionalResonance: true,
      learningsForNextTime: true,
    },
  });

  const values = {
    ...rest,
    experiencedAreas,
    organizationFeedback: rest.organizationFeedback || null,
    emotionalResonance: rest.emotionalResonance || null,
    learningsForNextTime: rest.learningsForNextTime || null,
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
              objectiveAchievementLevel: existing.objectiveAchievementLevel,
              experiencedAreas: existing.experiencedAreas,
              organizationFeedback: existing.organizationFeedback,
              emotionalResonance: existing.emotionalResonance,
              learningsForNextTime: existing.learningsForNextTime,
            }
          : undefined,
        after: {
          activity: activity.title,
          objectiveAchievementLevel: values.objectiveAchievementLevel,
          experiencedAreas: values.experiencedAreas,
          organizationFeedback: values.organizationFeedback,
          emotionalResonance: values.emotionalResonance,
          learningsForNextTime: values.learningsForNextTime,
        },
      },
      tx,
    );
  });

  revalidateEvaluations(activityId);

  return {
    success: existing
      ? "Tu observación fue actualizada."
      : "¡Gracias! Tu observación quedó registrada.",
  };
}
