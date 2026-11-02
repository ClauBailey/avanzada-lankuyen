import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

const optionalUuid = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || UUID_PATTERN.test(value),
      message,
    );

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined()])
  .optional()
  .transform((value) => value === "on" || value === "true");

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

/** RF-CIC-02 · Diagnóstico que escribe cada Comunidad. */
export const communityDiagnosisSchema = z.object({
  strengthsAndInterests: z
    .string()
    .trim()
    .min(10, "Cuéntanos al menos una frase sobre los intereses de tu Comunidad.")
    .max(6000, "El diagnóstico no puede superar los 6000 caracteres."),
  suggestedActivities: optionalText(
    3000,
    "Las actividades sugeridas no pueden superar los 3000 caracteres.",
  ),
});

/** RF-CIC-02 · Diagnóstico general y énfasis educativo de la Avanzada. */
export const cycleSummarySchema = z.object({
  diagnosisSummary: z
    .string()
    .trim()
    .min(10, "Escribe el diagnóstico general acordado en la Reunión de Coordinadores.")
    .max(8000, "El diagnóstico general no puede superar los 8000 caracteres."),
  educationalEmphasis: z
    .string()
    .trim()
    .min(3, "Fija el énfasis educativo del ciclo.")
    .max(4000, "El énfasis educativo no puede superar los 4000 caracteres."),
});

/** RF-CIC-03 · Propuesta de actividad de los jóvenes o de una Comunidad. */
export const activityProposalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título de la propuesta debe tener al menos 3 caracteres.")
    .max(160, "El título no puede superar los 160 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Describe la propuesta con al menos una frase.")
    .max(4000, "La descripción no puede superar los 4000 caracteres."),
  isSocialInterventionProject: checkbox,
  communityId: optionalUuid("Comunidad inválida."),
});

/** RF-CIC-04 · Sesión de votación de la Asamblea. */
export const assemblyVoteSessionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Ponle un título a la sesión de votación.")
      .max(160, "El título no puede superar los 160 caracteres."),
    dynamic: z.enum([
      "ELECCION_DIRECTA",
      "RANKING_ESTRELLAS",
      "ASIGNACION_PUNTOS",
    ]),
    maxPointsBudget: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? Number(value) : 10)),
  })
  .superRefine((data, ctx) => {
    if (
      data.dynamic === "ASIGNACION_PUNTOS" &&
      (!Number.isInteger(data.maxPointsBudget) ||
        data.maxPointsBudget < 1 ||
        data.maxPointsBudget > 100)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPointsBudget"],
        message: "El pozo de puntos debe ser un entero entre 1 y 100.",
      });
    }
  });

/** RF-CIC-04 · Voto individual de la Asamblea. */
export const assemblyVoteSchema = z.object({
  sessionId: uuid("Sesión de votación inválida."),
  proposalId: uuid("Propuesta inválida."),
  value: z
    .string()
    .trim()
    .regex(/^\d+$/, "El voto debe ser un número entero.")
    .transform((value) => Number(value)),
});

export const assemblyVoteSessionIdSchema = z.object({
  sessionId: uuid("Sesión de votación inválida."),
});

export const assemblyVoteSessionToggleSchema = z.object({
  sessionId: uuid("Sesión de votación inválida."),
  isOpen: z.enum(["true", "false"]),
});

export const selectProposalSchema = z.object({
  proposalId: uuid("Propuesta inválida."),
  selected: z.enum(["true", "false"]),
});

export const cycleIdSchema = z.object({
  cycleId: uuid("Ciclo inválido."),
});

export const advanceCyclePhaseSchema = z.object({
  cycleId: uuid("Ciclo inválido."),
  phase: z.enum([
    "DIAGNOSTICO_Y_ENFASIS",
    "PROPUESTA_Y_SELECCION",
    "ORGANIZACION_Y_PREPARACION",
    "DESARROLLO_Y_EVALUACION",
    "FINALIZADO",
  ]),
});
