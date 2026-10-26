import type { Role } from "@/generated/prisma/enums";

import {
  permissionsFor,
  type Permission,
} from "@/server/rbac/permissions";

export class ForbiddenError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`No tienes permiso para realizar esta acción (${permission}).`);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}

export interface Actor {
  role: Role;
}

export function can(
  actor: Actor | null | undefined,
  permission: Permission,
): boolean {
  if (!actor) return false;
  return permissionsFor(actor.role).has(permission);
}

export function canAny(
  actor: Actor | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(actor, permission));
}

export function canAll(
  actor: Actor | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => can(actor, permission));
}

export function assertCan(
  actor: Actor | null | undefined,
  permission: Permission,
): asserts actor is Actor {
  if (!can(actor, permission)) {
    throw new ForbiddenError(permission);
  }
}
