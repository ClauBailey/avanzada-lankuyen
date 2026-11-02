"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import {
  addWorkGroupMemberSchema,
  createProjectSchema,
  dissolveWorkGroupSchema,
  finalReportSchema,
  joinWorkGroupSchema,
  projectActivityItemSchema,
  projectActivityToggleSchema,
  setProjectStepSchema,
  supportContactSchema,
  supportContactToggleSchema,
  updateProjectSchema,
  workGroupMemberIdSchema,
} from "@/features/projects/schemas";
import {
  canCreateProject,
  canDissolveWorkGroup,
  canEditProject,
  canJoinWorkGroup,
  canManageWorkGroup,
  canSubmitFinalReport,
  projectConvocationBody,
  validateWorkGroupMemberInput,
  workGroupMemberKindLabel,
  type ProjectPermissionContext,
  type ProjectStepKey,
  type WorkGroupStatusKey,
} from "@/features/projects/rules";
import { recordAudit } from "@/server/audit";
import { requirePermission, requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";

function revalidateProjects(projectId?: string) {
  revalidatePath("/proyectos");
  revalidatePath("/admin/red-de-apoyo");
  revalidatePath("/calendario");
  revalidatePath("/inicio");
  revalidatePath("/notificaciones");
  if (projectId) revalidatePath(`/proyectos/${projectId}`);
}

function readCompetencies(formData: FormData) {
  return formData
    .getAll("requiredCompetencies")
    .map((value) => String(value))
    .filter(Boolean);
}

interface LoadedProject extends ProjectPermissionContext {
  id: string;
  title: string;
  step: ProjectStepKey;
  responsibleUserId: string | null;
  workGroupStatus: WorkGroupStatusKey;
  memberUserIds: string[];
  cycleId: string | null;
}

async function loadProject(projectId: string): Promise<LoadedProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      step: true,
      cycleId: true,
      responsibleUserId: true,
      workGroupStatus: true,
      members: { select: { userId: true } },
    },
  });

  if (!project) return null;

  return {
    ...project,
    memberUserIds: project.members
      .map((member) => member.userId)
      .filter((value): value is string => Boolean(value)),
  };
}

async function assertYouthResponsible(userId: string | undefined) {
  if (!userId) return null;

  const responsible = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, firstName: true, lastName: true, preferredName: true },
  });

  return responsible;
}

// ------------------------------------------------------------
// Proyectos del ciclo
// ------------------------------------------------------------

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  if (!canCreateProject(actor)) {
    return {
      error:
        "Solo los jóvenes y el Equipo Adulto de la Avanzada pueden abrir un proyecto.",
    };
  }

  const parsed = createProjectSchema.safeParse({
    title: readField(formData, "title"),
    cycleId: readField(formData, "cycleId") || undefined,
    responsibleUserId: readField(formData, "responsibleUserId") || undefined,
    accompanyingAaId: readField(formData, "accompanyingAaId") || undefined,
    beneficiaries: readField(formData, "beneficiaries"),
    locality: readField(formData, "locality"),
    durationText: readField(formData, "durationText"),
    problemDiagnosis: readField(formData, "problemDiagnosis"),
    generalObjective: readField(formData, "generalObjective"),
    specificObjectives: readField(formData, "specificObjectives"),
    observableIndicators: readField(formData, "observableIndicators") || undefined,
    budgetSummary: readField(formData, "budgetSummary") || undefined,
    requiredCompetencies: readCompetencies(formData),
    isSocialEnvironmentalIntervention: readField(
      formData,
      "isSocialEnvironmentalIntervention",
    ),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const responsible = await assertYouthResponsible(
    parsed.data.responsibleUserId,
  );

  if (parsed.data.responsibleUserId && !responsible) {
    return {
      error:
        "El Responsable del Grupo de Trabajo debe ser un joven activo de la Avanzada.",
    };
  }

  if (parsed.data.accompanyingAaId) {
    const aa = await prisma.user.findFirst({
      where: {
        id: parsed.data.accompanyingAaId,
        role: "AA",
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!aa) {
      return { error: "El AA acompañante indicado no está activo." };
    }
  }

  const cycleId =
    parsed.data.cycleId ??
    (
      await prisma.programCycle.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
    )?.id ??
    null;

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        cycleId,
        title: parsed.data.title,
        responsibleUserId: parsed.data.responsibleUserId ?? actor.id,
        accompanyingAaId: parsed.data.accompanyingAaId ?? null,
        beneficiaries: parsed.data.beneficiaries,
        locality: parsed.data.locality,
        durationText: parsed.data.durationText,
        isSocialEnvironmentalIntervention:
          parsed.data.isSocialEnvironmentalIntervention,
        problemDiagnosis: parsed.data.problemDiagnosis,
        generalObjective: parsed.data.generalObjective,
        specificObjectives: parsed.data.specificObjectives,
        observableIndicators: parsed.data.observableIndicators ?? null,
        budgetSummary: parsed.data.budgetSummary ?? null,
        requiredCompetencies: parsed.data.requiredCompetencies ?? [],
      },
      select: { id: true, title: true, locality: true },
    });

    // El joven Responsable queda inscrito desde el primer momento.
    if (parsed.data.responsibleUserId ?? actor.id) {
      const responsibleId = parsed.data.responsibleUserId ?? actor.id;
      const isYouth = await tx.user.findFirst({
        where: { id: responsibleId, role: { in: ["PP", "COORDINADOR"] } },
        select: { id: true },
      });
      if (isYouth) {
        await tx.workGroupMember.create({
          data: {
            projectId: created.id,
            userId: isYouth.id,
            taskRole: "Responsable del Grupo de Trabajo",
          },
        });
      }
    }

    const youth = await tx.user.findMany({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const recipient of youth) {
      await notifyUser(
        {
          recipientId: recipient.id,
          type: "PROYECTO_CONVOCATORIA",
          title: "Nuevo proyecto abierto",
          body: projectConvocationBody({
            projectTitle: created.title,
            locality: created.locality,
            responsibleName: responsible ? getDisplayName(responsible) : null,
          }),
          entityType: "Project",
          entityId: created.id,
          actionUrl: `/proyectos/${created.id}`,
          dedupeKey: `project-convocation:${created.id}:${recipient.id}`,
          priority: 1,
        },
        tx,
      );
    }

    await recordAudit(
      {
        actor,
        action: "project.create",
        entityType: "Project",
        entityId: created.id,
        after: {
          title: created.title,
          locality: created.locality,
          cycleId,
          responsibleUserId: parsed.data.responsibleUserId ?? actor.id,
        },
      },
      tx,
    );

    return created;
  });

  revalidateProjects(project.id);
  return {
    success: `Proyecto «${project.title}» abierto. La Avanzada recibió la convocatoria.`,
  };
}

