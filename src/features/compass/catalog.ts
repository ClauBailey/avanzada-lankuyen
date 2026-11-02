/**
 * Catálogo desacoplado de objetivos intermedios (15–17 años) y terminales.
 *
 * La malla completa de las seis áreas está disponible desde el ingreso del
 * joven (Período Introductorio). No existe ninguna condición de etapa, edad o
 * antigüedad: `RF-BRU-02` prohíbe ocultar o parcelar objetivos.
 */
import objectiveCatalog from "@/data/instrumento-objetivos.json";

export const COMPASS_AREAS = [
  {
    key: "CORPORALIDAD",
    label: "Corporalidad",
    description:
      "El cuerpo como territorio propio: cuidado, movimiento, límites y seguridad.",
  },
  {
    key: "CREATIVIDAD",
    label: "Creatividad",
    description:
      "La imaginación y la expresión como formas de transformar el mundo.",
  },
  {
    key: "CARACTER",
    label: "Carácter",
    description:
      "La autonomía, la constancia y la coherencia entre lo que se cree y se hace.",
  },
  {
    key: "AFECTIVIDAD",
    label: "Afectividad",
    description:
      "Los vínculos, las emociones y el cuidado recíproco entre personas.",
  },
  {
    key: "SOCIABILIDAD",
    label: "Sociabilidad",
    description:
      "La comunidad, la comunicación, la diversidad y el servicio a los demás.",
  },
  {
    key: "ESPIRITUALIDAD",
    label: "Espiritualidad",
    description:
      "El sentido, la interioridad, la gratitud y la apertura a lo trascendente.",
  },
] as const;

export type CompassAreaKey = (typeof COMPASS_AREAS)[number]["key"];

export interface CompassTemplate {
  code: string;
  area: CompassAreaKey;
  terminalObjective: string;
  intermediateObjective: string;
  sortOrder: number;
}

export const COMPASS_OBJECTIVE_CATALOG: readonly CompassTemplate[] =
  objectiveCatalog as CompassTemplate[];

export function compassAreaDefinition(area: CompassAreaKey) {
  return (
    COMPASS_AREAS.find((item) => item.key === area) ?? COMPASS_AREAS[0]
  );
}

export function templatesByArea(area: CompassAreaKey): CompassTemplate[] {
  return COMPASS_OBJECTIVE_CATALOG.filter(
    (template) => template.area === area,
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function groupTemplatesByArea(): Record<CompassAreaKey, CompassTemplate[]> {
  const grouped = {} as Record<CompassAreaKey, CompassTemplate[]>;
  for (const area of COMPASS_AREAS) {
    grouped[area.key] = [];
  }
  for (const template of COMPASS_OBJECTIVE_CATALOG) {
    grouped[template.area]?.push(template);
  }
  for (const area of COMPASS_AREAS) {
    grouped[area.key].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return grouped;
}

export interface CompassCatalogValidation {
  valid: boolean;
  total: number;
  areasCovered: CompassAreaKey[];
  missingAreas: CompassAreaKey[];
  duplicateCodes: string[];
  problems: string[];
}

/**
 * Valida la invariante de disponibilidad total: seis áreas cubiertas, códigos
 * únicos y al menos tres objetivos representativos por área. No evalúa etapa,
 * edad ni antigüedad porque el catálogo no las admite.
 */
export function validateCompassCatalog(
  catalog: readonly CompassTemplate[] = COMPASS_OBJECTIVE_CATALOG,
): CompassCatalogValidation {
  const problems: string[] = [];
  const seen = new Set<string>();
  const duplicateCodes: string[] = [];
  const areaCounts = new Map<CompassAreaKey, number>();

  for (const template of catalog) {
    if (seen.has(template.code)) {
      duplicateCodes.push(template.code);
      problems.push(`Código duplicado: ${template.code}`);
    }
    seen.add(template.code);

    if (!COMPASS_AREAS.some((area) => area.key === template.area)) {
      problems.push(`Área desconocida en ${template.code}: ${template.area}`);
      continue;
    }

    if (!template.terminalObjective.trim()) {
      problems.push(`Objetivo terminal vacío en ${template.code}`);
    }
    if (!template.intermediateObjective.trim()) {
      problems.push(`Objetivo intermedio vacío en ${template.code}`);
    }

    areaCounts.set(
      template.area,
      (areaCounts.get(template.area) ?? 0) + 1,
    );
  }

  const areasCovered = COMPASS_AREAS.filter(
    (area) => (areaCounts.get(area.key) ?? 0) > 0,
  ).map((area) => area.key);

  const missingAreas = COMPASS_AREAS.filter(
    (area) => (areaCounts.get(area.key) ?? 0) === 0,
  ).map((area) => area.key);

  for (const area of COMPASS_AREAS) {
    const count = areaCounts.get(area.key) ?? 0;
    if (count > 0 && count < 3) {
      problems.push(
        `El área ${area.label} tiene ${count} objetivo(s); se esperan al menos 3.`,
      );
    }
  }

  if (missingAreas.length > 0) {
    problems.push(
      `Faltan áreas de desarrollo: ${missingAreas.join(", ")}.`,
    );
  }

  return {
    valid: problems.length === 0,
    total: catalog.length,
    areasCovered,
    missingAreas,
    duplicateCodes,
    problems,
  };
}
