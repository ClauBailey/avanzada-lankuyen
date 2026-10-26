/**
 * Utilidades puras para evaluar la ventana del cron de hojas de ruta.
 *
 * Se mantienen sin dependencias del servidor para poder probarlas con
 * `node --test` sin levantar Next.js ni la base de datos.
 */

export interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = domingo, 1 = lunes, … 6 = sábado. */
  weekday: number;
  /** 1 = lunes, … 7 = domingo (ISO 8601). */
  isoWeekday: number;
  /** Fecha local `YYYY-MM-DD`. */
  dateKey: string;
  /** Hora local `HH:mm`. */
  timeKey: string;
}

export interface ScheduleEvaluation extends ZonedDateTimeParts {
  timeZone: string;
  expectedWeekday: number;
  expectedHour: number;
  isScheduledDay: boolean;
  isScheduledHour: boolean;
  matchesSchedule: boolean;
  isoWeekKey: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatterFor(timeZone: string) {
  const cached = formatters.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  formatters.set(timeZone, formatter);
  return formatter;
}

/** Descompone un instante UTC en la fecha y hora local de una zona IANA. */
export function getZonedDateTimeParts(
  date: Date,
  timeZone: string,
): ZonedDateTimeParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hour = read("hour");
  const minute = read("minute");
  const second = read("second");

  // La fecha local se interpreta como UTC para obtener el día de la semana
  // sin que el desfase horario mueva el calendario.
  const localAsUtc = new Date(Date.UTC(year, month - 1, day));
  const weekday = localAsUtc.getUTCDay();

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    isoWeekday: weekday === 0 ? 7 : weekday,
    dateKey: `${year}-${pad(month)}-${pad(day)}`,
    timeKey: `${pad(hour)}:${pad(minute)}`,
  };
}

/** Semana ISO 8601 (`YYYY-Www`) de una fecha local en la zona indicada. */
export function getIsoWeekKey(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);
  return isoWeekKeyFromDate(parts.year, parts.month, parts.day);
}

/** Semana ISO 8601 a partir de una fecha de calendario. */
export function isoWeekKeyFromDate(year: number, month: number, day: number) {
  const target = new Date(Date.UTC(year, month - 1, day));
  const isoDay = target.getUTCDay() || 7;

  // El jueves de la misma semana determina a qué año ISO pertenece.
  target.setUTCDate(target.getUTCDate() + 4 - isoDay);

  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${isoYear}-W${pad(week)}`;
}

export interface ScheduleOptions {
  timeZone: string;
  /** Hora local esperada (0–23). */
  hour: number;
  /** Día esperado: 0 = domingo, 1 = lunes, … 6 = sábado. Por defecto miércoles. */
  weekday?: number;
}

/**
 * Evalúa si un instante cae en la ventana configurada.
 *
 * La ventana es de una hora completa: miércoles a las 11 significa
 * 11:00–11:59 en `America/Santiago`. El `run_key` semanal se encarga de
 * que las Invocaciones repetidas dentro de esa hora no dupliquen avisos.
 */
export function evaluateSchedule(
  date: Date,
  options: ScheduleOptions,
): ScheduleEvaluation {
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("La fecha recibida no es válida.");
  }

  const expectedWeekday = options.weekday ?? 3;
  const expectedHour = Math.trunc(options.hour);
  const parts = getZonedDateTimeParts(date, options.timeZone);
  const isScheduledDay = parts.weekday === expectedWeekday;
  const isScheduledHour = parts.hour === expectedHour;

  return {
    ...parts,
    timeZone: options.timeZone,
    expectedWeekday,
    expectedHour,
    isScheduledDay,
    isScheduledHour,
    matchesSchedule: isScheduledDay && isScheduledHour,
    isoWeekKey: isoWeekKeyFromDate(parts.year, parts.month, parts.day),
  };
}
