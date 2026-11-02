/**
 * Reglas puras de La Brújula y del acompañamiento privado 1 a 1.
 *
 * Se mantienen sin Prisma ni Next.js para poder probarlas con `node --test` y
 * para que las Server Actions y las vistas compartan exactamente la misma
 * decisión de autorización.
 *
 * Principios:
 *  - Art. I: solo el joven titular escribe su Brújula. Ningún adulto «aprueba»
 *    ni «rechaza» objetivos.
 *  - Art. VII y VIII: la lectura es 1 a 1. El AA encargado puede leer; otro AA
 *    no. Los compañeros de comunidad solo ven lo marcado explícitamente.
 */

export const COMPASS_STATUSES = [
  {
    key: "EXPLORANDO",
    label: "En exploración / en camino",
    shortLabel: "En camino",
    description:
      "Estoy descubriendo este objetivo, probándolo y dándole forma en mi vida.",
  },
  {
    key: "LOGRADO_EN_VIDA_COTIDIANA",
    label: "Logrado en mi vida cotidiana",
    shortLabel: "Logrado",
    description:
      "Reconozco que este objetivo ya forma parte de mi manera de vivir.",
  },
] as const;

export type CompassObjectiveStatus =
  (typeof COMPASS_STATUSES)[number]["key"];

export function compassStatusDefinition(status: CompassObjectiveStatus) {
  return (
    COMPASS_STATUSES.find((item) => item.key === status) ??
    COMPASS_STATUSES[0]
  );
}

export function isCompassStatus(value: string): value is CompassObjectiveStatus {
  return COMPASS_STATUSES.some((item) => item.key === value);
}

export const MENTORING_NOTE_PRIVACY = [
  {
    key: "PRIVADA",
    label: "Privada del AA encargado",
    description:
      "Solo tú puedes leer esta nota. El joven no la ve en su Brújula.",
  },
  {
    key: "COMPARTIDA",
    label: "Compartida con el joven",
    description:
      "La nota aparece en la Brújula del joven, siempre como acompañamiento y nunca como evaluación.",
  },
] as const;

export type MentoringNotePrivacy =
  (typeof MENTORING_NOTE_PRIVACY)[number]["key"];

export interface CompassActor {
  id: string;
  role: string;
  communityId?: string | null;
  isActive?: boolean;
}

export interface CompassTarget {
  id: string;
  role: string;
  assignedAaId: string | null;
  communityId: string | null;
  isActive?: boolean;
}

export function isYouthRole(role: string): role is "PP" | "COORDINADOR" {
  return role === "PP" || role === "COORDINADOR";
}

/**
 * Escritura exclusiva del titular (Art. I).
 *
 * Un AA —aunque sea su `assignedAaId`— nunca escribe la Brújula de otra
 * persona: no adopta, no reformula, no cambia estados ni visibilidad.
 */
export function canWriteCompass(
  actor: Pick<CompassActor, "id" | "role">,
  targetUserId: string,
): boolean {
  return actor.id === targetUserId && isYouthRole(actor.role);
}

/**
 * Lectura de la Brújula (Art. VII y VIII).
 *
 * 1. El propio joven titular.
 * 2. Su AA encargado vigente.
 * 3. Compañeros activos de la misma comunidad, solo para lo compartido.
 */
export function canReadCompass(
  actor: CompassActor,
  target: CompassTarget,
): boolean {
  if (actor.id === target.id) {
    return isYouthRole(actor.role) && actor.role === target.role;
  }

  if (actor.role === "AA") {
    return target.assignedAaId === actor.id;
  }

  if (isYouthRole(actor.role) && isYouthRole(target.role)) {
    return (
      actor.isActive !== false &&
      target.isActive !== false &&
      Boolean(actor.communityId) &&
      actor.communityId === target.communityId
    );
  }

  return false;
}

/** El AA encargado lee, pero no escribe, la Brújula del joven. */
export function isCompassReadOnlyFor(
  actor: Pick<CompassActor, "id" | "role">,
  targetUserId: string,
): boolean {
  return actor.role === "AA" && actor.id !== targetUserId;
}

