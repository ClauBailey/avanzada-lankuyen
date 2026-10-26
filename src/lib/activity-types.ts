import type { ActivityType } from "@/generated/prisma/enums";

export const ACTIVITY_TYPES = [
  "REUNION",
  "SALIDA",
  "FORMACION",
  "SERVICIO",
  "CELEBRACION",
  "OTRO",
] as const satisfies readonly ActivityType[];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  REUNION: "Reunión",
  SALIDA: "Salida",
  FORMACION: "Formación",
  SERVICIO: "Servicio",
  CELEBRACION: "Celebración",
  OTRO: "Otro",
};

export const ACTIVITY_TYPE_STYLES: Record<ActivityType, string> = {
  REUNION: "border-anil-200 bg-anil-50 text-anil-800",
  SALIDA: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FORMACION: "border-lavender/40 bg-lavender/10 text-anil-800",
  SERVICIO: "border-amber-200 bg-amber-50 text-amber-800",
  CELEBRACION: "border-gold/40 bg-gold-soft text-[#7a5a16]",
  OTRO: "border-line bg-canvas text-ink-soft",
};

export const RSVP_LABELS = {
  CONFIRMADO: "Confirmó asistencia",
  NO_ASISTE: "No podrá ir",
} as const;

export const ATTENDANCE_LABELS = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  JUSTIFICADO: "Justificado",
} as const;

export const ATTENDANCE_STYLES = {
  PRESENTE: "success",
  AUSENTE: "danger",
  JUSTIFICADO: "warning",
} as const;
