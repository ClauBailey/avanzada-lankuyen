import { APP_TIMEZONE } from "@/lib/constants";

type DateInput = Date | string;

const longDateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: APP_TIMEZONE,
});

const shortDateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: APP_TIMEZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIMEZONE,
});

const fullDateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: APP_TIMEZONE,
});

const timestampFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: APP_TIMEZONE,
});

const dateOnlyFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthLabelFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const zonedPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function formatLongDate(date: Date = new Date()) {
  return capitalize(longDateFormatter.format(date));
}

export function formatShortDate(date: DateInput) {
  return capitalize(shortDateFormatter.format(toDate(date)));
}

export function formatDateTime(date: DateInput) {
  return capitalize(dateTimeFormatter.format(toDate(date)));
}

/** Fecha sin hora, con año: "26 de octubre de 2026". */
export function formatFullDate(date: DateInput) {
  return capitalize(fullDateFormatter.format(toDate(date)));
}

/** Marca de tiempo compacta: "26-10-2026, 14:30". */
export function formatTimestamp(date: DateInput) {
  return timestampFormatter.format(toDate(date));
}

/** Hora local de la unidad: "14:30". */
export function formatTime(date: DateInput) {
  return timeFormatter.format(toDate(date));
}

/**
 * Fecha sin hora para columnas `date` de PostgreSQL.
 * Se formatea en UTC porque Prisma las devuelve a medianoche UTC.
 */
export function formatDateOnly(date: DateInput) {
  return capitalize(dateOnlyFormatter.format(toDate(date)));
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getZonedParts(date: Date) {
  const parts = zonedPartsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getZonedParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

/** Valor para `<input type="datetime-local">` en hora de Chile. */
export function toDateTimeInputValue(date: DateInput) {
  const parts = getZonedParts(toDate(date));
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Valor para `<input type="date">` en hora de Chile. */
export function toDateInputValue(date: DateInput) {
  const parts = getZonedParts(toDate(date));
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * Convierte un valor `datetime-local` interpretado en America/Santiago a UTC.
 * Se resuelve el desfase en dos pasadas para cubrir los cambios de horario.
 */
export function parseDateTimeInput(value: string): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0"] = match;
  const naive = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (Number.isNaN(naive)) return null;

  const firstGuess = naive - getTimeZoneOffsetMs(new Date(naive));
  const refined = naive - getTimeZoneOffsetMs(new Date(firstGuess));

  return new Date(refined);
}

/** Convierte `YYYY-MM-DD` a la fecha UTC que usa Prisma para columnas `date`. */
export function parseDateOnlyInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Etiqueta legible de un mes `YYYY-MM`: "Octubre de 2026". */
export function formatMonthLabel(month: string) {
  const date = parseDateOnlyInput(`${month}-01`);
  return date ? capitalize(monthLabelFormatter.format(date)) : month;
}

/** Rango [inicio, fin) de un mes `YYYY-MM` en hora de Chile. */
export function getMonthRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;

  const start = parseDateTimeInput(`${month}-01T00:00`);
  const nextYear = Number(match[2]) === 12 ? Number(match[1]) + 1 : Number(match[1]);
  const nextMonth = Number(match[2]) === 12 ? 1 : Number(match[2]) + 1;
  const end = parseDateTimeInput(
    `${nextYear}-${pad(nextMonth)}-01T00:00`,
  );

  if (!start || !end) return null;
  return { start, end };
}

/** Lista de meses `YYYY-MM` entre dos fechas (inclusive). */
export function listMonthsBetween(start: DateInput, end: DateInput) {
  const startParts = getZonedParts(toDate(start));
  const endParts = getZonedParts(toDate(end));
  const months: string[] = [];

  let year = startParts.year;
  let month = startParts.month;

  while (
    year < endParts.year ||
    (year === endParts.year && month <= endParts.month)
  ) {
    months.push(`${year}-${pad(month)}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

/** Saludo según la hora local de la unidad (America/Santiago). */
export function getGreeting(date: Date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: APP_TIMEZONE,
    }).format(date),
  );

  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}
