/**
 * Constantes y utilidades del material digital de la unidad.
 *
 * Este módulo es puro (sin `server-only`) porque lo usan tanto las páginas
 * del servidor como los formularios de administración en el cliente.
 */

export const MATERIAL_CORE = [
  {
    key: "grito",
    slug: "grito-de-la-unidad",
    label: "El Grito",
    shortLabel: "Grito",
    eyebrow: "La voz que nos reúne",
    description: "El llamado de la Avanzada y la respuesta de la unidad.",
  },
  {
    key: "oracion",
    slug: "oracion",
    label: "La Oración",
    shortLabel: "Oración",
    eyebrow: "La plegaria de Lankuyen",
    description: "Las palabras que nos acompañan antes de cada encuentro.",
  },
  {
    key: "himno",
    slug: "himno",
    label: "El Himno",
    shortLabel: "Himno",
    eyebrow: "La canción de la unidad",
    description: "La letra que cantamos juntos, estrofa a estrofa.",
  },
  {
    key: "bandera",
    slug: "bandera",
    label: "La Bandera",
    shortLabel: "Bandera",
    eyebrow: "El símbolo que nos representa",
    description: "Sus colores, sus símbolos y la historia que guarda.",
  },
  {
    key: "otros",
    slug: "otros-recursos",
    label: "Otros recursos",
    shortLabel: "Biblioteca",
    eyebrow: "Biblioteca de la unidad",
    description: "Manuales, cantos, guías de etapa y lecturas complementarias.",
  },
] as const;

export type MaterialCoreKey = (typeof MATERIAL_CORE)[number]["key"];

export const MATERIAL_CORE_SLUGS = MATERIAL_CORE.map((item) => item.slug);

export function findMaterialCore(slug: string) {
  return MATERIAL_CORE.find((item) => item.slug === slug) ?? null;
}

export function isMaterialCoreSlug(slug: string) {
  return MATERIAL_CORE_SLUGS.includes(slug as (typeof MATERIAL_CORE_SLUGS)[number]);
}

export function isMaterialCoreKey(
  value: string | undefined,
): value is MaterialCoreKey {
  return MATERIAL_CORE.some((item) => item.key === value);
}

export function materialToneForSlug(slug: string) {
  const core = findMaterialCore(slug);

  if (core?.key === "grito") return "grito" as const;
  if (core?.key === "oracion") return "prayer" as const;
  if (core?.key === "himno") return "anthem" as const;
  return "default" as const;
}

export const MATERIAL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MATERIAL_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml";
export const MATERIAL_IMAGE_HINT = "PNG, JPG, WEBP o SVG · máximo 5 MB";

export const MATERIAL_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export function isMaterialImageMime(mime: string) {
  return (MATERIAL_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function materialImageExtension(name: string, mimeType: string) {
  const fromName = name.includes(".")
    ? name.slice(name.lastIndexOf(".")).toLowerCase()
    : "";

  if (/^\.[a-z0-9]{1,8}$/.test(fromName)) return fromName;

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/svg+xml") return ".svg";
  return "";
}

export interface MaterialSearchable {
  title: string;
  summary: string | null;
  bodyMd: string;
}

export interface MaterialResourceView extends MaterialSearchable {
  id: string;
  slug: string;
  imageFileId: string | null;
  sortOrder: number;
  updatedAt: Date;
}

/**
 * Búsqueda simple y tolerante a mayúsculas/acentos sobre el material.
 * Se aplica en el servidor para que el lector siga siendo mobile-first y no
 * envíe el cuerpo completo de todos los recursos al cliente.
 */
export function materialMatches(
  resource: MaterialSearchable,
  rawQuery: string,
) {
  const query = normalizeForSearch(rawQuery);

  if (!query) return true;

  const haystack = normalizeForSearch(
    `${resource.title} ${resource.summary ?? ""} ${plainTextFromMarkdown(
      resource.bodyMd,
    )}`,
  );

  return haystack.includes(query);
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convierte Markdown en texto legible para el botón «Copiar texto» y para la
 * búsqueda. No pretende ser un parser completo: elimina la sintaxis más común
 * conservando versos, saltos de línea y el contenido de los enlaces.
 */
export function plainTextFromMarkdown(markdown: string) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s{0,3}(?:---+|\*\*\*+|___+)\s*$/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
