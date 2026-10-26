import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Award, Plus, UserRound } from "lucide-react";

import {
  UserActiveToggle,
  UserCommunitySelect,
  UserResetButton,
  UserRoleButton,
} from "@/components/admin/user-controls";
import { UsersFilters } from "@/components/admin/users-filters";
import { CommunityTag } from "@/components/brand/community-tag";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Usuarios · Panel AA",
};

type SearchParams = {
  q?: string;
  community?: string;
  role?: string;
  status?: string;
};

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("user:manage");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const communityFilter = params.community ?? "";
  const roleFilter = params.role ?? "";
  const statusFilter = params.status ?? "";

  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (communityFilter === "sin") {
    where.communityId = null;
  } else if (communityFilter) {
    where.communityId = communityFilter;
  }

  if (roleFilter === "PP" || roleFilter === "COORDINADOR" || roleFilter === "AA") {
    where.role = roleFilter;
  }

  if (statusFilter === "active") where.isActive = true;
  if (statusFilter === "inactive") where.isActive = false;

  const [users, communities] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        communityId: true,
        community: { select: { id: true, name: true, color: true } },
        _count: {
          select: {
            badges: { where: { revokedAt: null } },
          },
        },
      },
    }),
    prisma.community.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
  ]);

  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Crea cuentas, asigna comunidades, ajusta roles y restablece contraseñas. No existe registro público: todas las cuentas nacen aquí."
        actions={
          <Link
            href="/admin/usuarios/nuevo"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear cuenta
          </Link>
        }
      />

      <Suspense fallback={null}>
        <UsersFilters communities={communities} />
      </Suspense>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            {users.length} cuenta{users.length === 1 ? "" : "s"} · {activeCount} activa
            {activeCount === 1 ? "" : "s"}
          </p>
          <p className="text-[11px] text-ink-soft">
            Las cuentas se ordenan con las activas primero.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="p-10 text-center">
            <UserRound className="mx-auto size-8 text-anil-400" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">
              No encontramos cuentas con esos filtros
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Prueba limpiando la búsqueda o crea una cuenta nueva.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line/70 bg-canvas/60 text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Miembro
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Rol
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Comunidad
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Insignias
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {users.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`;

                  return (
                    <tr key={member.id} className="align-top hover:bg-canvas/40">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{fullName}</p>
                        <p className="text-xs text-ink-soft">@{member.username}</p>
                        {member.email ? (
                          <p className="text-[11px] text-ink-soft/80">{member.email}</p>
                        ) : null}
                        {member.mustChangePassword ? (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-soft/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7a5a16]">
                            Clave temporal
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={member.role === "AA" ? "gold" : "default"}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <UserCommunitySelect
                          userId={member.id}
                          communityId={member.communityId}
                          communities={communities}
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        {member.role === "AA" ? (
                          <span className="text-xs text-ink-soft">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <Award className="size-3.5 text-gold" aria-hidden="true" />
                            {member._count.badges}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {member.isActive ? (
                          <Badge variant="success">Activa</Badge>
                        ) : (
                          <Badge variant="outline">Inactiva</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <Link
                              href={`/admin/usuarios/${member.id}`}
                              className={buttonVariants({
                                variant: "secondary",
                                size: "sm",
                              })}
                            >
                              Ficha
                              <ArrowUpRight className="size-3.5" aria-hidden="true" />
                            </Link>
                            <UserResetButton
                              userId={member.id}
                              fullName={fullName}
                            />
                          </div>

                          <details className="group">
                            <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-[11px] font-semibold text-anil-700 transition-colors hover:bg-anil-50">
                              Más acciones
                            </summary>
                            <div className="mt-1 flex flex-col items-start gap-1 border-l-2 border-line pl-2">
                              {member.role !== "AA" ? (
                                <UserRoleButton userId={member.id} role={member.role} />
                              ) : null}
                              <UserActiveToggle
                                userId={member.id}
                                fullName={fullName}
                                isActive={member.isActive}
                              />
                            </div>
                          </details>

                          {member.community ? (
                            <CommunityTag
                              name={member.community.name}
                              color={member.community.color}
                              className="mt-0.5 lg:hidden"
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs leading-relaxed text-ink-soft">
        Las cuentas desactivadas conservan su historial (insignias, reflexiones y
        asistencia), pero no pueden iniciar sesión. El nombre de usuario y el correo
        no se reutilizan en cuentas nuevas.
      </p>
    </div>
  );
}
