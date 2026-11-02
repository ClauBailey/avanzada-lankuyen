"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import {
  activityProposalSchema,
  advanceCyclePhaseSchema,
  assemblyVoteSchema,
  assemblyVoteSessionSchema,
  assemblyVoteSessionToggleSchema,
  communityDiagnosisSchema,
  cycleIdSchema,
  cycleSummarySchema,
  selectProposalSchema,
} from "@/features/cycle/schemas";
import {
  ASSEMBLY_VOTING_PHASE,
  canCastAssemblyVote,
  canEditCommunityDiagnosis,
  canManageProgramCycle,
  canTransitionProgramCyclePhase,
  isDemocraticVoteDynamic,
  isProgramCyclePhase,
  nextProgramCyclePhase,
  validateAssemblyVote,
} from "@/features/cycle/rules";
import { recordAudit } from "@/server/audit";
import { requirePermission, requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";

function revalidateCycle() {
  revalidatePath("/ciclo");
  revalidatePath("/admin");
  revalidatePath("/admin/actividades");
  revalidatePath("/calendario");
  revalidatePath("/inicio");
}

async function getActiveCycle() {
  return prisma.programCycle.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phase: true,
      isActive: true,
      isCalendarApprovedByAssembly: true,
    },
  });
}

// ------------------------------------------------------------
// Fase 1 · Diagnóstico y Énfasis Educativo
// ------------------------------------------------------------

export async function saveCommunityDiagnosisAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:diagnose");

  const parsed = communityDiagnosisSchema.safeParse({
    strengthsAndInterests: readField(formData, "strengthsAndInterests"),
    suggestedActivities: readField(formData, "suggestedActivities") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const cycle = await getActiveCycle();

  if (!cycle) {
    return { error: "No hay un ciclo activo." };
  }

  if (cycle.phase !== "DIAGNOSTICO_Y_ENFASIS") {
    return {
      error:
        "El diagnóstico de Comunidad se escribe durante la fase de Diagnóstico y Énfasis Educativo.",
    };
  }

  if (!canEditCommunityDiagnosis(actor, actor.communityId)) {
    return {
      error:
        "Solo los miembros de una Comunidad pueden escribir su propio diagnóstico.",
    };
  }

  const communityId = actor.communityId as string;

  await prisma.$transaction(async (tx) => {
    const diagnosis = await tx.communityDiagnosis.upsert({
      where: {
        cycleId_communityId: { cycleId: cycle.id, communityId },
      },
      create: {
        cycleId: cycle.id,
        communityId,
        authorId: actor.id,
        strengthsAndInterests: parsed.data.strengthsAndInterests,
        suggestedActivities: parsed.data.suggestedActivities ?? null,
      },
      update: {
        authorId: actor.id,
        strengthsAndInterests: parsed.data.strengthsAndInterests,
        suggestedActivities: parsed.data.suggestedActivities ?? null,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.diagnosis.save",
        entityType: "CommunityDiagnosis",
        entityId: diagnosis.id,
        after: {
          cycleId: cycle.id,
          communityId,
          strengthsAndInterests: parsed.data.strengthsAndInterests,
        },
      },
      tx,
    );
  });

  revalidateCycle();
  return { success: "Diagnóstico de Comunidad guardado." };
}

export async function saveCycleSummaryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = cycleSummarySchema.safeParse({
    diagnosisSummary: readField(formData, "diagnosisSummary"),
    educationalEmphasis: readField(formData, "educationalEmphasis"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error:
        "La Reunión de Coordinadores es quien acuerda el diagnóstico general y el énfasis educativo.",
    };
  }

  const cycle = await getActiveCycle();

  if (!cycle) {
    return { error: "No hay un ciclo activo." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.programCycle.update({
      where: { id: cycle.id },
      data: {
        diagnosisSummary: parsed.data.diagnosisSummary,
        educationalEmphasis: parsed.data.educationalEmphasis,
      },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.summary.save",
        entityType: "ProgramCycle",
        entityId: cycle.id,
        after: {
          diagnosisSummary: parsed.data.diagnosisSummary,
          educationalEmphasis: parsed.data.educationalEmphasis,
        },
      },
      tx,
    );
  });

  revalidateCycle();
  return {
    success: "Diagnóstico general y énfasis educativo del ciclo guardados.",
  };
}

// ------------------------------------------------------------
// Fase 2 · Propuestas y Selección en Asamblea
// ------------------------------------------------------------

export async function createActivityProposalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:propose");

  const parsed = activityProposalSchema.safeParse({
    title: readField(formData, "title"),
    description: readField(formData, "description"),
    isSocialInterventionProject: readField(
      formData,
      "isSocialInterventionProject",
    ),
    communityId: readField(formData, "communityId") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const cycle = await getActiveCycle();

  if (!cycle) {
    return { error: "No hay un ciclo activo." };
  }

  if (cycle.phase !== ASSEMBLY_VOTING_PHASE) {
    return {
      error:
        "Las propuestas se publican durante la fase de Propuestas y Selección en Asamblea.",
    };
  }

  // La propuesta puede ser personal o de la propia Comunidad, nunca de otra.
  const communityId = actor.communityId ?? null;

  await prisma.$transaction(async (tx) => {
    const proposal = await tx.activityProposal.create({
      data: {
        cycleId: cycle.id,
        proposerId: actor.id,
        communityId,
        title: parsed.data.title,
        description: parsed.data.description,
        isSocialInterventionProject:
          parsed.data.isSocialInterventionProject,
      },
      select: { id: true },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.proposal.create",
        entityType: "ActivityProposal",
        entityId: proposal.id,
        after: {
          title: parsed.data.title,
          communityId,
          isSocialInterventionProject:
            parsed.data.isSocialInterventionProject,
        },
      },
      tx,
    );
  });

  revalidateCycle();
  return { success: `Propuesta «${parsed.data.title}» publicada.` };
}

export async function createAssemblyVoteSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = assemblyVoteSessionSchema.safeParse({
    title: readField(formData, "title"),
    dynamic: readField(formData, "dynamic"),
    maxPointsBudget: readField(formData, "maxPointsBudget") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error: "Solo la Reunión de Coordinadores abre sesiones de votación.",
    };
  }

  const cycle = await getActiveCycle();

  if (!cycle) {
    return { error: "No hay un ciclo activo." };
  }

  if (cycle.phase !== ASSEMBLY_VOTING_PHASE) {
    return {
      error:
        "La sesión de votación solo puede abrirse en la fase de Propuestas y Selección.",
    };
  }

  if (!isDemocraticVoteDynamic(parsed.data.dynamic)) {
    return { error: "Dinámica de votación inválida." };
  }

  await prisma.assemblyVoteSession.create({
    data: {
      cycleId: cycle.id,
      title: parsed.data.title,
      dynamic: parsed.data.dynamic,
      maxPointsBudget:
        parsed.data.dynamic === "ASIGNACION_PUNTOS"
          ? parsed.data.maxPointsBudget
          : null,
      isOpen: false,
    },
  });

  revalidateCycle();
  return {
    success: `Sesión «${parsed.data.title}» creada. Ábrela cuando la Asamblea esté lista para votar.`,
  };
}

/**
 * Abre o cierra una sesión de votación.
 *
 * Al abrirla se notifica a todos los jóvenes activos de la unidad con
 * `CICLO_VOTACION_ABIERTA`. El Equipo Adulto no recibe voto: solo acompaña.
 */
export async function setAssemblyVoteSessionOpenAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = assemblyVoteSessionToggleSchema.safeParse({
    sessionId: readField(formData, "sessionId"),
    isOpen: readField(formData, "isOpen"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error: "Solo la Reunión de Coordinadores administra la votación.",
    };
  }

  const session = await prisma.assemblyVoteSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      title: true,
      isOpen: true,
      cycle: { select: { id: true, phase: true } },
    },
  });

  if (!session || session.cycle.phase !== ASSEMBLY_VOTING_PHASE) {
    return {
      error:
        "La sesión no existe o el ciclo no está en la fase de Propuestas y Selección.",
    };
  }

  const isOpen = parsed.data.isOpen === "true";

  if (session.isOpen === isOpen) {
    return {
      success: isOpen
        ? "La votación ya estaba abierta."
        : "La votación ya estaba cerrada.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.assemblyVoteSession.update({
      where: { id: session.id },
      data: { isOpen },
    });

    if (isOpen) {
      const voters = await tx.user.findMany({
        where: {
          role: { in: ["PP", "COORDINADOR"] },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      for (const voter of voters) {
        await notifyUser(
          {
            recipientId: voter.id,
            type: "CICLO_VOTACION_ABIERTA",
            title: "La Asamblea abrió su votación",
            body: `Ya puedes votar en «${session.title}». Tu voz decide el próximo ciclo de la Avanzada.`,
            entityType: "AssemblyVoteSession",
            entityId: session.id,
            actionUrl: "/ciclo",
            dedupeKey: `cycle-vote-open:${session.id}:${voter.id}`,
            priority: 1,
          },
          tx,
        );
      }
    }

    await recordAudit(
      {
        actor,
        action: isOpen ? "cycle.vote.open" : "cycle.vote.close",
        entityType: "AssemblyVoteSession",
        entityId: session.id,
        before: { isOpen: session.isOpen },
        after: { isOpen },
      },
      tx,
    );
  });

  revalidateCycle();
  return {
    success: isOpen
      ? "Votación abierta. Las y los jóvenes de la unidad ya fueron notificados."
      : "Votación cerrada. Los resultados quedan disponibles para la Asamblea.",
  };
}

