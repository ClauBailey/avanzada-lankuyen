import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) => z.string().trim().regex(UUID_PATTERN, message);

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

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const requiredText = (min: number, max: number, empty: string, long: string) =>
  z.string().trim().min(min, empty).max(max, long);

export const projectStepSchema = z.enum([
  "SONAR",
  "ELEGIR",
  "ORGANIZAR",
  "REALIZAR",
  "EVALUAR",
  "CELEBRAR",
]);

export const projectLocalitySchema = z.enum(["LOCAL", "COMUNAL", "REGIONAL"]);

export const projectActivityKindSchema = z.enum(["CENTRAL", "CONEXA"]);

export const competencyAreaSchema = z.enum([
  "CULTURA",
  "TRABAJO_EN_EQUIPO",
  "INNOVACION",
  "COMUNICACION",
  "CIUDADANIA",
  "MEDIOAMBIENTE",
  "VIDA_AIRE_LIBRE_Y_DEPORTES",
]);

const projectFields = {
  title: requiredText(
    3,
    160,
    "El título del proyecto debe tener al menos 3 caracteres.",
    "El título no puede superar los 160 caracteres.",
  ),
  cycleId: optionalUuid("Ciclo inválido."),
  responsibleUserId: optionalUuid("Responsable inválido."),
  accompanyingAaId: optionalUuid("AA acompañante inválido."),
  beneficiaries: requiredText(
    3,
    4000,
    "Describe a quiénes beneficia el proyecto.",
    "Los destinatarios no pueden superar los 4000 caracteres.",
  ),
  locality: projectLocalitySchema,
  durationText: requiredText(
    2,
    120,
    "Indica la duración estimada del proyecto.",
    "La duración no puede superar los 120 caracteres.",
  ),
  problemDiagnosis: requiredText(
    10,
    8000,
    "Escribe el diagnóstico del problema o sueño (mínimo 10 caracteres).",
    "El diagnóstico no puede superar los 8000 caracteres.",
  ),
  generalObjective: requiredText(
    5,
    4000,
    "Escribe el objetivo general del proyecto.",
    "El objetivo general no puede superar los 4000 caracteres.",
  ),
  specificObjectives: requiredText(
    5,
    6000,
    "Escribe los objetivos específicos del proyecto.",
    "Los objetivos específicos no pueden superar los 6000 caracteres.",
  ),
  observableIndicators: optionalText(
    4000,
    "Los indicadores observables no pueden superar los 4000 caracteres.",
  ),
  budgetSummary: optionalText(
    4000,
    "El resumen de presupuesto no puede superar los 4000 caracteres.",
  ),
  requiredCompetencies: z.array(competencyAreaSchema).max(7).optional(),
  isSocialEnvironmentalIntervention: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
};

export const createProjectSchema = z.object(projectFields);

export const updateProjectSchema = z.object({
  ...projectFields,
  projectId: uuid("Proyecto inválido."),
  step: projectStepSchema.optional(),
});

export const projectIdSchema = z.object({
  projectId: uuid("Proyecto inválido."),
});

export const setProjectStepSchema = z.object({
  projectId: uuid("Proyecto inválido."),
  step: projectStepSchema,
});

export const projectActivityItemSchema = z.object({
  projectId: uuid("Proyecto inválido."),
  title: requiredText(
    3,
    160,
    "El título de la actividad debe tener al menos 3 caracteres.",
    "El título de la actividad no puede superar los 160 caracteres.",
  ),
  kind: projectActivityKindSchema,
  activityId: optionalUuid("Actividad del calendario inválida."),
});

export const projectActivityToggleSchema = z.object({
  itemId: uuid("Actividad del proyecto inválida."),
  isCompleted: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export const joinWorkGroupSchema = z.object({
  projectId: uuid("Proyecto inválido."),
  taskRole: optionalText(
    160,
    "El rol en la tarea no puede superar los 160 caracteres.",
  ),
});

export const addWorkGroupMemberSchema = z.object({
  projectId: uuid("Proyecto inválido."),
  userId: optionalUuid("Integrante inválido."),
  supportContactId: optionalUuid("Monitor inválido."),
  externalName: optionalText(
    160,
    "El nombre del participante externo no puede superar los 160 caracteres.",
  ),
  externalOrganization: optionalText(
    160,
    "La organización no puede superar los 160 caracteres.",
  ),
  taskRole: requiredText(
    2,
    160,
    "Indica el rol o la responsabilidad en la tarea.",
    "El rol en la tarea no puede superar los 160 caracteres.",
  ),
});

export const workGroupMemberIdSchema = z.object({
  memberId: uuid("Integrante inválido."),
});

export const finalReportSchema = z.object({
  projectId: uuid("Proyecto inválido."),
  finalReportPreparation: requiredText(
    10,
    8000,
    "Describe la preparación y ejecución del proyecto (mínimo 10 caracteres).",
    "El resumen de preparación y ejecución no puede superar los 8000 caracteres.",
  ),
  finalReportConclusions: requiredText(
    10,
    8000,
    "Escribe las conclusiones de la evaluación (mínimo 10 caracteres).",
    "Las conclusiones no pueden superar los 8000 caracteres.",
  ),
  celebrationNotes: optionalText(
    4000,
    "El registro de la celebración no puede superar los 4000 caracteres.",
  ),
});

export const dissolveWorkGroupSchema = z.object({
  projectId: uuid("Proyecto inválido."),
});

export const supportContactSchema = z.object({
  contactId: optionalUuid("Contacto inválido."),
  fullName: requiredText(
    3,
    160,
    "El nombre del contacto debe tener al menos 3 caracteres.",
    "El nombre no puede superar los 160 caracteres.",
  ),
  relationshipOrRole: requiredText(
    2,
    160,
    "Indica el vínculo o rol del contacto.",
    "El vínculo o rol no puede superar los 160 caracteres.",
  ),
  organization: optionalText(
    160,
    "La organización no puede superar los 160 caracteres.",
  ),
  contactInfo: optionalText(
    200,
    "El contacto no puede superar los 200 caracteres.",
  ),
  supportedAreas: z.array(competencyAreaSchema).max(7).optional(),
  collaborationNotes: optionalText(
    4000,
    "El historial de apoyo no puede superar los 4000 caracteres.",
  ),
  isActive: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

export const supportContactToggleSchema = z.object({
  contactId: uuid("Contacto inválido."),
  isActive: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});
