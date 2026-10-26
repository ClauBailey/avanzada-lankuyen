import "server-only";

import { prisma } from "@/server/db";

export interface AppSettings {
  /** Zona IANA usada por el calendario y los cronjobs. */
  timezone: string;
  /** Hora local (0–23) en la que corre el recordatorio semanal. */
  cronHour: number;
  /** Días de anticipación con los que se avisa por una hoja faltante. */
  reminderLeadDays: number;
  cronEnabled: boolean;
  /**
   * Cuando está activo, cualquier PP/COORDINADOR puede subir una hoja de ruta,
   * además de los encargados de la actividad y los AA.
   */
  allowAnyPpRouteSheetUpload: boolean;
}

const DEFAULTS: AppSettings = {
  timezone: "America/Santiago",
  cronHour: 11,
  reminderLeadDays: 7,
  cronEnabled: true,
  allowAnyPpRouteSheetUpload: false,
};

const SETTING_KEYS = [
  "timezone",
  "cron.hour",
  "reminder.leadDays",
  "cron.enabled",
  "route_sheet.allowAnyPpUpload",
] as const;

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function readBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

/**
 * Lee la configuración operativa desde `app_settings`.
 *
 * Si una clave falta o tiene un valor inválido se usa el valor por defecto,
 * de modo que un entorno recién migrado siga funcionando.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    select: { key: true, value: true },
  });

  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    timezone: readString(byKey.get("timezone"), DEFAULTS.timezone),
    cronHour: readInt(byKey.get("cron.hour"), DEFAULTS.cronHour, 0, 23),
    reminderLeadDays: readInt(
      byKey.get("reminder.leadDays"),
      DEFAULTS.reminderLeadDays,
      1,
      60,
    ),
    cronEnabled: readBoolean(
      byKey.get("cron.enabled"),
      DEFAULTS.cronEnabled,
    ),
    allowAnyPpRouteSheetUpload: readBoolean(
      byKey.get("route_sheet.allowAnyPpUpload"),
      DEFAULTS.allowAnyPpRouteSheetUpload,
    ),
  };
}

export { DEFAULTS as DEFAULT_APP_SETTINGS };
