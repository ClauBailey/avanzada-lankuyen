import type { RouteSheetStatus } from "@/generated/prisma/enums";

export const ROUTE_SHEET_STATUSES: RouteSheetStatus[] = [
  "PENDIENTE_AUTORIZACION",
  "APROBADA",
  "RECHAZADA",
];

export const ROUTE_SHEET_STATUS_LABELS: Record<RouteSheetStatus, string> = {
  PENDIENTE_AUTORIZACION: "En revisión",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const ROUTE_SHEET_STATUS_BADGE: Record<
  RouteSheetStatus,
  "warning" | "success" | "danger"
> = {
  PENDIENTE_AUTORIZACION: "warning",
  APROBADA: "success",
  RECHAZADA: "danger",
};

export const ROUTE_SHEET_STATUS_DESCRIPTIONS: Record<RouteSheetStatus, string> = {
  PENDIENTE_AUTORIZACION:
    "El documento está en la bandeja de los AA y todavía no puede reemplazarse.",
  APROBADA:
    "La hoja fue autorizada y ya está disponible para toda la unidad en el calendario.",
  RECHAZADA:
    "Los AA pidieron correcciones. Revisa el motivo y sube una nueva versión.",
};

export const MAX_ROUTE_SHEET_BYTES = 10 * 1024 * 1024;

export const ROUTE_SHEET_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type RouteSheetMimeType = (typeof ROUTE_SHEET_MIME_TYPES)[number];

export const ROUTE_SHEET_ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp";

export const ROUTE_SHEET_FILE_HINT =
  "PDF, DOC, DOCX, JPG, PNG o WEBP · máximo 10 MB";

export function isAllowedRouteSheetMime(type: string) {
  return (ROUTE_SHEET_MIME_TYPES as readonly string[]).includes(type);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 1,
    }).format(kilobytes)} KB`;
  }

  return `${new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 1,
  }).format(kilobytes / 1024)} MB`;
}

export function routeSheetVersionLabel(version: number) {
  return `v${version}`;
}
