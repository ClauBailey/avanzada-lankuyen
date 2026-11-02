/**
 * Reglas puras de Proyectos, Grupos de Trabajo y Red de Apoyo (Fase 5).
 *
 * Se mantienen sin Prisma ni Next.js para que las Server Actions, las vistas y
 * las pruebas constitucionales compartan exactamente la misma decisión.
 *
 * Principios:
 *  - Art. V: el Grupo de Trabajo es abierto y transversal. Cualquier joven de
 *    cualquier Comunidad puede inscribirse según su interés en la tarea.
 *  - Manual p. 261–265: el proyecto avanza por seis pasos, desde Soñar hasta
 *    Celebrar ¡La Peña!.
 *  - Manual p. 104: el Grupo de Trabajo se disuelve al concluir e informar el
 *    proyecto; pasa a `HISTORICO_DISUELTO` sin borrar su memoria.
 */

export const PROJECT_STEPS = [
  {
    key: "SONAR",
    order: 1,
    label: "Soñar",
    shortLabel: "Soñar",
    manualLabel: "1. Soñar",
    description:
      "El grupo imagina qué quiere cambiar o vivir. Todavía no hay plan: hay deseo, conversación y escucha.",
  },
  {
    key: "ELEGIR",
    order: 2,
    label: "Elegir",
    shortLabel: "Elegir",
    manualLabel: "2. Elegir",
    description:
      "De todas las ideas, el grupo elige una y la escribe como proyecto con destinatarios y objetivos claros.",
  },
  {
    key: "ORGANIZAR",
    order: 3,
    label: "Organizar",
    shortLabel: "Organizar",
    manualLabel: "3. Organizar",
    description:
      "Se reparten tareas, se define el presupuesto, se consiguen permisos y se preparan las actividades centrales y conexas.",
  },
  {
    key: "REALIZAR",
    order: 4,
    label: "Realizar",
    shortLabel: "Realizar",
    manualLabel: "4. Realizar",
    description:
      "El proyecto se vive. Cada actividad central se ejecuta y las conexas amplían su alcance.",
  },
  {
    key: "EVALUAR",
    order: 5,
    label: "Evaluar",
    shortLabel: "Evaluar",
    manualLabel: "5. Evaluar",
    description:
      "El grupo revisa lo preparado y lo ejecutado, saca conclusiones y consolida el Informe Final del Proyecto.",
  },
  {
    key: "CELEBRAR",
    order: 6,
    label: "Celebrar · ¡La Peña!",
    shortLabel: "Celebrar",
    manualLabel: "6. Celebrar — ¡La Peña!",
    description:
      "La Peña cierra el proyecto: se agradece, se comparte lo vivido y el Grupo de Trabajo se disuelve con su memoria intacta.",
  },
] as const;

export type ProjectStepKey = (typeof PROJECT_STEPS)[number]["key"];

export function isProjectStep(value: string): value is ProjectStepKey {
  return PROJECT_STEPS.some((step) => step.key === value);
}

export function projectStepDefinition(step: ProjectStepKey) {
  return PROJECT_STEPS.find((item) => item.key === step) ?? PROJECT_STEPS[0];
}

/** Siguiente paso del proyecto; `CELEBRAR` es terminal y devuelve `null`. */
export function nextProjectStep(step: ProjectStepKey): ProjectStepKey | null {
  const current = projectStepDefinition(step);
  return (
    PROJECT_STEPS.find((item) => item.order === current.order + 1)?.key ?? null
  );
}

export const PROJECT_LOCALITIES = [
  {
    key: "LOCAL",
    label: "Local",
    description: "Ocurre en el propio sector o grupo de referencia.",
  },
  {
    key: "COMUNAL",
    label: "Comunal",
    description: "Involucra a la comuna y a actores del territorio.",
  },
  {
    key: "REGIONAL",
    label: "Regional",
    description: "Tiene alcance regional o articula varias comunas.",
  },
] as const;

export type ProjectLocalityKey = (typeof PROJECT_LOCALITIES)[number]["key"];

export function isProjectLocality(value: string): value is ProjectLocalityKey {
  return PROJECT_LOCALITIES.some((item) => item.key === value);
}

export function projectLocalityDefinition(locality: ProjectLocalityKey) {
  return (
    PROJECT_LOCALITIES.find((item) => item.key === locality) ??
    PROJECT_LOCALITIES[0]
  );
}

/**
 * `CENTRAL` es insustituible para el proyecto; `CONEXA` amplía su alcance sin
 * reemplazarla (Manual p. 259).
 */
