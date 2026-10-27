/**
 * Constantes y utilidades puras de La Bitácora.
 *
 * Se comparten entre servidor y cliente: el formulario comprime la foto antes
 * de enviarla y la Server Action vuelve a validar tipo y peso.
 */

import { slugify } from "@/lib/slug";

export const LOGBOOK_PHOTO_MAX_BYTES = 1_572_864; // 1.5 MB
export const LOGBOOK_PHOTO_MAX_SIDE = 1600;
export const LOGBOOK_PHOTO_QUALITY = 0.82;
export const LOGBOOK_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const LOGBOOK_PHOTO_HINT =
  "JPG, PNG o WEBP · se optimiza a 1600 px · máximo 1.5 MB";
export const LOGBOOK_TITLE_MAX = 160;
export const LOGBOOK_CONTENT_MAX = 20_000;
export const LOGBOOK_REJECTION_MAX = 1_000;

export const LOGBOOK_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isAllowedLogbookPhotoMime(mime: string) {
  return (LOGBOOK_PHOTO_MIME_TYPES as readonly string[]).includes(mime);
}

export function logbookPhotoExtension(name: string, mimeType: string) {
  const fromName = name.includes(".")
    ? name.slice(name.lastIndexOf(".")).toLowerCase()
    : "";

  if (/^\.(jpe?g|png|webp)$/.test(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/jpeg") return ".jpg";
  return "";
}

export function logbookStatusLabel(status: string) {
  if (status === "PUBLICADA") return "Publicada";
  if (status === "RECHAZADA") return "Rechazada";
  return "Pendiente de aprobación";
}

export function formatLogbookPage(pageNumber: number | null | undefined) {
  return pageNumber ? `Página ${pageNumber}` : "Sin numerar";
}

/** Lema inspirador para compartir una insignia cuando el AA no dejó nota. */
export function badgeShareMotto(code: string, category: string) {
  if (code.includes("CUMBRE") || category === "PROMESA") {
    return "La cumbre no es el final: es la vista que nos invita a seguir caminando.";
  }
  if (code.includes("SENDERO")) {
    return "Cada paso del sendero deja una huella que la unidad recuerda.";
  }
  return "Siempre más alto, siempre más lejos, siempre juntos.";
}

/** Nombre del PNG descargable: insignia-[slug]-[username].png */
export function badgeShareFilename(
  badgeName: string,
  username: string,
) {
  const badgeSlug = slugify(badgeName) || "insignia";
  const userSlug = slugify(username) || "pionero";
  return `insignia-${badgeSlug}-${userSlug}.png`;
}

export function nextPublishedPageNumber(
  pageNumbers: ReadonlyArray<number | null>,
) {
  return (
    pageNumbers.reduce<number>(
      (max, page) => (page && page > max ? page : max),
      0,
    ) + 1
  );
}
