/**
 * Reglas puras del Ciclo de Programa democrático y de la Asamblea (Fase 4).
 *
 * Se mantienen sin Prisma ni Next.js para que las Server Actions, las vistas y
 * las pruebas constitucionales compartan exactamente la misma decisión.
 *
 * Principios:
 *  - Art. VI: solo los jóvenes (PP y COORDINADOR) votan en la Asamblea. El
 *    Equipo Adulto participa acompañando la deliberación, sin derecho a voto.
 *  - RF-CIC-01: el ciclo avanza en cuatro fases secuenciales y se cierra con
 *    `FINALIZADO`. No se puede saltar ni retroceder.
 *  - RF-CIC-02: cada Comunidad diagnostica su propio ciclo; nadie lo hace por
 *    ella.
 */

export const PROGRAM_CYCLE_PHASES = [
  {
    key: "DIAGNOSTICO_Y_ENFASIS",
    order: 1,
    label: "Diagnóstico y Énfasis Educativo",
    shortLabel: "Diagnóstico",
    description:
      "Cada Comunidad comparte sus intereses, anhelos y evaluación interna. La Reunión de Coordinadores sintetiza el diagnóstico de la Avanzada y fija el énfasis formativo del período.",
    youthHint:
      "Escribe el diagnóstico de tu Comunidad: qué les mueve, qué necesitan y qué les gustaría vivir.",
    adultHint:
      "Revisa los diagnósticos de todas las Comunidades y redacta el diagnóstico general junto al énfasis educativo.",
  },
  {
    key: "PROPUESTA_Y_SELECCION",
    order: 2,
    label: "Propuestas y Selección en Asamblea",
    shortLabel: "Propuestas",
    description:
      "Los jóvenes y las Comunidades publican propuestas de actividades. La Asamblea las delibera y vota con la dinámica democrática que elija.",
    youthHint:
      "Propón las actividades que quieres vivir y, cuando la votación esté abierta, emite tu voto.",
    adultHint:
      "Abre y cierra la sesión de votación. Acompaña la deliberación: el voto pertenece exclusivamente a los jóvenes.",
  },
  {
    key: "ORGANIZACION_Y_PREPARACION",
    order: 3,
    label: "Calendario y Preparación",
    shortLabel: "Calendario",
    description:
      "La Reunión de Coordinadores decide qué propuestas pasan al calendario oficial, programa las actividades por alcance y registra la aprobación de la Asamblea.",
    youthHint:
      "Mira cómo las propuestas más votadas se transforman en actividades del calendario.",
    adultHint:
      "Selecciona las propuestas elegidas, programa las actividades y deja constancia de la aprobación de la Asamblea.",
  },
  {
    key: "DESARROLLO_Y_EVALUACION",
    order: 4,
    label: "Desarrollo y Evaluación del Ciclo",
    shortLabel: "Desarrollo",
    description:
      "Se viven las actividades y proyectos programados. Al cierre, se habilita la autoevaluación de ciclo en La Brújula y la evaluación general en la Asamblea.",
    youthHint:
      "Vive el ciclo y, al final, escribe tu autoevaluación de ciclo en Mi Brújula.",
    adultHint:
      "Acompaña el desarrollo del ciclo y prepara la evaluación general con la Asamblea.",
  },
  {
    key: "FINALIZADO",
    order: 5,
    label: "Ciclo Finalizado",
    shortLabel: "Finalizado",
    description:
      "El ciclo cerró. Sus diagnósticos, propuestas, votaciones y actividades quedan como memoria de la Avanzada.",
    youthHint: "El ciclo terminó. Todo lo vivido queda guardado.",
    adultHint: "Cierra el ciclo activando el siguiente período cuando corresponda.",
  },
] as const;

export type ProgramCyclePhaseKey =
  (typeof PROGRAM_CYCLE_PHASES)[number]["key"];

export function isProgramCyclePhase(
  value: string,
): value is ProgramCyclePhaseKey {
  return PROGRAM_CYCLE_PHASES.some((phase) => phase.key === value);
}

