import { z } from "zod";

import { activityIdSchema } from "@/features/activities/schemas";

const achievementLevel = z.enum(
  ["LOGRADO_PLENAMENTE", "LOGRADO_PARCIALMENTE", "NO_LOGRADO_REPLANTEAR"],
  { message: "Selecciona cómo se lograron los objetivos de la actividad." },
);

const developmentArea = z.enum([
  "CORPORALIDAD",
  "CREATIVIDAD",
  "CARACTER",
  "AFECTIVIDAD",
  "SOCIABILIDAD",
  "ESPIRITUALIDAD",
]);

const openText = (label: string) =>
  z
    .string()
    .trim()
    .max(2000, `${label} no puede superar los 2000 caracteres.`)
    .optional();

/**
 * Observación cualitativa posterior a una actividad.
 * No existe ninguna escala numérica ni promedio.
 */
export const activityEvaluationSchema = activityIdSchema.extend({
  objectiveAchievementLevel: achievementLevel,
  experiencedAreas: z
    .array(developmentArea)
    .max(6, "Selecciona como máximo las seis áreas de desarrollo.")
    .default([]),
  organizationFeedback: openText("La observación sobre la organización"),
  emotionalResonance: openText("La observación sobre el clima y el ritmo"),
  learningsForNextTime: openText("El aprendizaje para la próxima vez"),
});

export type ActivityEvaluationInput = z.infer<typeof activityEvaluationSchema>;
