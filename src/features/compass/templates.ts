/**
 * Reglas puras del catálogo referencial de objetivos de La Brújula.
 *
 * El Equipo Adulto puede corregir la redacción oficial de una plantilla, pero
 * el objetivo que un joven ya adoptó le pertenece: `currentText` y su historial
 * de versiones nunca se modifican. La plantilla corregida solo se ofrece como
 * referencia discreta en la tarjeta del joven (Art. I y II).
 */

export interface PersonalObjectiveSnapshot {
  templateId: string | null;
  currentText: string;
  versions: ReadonlyArray<{ text: string }>;
}

export interface TemplateReference {
  /** Texto oficial que se muestra como propuesta; `null` si coincide o falta. */
  referenceText: string | null;
  /** Copia inmutable del objetivo personal: la plantilla no lo sobrescribe. */
  personalObjective: PersonalObjectiveSnapshot;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Deriva la nota «Propuesta referencial del Manual» sin tocar el objetivo
 * personal. Es una función pura: sirve a la interfaz y a las pruebas.
 */
export function templateReferenceForObjective(
  template: { intermediateObjective?: string | null } | null,
  objective: PersonalObjectiveSnapshot,
): TemplateReference {
  const reference = (template?.intermediateObjective ?? "").trim();
  const referenceText =
    reference.length > 0 && normalize(reference) !== normalize(objective.currentText)
      ? reference
      : null;

  return {
    referenceText,
    personalObjective: {
      templateId: objective.templateId,
      currentText: objective.currentText,
      versions: [...objective.versions],
    },
  };
}

/** Un cambio de plantilla jamás altera el texto ni las versiones personales. */
export function templateEditPreservesPersonalObjective(
  objective: PersonalObjectiveSnapshot,
  template: { intermediateObjective?: string | null } | null,
): {
  personalObjective: PersonalObjectiveSnapshot;
  referenceText: string | null;
} {
  return templateReferenceForObjective(template, objective);
}
