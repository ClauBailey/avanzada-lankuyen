"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { parseDateOnlyInput, parseDateTimeInput } from "@/lib/dates";
import {
  activityIdSchema,
  activitySchema,
  programCycleIdSchema,
  programCycleSchema,
} from "@/features/activities/schemas";
import { canCreateActivityForScope } from "@/features/cycle/rules";
import { recordAudit } from "@/server/audit";
import { requirePermission, requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { can } from "@/server/rbac/can";

function revalidateCalendar(activityId?: string) {
  revalidatePath("/admin/actividades");
  revalidatePath("/admin/asistencia");
  revalidatePath("/calendario");
  revalidatePath("/ciclo");
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

export async function createProgramCycleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = programCycleSchema.safeParse({
    name: readField(formData, "name"),
    startDate: readField(formData, "startDate"),
    endDate: readField(formData, "endDate"),
    isActive: readField(formData, "isActive") || "false",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { name, startDate, endDate } = parsed.data;
  const start = parseDateOnlyInput(startDate);
  const end = parseDateOnlyInput(endDate);

  if (!start || !end) {
    return { error: "Revisa las fechas del ciclo." };
  }

  const activeCount = await prisma.programCycle.count({
    where: { isActive: true },
  });
  const shouldActivate = parsed.data.isActive === "true" || activeCount === 0;

  try {
    await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.programCycle.updateMany({ data: { isActive: false } });
      }

      const created = await tx.programCycle.create({
        data: {
          name,
          startDate: start,
          endDate: end,
          isActive: shouldActivate,
        },
        select: { id: true },
      });

      await recordAudit(
        {
          actor,
          action: "cycle.create",
          entityType: "ProgramCycle",
          entityId: created.id,
          after: { name, startDate, endDate, isActive: shouldActivate },
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `Ya existe el ciclo «${name}».` };
    }
    throw error;
  }

  revalidateCalendar();
  return {
    success: shouldActivate
      ? `Ciclo «${name}» creado y marcado como activo.`
      : `Ciclo «${name}» creado.`,
  };
}

export async function activateProgramCycleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = programCycleIdSchema.safeParse({
    cycleId: readField(formData, "cycleId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const cycle = await prisma.programCycle.findUnique({
    where: { id: parsed.data.cycleId },
    select: { id: true, name: true, isActive: true },
  });

  if (!cycle) {
    return { error: "El ciclo ya no existe." };
  }

  if (cycle.isActive) {
    return { success: "Este ciclo ya está activo." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.programCycle.updateMany({ data: { isActive: false } });
    await tx.programCycle.update({
      where: { id: cycle.id },
      data: { isActive: true },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.activate",
        entityType: "ProgramCycle",
        entityId: cycle.id,
        before: { isActive: false },
        after: { isActive: true, name: cycle.name },
      },
      tx,
    );
  });

  revalidateCalendar();
  return { success: `Ciclo «${cycle.name}» activado.` };
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
    cycleId: readField(formData, "cycleId"),
    title: readField(formData, "title"),
    type: readField(formData, "type"),
    scope: readField(formData, "scope") || "AVANZADA",
    scheduleType: readField(formData, "scheduleType") || "VARIABLE",
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

type ActivityScopeValue = "COMUNIDAD" | "AVANZADA" | "GRUPO_DE_TRABAJO";

/**
 * RF-CAL-02: el AA programa todo el calendario; el COORDINADOR solo
 * actividades de alcance COMUNIDAD de su propia Comunidad.
 */
function canProgramScope(
  actor: {
    id: string;
    role: string;
    communityId: string | null;
    isActive?: boolean;
  },
  scope: ActivityScopeValue,
): boolean {
  if (scope === "COMUNIDAD") {
    return canCreateActivityForScope(actor, {
      scope,
      communityId: actor.communityId,
    });
  }
  return actor.role === "AA";
}

export async function createActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireReadyUser();

  if (
    !can(actor, "activity:manage") &&
    !can(actor, "activity:manage_community")
  ) {
    return { error: "No tienes permiso para programar actividades." };
  }

  const parsed = readActivityForm(formData);

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const data = parsed.data;

  if (!canProgramScope(actor, data.scope)) {
    return {
      error:
        "Solo puedes programar actividades de alcance Comunidad para tu propia Comunidad.",
    };
  }

  const cycle = await prisma.programCycle.findUnique({
    where: { id: data.cycleId },
    select: { id: true, name: true },
  });

  if (!cycle) {
    return { error: "El ciclo seleccionado no existe." };
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
          cycleId: data.cycleId,
          title: data.title,
          type: data.type,
          scope: data.scope,
          scheduleType: data.scheduleType,
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
            cycle: cycle.name,
            title: data.title,
            type: data.type,
            scope: data.scope,
            scheduleType: data.scheduleType,
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
  const actor = await requireReadyUser();

  if (
    !can(actor, "activity:manage") &&
    !can(actor, "activity:manage_community")
  ) {
    return { error: "No tienes permiso para editar actividades." };
  }

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

  if (!canProgramScope(actor, data.scope)) {
    return {
      error:
        "Solo puedes programar actividades de alcance Comunidad para tu propia Comunidad.",
    };
  }

  const current = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: {
      id: true,
      title: true,
      type: true,
      scope: true,
      scheduleType: true,
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

  if (
    !can(actor, "activity:manage") &&
    current.scope !== "COMUNIDAD"
  ) {
    return {
      error: "Solo puedes editar actividades de alcance Comunidad.",
    };
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
        cycleId: data.cycleId,
        title: data.title,
        type: data.type,
        scope: data.scope,
        scheduleType: data.scheduleType,
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
          scope: current.scope,
          scheduleType: current.scheduleType,
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
          scope: data.scope,
          scheduleType: data.scheduleType,
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
