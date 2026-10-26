import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { formatLongDate } from "@/lib/dates";
import {
  evaluateSchedule,
  getIsoWeekKey,
  getZonedDateTimeParts,
} from "@/lib/route-sheet-schedule";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { getAppSettings } from "@/server/settings";

export const ROUTE_SHEET_REMINDER_JOB = "route-sheet-reminder";
export const ROUTE_SHEET_REMINDER_TITLE = "Recordatorio de hoja de ruta";

export interface RouteSheetReminderStats {
  activities: number;
  notifications: number;
  fallbackActivities: number;
  activityIds: string[];
}

export interface RouteSheetReminderResult {
  executed: boolean;
  skipped?: "schedule" | "disabled" | "already-ran";
  runKey: string;
  timeZone: string;
  scheduled: boolean;
  message: string;
  stats: RouteSheetReminderStats;
  error?: string;
}

interface RunRouteSheetReminderOptions {
  /**
   * Permite ejecutar el job fuera de la ventana de miércoles 11:00 para
   * pruebas manuales. No modifica el reloj ni consume el `run_key` semanal.
   */
  bypassScheduleCheck?: boolean;
  /** Inyectable para pruebas; por defecto usa el reloj del servidor. */
  now?: Date;
}

const EMPTY_STATS: RouteSheetReminderStats = {
  activities: 0,
  notifications: 0,
  fallbackActivities: 0,
  activityIds: [],
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function truncate(value: string, max = 220) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function manualRunKey(now: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(now, timeZone);
  // Se agrupa por minuto: varios clics seguidos son idempotentes, pero se
  // puede volver a probar más tarde sin esperar a la semana siguiente.
  return `${ROUTE_SHEET_REMINDER_JOB}:${getIsoWeekKey(
    now,
    timeZone,
  )}:manual:${parts.dateKey}T${parts.hour}${parts.minute}`;
}

interface AcquiredJob {
  id: string;
  alreadyRan: boolean;
}

async function acquireJobRun(runKey: string): Promise<AcquiredJob> {
  const existing = await prisma.jobRun.findUnique({
    where: {
      jobName_runKey: {
        jobName: ROUTE_SHEET_REMINDER_JOB,
        runKey,
      },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "ERROR") {
      // Un intento fallido puede reintentarse; los dedupe keys evitan que se
      // dupliquen las notificaciones que ya alcanzaron a crearse.
      await prisma.jobRun.update({
        where: { id: existing.id },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
          finishedAt: null,
          error: null,
        },
      });
      return { id: existing.id, alreadyRan: false };
    }

    return { id: existing.id, alreadyRan: true };
  }

  try {
    const created = await prisma.jobRun.create({
      data: {
        jobName: ROUTE_SHEET_REMINDER_JOB,
        runKey,
        status: "RUNNING",
      },
      select: { id: true },
    });

    return { id: created.id, alreadyRan: false };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const raced = await prisma.jobRun.findUnique({
      where: {
        jobName_runKey: {
          jobName: ROUTE_SHEET_REMINDER_JOB,
          runKey,
        },
      },
      select: { id: true, status: true },
    });

    if (raced?.status === "ERROR") {
      await prisma.jobRun.update({
        where: { id: raced.id },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
          finishedAt: null,
          error: null,
        },
      });
      return { id: raced.id, alreadyRan: false };
    }

    return { id: raced?.id ?? "", alreadyRan: true };
  }
}

/**
 * Busca actividades publicadas y futuras que todavía no tienen una hoja
 * aprobada ni una versión pendiente de revisión, y avisa a sus encargados.
 *
 * Es intencionalmente idempotente:
 * - `job_runs` evita repetir el `run_key` semanal.
 * - `notifications.dedupe_key` evita repetir avisos por actividad/semana.
 */
