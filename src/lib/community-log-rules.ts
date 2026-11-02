/**
 * Reglas puras de la Bitácora Privada de Comunidad (RF-BIT-01 a 03).
 *
 * La bitácora pertenece a los jóvenes de una comunidad. Ningún adulto puede
 * leerla completa: el AA encargado ve solo las entradas que la comunidad marcó
 * con `sharedWithAa`, y la Reunión de Coordinadores solo las marcadas con
 * `sharedWithCoordinators`.
 */

export interface CommunityLogActor {
  id: string;
  role: string;
  communityId: string | null;
  isActive?: boolean;
}

export interface CommunityLogEntryVisibility {
  id?: string;
  communityId: string;
  authorId?: string | null;
  sharedWithAa: boolean;
  sharedWithCoordinators: boolean;
}

function isYouth(role: string) {
  return role === "PP" || role === "COORDINADOR";
}

/** Solo miembros activos de la misma comunidad acceden a su bitácora. */
export function canAccessCommunityLog(
  actor: CommunityLogActor,
  communityId: string | null,
): boolean {
  return (
    isYouth(actor.role) &&
    actor.isActive !== false &&
    Boolean(actor.communityId) &&
    Boolean(communityId) &&
    actor.communityId === communityId
  );
}

/** Cualquier miembro activo de la comunidad puede crear y editar entradas. */
export function canManageCommunityLog(
  actor: CommunityLogActor,
  entry: Pick<CommunityLogEntryVisibility, "communityId">,
): boolean {
  return canAccessCommunityLog(actor, entry.communityId);
}

/**
 * Lectura de una entrada concreta.
 *
 * - Miembros activos de la comunidad: siempre.
 * - AA que acompaña a alguien de esa comunidad: solo `sharedWithAa`.
 * - Coordinadores de otra comunidad (Reunión de Coordinadores): solo
 *   `sharedWithCoordinators`.
 * - Cualquier otra persona: nunca.
 */
export function canReadCommunityLogEntry(
  actor: CommunityLogActor,
  entry: CommunityLogEntryVisibility,
  options: { aaAccompaniesCommunity?: boolean } = {},
): boolean {
  if (canAccessCommunityLog(actor, entry.communityId)) return true;

  if (actor.role === "AA") {
    return entry.sharedWithAa === true && options.aaAccompaniesCommunity === true;
  }

  if (actor.role === "COORDINADOR") {
    return entry.sharedWithCoordinators === true;
  }

  return false;
}

/** Filtra las entradas visibles para una audiencia. */
export function visibleCommunityLogEntries<
  T extends CommunityLogEntryVisibility,
>(
  actor: CommunityLogActor,
  entries: readonly T[],
  options: { aaAccompaniesCommunity?: boolean } = {},
): readonly T[] {
  return entries.filter((entry) =>
    canReadCommunityLogEntry(actor, entry, options),
  );
}

/** Una entrada propia puede editarse; las demás quedan en solo lectura. */
export function canEditCommunityLogEntry(
  actor: CommunityLogActor,
  entry: CommunityLogEntryVisibility,
): boolean {
  if (!canAccessCommunityLog(actor, entry.communityId)) return false;
  return entry.authorId === actor.id;
}
