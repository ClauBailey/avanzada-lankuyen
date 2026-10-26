"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { parseDateOnlyInput, parseDateTimeInput } from "@/lib/dates";
import {
  activityIdSchema,
  activitySchema,
  semesterIdSchema,
  semesterSchema,
} from "@/features/activities/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateCalendar(activityId?: string) {
  revalidatePath("/admin/actividades");
  revalidatePath("/admin/asistencia");
  revalidatePath("/calendario");
  revalidatePath("/inicio");
  if (activityId) {
    revalidatePath(`/calendario/${activityId}`);
    revalidatePath(`/admin/asistencia/${activityId}`);
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createSemesterAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("semester:manage");

  const parsed = semesterSchema.safeParse({
    name: readField(formData, "name"),
    startsOn: readField(formData, "startsOn"),
    endsOn: readField(formData, "endsOn"),
    isActive: readField(formData, "isActive") || "false",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { name, startsOn, endsOn } = parsed.data;
  const startsOnDate = parseDateOnlyInput(startsOn);
  const endsOnDate = parseDateOnlyInput(endsOn);

  if (!startsOnDate || !endsOnDate) {
    return { error: "Revisa las fechas del semestre." };
  }

  const activeCount = await prisma.semester.count({ where: { isActive: true } });
  const shouldActivate = parsed.data.isActive === "true" || activeCount === 0;

  try {
    await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.semester.updateMany({ data: { isActive: false } });
      }

      const created = await tx.semester.create({
        data: {
          name,
          startsOn: startsOnDate,
          endsOn: endsOnDate,
          isActive: shouldActivate,
        },
        select: { id: true },
      });

      await recordAudit(
        {
          actor,
          action: "semester.create",
          entityType: "Semester",
          entityId: created.id,
          after: { name, startsOn, endsOn, isActive: shouldActivate },
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `Ya existe el semestre «${name}».` };
    }
    throw error;
  }

  revalidateCalendar();
  return {
    success: shouldActivate
      ? `Semestre «${name}» creado y marcado como activo.`
      : `Semestre «${name}» creado.`,
  };
}

export async function activateSemesterAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("semester:manage");

  const parsed = semesterIdSchema.safeParse({
    semesterId: readField(formData, "semesterId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const semester = await prisma.semester.findUnique({
    where: { id: parsed.data.semesterId },
    select: { id: true, name: true, isActive: true },
  });

  if (!semester) {
    return { error: "El semestre ya no existe." };
  }

  if (semester.isActive) {
    return { success: "Este semestre ya está activo." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.semester.updateMany({ data: { isActive: false } });
    await tx.semester.update({
      where: { id: semester.id },
      data: { isActive: true },
    });

    await recordAudit(
      {
        actor,
        action: "semester.activate",
        entityType: "Semester",
        entityId: semester.id,
        before: { isActive: false },
        after: { isActive: true, name: semester.name },
      },
      tx,
    );
  });

  revalidateCalendar();
  return { success: `Semestre «${semester.name}» activado.` };
}

async function resolveLeaders(leaderIds: string[]) {
  const unique = [...new Set(leaderIds)];

  if (unique.length === 0) return { ids: [] as string[], error: null };

  const leaders = await prisma.user.findMany({
    where: {
      id: { in: unique },
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (leaders.length !== unique.length) {
    return {
      ids: [] as string[],
      error:
        "Uno o más encargados no existen, están inactivos o no pueden ser encargados.",
    };
  }

  return { ids: unique, error: null };
}

function readActivityForm(formData: FormData) {
  return activitySchema.safeParse({
    semesterId: readField(formData, "semesterId"),
    title: readField(formData, "title"),
    type: readField(formData, "type"),
    startsAt: readField(formData, "startsAt"),
    endsAt: readField(formData, "endsAt"),
    location: readField(formData, "location") || undefined,
    description: readField(formData, "description") || undefined,
    isPublished: readField(formData, "isPublished") || "true",
    leaderIds: formData
      .getAll("leaderIds")
      .filter((value): value is string => typeof value === "string"),
  });
}

export async function createActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("activity:manage");

  const parsed = readActivityForm(formData);

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const data = parsed.data;

  const semester = await prisma.semester.findUnique({
    where: { id: data.semesterId },
    select: { id: true, name: true },
  });

  if (!semester) {
    return { error: "El semestre seleccionado no existe." };
  }

  const startsAt = parseDateTimeInput(data.startsAt);
  const endsAt = parseDateTimeInput(data.endsAt);

  if (!startsAt || !endsAt) {
    return { error: "Revisa la fecha y hora de la actividad." };
  }

  const leaders = await resolveLeaders(data.leaderIds ?? []);

  if (leaders.error) {
    return { error: leaders.error };
  }

  let activityId: string;

  try {
    activityId = await prisma.$transaction(async (tx) => {
      const activity = await tx.activity.create({
        data: {
          semesterId: data.semesterId,
          title: data.title,
          type: data.type,
          startsAt,
          endsAt,
          location: data.location || null,
          description: data.description || null,
          isPublished: data.isPublished !== "false",
          createdById: actor.id,
          leaders:
            leaders.ids.length > 0
              ? {
                  create: leaders.ids.map((userId) => ({
                    userId,
                    assignedById: actor.id,
                  })),
                }
              : undefined,
        },
        select: { id: true },
      });

      await recordAudit(
        {
          actor,
          action: "activity.create",
          entityType: "Activity",
          entityId: activity.id,
          after: {
            semester: semester.name,
            title: data.title,
            type: data.type,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            location: data.location || null,
            isPublished: data.isPublished !== "false",
            leaderIds: leaders.ids,
          },
        },
        tx,
      );

      return activity.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "No pudimos crear la actividad. Inténtalo de nuevo." };
    }
    throw error;
  }

  revalidateCalendar(activityId);
  return { success: `Actividad «${data.title}» creada.` };
}

export async function updateActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("activity:manage");

  const idParsed = activityIdSchema.safeParse({
    activityId: readField(formData, "activityId"),
  });

  if (!idParsed.success) {
    return { error: firstIssue(idParsed.error) };
  }

  const parsed = readActivityForm(formData);

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const data = parsed.data;
  const { activityId } = idParsed.data;

  const current = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      endsAt: true,
      location: true,
      description: true,
      isPublished: true,
      leaders: { select: { userId: true } },
    },
  });

  if (!current) {
    return { error: "La actividad ya no existe." };
  }

  const startsAt = parseDateTimeInput(data.startsAt);
  const endsAt = parseDateTimeInput(data.endsAt);

  if (!startsAt || !endsAt) {
    return { error: "Revisa la fecha y hora de la actividad." };
  }

  const leaders = await resolveLeaders(data.leaderIds ?? []);

  if (leaders.error) {
    return { error: leaders.error };
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activityId },
      data: {
        semesterId: data.semesterId,
        title: data.title,
        type: data.type,
        startsAt,
        endsAt,
        location: data.location || null,
        description: data.description || null,
        isPublished: data.isPublished !== "false",
      },
    });

    await tx.activityLeader.deleteMany({ where: { activityId } });

    if (leaders.ids.length > 0) {
      await tx.activityLeader.createMany({
        data: leaders.ids.map((userId) => ({
          activityId,
          userId,
          assignedById: actor.id,
        })),
      });
    }

    await recordAudit(
      {
        actor,
        action: "activity.update",
        entityType: "Activity",
        entityId: activityId,
        before: {
          title: current.title,
          type: current.type,
          startsAt: current.startsAt.toISOString(),
          endsAt: current.endsAt.toISOString(),
          location: current.location,
          description: current.description,
          isPublished: current.isPublished,
          leaderIds: current.leaders.map((leader) => leader.userId),
        },
        after: {
          title: data.title,
          type: data.type,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          location: data.location || null,
          description: data.description || null,
          isPublished: data.isPublished !== "false",
          leaderIds: leaders.ids,
        },
      },
      tx,
    );
  });

  revalidateCalendar(activityId);
  return { success: "Actividad actualizada." };
}

