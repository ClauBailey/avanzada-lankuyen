/**
 * Reglas de "niebla de guerra" para logros.
 *
 * Este módulo es puro (sin Prisma ni Next.js) para poder probar que un logro
 * bloqueado nunca expone su texto real en el payload del servidor.
 */

export type AchievementVisibilityValue = "PUBLIC" | "HINT" | "SECRET";
export type AchievementCategoryValue =
  | "AVANZADA"
  | "COMUNIDAD"
  | "ESPECIAL"
  | "SECRETO";
export type AchievementViewerRole = "AA" | "PP" | "COORDINADOR";

export const SECRET_ACHIEVEMENT_TITLE = "???";
export const SECRET_ACHIEVEMENT_DESCRIPTION =
  "Logro secreto. Desbloquéalo para descubrir sus detalles.";
export const HINT_ACHIEVEMENT_FALLBACK =
  "Sigue explorando para descubrir cómo obtenerlo.";

export interface AchievementSource {
  title: string;
  description: string;
  hint: string | null;
  icon: string;
  visibility: AchievementVisibilityValue;
}

export interface SanitizedAchievementText {
  title: string;
  description: string;
  hint: string | null;
  icon: string;
  /** `true` cuando el visitante todavía no lo ha desbloqueado. */
  locked: boolean;
}

/**
 * Aplica la censura correspondiente al visitante.
 *
 * - AA: ve todo el catálogo sin importar si lo tiene desbloqueado.
 * - Logro desbloqueado: texto completo.
 * - SECRET bloqueado: título "???", icono Lock y descripción genérica. La
 *   pista, si existe, se conserva como único teaser.
 * - HINT bloqueado: título real e icono real; la descripción se reemplaza por
 *   la pista para no revelar el requisito completo.
 * - PUBLIC bloqueado: la descripción ya es pública por diseño.
 */
export function sanitizeAchievementForViewer(
  achievement: AchievementSource,
  unlocked: boolean,
  viewerRole: AchievementViewerRole,
): SanitizedAchievementText {
  const fullAccess = unlocked || viewerRole === "AA";

  if (fullAccess) {
    return {
      title: achievement.title,
      description: achievement.description,
      hint: achievement.hint,
      icon: achievement.icon,
      locked: false,
    };
  }

  if (achievement.visibility === "SECRET") {
    return {
      title: SECRET_ACHIEVEMENT_TITLE,
      description: SECRET_ACHIEVEMENT_DESCRIPTION,
      hint: achievement.hint,
      icon: "Lock",
      locked: true,
    };
  }

  if (achievement.visibility === "HINT") {
    return {
      title: achievement.title,
      description: achievement.hint ?? HINT_ACHIEVEMENT_FALLBACK,
      hint: null,
      icon: achievement.icon,
      locked: true,
    };
  }

  return {
    title: achievement.title,
    description: achievement.description,
    hint: achievement.hint,
    icon: achievement.icon,
    locked: true,
  };
}
