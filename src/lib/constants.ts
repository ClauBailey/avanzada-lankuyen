export const APP_NAME = "Avanzada Lankuyen";
export const UNIT_TAGLINE = "Pioneros y pioneras en camino a la cumbre";

// La unidad opera siempre en hora de Chile. Se mantiene como constante para
// que también esté disponible en componentes de cliente.
export const APP_TIMEZONE = "America/Santiago";

export const ROLE_LABELS = {
  AA: "Adulto Acompañante",
  PP: "Pionero o pionera",
  COORDINADOR: "Coordinador o coordinadora",
} as const;

export type AppRole = keyof typeof ROLE_LABELS;

export const ADULT_TEAM_ROLE_LABELS = {
  RESPONSABLE_AVANZADA: "Responsable de Avanzada",
  ASISTENTE_AVANZADA: "Asistente de Avanzada",
} as const;

export const ROLE_SHORT_LABELS = {
  AA: "AA",
  PP: "PP",
  COORDINADOR: "Coord.",
} as const;