export async function updateProjectAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = updateProjectSchema.safeParse({
    projectId: readField(formData, "projectId"),
    title: readField(formData, "title"),
    cycleId: readField(formData, "cycleId") || undefined,
    responsibleUserId: readField(formData, "responsibleUserId") || undefined,
    accompanyingAaId: readField(formData, "accompanyingAaId") || undefined,
    beneficiaries: readField(formData, "beneficiaries"),
    locality: readField(formData, "locality"),
    durationText: readField(formData, "durationText"),
    problemDiagnosis: readField(formData, "problemDiagnosis"),
    generalObjective: readField(formData, "generalObjective"),
    specificObjectives: readField(formData, "specificObjectives"),
    observableIndicators: readField(formData, "observableIndicators") || undefined,
    budgetSummary: readField(formData, "budgetSummary") || undefined,
    requiredCompetencies: readCompetencies(formData),
    isSocialEnvironmentalIntervention: readField(
      formData,
      "isSocialEnvironmentalIntervention",
    ),
    step: readField(formData, "step") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (!canEditProject(actor, project)) {
    return {
      error:
        "Solo el Equipo Adulto, la coordinación, el Responsable del Grupo de Trabajo y sus participantes activos pueden editar el proyecto.",
    };
  }

  if (parsed.data.responsibleUserId) {
    const responsible = await assertYouthResponsible(
      parsed.data.responsibleUserId,
    );
    if (!responsible) {
      return {
        error:
          "El Responsable del Grupo de Trabajo debe ser un joven activo de la Avanzada.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: {
        title: parsed.data.title,
        cycleId: parsed.data.cycleId ?? project.cycleId,
        responsibleUserId:
          parsed.data.responsibleUserId ?? project.responsibleUserId,
        accompanyingAaId: parsed.data.accompanyingAaId ?? null,
        beneficiaries: parsed.data.beneficiaries,
        locality: parsed.data.locality,
        durationText: parsed.data.durationText,
        isSocialEnvironmentalIntervention:
          parsed.data.isSocialEnvironmentalIntervention,
        problemDiagnosis: parsed.data.problemDiagnosis,
        generalObjective: parsed.data.generalObjective,
        specificObjectives: parsed.data.specificObjectives,
        observableIndicators: parsed.data.observableIndicators ?? null,
        budgetSummary: parsed.data.budgetSummary ?? null,
        requiredCompetencies: parsed.data.requiredCompetencies ?? [],
        step: parsed.data.step ?? project.step,
      },
    });

    await recordAudit(
      {
        actor,
        action: "project.update",
        entityType: "Project",
        entityId: project.id,
        before: { title: project.title, step: project.step },
        after: {
          title: parsed.data.title,
          step: parsed.data.step ?? project.step,
        },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return { success: "Pauta de Identificación del Proyecto actualizada." };
}

export async function setProjectStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = setProjectStepSchema.safeParse({
    projectId: readField(formData, "projectId"),
    step: readField(formData, "step"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (!canEditProject(actor, project)) {
    return { error: "No tienes permiso para mover los pasos de este proyecto." };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { step: parsed.data.step },
  });

  revalidateProjects(project.id);
  return { success: "El proyecto avanzó de paso." };
}

// ------------------------------------------------------------
// Actividades centrales y conexas
// ------------------------------------------------------------

export async function addProjectActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = projectActivityItemSchema.safeParse({
    projectId: readField(formData, "projectId"),
    title: readField(formData, "title"),
    kind: readField(formData, "kind"),
    activityId: readField(formData, "activityId") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (!canEditProject(actor, project)) {
    return { error: "No tienes permiso para organizar las actividades de este proyecto." };
  }

  if (parsed.data.activityId) {
    const activity = await prisma.activity.findFirst({
      where: { id: parsed.data.activityId, deletedAt: null },
      select: { id: true },
    });
    if (!activity) {
      return { error: "La actividad del calendario indicada no existe." };
    }
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.projectActivityItem.create({
      data: {
        projectId: project.id,
        title: parsed.data.title,
        kind: parsed.data.kind,
        activityId: parsed.data.activityId ?? null,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "project.activity.create",
        entityType: "ProjectActivityItem",
        entityId: item.id,
        after: {
          projectId: project.id,
          title: parsed.data.title,
          kind: parsed.data.kind,
        },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return {
    success:
      parsed.data.kind === "CENTRAL"
        ? "Actividad central agregada al proyecto."
        : "Actividad conexa agregada al proyecto.",
  };
}

export async function toggleProjectActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = projectActivityToggleSchema.safeParse({
    itemId: readField(formData, "itemId"),
    isCompleted: readField(formData, "isCompleted"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const item = await prisma.projectActivityItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, projectId: true, isCompleted: true },
  });

  if (!item) return { error: "La actividad del proyecto ya no existe." };

  const project = await loadProject(item.projectId);
  if (!project) return { error: "El proyecto ya no existe." };

  if (!canEditProject(actor, project)) {
    return { error: "No tienes permiso para actualizar este proyecto." };
  }

  const isCompleted = parsed.data.isCompleted;

  await prisma.projectActivityItem.update({
    where: { id: item.id },
    data: { isCompleted },
  });

  revalidateProjects(project.id);
  return {
    success: isCompleted
      ? "Actividad marcada como realizada."
      : "Actividad devuelta a pendiente.",
  };
}

// ------------------------------------------------------------
// Grupo de Trabajo
// ------------------------------------------------------------

export async function joinWorkGroupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireReadyUser();

  const parsed = joinWorkGroupSchema.safeParse({
    projectId: readField(formData, "projectId"),
    taskRole: readField(formData, "taskRole") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (project.memberUserIds.includes(actor.id)) {
    return { success: "Ya formas parte de este Grupo de Trabajo." };
  }

  if (!canJoinWorkGroup(actor, project)) {
    return {
      error:
        project.workGroupStatus !== "ACTIVO"
          ? "Este Grupo de Trabajo ya fue disuelto: el proyecto concluyó y quedó como memoria histórica."
          : "Solo los jóvenes activos de la Avanzada pueden inscribirse en un Grupo de Trabajo.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.workGroupMember.create({
      data: {
        projectId: project.id,
        userId: actor.id,
        taskRole:
          parsed.data.taskRole ?? "Participante del Grupo de Trabajo",
      },
    });

    await recordAudit(
      {
        actor,
        action: "project.workgroup.join",
        entityType: "WorkGroupMember",
        entityId: project.id,
        after: { projectId: project.id, userId: actor.id },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return {
    success: "Te inscribiste en el Grupo de Trabajo. Tu comunidad no limita la tarea.",
  };
}

export async function addWorkGroupMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = addWorkGroupMemberSchema.safeParse({
    projectId: readField(formData, "projectId"),
    userId: readField(formData, "userId") || undefined,
    supportContactId: readField(formData, "supportContactId") || undefined,
    externalName: readField(formData, "externalName") || undefined,
    externalOrganization:
      readField(formData, "externalOrganization") || undefined,
    taskRole: readField(formData, "taskRole"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const validation = validateWorkGroupMemberInput(parsed.data);

  if (!validation.valid) return { error: validation.error };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (!canManageWorkGroup(actor, project)) {
    return {
      error: "No tienes permiso para sumar integrantes a este Grupo de Trabajo.",
    };
  }

  if (parsed.data.userId) {
    const member = await prisma.user.findFirst({
      where: {
        id: parsed.data.userId,
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!member) {
      return { error: "El integrante indicado no es un joven activo." };
    }

    if (project.memberUserIds.includes(member.id)) {
      return { success: "Ese joven ya forma parte del Grupo de Trabajo." };
    }
  }

  if (parsed.data.supportContactId) {
    const contact = await prisma.supportNetworkContact.findFirst({
      where: { id: parsed.data.supportContactId, isActive: true },
      select: { id: true },
    });

    if (!contact) {
      return {
        error: "El monitor indicado no está activo en la Red de Apoyo.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const member = await tx.workGroupMember.create({
      data: {
        projectId: project.id,
        userId: parsed.data.userId ?? null,
        supportContactId: parsed.data.supportContactId ?? null,
        externalName: parsed.data.externalName ?? null,
        externalOrganization: parsed.data.externalOrganization ?? null,
        taskRole: parsed.data.taskRole,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "project.workgroup.member_add",
        entityType: "WorkGroupMember",
        entityId: member.id,
        after: {
          projectId: project.id,
          kind: workGroupMemberKindLabel(parsed.data),
          taskRole: parsed.data.taskRole,
        },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return {
    success:
      validation.kind === "EXTERNO"
        ? "Participante externo sumado al Grupo de Trabajo."
        : validation.kind === "MONITOR"
          ? "Monitor de la Red de Apoyo sumado al Grupo de Trabajo."
          : "Integrante sumado al Grupo de Trabajo.",
  };
}

export async function removeWorkGroupMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = workGroupMemberIdSchema.safeParse({
    memberId: readField(formData, "memberId"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const member = await prisma.workGroupMember.findUnique({
    where: { id: parsed.data.memberId },
    select: {
      id: true,
      projectId: true,
      userId: true,
      externalName: true,
      taskRole: true,
    },
  });

  if (!member) return { error: "El integrante ya no existe." };

  const project = await loadProject(member.projectId);
  if (!project) return { error: "El proyecto ya no existe." };

  if (!canManageWorkGroup(actor, project)) {
    return { error: "No tienes permiso para retirar integrantes de este grupo." };
  }

  await prisma.workGroupMember.delete({ where: { id: member.id } });

  revalidateProjects(project.id);
  return { success: "Integrante retirado del Grupo de Trabajo." };
}

// ------------------------------------------------------------
// Informe Final y disolución
// ------------------------------------------------------------

export async function saveFinalReportAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = finalReportSchema.safeParse({
    projectId: readField(formData, "projectId"),
    finalReportPreparation: readField(formData, "finalReportPreparation"),
    finalReportConclusions: readField(formData, "finalReportConclusions"),
    celebrationNotes: readField(formData, "celebrationNotes") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await loadProject(parsed.data.projectId);

  if (!project) return { error: "El proyecto ya no existe." };

  if (!canSubmitFinalReport(actor, project)) {
    return {
      error:
        "El Informe Final se consolida en el paso Evaluar o Celebrar, por el Responsable, sus participantes activos, la coordinación o un AA.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: {
        finalReportPreparation: parsed.data.finalReportPreparation,
        finalReportConclusions: parsed.data.finalReportConclusions,
        celebrationNotes: parsed.data.celebrationNotes ?? null,
      },
    });

    await recordAudit(
      {
        actor,
        action: "project.final_report.save",
        entityType: "Project",
        entityId: project.id,
        after: {
          finalReportPreparation: parsed.data.finalReportPreparation,
          finalReportConclusions: parsed.data.finalReportConclusions,
        },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return { success: "Informe Final del Proyecto guardado." };
}

export async function dissolveWorkGroupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("project:manage");

  const parsed = dissolveWorkGroupSchema.safeParse({
    projectId: readField(formData, "projectId"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: {
      id: true,
      title: true,
      step: true,
      workGroupStatus: true,
      responsibleUserId: true,
      finalReportPreparation: true,
      finalReportConclusions: true,
      members: { select: { userId: true } },
    },
  });

  if (!project) return { error: "El proyecto ya no existe." };

  const permissionContext = {
    ...project,
    memberUserIds: project.members
      .map((member) => member.userId)
      .filter((value): value is string => Boolean(value)),
  };

  if (!canDissolveWorkGroup(actor, permissionContext)) {
    return {
      error:
        project.workGroupStatus === "HISTORICO_DISUELTO"
          ? "Este Grupo de Trabajo ya fue disuelto."
          : "Solo tras el Informe Final, en el paso Evaluar o Celebrar, se puede disolver el Grupo de Trabajo.",
    };
  }

  if (!project.finalReportPreparation || !project.finalReportConclusions) {
    return {
      error:
        "Antes de disolver el grupo, consolida el Informe Final con la preparación/ejecución y las conclusiones.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: { workGroupStatus: "HISTORICO_DISUELTO", step: "CELEBRAR" },
    });

    await recordAudit(
      {
        actor,
        action: "project.workgroup.dissolve",
        entityType: "Project",
        entityId: project.id,
        before: { workGroupStatus: project.workGroupStatus },
        after: { workGroupStatus: "HISTORICO_DISUELTO" },
      },
      tx,
    );
  });

  revalidateProjects(project.id);
  return {
    success: `El Grupo de Trabajo de «${project.title}» se disolvió y queda como memoria histórica de la Avanzada.`,
  };
}

// ------------------------------------------------------------
// Red de Apoyo (RF-PRY-06)
// ------------------------------------------------------------

export async function saveSupportContactAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("support_network:manage");

  const parsed = supportContactSchema.safeParse({
    contactId: readField(formData, "contactId") || undefined,
    fullName: readField(formData, "fullName"),
    relationshipOrRole: readField(formData, "relationshipOrRole"),
    organization: readField(formData, "organization") || undefined,
    contactInfo: readField(formData, "contactInfo") || undefined,
    supportedAreas: formData.getAll("supportedAreas").map((value) => String(value)),
    collaborationNotes:
      readField(formData, "collaborationNotes") || undefined,
    isActive: readField(formData, "isActive"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const data = {
    fullName: parsed.data.fullName,
    relationshipOrRole: parsed.data.relationshipOrRole,
    organization: parsed.data.organization ?? null,
    contactInfo: parsed.data.contactInfo ?? null,
    supportedAreas: parsed.data.supportedAreas ?? [],
    collaborationNotes: parsed.data.collaborationNotes ?? null,
    isActive: parsed.data.isActive,
  };

  if (parsed.data.contactId) {
    const current = await prisma.supportNetworkContact.findUnique({
      where: { id: parsed.data.contactId },
      select: { id: true, fullName: true },
    });

    if (!current) return { error: "El contacto ya no existe." };

    await prisma.$transaction(async (tx) => {
      await tx.supportNetworkContact.update({
        where: { id: current.id },
        data,
      });

      await recordAudit(
        {
          actor,
          action: "support_network.update",
          entityType: "SupportNetworkContact",
          entityId: current.id,
          before: { fullName: current.fullName },
          after: data,
        },
        tx,
      );
    });

    revalidateProjects();
    return { success: "Contacto de la Red de Apoyo actualizado." };
  }

  const created = await prisma.$transaction(async (tx) => {
    const contact = await tx.supportNetworkContact.create({
      data,
      select: { id: true, fullName: true },
    });

    await recordAudit(
      {
        actor,
        action: "support_network.create",
        entityType: "SupportNetworkContact",
        entityId: contact.id,
        after: data,
      },
      tx,
    );

    return contact;
  });

  revalidateProjects();
  return {
    success: `«${created.fullName}» se sumó al directorio de la Red de Apoyo.`,
  };
}

export async function toggleSupportContactAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("support_network:manage");

  const parsed = supportContactToggleSchema.safeParse({
    contactId: readField(formData, "contactId"),
    isActive: readField(formData, "isActive"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const contact = await prisma.supportNetworkContact.findUnique({
    where: { id: parsed.data.contactId },
    select: { id: true, fullName: true, isActive: true },
  });

  if (!contact) return { error: "El contacto ya no existe." };

  await prisma.$transaction(async (tx) => {
    await tx.supportNetworkContact.update({
      where: { id: contact.id },
      data: { isActive: parsed.data.isActive },
    });

    await recordAudit(
      {
        actor,
        action: "support_network.toggle_active",
        entityType: "SupportNetworkContact",
        entityId: contact.id,
        before: { isActive: contact.isActive },
        after: { isActive: parsed.data.isActive },
      },
      tx,
    );
  });

  revalidateProjects();
  return {
    success: parsed.data.isActive
      ? "Contacto reactivado en la Red de Apoyo."
      : "Contacto archivado de la Red de Apoyo.",
  };
}