export function programCyclePhaseDefinition(phase: ProgramCyclePhaseKey) {
  return (
    PROGRAM_CYCLE_PHASES.find((item) => item.key === phase) ??
    PROGRAM_CYCLE_PHASES[0]
  );
}

/**
 * Siguiente fase del ciclo. `FINALIZADO` es terminal: devuelve `null`.
 */
export function nextProgramCyclePhase(
  phase: ProgramCyclePhaseKey,
): ProgramCyclePhaseKey | null {
  const current = programCyclePhaseDefinition(phase);
  return (
    PROGRAM_CYCLE_PHASES.find((item) => item.order === current.order + 1)
      ?.key ?? null
  );
}

/**
 * RF-CIC-01: el ciclo solo avanza una fase a la vez. Se permite «confirmar» la
 * fase actual (idempotencia) pero nunca saltar ni retroceder.
 */
export function canTransitionProgramCyclePhase(
  from: ProgramCyclePhaseKey,
  to: ProgramCyclePhaseKey,
): boolean {
  if (from === to) return true;
  return nextProgramCyclePhase(from) === to;
}

/** La votación de la Asamblea solo existe en la fase de propuestas. */
export const ASSEMBLY_VOTING_PHASE: ProgramCyclePhaseKey =
  "PROPUESTA_Y_SELECCION";

/** Mensaje de neutralidad que ve el Equipo Adulto en la cabina de votación. */
export const ASSEMBLY_NEUTRALITY_MESSAGE =
  "Como miembro del Equipo Adulto participas en la Asamblea acompañando la deliberación y sin derecho a voto.";

/** Rechazo constitucional del voto adulto (Art. VI, Manual p. 124). */
export const ADULT_VOTE_DENIED_MESSAGE =
  "El Equipo Adulto participa en la Asamblea sin derecho a voto (Constitución Art. VI y Manual p. 124).";

export const DEMOCRATIC_VOTE_DYNAMICS = [
  {
    key: "ELECCION_DIRECTA",
    label: "Elección directa",
    descriptionTotally:
      "Un día de elecciones: cada joven marca las propuestas que apoya.",
    description:
      "Cada joven marca las propuestas que apoya. Cada propuesta cuenta un voto.",
    minValue: 1,
    maxValue: 1,
  },
  {
    key: "RANKING_ESTRELLAS",
    label: "Ranking de estrellas",
    description:
      "Cada joven califica cada propuesta de 1 a 5 estrellas, como en una playlist compartida.",
    minValue: 1,
    maxValue: 5,
  },
  {
    key: "ASIGNACION_PUNTOS",
    label: "Asignación de puntos",
    description:
      "Cada joven reparte un pozo de puntos entre las propuestas que más le importan.",
    minValue: 0,
    maxValue: 10,
  },
] as const;

export type DemocraticVoteDynamicKey =
  (typeof DEMOCRATIC_VOTE_DYNAMICS)[number]["key"];

export function isDemocraticVoteDynamic(
  value: string,
): value is DemocraticVoteDynamicKey {
  return DEMOCRATIC_VOTE_DYNAMICS.some((item) => item.key === value);
}

export function democraticVoteDynamicDefinition(
  dynamic: DemocraticVoteDynamicKey,
) {
  return (
    DEMOCRATIC_VOTE_DYNAMICS.find((item) => item.key === dynamic) ??
    DEMOCRATIC_VOTE_DYNAMICS[0]
  );
}

export interface AssemblyActor {
  id: string;
  role: string;
  isActive?: boolean;
}

export function isAssemblyVoterRole(role: string): boolean {
  return role === "PP" || role === "COORDINADOR";
}

export type VoteEligibility =
  | { allowed: true }
  | { allowed: false; status: 403; error: string };

/**
 * Art. VI — Voto juvenil exclusivo.
 *
 * Cualquier cuenta que no sea PP o COORDINADOR (incluido todo el Equipo
 * Adulto, sin excepciones) recibe `403` con el mensaje constitucional.
 */