export const PROJECT_ACTIVITY_KINDS = [
  {
    key: "CENTRAL",
    label: "Actividad central",
    shortLabel: "Central",
    description: "Sin ella el proyecto no cumple su objetivo.",
  },
  {
    key: "CONEXA",
    label: "Actividad conexa",
    shortLabel: "Conexa",
    description: "Amplía el alcance del proyecto y suma participación.",
  },
] as const;

export type ProjectActivityKindKey =
  (typeof PROJECT_ACTIVITY_KINDS)[number]["key"];

export function isProjectActivityKind(
  value: string,
): value is ProjectActivityKindKey {
  return PROJECT_ACTIVITY_KINDS.some((item) => item.key === value);
}

export function projectActivityKindLabel(
  kind: ProjectActivityKindKey | string,
): string {
  return (
    PROJECT_ACTIVITY_KINDS.find((item) => item.key === kind)?.label ?? kind
  );
}

export const WORK_GROUP_STATUSES = [
  {
    key: "ACTIVO",
    label: "Activo",
    description: "El Grupo de Trabajo está abierto a nuevas inscripciones.",
  },
  {
    key: "HISTORICO_DISUELTO",
    label: "Histórico · disuelto",
    description:
      "El proyecto concluyó y fue informado. El grupo ya no recibe inscripciones.",
  },
] as const;

export type WorkGroupStatusKey = (typeof WORK_GROUP_STATUSES)[number]["key"];

export function workGroupStatusDefinition(status: WorkGroupStatusKey) {
  return (
    WORK_GROUP_STATUSES.find((item) => item.key === status) ??
    WORK_GROUP_STATUSES[0]
  );
}

export function isYouthRole(role: string): role is "PP" | "COORDINADOR" {
  return role === "PP" || role === "COORDINADOR";
}

export interface ProjectActor {
  id: string;
  role: string;
  isActive?: boolean;
}

export interface ProjectPermissionContext {
  responsibleUserId: string | null;
  workGroupStatus: WorkGroupStatusKey;
  /** IDs de integrantes internos vigentes (con cuenta). */
  memberUserIds: readonly string[];
}

/**
 * Crear un proyecto: cualquier joven activo (PP o COORDINADOR) o un AA. El
 * creador puede quedar como `responsibleUserId`.
 */
export function canCreateProject(actor: ProjectActor): boolean {
  return (
    actor.isActive !== false &&
    (actor.role === "AA" || isYouthRole(actor.role))
  );
}

/**
 * Actualizar la Pauta de Identificación y los seis pasos: AA, COORDINADOR, el
 * joven Responsable del Grupo de Trabajo y los participantes activos.
 */
export function canEditProject(
  actor: ProjectActor,
  project: ProjectPermissionContext,
): boolean {
  if (actor.isActive === false) return false;
  if (actor.role === "AA" || actor.role === "COORDINADOR") return true;
  if (!isYouthRole(actor.role)) return false;
  if (project.responsibleUserId && project.responsibleUserId === actor.id) {
    return true;
  }
  return (
    project.workGroupStatus === "ACTIVO" &&
    project.memberUserIds.includes(actor.id)
  );
}

/**
 * Inscripción transversal (RF-PRY-04): cualquier PP o COORDINADOR de
 * cualquier Comunidad entra a un Grupo de Trabajo activo por interés en la
 * tarea. No se exige pertenecer a la comunidad organizadora.
 */
export function canJoinWorkGroup(
  actor: ProjectActor,
  project: Pick<ProjectPermissionContext, "workGroupStatus" | "memberUserIds">,
): boolean {
  return (
    actor.isActive !== false &&
    isYouthRole(actor.role) &&
    project.workGroupStatus === "ACTIVO" &&
    !project.memberUserIds.includes(actor.id)
  );
}

/** Agregar participantes externos o monitores sigue la regla de edición. */
export function canManageWorkGroup(
  actor: ProjectActor,
  project: ProjectPermissionContext,
): boolean {
  return canEditProject(actor, project);
}

/** El Informe Final se consolida en Evaluar o Celebrar. */
export function canSubmitFinalReport(
  actor: ProjectActor,
  project: ProjectPermissionContext & { step: ProjectStepKey },
): boolean {
  return (
    canEditProject(actor, project) &&
    (project.step === "EVALUAR" || project.step === "CELEBRAR")
  );
}

/**
 * Disolver el Grupo de Trabajo (Manual p. 104). Solo tras el Informe Final, en
 * los pasos Evaluar o Celebrar, y por quien puede editar el proyecto.
 */
