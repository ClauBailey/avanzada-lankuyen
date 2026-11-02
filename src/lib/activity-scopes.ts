import type {
  ActivityScheduleType,
  ActivityScope,
} from "@/generated/prisma/enums";

/** Alcance de una actividad del calendario (RF-CAL-01). */
export const ACTIVITY_SCOPES = [
  "COMUNIDAD",
  "AVANZADA",
  "GRUPO_DE_TRABAJO",
] as const satisfies readonly ActivityScope[];

export const ACTIVITY_SCOPE_LABELS: Record<ActivityScope, string> = {
  COMUNIDAD: "Comunidad",
  AVANZADA: "Avanzada",
  GRUPO_DE_TRABAJO: "Grupo de trabajo",
};

export const ACTIVITY_SCOPE_DESCRIPTIONS: Record<ActivityScope, string> = {
  COMUNIDAD: "Actividad propia de una Comunidad.",
  AVANZADA: "Actividad común de toda la Unidad.",
  GRUPO_DE_TRABAJO: "Actividad de un equipo o proyecto específico.",
};

/** Carácter de la actividad respecto al ciclo de programa (RF-CAL-01). */
export const ACTIVITY_SCHEDULE_TYPES = [
  "FIJA",
  "VARIABLE",
] as const satisfies readonly ActivityScheduleType[];

export const ACTIVITY_SCHEDULE_TYPE_LABELS: Record<ActivityScheduleType, string> =
  {
    FIJA: "Fija",
    VARIABLE: "Variable",
  };

export const ACTIVITY_SCHEDULE_TYPE_DESCRIPTIONS: Record<
  ActivityScheduleType,
  string
> = {
  FIJA: "Reuniones regulares, peñas, campamentos y ceremonias.",
  VARIABLE: "Actividades nacidas del ciclo de programa o de proyectos.",
};
