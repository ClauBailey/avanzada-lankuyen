/**
 * Sistema de rareza de logros.
 *
 * El campo numérico `points` ya no es un marcador acumulable: se interpreta
 * como el índice de rareza del logro. Este módulo es puro (sin Prisma ni
 * Next.js) para poder probar los rangos con `node --test`.
 */

export type AchievementRarityKey =
  | "COMMON"
  | "UNCOMMON"
  | "EPIC"
  | "LEGENDARY"
  | "HIDDEN";

export interface AchievementRarity {
  key: AchievementRarityKey;
  /** Nombre corto visible en la etiqueta. */
  label: string;
  /** Nombre scout de la rareza. */
  subtitle: string;
  /** Borde de la tarjeta cuando el logro está desbloqueado. */
  borderClass: string;
  /** Colores de la etiqueta de rareza. */
  badgeClass: string;
  /** Franja superior y acentos de la tarjeta. */
  accentClass: string;
  /** Valor numérico interno que produce esta rareza. */
  defaultPoints: number;
}

const COMMON = {
  key: "COMMON",
  label: "Común",
  subtitle: "Huella de Sendero",
  borderClass: "border-slate-300",
  badgeClass: "bg-slate-100 text-slate-700",
  accentClass: "bg-gradient-to-r from-slate-300 to-emerald-300",
  defaultPoints: 10,
} satisfies AchievementRarity;

const UNCOMMON = {
  key: "UNCOMMON",
  label: "Poco Común",
  subtitle: "Huella de Fogón",
  borderClass: "border-sky-300",
  badgeClass: "bg-sky-100 text-sky-800",
  accentClass: "bg-gradient-to-r from-sky-300 to-sky-500",
  defaultPoints: 20,
} satisfies AchievementRarity;

const EPIC = {
  key: "EPIC",
  label: "Épico",
  subtitle: "Huella de Cumbre",
  borderClass: "border-purple-400",
  badgeClass: "bg-purple-100 text-purple-800",
  accentClass: "bg-gradient-to-r from-purple-400 to-fuchsia-400",
  defaultPoints: 30,
} satisfies AchievementRarity;

const LEGENDARY = {
  key: "LEGENDARY",
  label: "Legendario",
  subtitle: "Reliquia de Lankuyen",
  borderClass: "border-amber-400 ring-1 ring-amber-300/50",
  badgeClass: "bg-amber-100 text-amber-900",
  accentClass: "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500",
  defaultPoints: 50,
} satisfies AchievementRarity;

/** Rareza neutra para logros SECRET que el visitante todavía no desbloqueó. */
export const HIDDEN_RARITY: AchievementRarity = {
  key: "HIDDEN",
  label: "???",
  subtitle: "Rareza oculta",
  borderClass: "border-dashed border-slate-300",
  badgeClass: "bg-slate-100 text-slate-500",
  accentClass: "bg-slate-200",
  defaultPoints: 0,
};

/** Orden estable para desgloses y selectores. */
export const RARITY_ORDER = [
  "COMMON",
  "UNCOMMON",
  "EPIC",
  "LEGENDARY",
] as const;

export type AchievementRarityCountKey = (typeof RARITY_ORDER)[number];

export const RARITY_OPTIONS = [
  COMMON,
  UNCOMMON,
  EPIC,
  LEGENDARY,
] as const;

/**
 * Clasifica un logro según el valor numérico guardado en `points`.
 *
 * - <= 15: Común
 * - 16 a 24: Poco Común
 * - 25 a 34: Épico
 * - >= 35: Legendario
 */
export function getAchievementRarity(points: number): AchievementRarity {
  if (!Number.isFinite(points) || points <= 15) return COMMON;
  if (points <= 24) return UNCOMMON;
  if (points <= 34) return EPIC;
  return LEGENDARY;
}
