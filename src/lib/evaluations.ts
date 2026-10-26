/**
 * Áreas de desarrollo scout evaluadas después de cada actividad.
 *
 * Se mantienen en un módulo puro para compartir etiquetas entre formularios,
 * vistas AA y pruebas unitarias sin arrastrar dependencias del servidor.
 */
export const EVALUATION_AREAS = [
  {
    key: "affectivityScore",
    label: "Afectividad",
    description:
      "Vínculos, cuidado de los demás y clima emocional que dejó la actividad.",
  },
  {
    key: "corporalityScore",
    label: "Corporalidad",
    description:
      "Cuerpo, energía, movimiento y cuidado de la salud durante el encuentro.",
  },
  {
    key: "spiritualityScore",
    label: "Espiritualidad",
    description:
      "Sentido, interioridad, valores y conexión con lo trascendente.",
  },
  {
    key: "characterScore",
    label: "Carácter",
    description:
      "Autonomía, responsabilidad, constancia y toma de decisiones.",
  },
  {
    key: "creativityScore",
    label: "Creatividad",
    description:
      "Imaginación, expresión y búsqueda de soluciones propias.",
  },
  {
    key: "sociabilityScore",
    label: "Sociabilidad",
    description:
      "Trabajo en equipo, comunicación y convivencia con el grupo.",
  },
] as const;

export type EvaluationAreaKey = (typeof EVALUATION_AREAS)[number]["key"];

export type EvaluationScores = Record<EvaluationAreaKey, number>;

export const EVALUATION_SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

export function overallEvaluationAverage(
  evaluations: ReadonlyArray<EvaluationScores>,
): number | null {
  if (evaluations.length === 0) return null;

  return average(
    evaluations.flatMap((evaluation) =>
      EVALUATION_AREAS.map((area) => evaluation[area.key]),
    ),
  );
}

export function areaAverages(
  evaluations: ReadonlyArray<EvaluationScores>,
): Record<EvaluationAreaKey, number | null> {
  return Object.fromEntries(
    EVALUATION_AREAS.map((area) => [
      area.key,
      average(evaluations.map((evaluation) => evaluation[area.key])),
    ]),
  ) as Record<EvaluationAreaKey, number | null>;
}

/** Formato breve para pantallas: "5,6" y un guion cuando no hay respuestas. */
export function formatEvaluationScore(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1).replace(".", ",");
}
