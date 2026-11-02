/**
 * Reglas puras de comunidades juveniles, Equipo Adulto y acompañamiento 1 a 1.
 *
 * Se mantienen sin Prisma ni Next.js para poder probarlas con `node --test`.
 * Las mismas reglas se aplican en las vistas (avisos no bloqueantes) y en las
 * Server Actions (validación real).
 */

export const COMMUNITY_MIN_YOUTH = 3;
export const COMMUNITY_MAX_YOUTH = 6;
export const MAX_YOUTH_PER_AA = 6;
export const AA_MIN_STABILITY_DAYS = 365;

export const COMMUNITY_INTERNAL_ROLES = [
  "COORDINADOR",
  "SECRETARIO",
  "TESORERO",
  "ADMINISTRADOR",
] as const;

export type CommunityInternalRole = (typeof COMMUNITY_INTERNAL_ROLES)[number];

export const ADULT_TEAM_ROLES = [
  "RESPONSABLE_AVANZADA",
  "ASISTENTE_AVANZADA",
] as const;

export type AdultTeamRole = (typeof ADULT_TEAM_ROLES)[number];

export const COMMUNITY_INTERNAL_ROLE_LABELS: Record<
  CommunityInternalRole,
  string
> = {
  COORDINADOR: "Coordinador/a",
  SECRETARIO: "Secretario/a",
  TESORERO: "Tesorero/a",
  ADMINISTRADOR: "Administrador/a",
};

export const ADULT_TEAM_ROLE_LABELS: Record<AdultTeamRole, string> = {
  RESPONSABLE_AVANZADA: "Responsable de la Avanzada",
  ASISTENTE_AVANZADA: "Asistente de la Avanzada",
};

export type YouthRole = "PP" | "COORDINADOR";

interface RoleLike {
  role: string;
  isActive?: boolean;
}

/** PP y COORDINADOR son los roles juveniles; AA pertenece al Equipo Adulto. */
export function isYouthRole(role: string): role is YouthRole {
  return role === "PP" || role === "COORDINADOR";
}

export function isSocialMemberRole(role: string): role is YouthRole {
  return isYouthRole(role);
}

/** Solo las cuentas juveniles activas cuentan como integrantes de comunidad. */
export function isActiveYouth(user: RoleLike): boolean {
  return user.isActive !== false && isYouthRole(user.role);
}

export function countActiveYouth(users: readonly RoleLike[]): number {
  return users.filter(isActiveYouth).length;
}

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm;
}

/**
 * Aviso metodológico de tamaño de comunidad (Manual: grupos de 3 a 6 amigos).
 * Devuelve `null` cuando el grupo está dentro del rango recomendado.
 */
export function communitySizeAdvisory(count: number): string | null {
  if (count < COMMUNITY_MIN_YOUTH) {
    return `Esta comunidad tiene ${count} ${plural(
      count,
      "persona joven activa",
      "personas jóvenes activas",
    )}. El Manual recomienda formar grupos de ${COMMUNITY_MIN_YOUTH} a ${COMMUNITY_MAX_YOUTH} amigos; considera integrar a más pioneros y pioneras o acompañar el proceso de crecimiento del grupo.`;
  }

  if (count > COMMUNITY_MAX_YOUTH) {
    return `Esta comunidad tiene ${count} personas jóvenes activas y supera el máximo recomendado de ${COMMUNITY_MAX_YOUTH}. El Manual sugiere grupos de ${COMMUNITY_MIN_YOUTH} a ${COMMUNITY_MAX_YOUTH} amigos para sostener el acompañamiento cercano.`;
  }

  return null;
}

/**
 * Aviso de carga de acompañamiento: el Manual recomienda que cada AA acompañe
 * como máximo a 6 jóvenes activos. Es una advertencia, no un bloqueo.
 */
export function aaLoadAdvisory(count: number): string | null {
  if (count <= MAX_YOUTH_PER_AA) return null;
  return `Este AA acompaña a ${count} personas jóvenes activas, por sobre el máximo recomendado de ${MAX_YOUTH_PER_AA}. Revisa la distribución para sostener un acompañamiento personal y cercano.`;
}

/** Días completos desde que se asignó el AA actual. `null` si no hay fecha. */
export function daysWithAssignedAa(
  assignedSince: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!assignedSince) return null;
  const start =
    assignedSince instanceof Date ? assignedSince : new Date(assignedSince);
  if (Number.isNaN(start.getTime())) return null;

  const diff = now.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / 86_400_000);
}

/**
 * Un cambio de AA antes de 365 días exige confirmación explícita.
 * Si nunca hubo asignación, no hay estabilidad que proteger.
 */
export function isEarlyAaReassignment(
  assignedSince: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  const days = daysWithAssignedAa(assignedSince, now);
  return days !== null && days < AA_MIN_STABILITY_DAYS;
}

/** Texto de confirmación para la UI y las Server Actions. */
export function earlyReassignmentMessage(days: number | null): string {
  const elapsed = days ?? 0;
  return `Esta persona joven lleva ${elapsed} ${plural(
    elapsed,
    "día",
    "días",
  )} con su AA actual. El Manual recomienda una estabilidad mínima de un año; confirma el cambio solo si es necesario.`;
}

export interface CommunityActor {
  role: string;
  communityId: string | null;
}

/**
 * AA puede editar la identidad de cualquier comunidad; COORDINADOR solo la
 * propia. Cualquier otro rol queda excluido.
 */
export function canEditCommunityIdentity(
  actor: CommunityActor,
  communityId: string,
): boolean {
  if (actor.role === "AA") return true;
  return actor.role === "COORDINADOR" && actor.communityId === communityId;
}

/** Misma regla de alcance para rotar los cargos internos de la comunidad. */
export function canManageCommunityRoles(
  actor: CommunityActor,
  communityId: string,
): boolean {
  return canEditCommunityIdentity(actor, communityId);
}

/**
 * El cargo interno COORDINADOR se sincroniza con el rol de sistema
 * COORDINADOR; cualquier otro cargo (o ninguno) deja a la persona como PP.
 */
export function systemRoleForCommunityRole(
  role: CommunityInternalRole | null | undefined,
): YouthRole {
  return role === "COORDINADOR" ? "COORDINADOR" : "PP";
}

export function isCommunityInternalRole(
  value: string,
): value is CommunityInternalRole {
  return (COMMUNITY_INTERNAL_ROLES as readonly string[]).includes(value);
}

export function isAdultTeamRole(value: string): value is AdultTeamRole {
  return (ADULT_TEAM_ROLES as readonly string[]).includes(value);
}
