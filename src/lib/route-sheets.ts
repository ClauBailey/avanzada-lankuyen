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

export const ROUTE_SHEET_STRUCTURED_SECTIONS = [
  {
    key: "responsibleText",
    order: 1,
    label: "Responsable de la actividad",
    hint: "Quién asume la hoja de ruta y cómo se organiza el equipo de encargados.",
  },
  {
    key: "priorMotivation",
    order: 2,
    label: "Motivación previa",
    hint: "Por qué la actividad nace y qué necesidad o sueño la origina.",
  },
  {
    key: "activityObjectives",
    order: 3,
    label: "Objetivos de la actividad",
    hint: "Qué se espera lograr, expresado en resultados observables.",
  },
  {
    key: "locationAndPermits",
    order: 4,
    label: "Lugar y permisos",
    hint: "Dónde se realiza, horarios, accesos y autorizaciones necesarias.",
  },
  {
    key: "phasesAndVariants",
    order: 5,
    label: "Fases y variantes",
    hint: "Momento a momento de la actividad y qué hacer si cambia el plan o el clima.",
  },
  {
    key: "externalHumanResources",
    order: 6,
    label: "Recursos humanos externos",
    hint: "Monitores, invitados, apoderados o especialistas que participan.",
  },
  {
    key: "materialsAndBudget",
    order: 7,
    label: "Materiales y presupuesto",
    hint: "Insumos, transporte, alimentación y financiamiento estimado.",
  },
  {
    key: "riskPrevention",
    order: 8,
    label: "Prevención de riesgos",
    hint: "Riesgos identificados, medidas preventivas y plan de emergencia.",
  },
] as const;

export type RouteSheetStructuredSectionKey =
  (typeof ROUTE_SHEET_STRUCTURED_SECTIONS)[number]["key"];

export type RouteSheetStructuredData = Partial<
  Record<RouteSheetStructuredSectionKey, string>
>;

export function parseRouteSheetStructuredData(
  value: unknown,
): RouteSheetStructuredData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const data: RouteSheetStructuredData = {};
  for (const section of ROUTE_SHEET_STRUCTURED_SECTIONS) {
    const text = (value as Record<string, unknown>)[section.key];
    if (typeof text === "string" && text.trim().length > 0) {
      data[section.key] = text;
    }
  }

  return Object.keys(data).length > 0 ? data : null;
}

export function routeSheetStructuredSectionLabel(key: string): string {
  return (
    ROUTE_SHEET_STRUCTURED_SECTIONS.find((section) => section.key === key)
      ?.label ?? key
  );
}
