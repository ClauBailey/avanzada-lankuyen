import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getZonedDateTimeParts } from "@/lib/route-sheet-schedule";
import { prisma } from "@/server/db";
import { getAppSettings } from "@/server/settings";
import { enqueuePushNotification } from "@/server/web-push";

export const ATTENDANCE_REMINDER_JOB = "attendance-reminder";

export interface AttendanceReminderStats {
  activityId: string | null;
  /** Pioneros/as y coordinadores/as sin respuesta para la actividad. */
  pending: number;
  /** Pushea encolados para envío después de la respuesta del cron. */
  notified: number;
}

export interface AttendanceReminderResult {
  executed: boolean;
  skipped?: "disabled" | "no-activity" | "already-ran";
  runKey: string;
  message: string;
  stats: AttendanceReminderStats;
  error?: string;
}

interface RunAttendanceReminderOptions {
  /**
   * Permite probar el cron aunque `cron.enabled` esté apagado. No reutiliza el
   * `run_key` automático, de modo que se puede repetir la prueba.
   */
  bypassScheduleCheck?: boolean;
  /** Inyectable para pruebas; por defecto usa el reloj del servidor. */
  now?: Date;
}

const EMPTY_STATS: AttendanceReminderStats = {
  activityId: null,
  pending: 0,
  notified: 0,
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function acquireJobRun(runKey: string) {
  const where = {
    jobName_runKey: {
      jobName: ATTENDANCE_REMINDER_JOB,
      runKey,
    },
  };

  const existing = await prisma.jobRun.findUnique({
    where,
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "ERROR") {
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
      data: { jobName: ATTENDANCE_REMINDER_JOB, runKey, status: "RUNNING" },
      select: { id: true },
    });

    return { id: created.id, alreadyRan: false };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const raced = await prisma.jobRun.findUnique({
      where,
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
 * Recordatorio de asistencia para la próxima actividad publicada.
 *
 * `RsvpStatus` solo tiene CONFIRMADO y NO_ASISTE; por eso "pendiente" significa
 * que la persona activa aún no tiene una `AttendanceResponse` para la
 * actividad. Se envía un único recordatorio automático por actividad: el
 * `run_key` del job lo garantiza.
 */
export async function runAttendanceReminder(
  options: RunAttendanceReminderOptions = {},
): Promise<AttendanceReminderResult> {
  const now = options.now ?? new Date();
  const bypass = options.bypassScheduleCheck ?? false;
  const settings = await getAppSettings();
  const manualKey = `${ATTENDANCE_REMINDER_JOB}:manual:${getZonedDateTimeParts(
    now,
    settings.timezone,
  ).dateKey}T${now.getTime()}`;

  const base = {
    runKey: manualKey,
    stats: EMPTY_STATS,
  };

  if (!bypass && !settings.cronEnabled) {
    return {
      ...base,
      executed: false,
      skipped: "disabled",
      message:
        "El cron está desactivado en la configuración. Actívalo o usa la ejecución manual.",
    };
  }

  const horizon = new Date(
    now.getTime() + settings.reminderLeadDays * 86_400_000,
  );

  const activity = await prisma.activity.findFirst({
    where: {
      isPublished: true,
      deletedAt: null,
      startsAt: { gt: now, lte: horizon },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, startsAt: true },
  });

  if (!activity) {
    return {
      ...base,
      executed: false,
      skipped: "no-activity",
      message: `No hay una actividad próxima en los siguientes ${settings.reminderLeadDays} días.`,
    };
  }

  const stats: AttendanceReminderStats = {
    ...EMPTY_STATS,
    activityId: activity.id,
  };
  const runKey = bypass
    ? `${ATTENDANCE_REMINDER_JOB}:manual:${activity.id}:${now.getTime()}`
    : `${ATTENDANCE_REMINDER_JOB}:${activity.id}`;

  const job = await acquireJobRun(runKey);

  if (job.alreadyRan) {
    return {
      ...base,
      runKey,
      stats,
      executed: false,
      skipped: "already-ran",
      message:
        "Ya se envió el recordatorio automático para esta actividad. No se enviaron avisos duplicados.",
    };
  }

  try {
    const pending = await prisma.user.findMany({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
        attendanceResponses: { none: { activityId: activity.id } },
      },
      select: { id: true },
    });

    for (const recipient of pending) {
      enqueuePushNotification(recipient.id, {
        title: "Confirmación de Asistencia",
        body: "Recuerda ingresar a la plataforma y confirmar tu asistencia para la próxima actividad.",
        url: `/calendario/${activity.id}`,
        tag: `attendance-${activity.id}`,
      });
    }

    stats.pending = pending.length;
    stats.notified = pending.length;

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "OK",
        finishedAt: new Date(),
        stats: stats as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      ...base,
      runKey,
      stats,
      executed: true,
      message:
        pending.length === 0
          ? `Todos los miembros ya respondieron su asistencia para «${activity.title}».`
          : `Recordatorio programado para ${pending.length} miembro${
              pending.length === 1 ? "" : "s"
            } sin respuesta para «${activity.title}».`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido.";

    await prisma.jobRun
      .update({
        where: { id: job.id },
        data: { status: "ERROR", finishedAt: new Date(), error: message },
      })
      .catch(() => undefined);

    return {
      ...base,
      runKey,
      stats,
      executed: false,
      message: "No se pudo ejecutar el recordatorio de asistencia.",
      error: message,
    };
  }
}
