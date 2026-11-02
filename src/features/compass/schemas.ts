import { z } from "zod";

export const compassAreaSchema = z.enum([
  "CORPORALIDAD",
  "CREATIVIDAD",
  "CARACTER",
  "AFECTIVIDAD",
  "SOCIABILIDAD",
  "ESPIRITUALIDAD",
]);

export const compassStatusSchema = z.enum([
  "EXPLORANDO",
  "LOGRADO_EN_VIDA_COTIDIANA",
]);

const objectiveText = z
  .string()
  .trim()
  .min(3, "Escribe al menos una frase para tu objetivo.")
  .max(2000, "El objetivo no puede superar los 2000 caracteres.");

const reflectionText = z
  .string()
  .trim()
  .min(3, "Escribe al menos una frase para tu reflexión.")
  .max(4000, "La reflexión no puede superar los 4000 caracteres.");

const uuid = (label: string) => z.string().uuid(`${label} inválido.`);

const optionalUuid = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || z.string().uuid().safeParse(value).success,
      `${label} inválido.`,
    );

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined()])
  .optional()
  .transform((value) => value === "on" || value === "true");

const optionalCheckbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined()])
  .optional()
  .transform((value) => value === "on" || value === "true");

export const adoptTemplateObjectiveSchema = z.object({
  templateId: uuid("Objetivo del catálogo"),
  currentText: objectiveText.optional(),
});

export const updateCompassObjectiveTextSchema = z.object({
  objectiveId: uuid("Objetivo"),
  currentText: objectiveText,
});

export const createCustomCompassObjectiveSchema = z.object({
  area: compassAreaSchema,
  terminalObjectiveRef: z
    .string()
    .trim()
    .max(600, "La línea terminal no puede superar los 600 caracteres.")
    .optional(),
  currentText: objectiveText,
});

export const updateCompassObjectiveStatusSchema = z.object({
  objectiveId: uuid("Objetivo"),
  status: compassStatusSchema,
});

export const toggleCompassObjectiveSharingSchema = z.object({
  objectiveId: uuid("Objetivo"),
  sharedWithCommunity: checkbox,
});

export const compassReflectionSchema = z.object({
  objectiveId: optionalUuid("Objetivo"),
  activityId: optionalUuid("Actividad"),
  isCycleSelfEvaluation: checkbox,
  cycleLabel: z
    .string()
    .trim()
    .max(120, "El nombre del ciclo no puede superar los 120 caracteres.")
    .optional(),
  content: reflectionText,
  sharedWithAa: optionalCheckbox,
  sharedWithCommunity: optionalCheckbox,
});

/**
 * Edición de objetivo realizada sin conexión y guardada en la cola local.
 * La reconciliación con el servidor conserva siempre ambas redacciones.
 */
export const offlineCompassEditSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: z.literal("OBJECTIVE_TEXT"),
  objectiveId: uuid("Objetivo"),
  offlineBaseText: z
    .string()
    .max(2000, "El texto base no puede superar los 2000 caracteres."),
  offlineNewText: objectiveText,
  createdAt: z.string().trim().max(40).optional(),
});

export const syncOfflineCompassEditsSchema = z.object({
  edits: z
    .array(offlineCompassEditSchema)
    .min(1, "No hay ediciones pendientes por sincronizar.")
    .max(50, "Demasiadas ediciones pendientes en una sola sincronización."),
});

export const requestCompassConsensusSchema = z.object({
  objectiveId: optionalUuid("Objetivo"),
  message: z
    .string()
    .trim()
    .max(600, "El mensaje no puede superar los 600 caracteres.")
    .optional(),
});

export const mentoringNoteSchema = z.object({
  studentId: uuid("Joven"),
  noteId: optionalUuid("Nota"),
  content: z
    .string()
    .trim()
    .min(3, "Escribe al menos una frase para la nota.")
    .max(4000, "La nota no puede superar los 4000 caracteres."),
  sharedWithStudent: checkbox,
});

export const communityLogEntrySchema = z.object({
  entryId: optionalUuid("Entrada"),
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(160, "El título no puede superar los 160 caracteres."),
  content: z
    .string()
    .trim()
    .min(3, "Escribe el contenido de la entrada.")
    .max(8000, "La entrada no puede superar los 8000 caracteres."),
  sharedWithAa: checkbox,
  sharedWithCoordinators: checkbox,
});

export type AdoptTemplateObjectiveInput = z.infer<
  typeof adoptTemplateObjectiveSchema
>;
export type CompassReflectionInput = z.infer<typeof compassReflectionSchema>;
export type MentoringNoteInput = z.infer<typeof mentoringNoteSchema>;
export type CommunityLogEntryInput = z.infer<typeof communityLogEntrySchema>;