export async function runRouteSheetReminder(
  options: RunRouteSheetReminderOptions = {},
): Promise<RouteSheetReminderResult> {
  const now = options.now ?? new Date();
  const bypass = options.bypassScheduleCheck ?? false;
  const settings = await getAppSettings();

  const schedule = evaluateSchedule(now, {
    timeZone: settings.timezone,
    hour: settings.cronHour,
    weekday: 3,
  });

  const baseResult = {
    runKey: `${ROUTE_SHEET_REMINDER_JOB}:${schedule.isoWeekKey}`,
    timeZone: settings.timezone,
    scheduled: schedule.matchesSchedule,
    stats: EMPTY_STATS,
  };

  if (!bypass && !settings.cronEnabled) {
    return {
      ...baseResult,
      executed: false,
      skipped: "disabled",
      message:
        "El cron está desactivado en la configuración. Actívalo o usa la ejecución manual.",
    };
  }

  if (!bypass && !schedule.matchesSchedule) {
    return {
      ...baseResult,
      executed: false,
      skipped: "schedule",
      message:
        "El recordatorio solo se ejecuta los miércoles a las 11:00 en America/Santiago. Usa la ejecución manual para probarlo ahora.",
    };
  }

  const runKey = bypass
    ? manualRunKey(now, settings.timezone)
    : `${ROUTE_SHEET_REMINDER_JOB}:${schedule.isoWeekKey}`;

  const job = await acquireJobRun(runKey);
  const resultBase = { ...baseResult, runKey };

  if (job.alreadyRan) {
    return {
      ...resultBase,
      executed: false,
      skipped: "already-ran",
      message: `El recordatorio ya se ejecutó para ${schedule.isoWeekKey}. No se enviaron avisos duplicados.`,
    };
  }

  const horizon = new Date(
    now.getTime() + settings.reminderLeadDays * 86_400_000,
  );

  try {
    const activities = await prisma.activity.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        startsAt: { gt: now, lte: horizon },
        routeSheets: {
          none: {
            deletedAt: null,
            status: { in: ["APROBADA", "PENDIENTE_AUTORIZACION"] },
          },
        },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
        leaders: { select: { userId: true } },
        routeSheets: {
          where: { deletedAt: null },
          orderBy: { version: "desc" },
          take: 1,
          select: {
            version: true,
            status: true,
            rejectionReason: true,
          },
        },
      },
    });

    let aaFallbackIds: string[] | null = null;
    let notifications = 0;
    let fallbackActivities = 0;

    for (const activity of activities) {
      const leaderIds = activity.leaders.map((leader) => leader.userId);
      let recipientIds = leaderIds;

      if (recipientIds.length === 0) {
        fallbackActivities += 1;

        if (!aaFallbackIds) {
          const aas = await prisma.user.findMany({
            where: { role: "AA", isActive: true, deletedAt: null },
            select: { id: true },
          });
          aaFallbackIds = aas.map((aa) => aa.id);
        }

        recipientIds = aaFallbackIds;
      }

      if (recipientIds.length === 0) continue;

      const latest = activity.routeSheets[0] ?? null;
      const when = formatLongDate(activity.startsAt);
      const location = activity.location ? ` en ${activity.location}` : "";

      let body = `La actividad «${activity.title}» del ${when}${location} aún no tiene una hoja de ruta aprobada. Súbela desde Hojas de ruta para que los AA puedan revisarla.`;

      if (latest?.status === "RECHAZADA") {
        body = `La versión ${latest.version} de la hoja de ruta de «${activity.title}» (${when}) fue rechazada.${
          latest.rejectionReason
            ? ` Motivo: «${truncate(latest.rejectionReason)}».`
            : ""
        } Corrige el documento y sube una nueva versión desde Hojas de ruta.`;
      }

      for (const recipientId of new Set(recipientIds)) {
        const dedupeKey = `${ROUTE_SHEET_REMINDER_JOB}:${schedule.isoWeekKey}:${activity.id}:${recipientId}`;

        const existing = await prisma.notification.findUnique({
          where: { dedupeKey },
          select: { id: true },
        });

        if (existing) continue;

        await notifyUser({
          recipientId,
          type: "RECORDATORIO_HOJA_FALTANTE",
          title: `Falta la hoja de ruta: ${activity.title}`,
          body,
          entityType: "Activity",
          entityId: activity.id,
          actionUrl: "/hojas-de-ruta",
          dedupeKey,
          priority: 2,
        });

        notifications += 1;
      }
    }

    const stats: RouteSheetReminderStats = {
      activities: activities.length,
      notifications,
      fallbackActivities,
      activityIds: activities.map((activity) => activity.id),
    };

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "OK",
        finishedAt: new Date(),
        stats: stats as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      ...resultBase,
      executed: true,
      stats,
      message:
        activities.length === 0
          ? `No hay actividades sin hoja de ruta en los próximos ${settings.reminderLeadDays} días.`
          : `Recordatorio ejecutado: ${activities.length} actividad${
              activities.length === 1 ? "" : "es"
            } y ${notifications} notificación${
              notifications === 1 ? "" : "es"
            } enviada${notifications === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido del cron.";

    await prisma.jobRun
      .update({
        where: { id: job.id },
        data: {
          status: "ERROR",
          finishedAt: new Date(),
          error: truncate(message, 1800),
        },
      })
      .catch(() => undefined);

    return {
      ...resultBase,
      executed: false,
      stats: EMPTY_STATS,
      error: message,
      message: "No se pudo ejecutar el recordatorio de hojas de ruta.",
    };
  }
}
