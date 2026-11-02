/**
 * Reglas puras de Hojas de Ruta multi-comunidad (v2.2).
 *
 * Una actividad con alcance `COMUNIDAD` reúne una preparación independiente por
 * cada Comunidad juvenil. El hilo de una Comunidad nunca debe pisar el de otra:
 * el servidor fuerza `communityId = actor.communityId` para jóvenes y exige que
 * el AA elija expresamente la Comunidad.
 */

export type RouteSheetActivityScope = "AVANZADA" | "COMUNIDAD";

export interface RouteSheetCommunityResolution {
  communityId: string | null;
}

/**
 * Resuelve a qué Comunidad pertenece la hoja que se está subiendo.
 *
 * - Actividad de Avanzada → hilo general (`null`).
 * - Actividad de Comunidad + joven → su propia Comunidad, aunque el formulario
 *   intente enviar otra.
 * - Actividad de Comunidad + AA → la Comunidad que seleccione explícitamente.
 */
export function resolveRouteSheetCommunityId(input: {
  activityScope: string;
  actorRole: string;
  actorCommunityId: string | null;
  requestedCommunityId?: string | null;
}):
  | RouteSheetCommunityResolution
  | { error: string } {
  if (input.activityScope !== "COMUNIDAD") {
    return { communityId: null };
  }

  if (input.actorRole === "AA") {
    const requested = input.requestedCommunityId?.trim() || null;
    if (!requested) {
      return {
        error:
          "Selecciona la Comunidad a la que pertenece la hoja de ruta que vas a subir o revisar.",
      };
    }
    return { communityId: requested };
  }

  if (!input.actorCommunityId) {
    return {
      error:
        "Tu cuenta todavía no tiene una Comunidad asignada. Pide a tu AA que te integre antes de subir una hoja de ruta de Comunidad.",
    };
  }

  // La hoja de un joven siempre pertenece a su propia Comunidad.
  return { communityId: input.actorCommunityId };
}

export interface RouteSheetUploadPermissionInput {
  actorRole: string;
  actorCommunityId: string | null;
  targetCommunityId: string | null;
  activityScope: string;
  isLeader: boolean;
  isOrganizingCoordinator: boolean;
  isProjectResponsible: boolean;
  allowAnyPpUpload: boolean;
}

function isYouthRole(role: string): boolean {
  return role === "PP" || role === "COORDINADOR";
}

/**
 * ¿Puede este actor subir/versionar la hoja del hilo indicado?
 *
 * En actividades de Comunidad nadie puede escribir fuera de su propia
 * Comunidad: ni la coordinación ni un encargado de otra Comunidad.
 */
export function canUploadRouteSheet(
  input: RouteSheetUploadPermissionInput,
): boolean {
  if (input.actorRole === "AA") return true;

  if (!isYouthRole(input.actorRole)) return false;

  if (input.activityScope === "COMUNIDAD") {
    const sameCommunity =
      Boolean(input.targetCommunityId) &&
      input.targetCommunityId === input.actorCommunityId;

    if (!sameCommunity) return false;

    if (input.isLeader) return true;
    if (input.actorRole === "COORDINADOR") return true;

    return input.allowAnyPpUpload;
  }

  return (
    input.isLeader ||
    input.isOrganizingCoordinator ||
    input.isProjectResponsible ||
    input.allowAnyPpUpload
  );
}

export interface RouteSheetThreadItem {
  communityId: string | null;
  version: number;
  status: string;
}

/** Devuelve la versión más reciente del hilo de una Comunidad. */
export function latestRouteSheetForCommunity<T extends RouteSheetThreadItem>(
  sheets: readonly T[],
  communityId: string | null,
): T | null {
  let latest: T | null = null;

  for (const sheet of sheets) {
    if (sheet.communityId !== communityId) continue;
    if (!latest || sheet.version > latest.version) latest = sheet;
  }

  return latest;
}

export type CommunityRouteSheetStatusKey =
  | "SIN_ENTREGAR"
  | "PENDIENTE"
  | "OBSERVACIONES"
  | "APROBADA";

export interface CommunityRouteSheetStatus {
  key: CommunityRouteSheetStatusKey;
  label: string;
}

/**
 * Estado del tablero semáforo por Comunidad. Se calcula sobre la última versión
 * del hilo, no sobre la actividad completa.
 */
export function communityRouteSheetStatus(
  latest: RouteSheetThreadItem | null,
): CommunityRouteSheetStatus {
  if (!latest) return { key: "SIN_ENTREGAR", label: "Sin entregar" };

  if (latest.status === "APROBADA") {
    return { key: "APROBADA", label: "Aprobada" };
  }

  if (latest.status === "RECHAZADA") {
    return { key: "OBSERVACIONES", label: "Con observaciones" };
  }

  return { key: "PENDIENTE", label: "Pendiente de revisión" };
}

/**
 * Agrupa las hojas por Comunidad para que la interfaz no mezcle hilos. El
 * hilo general (hojas sin Comunidad) se conserva aparte.
 */
export function groupRouteSheetsByCommunity<T extends RouteSheetThreadItem>(
  sheets: readonly T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const sheet of sheets) {
    const key = sheet.communityId ?? "GENERAL";
    const list = grouped.get(key) ?? [];
    list.push(sheet);
    grouped.set(key, list);
  }

  return grouped;
}
