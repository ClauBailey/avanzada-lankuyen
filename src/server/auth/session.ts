import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { can } from "@/server/rbac/can";
import type { Permission } from "@/server/rbac/permissions";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  mustChangePassword: boolean;
  isLogbookKeeper: boolean;
  communityId: string | null;
  community: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

/**
 * Fuente de verdad de la sesión.
 *
 * Auth.js usa JWT (requisito del proveedor Credentials), pero aquí se
 * revalida el usuario contra PostgreSQL en cada request: si la cuenta fue
 * desactivada, eliminada o cambió de rol, la sesión lo refleja de inmediato.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      mustChangePassword: true,
      isLogbookKeeper: true,
      communityId: true,
      community: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Usuario con la contraseña inicial ya cambiada. Se usa en los layouts de la
 * aplicación; el flujo de cambio de contraseña vive fuera de `(app)`.
 */
export async function requireReadyUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/cambiar-password");
  return user;
}

export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireReadyUser();
  if (!can(user, permission)) redirect("/inicio");
  return user;
}

export async function requireAA(): Promise<SessionUser> {
  return requirePermission("admin:access");
}

export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  redirect(getLandingPath(user));
}

export function getLandingPath(user: Pick<SessionUser, "role" | "mustChangePassword">) {
  if (user.mustChangePassword) return "/cambiar-password";
  return user.role === "AA" ? "/admin" : "/inicio";
}