export function canCastAssemblyVote(voter: AssemblyActor): VoteEligibility {
  if (!isAssemblyVoterRole(voter.role)) {
    return {
      allowed: false,
      status: 403,
      error: ADULT_VOTE_DENIED_MESSAGE,
    };
  }

  if (voter.isActive === false) {
    return {
      allowed: false,
      status: 403,
      error: "La cuenta está inactiva y no puede participar en la Asamblea.",
    };
  }

  return { allowed: true };
}

export interface AssemblyVoteContext {
  voter: AssemblyActor;
  session: {
    isOpen: boolean;
    dynamic: DemocraticVoteDynamicKey;
    maxPointsBudget: number | null;
  };
  cyclePhase: ProgramCyclePhaseKey;
  /** Valor propuesto por el formulario. */
  value: number;
  /** Puntos que el votante ya repartió en otras propuestas de esta sesión. */
  pointsAlreadySpent?: number;
}

export type VoteValidation =
  | { allowed: true; value: number }
  | { allowed: false; status: 400 | 403; error: string };

/**
 * Valida un voto considerando el rol, el estado de la sesión, la fase del
 * ciclo, la dinámica y el presupuesto de puntos.
 */
export function validateAssemblyVote(
  context: AssemblyVoteContext,
): VoteValidation {
  const eligibility = canCastAssemblyVote(context.voter);

  if (!eligibility.allowed) {
    return eligibility;
  }

  if (!context.session.isOpen) {
    return {
      allowed: false,
      status: 400,
      error: "La votación de la Asamblea está cerrada.",
    };
  }

  if (context.cyclePhase !== ASSEMBLY_VOTING_PHASE) {
    return {
      allowed: false,
      status: 400,
      error:
        "Solo se puede votar durante la fase de Propuestas y Selección en Asamblea.",
    };
  }

  const dynamic = democraticVoteDynamicDefinition(context.session.dynamic);
  const value = Number(context.value);

  if (!Number.isInteger(value)) {
    return {
      allowed: false,
      status: 400,
      error: "El voto debe ser un número entero.",
    };
  }

  if (context.session.dynamic === "ELECCION_DIRECTA") {
    if (value !== 1) {
      return {
        allowed: false,
        status: 400,
        error: "En una elección directa cada voto vale exactamente 1.",
      };
    }
    return { allowed: true, value: 1 };
  }

  if (context.session.dynamic === "RANKING_ESTRELLAS") {
    if (value < dynamic.minValue || value > dynamic.maxValue) {
      return {
        allowed: false,
        status: 400,
        error: `El ranking de estrellas admite entre ${dynamic.minValue} y ${dynamic.maxValue} estrellas.`,
      };
    }
    return { allowed: true, value };
  }

  // ASIGNACION_PUNTOS
  if (value < 0) {
    return {
      allowed: false,
      status: 400,
      error: "No puedes asignar puntos negativos.",
    };
  }

  const budget = context.session.maxPointsBudget ?? dynamic.maxValue;
  const spent = Math.max(0, context.pointsAlreadySpent ?? 0);

  if (spent + value > budget) {
    return {
      allowed: false,
      status: 400,
      error: `Tu pozo es de ${budget} puntos y ya repartiste ${spent}. Puedes asignar como máximo ${Math.max(
        0,
        budget - spent,
      )}.`,
    };
  }

  return { allowed: true, value };
}

export interface TallyableProposal {
  id: string;
  title: string;
}

export interface TallyableVote {
  proposalId: string;
  value: number;
}

export interface AssemblyTallyRow {
  proposalId: string;
  title: string;
  total: number;
  voters: number;
  average: number;
}

/**
 * Consolida los resultados de una sesión para la deliberación de la Asamblea.
 *
 * - Elección directa: cantidad de votos.
 * - Ranking de estrellas: promedio de estrellas (y cantidad de votantes).
 * - Asignación de puntos: suma de puntos recibidos.
 */