/**
 * Art. VI — Voto juvenil exclusivo.
 *
 * Cualquier cuenta del Equipo Adulto es rechazada con `403` antes de tocar la
 * base de datos. El mensaje es el de la Constitución y el Manual p. 124.
 */
export async function castAssemblyVoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireReadyUser();

  const eligibility = canCastAssemblyVote(actor);

  if (!eligibility.allowed) {
    return { error: eligibility.error, status: eligibility.status };
  }

  const parsed = assemblyVoteSchema.safeParse({
    sessionId: readField(formData, "sessionId"),
    proposalId: readField(formData, "proposalId"),
    value: readField(formData, "value") || "1",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const session = await prisma.assemblyVoteSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      isOpen: true,
      dynamic: true,
      maxPointsBudget: true,
      cycleId: true,
      cycle: { select: { phase: true } },
    },
  });

  if (!session) {
    return { error: "La sesión de votación no existe." };
  }

  const proposal = await prisma.activityProposal.findFirst({
    where: { id: parsed.data.proposalId, cycleId: session.cycleId },
    select: { id: true, title: true },
  });

  if (!proposal) {
    return { error: "La propuesta no pertenece a este ciclo." };
  }

  const currentVote = await prisma.assemblyVote.findUnique({
    where: {
      sessionId_proposalId_voterId: {
        sessionId: session.id,
        proposalId: proposal.id,
        voterId: actor.id,
      },
    },
    select: { value: true },
  });

  const spent = await prisma.assemblyVote.aggregate({
    where: {
      sessionId: session.id,
      voterId: actor.id,
      proposalId: { not: proposal.id },
    },
    _sum: { value: true },
  });

  const validation = validateAssemblyVote({
    voter: actor,
    session: {
      isOpen: session.isOpen,
      dynamic: session.dynamic,
      maxPointsBudget: session.maxPointsBudget,
    },
    cyclePhase: session.cycle.phase,
    value: parsed.data.value,
    pointsAlreadySpent: spent._sum.value ?? 0,
  });

  if (!validation.allowed) {
    return { error: validation.error, status: validation.status };
  }

  await prisma.assemblyVote.upsert({
    where: {
      sessionId_proposalId_voterId: {
        sessionId: session.id,
        proposalId: proposal.id,
        voterId: actor.id,
      },
    },
    create: {
      sessionId: session.id,
      proposalId: proposal.id,
      voterId: actor.id,
      value: validation.value,
    },
    update: { value: validation.value },
  });

  revalidateCycle();
  return {
    success: currentVote
      ? `Voto actualizado en «${proposal.title}».`
      : `Voto registrado en «${proposal.title}».`,
  };
}

// ------------------------------------------------------------
// Fase 3 · Calendario y Preparación
// ------------------------------------------------------------

const CALENDAR_PHASES = new Set([
  "ORGANIZACION_Y_PREPARACION",
  "DESARROLLO_Y_EVALUACION",
]);