export function canDissolveWorkGroup(
  actor: ProjectActor,
  project: ProjectPermissionContext & { step: ProjectStepKey },
): boolean {
  return project.workGroupStatus === "ACTIVO" && canSubmitFinalReport(actor, project);
}

/** Las siete áreas de competencia del Manual (p. 278–279). */
export const COMPETENCY_AREA_OPTIONS = [
  { key: "CULTURA", label: "Cultura" },
  { key: "TRABAJO_EN_EQUIPO", label: "Trabajo en equipo" },
  { key: "INNOVACION", label: "Innovación" },
  { key: "COMUNICACION", label: "Comunicación" },
  { key: "CIUDADANIA", label: "Ciudadanía" },
  { key: "MEDIOAMBIENTE", label: "Medioambiente" },
  { key: "VIDA_AIRE_LIBRE_Y_DEPORTES", label: "Vida al aire libre y deportes" },
] as const;

export type CompetencyAreaKey =
  (typeof COMPETENCY_AREA_OPTIONS)[number]["key"];

export function competencyAreaLabel(area: CompetencyAreaKey | string): string {
  return (
    COMPETENCY_AREA_OPTIONS.find((item) => item.key === area)?.label ?? area
  );
}

export const WORK_GROUP_MEMBER_KINDS = [
  "INTERNO",
  "MONITOR",
  "EXTERNO",
] as const;

export type WorkGroupMemberKind = (typeof WORK_GROUP_MEMBER_KINDS)[number];

export interface WorkGroupMemberInput {
  userId?: string | null;
  supportContactId?: string | null;
  externalName?: string | null;
  externalOrganization?: string | null;
}

export type WorkGroupMemberValidation =
  | { valid: true; kind: WorkGroupMemberKind }
  | { valid: false; error: string };

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * RF-PRY-05 y Art. V: un integrante es válido si tiene cuenta (`userId`), si es
 * monitor de la Red de Apoyo (`supportContactId`) o si es un invitado externo
 * sin cuenta (`externalName` y `userId === null`). Las tres identidades son
 * mutuamente excluyentes.
 */
export function validateWorkGroupMemberInput(
  input: WorkGroupMemberInput,
): WorkGroupMemberValidation {
  const userId = clean(input.userId);
  const supportContactId = clean(input.supportContactId);
  const externalName = clean(input.externalName);
  const sources = [userId, supportContactId, externalName].filter(Boolean);

  if (sources.length === 0) {
    return {
      valid: false,
      error:
        "Indica un integrante con cuenta, un monitor de la Red de Apoyo o el nombre de un participante externo.",
    };
  }

  if (sources.length > 1) {
    return {
      valid: false,
      error:
        "Un integrante no puede ser a la vez miembro con cuenta, monitor y participante externo.",
    };
  }

  if (userId) {
    return { valid: true, kind: "INTERNO" };
  }

  if (supportContactId) {
    return { valid: true, kind: "MONITOR" };
  }

  if (externalName && externalName.length > 160) {
    return {
      valid: false,
      error: "El nombre del participante externo no puede superar los 160 caracteres.",
    };
  }

  return { valid: true, kind: "EXTERNO" };
}

/** Tipo legible del integrante para la ficha del proyecto. */
export function workGroupMemberKindLabel(input: WorkGroupMemberInput): string {
  const validation = validateWorkGroupMemberInput(input);
  if (!validation.valid) return "Sin identificar";
  if (validation.kind === "INTERNO") return "Miembro con cuenta";
  if (validation.kind === "MONITOR") return "Monitor de la Red de Apoyo";
  return "Participante externo invitado";
}

export const PROJECT_CONVOCATION_TITLE = "Nuevo proyecto abierto";

/** Texto de la notificación `PROYECTO_CONVOCATORIA` (RF-NOT-01). */
export function projectConvocationBody(options: {
  projectTitle: string;
  locality: ProjectLocalityKey;
  responsibleName: string | null;
}): string {
  const locality = projectLocalityDefinition(options.locality).label;
  const responsible = options.responsibleName
    ? ` Responsable: ${options.responsibleName}.`
    : "";
  return `Se abrió el proyecto «${options.projectTitle}» (alcance ${locality}). Cualquier persona joven de la Avanzada puede inscribirse en su Grupo de Trabajo según su interés en la tarea.${responsible}`;
}

/** Etiqueta de progreso «paso 3 de 6». */
export function projectStepProgress(step: ProjectStepKey): string {
  const definition = projectStepDefinition(step);
  return `Paso ${definition.order} de ${PROJECT_STEPS.length} · ${definition.label}`;
}
