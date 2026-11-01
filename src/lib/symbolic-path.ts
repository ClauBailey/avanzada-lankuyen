/**
 * Camino simbólico de la Avanzada Lankuyen.
 *
 * Los hitos son memoria y sentido, nunca requisitos: no hay orden obligatorio,
 * no hay bloqueos por etapas previas ni conteos de objetivos. La Promesa puede
 * solicitarse y celebrarse en cualquier momento.
 *
 * Manual de la Avanzada, pp. 49, 202–203.
 */

export const SYMBOLIC_MOMENTS = [
  {
    key: "BIENVENIDA_INVESTIDURA",
    title: "Bienvenida e investidura",
    subtitle: "La Cruz del Sur",
    description:
      "La comunidad recibe a una nueva pionera o pionero. La Cruz del Sur no marca un requisito: señala un rumbo y recuerda que nadie camina sola/o.",
    badgeCode: null,
  },
  {
    key: "SENDERO",
    title: "Sendero",
    subtitle: "Exploro mis caminos",
    description:
      "El Sendero marca el inicio de un tiempo para explorar intereses, preguntas y formas propias de servir. Se abre como estímulo, no como premio final.",
    badgeCode: "ETAPA_SENDERO",
  },
  {
    key: "CUMBRE",
    title: "Cumbre",
    subtitle: "Proyecto mi camino",
    description:
      "La Cumbre marca el inicio de un tiempo para proyectar. Se puede iniciar directamente cuando la madurez y el acuerdo con el Equipo Adulto así lo indiquen, sin haber pasado antes por el Sendero.",
    badgeCode: "ETAPA_CUMBRE",
  },
  {
    key: "PROMESA",
    title: "Promesa",
    subtitle: "El compromiso que nace de dentro",
    description:
      "La Promesa se formula libremente, con independencia de la etapa o la antigüedad. La persona elige la fórmula que quiere pronunciar y la comunidad celebra su compromiso.",
    badgeCode: "PROMESA",
  },
  {
    key: "PASO_AL_CLAN",
    title: "Paso al Clan",
    subtitle: "Seguir caminando en comunidad",
    description:
      "El paso al Clan celebra la continuidad del camino. No cierra la Avanzada: abre otra forma de vivir el servicio y la pertenencia.",
    badgeCode: null,
  },
] as const;

export type SymbolicMomentKey = (typeof SYMBOLIC_MOMENTS)[number]["key"];

export const PROMISE_FORMULAS = [
  {
    key: "LEY_GUIA",
    label: "Ley Guía",
    phrase: "«…vivir la Ley Guía…»",
    description:
      "Para quienes eligen pronunciar la Promesa desde la Ley Guía de la Avanzada.",
  },
  {
    key: "LEY_SCOUT",
    label: "Ley Scout",
    phrase: "«…vivir la Ley Scout…»",
    description:
      "Para quienes llegan desde el movimiento scout y quieren continuar su camino desde esa ley.",
  },
  {
    key: "LEY",
    label: "La Ley",
    phrase: "«…vivir la Ley…»",
    description:
      "La fórmula abierta del Manual para quien quiere pronunciar la Ley sin otro apellido.",
  },
] as const;

export type PromiseFormulaKey = (typeof PROMISE_FORMULAS)[number]["key"];

/**
 * Sentido de las etapas (Manual pp. 202–203): la insignia marca un inicio.
 * No existe ningún texto de bloqueo ni de activación pendiente.
 */
export const STAGE_MEANINGS = {
  SENDERO: {
    title: "Sendero",
    motto: "Exploro mis caminos",
    meaning:
      "El Sendero comienza cuando la persona decide explorar sus propios caminos: sus intereses, sus preguntas y las formas de servir que la llaman. La insignia no corona un final; enciende una etapa.",
  },
  CUMBRE: {
    title: "Cumbre",
    motto: "Proyecto mi camino",
    meaning:
      "La Cumbre comienza cuando la persona se siente lista para proyectar lo aprendido hacia el futuro. Mirar desde lo alto no es terminar el camino: es descubrir hacia dónde seguir.",
  },
} as const;

export function symbolicMoment(key: SymbolicMomentKey) {
  return SYMBOLIC_MOMENTS.find((moment) => moment.key === key);
}

export function promiseFormula(key: PromiseFormulaKey) {
  return PROMISE_FORMULAS.find((formula) => formula.key === key);
}

/**
 * El inicio de etapa nunca depende de una etapa anterior.
 * Se mantiene como función pura para que la interfaz y las pruebas compartan
 * exactamente la misma regla.
 */
export function canStartStage(stage: "SENDERO" | "CUMBRE"): boolean {
  return stage === "SENDERO" || stage === "CUMBRE";
}

/** La Promesa no exige etapa, antigüedad ni objetivos cumplidos. */
export function promiseIsIndependent(): boolean {
  return true;
}