export function tallyAssemblyVotes(
  proposals: readonly TallyableProposal[],
  votes: readonly TallyableVote[],
  dynamic: DemocraticVoteDynamicKey,
): AssemblyTallyRow[] {
  const rows = proposals.map((proposal) => {
    const own = votes.filter((vote) => vote.proposalId === proposal.id);
    const total = own.reduce((sum, vote) => sum + vote.value, 0);
    const voters = own.length;
    const average = voters === 0 ? 0 : total / voters;

    return {
      proposalId: proposal.id,
      title: proposal.title,
      total,
      voters,
      average,
    };
  });

  const sortValue = (row: AssemblyTallyRow) =>
    dynamic === "RANKING_ESTRELLAS" ? row.average : row.total;

  return rows.sort((a, b) => {
    const diff = sortValue(b) - sortValue(a);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, "es");
  });
}

// ------------------------------------------------------------
// Roles del ciclo
// ------------------------------------------------------------

export interface CycleActor {
  id: string;
  role: string;
  communityId: string | null;
  isActive?: boolean;
}

export interface CycleTarget {
  id: string;
  role: string;
  communityId: string | null;
  isActive?: boolean;
}

/**
 * Gestión de fases, énfasis educativo y aprobación del calendario:
 * Reunión de Coordinadores (COORDINADOR) y Equipo Adulto (AA).
 */
export function canManageProgramCycle(
  actor: Pick<CycleActor, "role" | "isActive">,
): boolean {
  return (
    actor.isActive !== false &&
    (actor.role === "AA" || actor.role === "COORDINADOR")
  );
}

/**
 * RF-CIC-02: solo los miembros activos de una Comunidad (o su coordinación)
 * escriben el diagnóstico de esa Comunidad. Un AA no lo redacta por ellos.
 */
export function canEditCommunityDiagnosis(
  actor: CycleActor,
  communityId: string | null,
): boolean {
  return (
    actor.isActive !== false &&
    (actor.role === "PP" || actor.role === "COORDINADOR") &&
    Boolean(actor.communityId) &&
    Boolean(communityId) &&
    actor.communityId === communityId
  );
}

/** Cualquier joven activo puede proponer actividades para el ciclo. */
export function canProposeActivity(
  actor: Pick<CycleActor, "role" | "isActive">,
): boolean {
  return actor.isActive !== false && isAssemblyVoterRole(actor.role);
}

/**
 * La Reunión de Coordinadores (COORDINADOR + AA) selecciona las propuestas que
 * pasan al calendario oficial (RF-CIC-05).
 */
export function canSelectProposalsForCalendar(
  actor: Pick<CycleActor, "role" | "isActive">,
): boolean {
  return canManageProgramCycle(actor);
}

/** Abrir o cerrar la sesión de votación (RF-CIC-04). */
export function canManageAssemblyVoteSession(
  actor: Pick<CycleActor, "role" | "isActive">,
): boolean {
  return canManageProgramCycle(actor);
}

export interface ActivityScopeInput {
  scope: "COMUNIDAD" | "AVANZADA" | "GRUPO_DE_TRABAJO";
  communityId: string | null;
}

/**
 * RF-CAL-02: el AA programa cualquier alcance; un COORDINADOR solo actividades
 * de su propia Comunidad. Un PP no programa el calendario.
 */
export function canCreateActivityForScope(
  actor: CycleActor,
  input: ActivityScopeInput,
): boolean {
  if (actor.isActive === false) return false;
  if (actor.role === "AA") return true;
  if (actor.role !== "COORDINADOR") return false;
  if (input.scope !== "COMUNIDAD") return false;
  return Boolean(actor.communityId) && actor.communityId === input.communityId;
}

/**
 * Lo que un joven puede ver de la Asamblea: siempre las propuestas y los
 * resultados; el voto individual de sus compañeros nunca se expone.
 */
export function visibleProposalIdsFor(
  actor: Pick<CycleActor, "role">,
  proposals: readonly { id: string; proposerId: string | null }[],
): readonly string[] {
  if (actor.role === "AA") return proposals.map((proposal) => proposal.id);
  return proposals.map((proposal) => proposal.id);
}