/**
 * Notas de acompañamiento (RF-BRU-09).
 *
 * Solo el AA encargado vigente puede crearlas, editarlas y leerlas todas.
 * El joven titular ve únicamente las que fueron compartidas con él.
 */
export function canManageMentoringNotes(
  actor: CompassActor,
  target: CompassTarget,
): boolean {
  return (
    actor.role === "AA" &&
    isYouthRole(target.role) &&
    Boolean(target.assignedAaId) &&
    target.assignedAaId === actor.id
  );
}

export function canReadMentoringNote(
  actor: CompassActor,
  target: CompassTarget,
  note: {
    id: string;
    studentId: string;
    authorAaId: string | null;
    sharedWithStudent: boolean;
  },
): boolean {
  if (note.studentId !== target.id) return false;
  if (canManageMentoringNotes(actor, target)) return true;
  return (
    actor.id === target.id &&
    isYouthRole(actor.role) &&
    note.sharedWithStudent === true
  );
}

/**
 * Filtra las notas que puede ver el joven titular: solo las compartidas.
 * El AA encargado recibe el historial completo.
 */
export function visibleMentoringNotesForStudent<
  T extends { sharedWithStudent: boolean },
>(notes: readonly T[]): readonly T[] {
  return notes.filter((note) => note.sharedWithStudent === true);
}

/**
 * Un compañero de comunidad solo ve los objetivos marcados explícitamente.
 * El AA encargado y el propio titular ven todo.
 */
export function visibleCompassObjectives<
  T extends { sharedWithCommunity: boolean },
>(options: {
  viewerId: string;
  targetId: string;
  isAssignedAa: boolean;
  objectives: readonly T[];
}): readonly T[] {
  if (options.viewerId === options.targetId || options.isAssignedAa) {
    return options.objectives;
  }
  return options.objectives.filter(
    (objective) => objective.sharedWithCommunity === true,
  );
}

/**
 * Las reflexiones siguen la misma regla que los objetivos: el titular y su AA
 * ven todo; los compañeros solo lo compartido con la comunidad.
 */
export function visibleCompassReflections<
  T extends { sharedWithCommunity: boolean },
>(options: {
  viewerId: string;
  targetId: string;
  isAssignedAa: boolean;
  reflections: readonly T[];
}): readonly T[] {
  return visibleCompassObjectives({
    viewerId: options.viewerId,
    targetId: options.targetId,
    isAssignedAa: options.isAssignedAa,
    objectives: options.reflections,
  });
}

/**
 * Texto del banner de transparencia (RF-BRU-08).
 * Es literal y se muestra siempre en la parte superior de `/brujula`.
 */
export function compassTransparencyBanner(options: {
  aaDisplayName: string | null;
  communityName: string | null;
}): string {
  const aa = options.aaDisplayName
    ? options.aaDisplayName
    : "Ningún AA asignado aún";
  const community = options.communityName
    ? `tu Comunidad ${options.communityName}`
    : "tu Comunidad";

  return `Tu Brújula es privada. Solo tú puedes escribir en ella. Actualmente pueden leerla: ${aa} (y ${community} solo en los elementos que marques para compartir).`;
}

/**
 * Aplica un cambio de redacción conservando el historial inmutable.
 *
 * Devuelve las versiones que deben insertarse: la primera redacción y cada
 * reformulación posterior. Nunca reemplaza ni elimina una versión previa.
 */
export function versionsToAppend(
  existingVersions: readonly { text: string }[],
  nextText: string,
): string[] {
  const normalized = nextText.trim();
  if (normalized.length === 0) return [];
  if (existingVersions.length === 0) return [normalized];
  if (existingVersions.some((version) => version.text === normalized)) {
    return [];
  }
  return [normalized];
}

/** ¿Puede el joven solicitar un Encuentro de Consenso? */
export function canRequestConsensus(options: {
  actorId: string;
  targetId: string;
  targetRole: string;
  assignedAaId: string | null;
}): boolean {
  return (
    options.actorId === options.targetId &&
    isYouthRole(options.targetRole) &&
    Boolean(options.assignedAaId)
  );
}
