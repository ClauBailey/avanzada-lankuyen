import { z } from "zod";

import { activityIdSchema } from "@/features/activities/schemas";

const score = (label: string) =>
  z.coerce
    .number()
    .int(`Selecciona un valor para ${label}.`)
    .min(1, `El valor de ${label} debe estar entre 1 y 7.`)
    .max(7, `El valor de ${label} debe estar entre 1 y 7.`);

export const activityEvaluationSchema = activityIdSchema.extend({
  affectivityScore: score("Afectividad"),
  corporalityScore: score("Corporalidad"),
  spiritualityScore: score("Espiritualidad"),
  characterScore: score("Carácter"),
  creativityScore: score("Creatividad"),
  sociabilityScore: score("Sociabilidad"),
  comment: z
    .string()
    .trim()
    .max(2000, "La evaluación escrita no puede superar los 2000 caracteres.")
    .optional(),
});

export type ActivityEvaluationInput = z.infer<typeof activityEvaluationSchema>;
