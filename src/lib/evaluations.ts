/**
 * Evaluación cualitativa de actividades (Constitución Art. III).
 *
 * No existen notas, escalas 1–7, promedios ni comparaciones entre personas.
 * Solo se observa el nivel de logro respecto de los objetivos, las áreas de
 * desarrollo que se hicieron presentes y las palabras de quien participó.
 *
 * Módulo puro: lo comparten formularios, vistas AA y pruebas unitarias.
 */

export const OBJECTIVE_ACHIEVEMENT_LEVELS = [
  {
    key: "LOGRADO_PLENAMENTE",
    label: "Logrado plenamente",
    shortLabel: "Plenamente",
    description:
      "La actividad alcanzó los objetivos que nos habíamos propuesto.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "LOGRADO_PARCIALMENTE",
    label: "Logrado parcialmente",
    shortLabel: "Parcialmente",
    description:
      "Avanzamos en los objetivos, aunque quedaron aspectos por profundizar.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "NO_LOGRADO_REPLANTEAR",
    label: "No logrado · replantear",
    shortLabel: "Replantear",
    description:
      "Los objetivos no se alcanzaron y conviene pensar otra forma de vivirlos.",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
] as const;

export type ObjectiveAchievementLevel =
  (typeof OBJECTIVE_ACHIEVEMENT_LEVELS)[number]["key"];

export const DEVELOPMENT_AREAS = [
  {
    key: "CORPORALIDAD",
    label: "Corporalidad",
    description:
      "Cuerpo, energía, movimiento y cuidado de la salud durante el encuentro.",
  },
  {
    key: "CREATIVIDAD",
    label: "Creatividad",
    description:
      "Imaginación, expresión y búsqueda de soluciones propias.",
  },
  {
    key: "CARACTER",
    label: "Carácter",
    description:
      "Autonomía, responsabilidad, constancia y toma de decisiones.",
  },
  {
    key: "AFECTIVIDAD",
    label: "Afectividad",
    description:
      "Vínculos, cuidado de los demás y clima emocional que dejó la actividad.",
  },
  {
    key: "SOCIABILIDAD",
    label: "Sociabilidad",
    description:
      "Trabajo en equipo, comunicación y convivencia con el grupo.",
  },
  {
    key: "ESPIRITUALIDAD",
    label: "Espiritualidad",
    description:
      "Sentido, interioridad, valores y conexión con lo trascendente.",
  },
] as const;

export type DevelopmentAreaKey = (typeof DEVELOPMENT_AREAS)[number]["key"];

export interface QualitativeEvaluation {
  objectiveAchievementLevel: ObjectiveAchievementLevel;
  experiencedAreas: readonly DevelopmentAreaKey[];
}

export function levelDefinition(level: ObjectiveAchievementLevel) {
  return (
    OBJECTIVE_ACHIEVEMENT_LEVELS.find((item) => item.key === level) ??
    OBJECTIVE_ACHIEVEMENT_LEVELS[1]
  );
}

/**
 * Distribución de niveles de logro. Devuelve conteos, nunca promedios.
 */
export function levelDistribution(
  evaluations: ReadonlyArray<
    Pick<QualitativeEvaluation, "objectiveAchievementLevel">
  >,
) {
  return OBJECTIVE_ACHIEVEMENT_LEVELS.map((level) => ({
    ...level,
    count: evaluations.filter(
      (evaluation) => evaluation.objectiveAchievementLevel === level.key,
    ).length,
  }));
}

/**
 * Frecuencia con que cada área de desarrollo fue percibida.
 */
export function areaFrequency(
  evaluations: ReadonlyArray<Pick<QualitativeEvaluation, "experiencedAreas">>,
) {
  const counts = new Map<DevelopmentAreaKey, number>();

  for (const evaluation of evaluations) {
    for (const area of evaluation.experiencedAreas) {
      counts.set(area, (counts.get(area) ?? 0) + 1);
    }
  }

  return DEVELOPMENT_AREAS.map((area) => ({
    ...area,
    count: counts.get(area.key) ?? 0,
  }));
}

/** Texto legible de las áreas marcadas, sin puntajes. */
export function formatExperiencedAreas(
  areas: readonly DevelopmentAreaKey[],
): string {
  if (areas.length === 0) return "Sin áreas marcadas";

  return areas
    .map(
      (key) => DEVELOPMENT_AREAS.find((area) => area.key === key)?.label ?? key,
    )
    .join(" · ");
}