export async function setActivityPublishedAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("activity:manage");

  const idParsed = activityIdSchema.safeParse({
    activityId: readField(formData, "activityId"),
  });

  if (!idParsed.success) {
    return { error: firstIssue(idParsed.error) };
  }

  const { activityId } = idParsed.data;
  const isPublished = readField(formData, "isPublished") === "true";

  const current = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: { id: true, isPublished: true },
  });

  if (!current) {
    return { error: "La actividad ya no existe." };
  }

  if (current.isPublished === isPublished) {
    return { success: "La actividad ya tiene ese estado." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activityId },
      data: { isPublished },
    });

    await recordAudit(
      {
        actor,
        action: isPublished ? "activity.publish" : "activity.unpublish",
        entityType: "Activity",
        entityId: activityId,
        before: { isPublished: current.isPublished },
        after: { isPublished },
      },
      tx,
    );
  });

  revalidateCalendar(activityId);
  return {
    success: isPublished
      ? "Actividad publicada en el calendario."
      : "Actividad ocultada del calendario.",
  };
}

export async function cancelActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("activity:manage");

  const parsed = activityIdSchema.safeParse({
    activityId: readField(formData, "activityId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { activityId } = parsed.data;

  const current = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: { id: true, title: true },
  });

  if (!current) {
    return { error: "La actividad ya no existe o fue cancelada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activityId },
      data: { deletedAt: new Date(), isPublished: false },
    });

    await recordAudit(
      {
        actor,
        action: "activity.cancel",
        entityType: "Activity",
        entityId: activityId,
        before: { deletedAt: null, isPublished: true },
        after: { deletedAt: new Date().toISOString(), isPublished: false },
        // El título queda en la auditoría para poder reconstruir el historial.
      },
      tx,
    );
  });

  revalidateCalendar(activityId);
  return { success: `Actividad «${current.title}» cancelada.` };
}
