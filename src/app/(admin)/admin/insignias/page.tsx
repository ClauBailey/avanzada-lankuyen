import Link from "next/link";
import { Suspense } from "react";
import { Award, ArrowUpRight, BookMarked, SearchX, UsersRound } from "lucide-react";

import { BadgeAdminCard } from "@/components/admin/badge-admin-card";
import { BadgeCatalogForm } from "@/components/admin/badge-catalog-form";
import { BadgesFilters } from "@/components/admin/badges-filters";
import { CommunityTag } from "@/components/brand/community-tag";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { getInitials } from "@/lib/utils";

export const metadata = {
  title: "Insignias · Panel AA",
};

type SearchParams = {
  q?: string;
  community?: string;
};

export default async function AdminInsigniasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("badge:grant");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const communityFilter = params.community ?? "";

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    role: { in: ["PP", "COORDINADOR"] },
  };

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
    ];
  }

  if (communityFilter) {
    where.communityId = communityFilter;
  }

  const [members, communities, badges] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [
        { isActive: "desc" },
        { community: { name: "asc" } },
        { firstName: "asc" },
        { lastName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        community: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.community.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        imagePath: true,
        category: true,
        sortOrder: true,
      },
    }),
  ]);

  const memberIds = members.map((member) => member.id);

  const grants = memberIds.length
    ? await prisma.userBadge.findMany({
        where: { userId: { in: memberIds }, revokedAt: null },
        select: {
          id: true,
          userId: true,
          badgeId: true,
          grantedAt: true,
          note: true,
        },
      })
    : [];

  const grantsByMember = new Map<
    string,
    Map<string, { id: string; grantedAt: string; note: string | null }>
  >();

  for (const grant of grants) {
    const byBadge =
      grantsByMember.get(grant.userId) ??
      new Map<string, { id: string; grantedAt: string; note: string | null }>();
    byBadge.set(grant.badgeId, {
      id: grant.id,
      grantedAt: grant.grantedAt.toISOString(),
      note: grant.note,
    });
    grantsByMember.set(grant.userId, byBadge);
  }

  const competencies = badges.filter((badge) => badge.category === "COMPETENCIA");
  const totalGrants = grants.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Otorgamiento de insignias"
        description="Busca a cada Pionero/a, revisa de un vistazo su camino y otorga o revoca insignias con una nota. Cada movimiento queda en la auditoría y dispara una notificación."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">
              {totalGrants} otorgada{totalGrants === 1 ? "" : "s"}
            </Badge>
            <Link
              href="#catalogo"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <BookMarked className="size-4" aria-hidden="true" />
              Editar catálogo
            </Link>
          </div>
        }
      />

      <Suspense fallback={null}>
        <BadgesFilters communities={communities} />
      </Suspense>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-ink">
            Matriz de la unidad
          </h2>
          <p className="text-xs text-ink-soft">
            {members.length} miembro{members.length === 1 ? "" : "s"} ·{" "}
            {badges.length} insignias en el catálogo
          </p>
        </div>

        {members.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-10 text-center">
            <SearchX className="mx-auto size-9 text-anil-400" aria-hidden="true" />
            <p className="mt-3 font-display text-xl font-semibold text-ink">
              No encontramos pioneros con esos filtros
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
              Prueba con otro nombre o comunidad. Las cuentas AA no participan de
              la progresión.
            </p>
          </Card>
        ) : (
          <ul className="space-y-4">
            {members.map((member) => {
              const fullName = `${member.firstName} ${member.lastName}`;
              const memberGrants = grantsByMember.get(member.id);
              const obtained = memberGrants?.size ?? 0;

              return (
                <li key={member.id}>
                  <Card className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 bg-canvas/40 px-4 py-3.5 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-100 text-xs font-bold text-anil-800">
                          {getInitials(member.firstName, member.lastName)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-base font-semibold text-ink">
                              {fullName}
                            </p>
                            {!member.isActive ? (
                              <Badge variant="outline">Inactiva</Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-ink-soft">
                            @{member.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {member.community ? (
                          <CommunityTag
                            name={member.community.name}
                            color={member.community.color}
                          />
                        ) : (
                          <Badge variant="outline">Sin comunidad</Badge>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-soft/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5a16]">
                          <Award className="size-3.5" aria-hidden="true" />
                          {obtained}
                        </span>
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
                      </div>
                    </div>

                    <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:p-4">
                      {badges.map((badge) => (
                        <BadgeAdminCard
                          key={badge.id}
                          userId={member.id}
                          userName={fullName}
                          badge={{
                            id: badge.id,
                            name: badge.name,
                            imagePath: badge.imagePath,
                          }}
                          grant={memberGrants?.get(badge.id) ?? null}
                        />
                      ))}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="catalogo" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#7a5a16]">
              <BookMarked className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                Catálogo
              </p>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Las 7 competencias
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
                Ajusta los títulos y descripciones oficiales sin tocar el código.
                Los cambios se ven de inmediato en el perfil de cada Pionero/a.
              </p>
            </div>
          </div>
          <Badge variant="outline">
            <UsersRound className="size-3.5" aria-hidden="true" />
            {competencies.length} competencias
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {competencies.map((badge) => (
            <BadgeCatalogForm
              key={badge.id}
              badge={{
                id: badge.id,
                code: badge.code,
                name: badge.name,
                description: badge.description,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
