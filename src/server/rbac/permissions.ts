import type { Role } from "@/generated/prisma/enums";

/**
 * Catálogo central de permisos.
 *
 * Toda decisión de autorización pasa por `can()` / `requirePermission()`.
 * Nunca se compara el rol directamente en componentes o acciones.
 */
export const PERMISSIONS = [
  "profile:view",
  "profile:edit",
  "reflection:edit",
  "calendar:view",
  "calendar:manage",
  "activity:manage",
  "activity:evaluate",
  "activity:evaluation_view",
  "semester:manage",
  "attendance:rsvp",
  "attendance:ratify",
  "route_sheet:upload",
  "route_sheet:review",
  "badge:view",
  "badge:grant",
  "badge:catalog_manage",
  "user:manage",
  "community:manage",
  "material:view",
  "material:manage",
  "notification:view",
  "audit:view",
  "admin:access",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Permisos base de un Pionero/a.
 */
const PP_PERMISSIONS = [
  "profile:view",
  "profile:edit",
  "reflection:edit",
  "calendar:view",
  "activity:evaluate",
  "attendance:rsvp",
  "route_sheet:upload",
  "badge:view",
  "material:view",
  "notification:view",
] as const satisfies readonly Permission[];

/**
 * v1: el rol COORDINADOR es un Pionero/a con exactamente los mismos permisos y
 * vistas que PP, incluida la evaluación posterior de actividades. Se declara de
 * forma independiente para que habilitar permisos intermedios sea un cambio
 * local.
 */
const COORDINADOR_PERMISSIONS = [
  "profile:view",
  "profile:edit",
  "reflection:edit",
  "calendar:view",
  "activity:evaluate",
  "attendance:rsvp",
  "route_sheet:upload",
  "badge:view",
  "material:view",
  "notification:view",
] as const satisfies readonly Permission[];

/**
 * Los AA administran toda la unidad, pero no responden evaluaciones: solo las
 * leen. La acción de envío también vuelve a exigir `activity:evaluate`.
 */
const AA_PERMISSIONS = PERMISSIONS.filter(
  (permission) => permission !== "activity:evaluate",
) as readonly Permission[];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  PP: new Set<Permission>(PP_PERMISSIONS),
  COORDINADOR: new Set<Permission>(COORDINADOR_PERMISSIONS),
  AA: new Set<Permission>(AA_PERMISSIONS),
};

export function permissionsFor(role: Role): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role];
}