export async function selectProposalForCalendarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = selectProposalSchema.safeParse({
    proposalId: readField(formData, "proposalId"),
    selected: readField(formData, "selected"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error: "Solo la Reunión de Coordinadores selecciona propuestas.",
    };
  }

  const proposal = await prisma.activityProposal.findUnique({
    where: { id: parsed.data.proposalId },
    select: {
      id: true,
      title: true,
      selectedForCalendar: true,
      cycle: { select: { phase: true } },
    },
  });

  if (!proposal) {
    return { error: "La propuesta ya no existe." };
  }

  if (!CALENDAR_PHASES.has(proposal.cycle.phase)) {
    return {
      error:
        "Las propuestas se seleccionan durante la fase de Calendario y Preparación.",
    };
  }

  const selected = parsed.data.selected === "true";

  await prisma.$transaction(async (tx) => {
    await tx.activityProposal.update({
      where: { id: proposal.id },
      data: { selectedForCalendar: selected },
    });

    await recordAudit(
      {
        actor,
        action: selected
          ? "cycle.proposal.select"
          : "cycle.proposal.unselect",
        entityType: "ActivityProposal",
        entityId: proposal.id,
        before: { selectedForCalendar: proposal.selectedForCalendar },
        after: { selectedForCalendar: selected },
      },
      tx,
    );
  });

  revalidateCycle();
  return {
    success: selected
      ? `«${proposal.title}» pasará al calendario oficial.`
      : `«${proposal.title}» vuelve a la deliberación.`,
  };
}

export async function approveCycleCalendarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = cycleIdSchema.safeParse({
    cycleId: readField(formData, "cycleId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error: "Solo la Reunión de Coordinadores registra la aprobación de la Asamblea.",
    };
  }

  const cycle = await prisma.programCycle.findUnique({
    where: { id: parsed.data.cycleId },
    select: { id: true, name: true, phase: true },
  });

  if (!cycle) {
    return { error: "El ciclo ya no existe." };
  }

  if (!CALENDAR_PHASES.has(cycle.phase)) {
    return {
      error:
        "El calendario se aprueba durante la fase de Organización y Preparación.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.programCycle.update({
      where: { id: cycle.id },
      data: { isCalendarApprovedByAssembly: true },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.calendar.approve",
        entityType: "ProgramCycle",
        entityId: cycle.id,
        after: { isCalendarApprovedByAssembly: true },
      },
      tx,
    );
  });

  revalidateCycle();
  return {
    success: `La Asamblea aprobó el calendario del ciclo «${cycle.name}».`,
  };
}

// ------------------------------------------------------------
// Fases del ciclo
// ------------------------------------------------------------

export async function advanceProgramCyclePhaseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("cycle:manage");

  const parsed = advanceCyclePhaseSchema.safeParse({
    cycleId: readField(formData, "cycleId"),
    phase: readField(formData, "phase"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  if (!canManageProgramCycle(actor)) {
    return {
      error: "Solo la Reunión de Coordinadores hace avanzar el ciclo.",
    };
  }

  const cycle = await prisma.programCycle.findUnique({
    where: { id: parsed.data.cycleId },
    select: { id: true, name: true, phase: true },
  });

  if (!cycle) {
    return { error: "El ciclo ya no existe." };
  }

  if (!isProgramCyclePhase(parsed.data.phase)) {
    return { error: "Fase de ciclo inválida." };
  }

  if (!canTransitionProgramCyclePhase(cycle.phase, parsed.data.phase)) {
    return {
      error:
        "El ciclo avanza una fase a la vez: no se puede saltar ni retroceder.",
    };
  }

  if (cycle.phase === parsed.data.phase) {
    return { success: "El ciclo ya está en esa fase." };
  }

  const expected =
    parsed.data.phase === nextProgramCyclePhase(cycle.phase)
      ? parsed.data.phase
      : null;

  if (!expected) {
    return { error: "Transición de fase inválida." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.programCycle.update({
      where: { id: cycle.id },
      data: { phase: parsed.data.phase },
    });

    await recordAudit(
      {
        actor,
        action: "cycle.phase.advance",
        entityType: "ProgramCycle",
        entityId: cycle.id,
        before: { phase: cycle.phase },
        after: { phase: parsed.data.phase },
      },
      tx,
    );
  });

  revalidateCycle();
  return { success: `El ciclo «${cycle.name}» avanzó de fase.` };
}
