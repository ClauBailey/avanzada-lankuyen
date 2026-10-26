import Link from "next/link";
import { ArrowUpRight, UsersRound } from "lucide-react";

import { CommunityForm } from "@/components/admin/community-form";
import { CommunityToggle } from "@/components/admin/community-toggle";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Comunidades · Panel AA",
};

export default async function AdminComunidadesPage() {
  await requirePermission("community:manage");

  const [communities, counts] = await Promise.all([
    prisma.community.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        isActive: true,
        deletedAt: true,
      },
    }),
    prisma.user.groupBy({
      by: ["communityId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countByCommunity = new Map<string, number>();
  for (const row of counts) {
    if (row.communityId) {
      countByCommunity.set(row.communityId, row._count._all);
    }
  }

  const activeCommunities = communities.filter((community) => community.isActive);
  const inactiveCommunities = communities.filter((community) => !community.isActive);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Comunidades"
        description="Los subgrupos dinámicos de la Avanzada. Cada Pionero/a y Coordinador pertenece a una comunidad, y su etiqueta aparece en el perfil y en las listas de asistencia."
        actions={
          <Badge variant="default">
            {activeCommunities.length} activa
            {activeCommunities.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
        <Card className="h-fit">
          <CardHeader className="border-b border-line/70">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              Nueva comunidad
            </CardDescription>
            <CardTitle>Crea un subgrupo</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <CommunityForm mode="create" />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Comunidades de la unidad
            </h2>
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center gap-1 text-xs font-semibold text-anil-700 hover:text-anil-900"
            >
              Gestionar miembros
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {communities.length === 0 ? (
            <Card className="border-dashed bg-surface/70 p-8 text-center">
              <UsersRound className="mx-auto size-8 text-anil-400" aria-hidden="true" />
              <p className="mt-3 font-display text-lg font-semibold text-ink">
                Aún no hay comunidades
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Crea la primera con el formulario de la izquierda. Después podrás
                asignar miembros desde la gestión de usuarios.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {[...activeCommunities, ...inactiveCommunities].map((community) => {
                const memberCount = countByCommunity.get(community.id) ?? 0;

                return (
                  <li key={community.id}>
                    <Card className="overflow-hidden">
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{
                                  backgroundColor: community.color ?? "#4b50a8",
                                }}
                                aria-hidden="true"
                              />
                              <h3 className="font-display text-lg font-semibold text-ink">
                                {community.name}
                              </h3>
                              {!community.isActive ? (
                                <Badge variant="outline">Inactiva</Badge>
                              ) : null}
                            </div>
                            {community.description ? (
                              <p className="mt-1 text-sm text-ink-soft">
                                {community.description}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm italic text-ink-soft/70">
                                Sin descripción.
                              </p>
                            )}
                          </div>

                          <Link
                            href={`/admin/usuarios?community=${community.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-line bg-canvas/60 px-3 py-2 text-xs font-semibold text-anil-800 transition-colors hover:border-anil-200 hover:bg-anil-50"
                          >
                            <UsersRound className="size-4" aria-hidden="true" />
                            {memberCount} miembro{memberCount === 1 ? "" : "s"}
                          </Link>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <details className="group">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-anil-200 hover:bg-anil-50">
                              Editar
                            </summary>
                            <div className="mt-4 rounded-xl border border-line/80 bg-canvas/50 p-4">
                              <CommunityForm mode="edit" community={community} />
                            </div>
                          </details>
                          <CommunityToggle
                            id={community.id}
                            name={community.name}
                            isActive={community.isActive}
                          />
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
