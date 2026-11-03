import Link from "next/link";
import { ArrowUpRight, TriangleAlert, UsersRound } from "lucide-react";

import { CommunityForm } from "@/components/admin/community-form";
import { CommunityToggle } from "@/components/admin/community-toggle";
import { CommunityBatchAa } from "@/components/communities/community-batch-aa";
import { CommunityMemberRoles } from "@/components/communities/community-member-roles";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { aaLoadAdvisory, communitySizeAdvisory } from "@/lib/community-rules";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Comunidades · Panel AA",
};

const YOUTH_ROLES = ["PP", "COORDINADOR"] as const;

export default async function AdminComunidadesPage() {
  await requirePermission("community:manage");

  const [communities, youth, adults] = await Promise.all([
    prisma.community.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        motto: true,
        description: true,
        color: true,
        isActive: true,
        deletedAt: true,
      },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, role: { in: [...YOUTH_ROLES] } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        username: true,
        role: true,
        isActive: true,
        communityId: true,
        communityRole: true,
        assignedAaId: true,
        assignedSince: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "AA", isActive: true, deletedAt: null },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        _count: {
          select: {
            assignedYouth: {
              where: {
                isActive: true,
                deletedAt: null,
                role: { in: [...YOUTH_ROLES] },
              },
            },
          },
        },
      },
    }),
  ]);

  const youthByCommunity = new Map<string, typeof youth>();
  for (const member of youth) {
    if (!member.communityId) continue;
    const list = youthByCommunity.get(member.communityId) ?? [];
    list.push(member);
    youthByCommunity.set(member.communityId, list);
  }

  const aaOptions = adults.map((adult) => ({
    id: adult.id,
    name: getDisplayName(adult),
    assignedCount: adult._count.assignedYouth,
  }));

  const overloadedAas = adults.filter(
    (adult) => aaLoadAdvisory(adult._count.assignedYouth) !== null,
  );

  const activeCommunities = communities.filter((community) => community.isActive);
  const inactiveCommunities = communities.filter((community) => !community.isActive);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Comunidades"
        description="Grupos juveniles de 3 a 6 pioneros y pioneras. El Equipo Adulto no pertenece a las comunidades: acompaña de forma personal y 1 a 1 a un grupo pequeño de personas jóvenes."
        actions={
          <Badge variant="default">
            {activeCommunities.length} activa
            {activeCommunities.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      {overloadedAas.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">
              Carga de acompañamiento por sobre lo recomendado
            </p>
            <ul className="list-inside list-disc text-xs leading-relaxed">
              {overloadedAas.map((adult) => (
                <li key={adult.id}>
                  {getDisplayName(adult)} acompaña a{" "}
                  {adult._count.assignedYouth} personas jóvenes activas.
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed">
              El Manual recomienda un máximo de 6 personas jóvenes por AA para sostener un
              acompañamiento cercano. Esta advertencia no bloquea la asignación.
            </p>
          </div>
        </div>
      ) : null}

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
                const members = youthByCommunity.get(community.id) ?? [];
                const activeMembers = members.filter((member) => member.isActive);
                const youthCount = activeMembers.length;
                const sizeAdvisory = communitySizeAdvisory(youthCount);
                const hasEarlyAssignments = activeMembers.some(
                  (member) =>
                    member.assignedAaId &&
                    member.assignedSince &&
                    Date.now() - member.assignedSince.getTime() <
                      365 * 86_400_000,
                );

                return (
                  <li key={community.id}>
                    <Card className="overflow-hidden">
                      <div className="space-y-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{
                                  backgroundColor: community.color ?? "#4527a0",
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
                            {community.motto ? (
                              <p className="mt-1 text-sm font-medium italic text-anil-800">
                                «{community.motto}»
                              </p>
                            ) : null}
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
                            {youthCount} persona{youthCount === 1 ? "" : "s"} joven{youthCount === 1 ? "" : "es"} activa{youthCount === 1 ? "" : "s"}
                            {youthCount === 1 ? "" : "s"}
                          </Link>
                        </div>

                        {sizeAdvisory ? (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                            <TriangleAlert
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{sizeAdvisory}</span>
                          </div>
                        ) : null}

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="space-y-2 rounded-xl border border-line/70 bg-canvas/30 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                              Asignar acompañamiento al grupo
                            </p>
                            <CommunityBatchAa
                              communityId={community.id}
                              aaOptions={aaOptions}
                              hasEarlyAssignments={Boolean(hasEarlyAssignments)}
                            />
                          </div>

                          <div className="space-y-2 rounded-xl border border-line/70 bg-canvas/30 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                              Cargos internos
                            </p>
                            <CommunityMemberRoles
                              communityId={community.id}
                              canManage
                              members={activeMembers.map((member) => ({
                                id: member.id,
                                name: getDisplayName(member),
                                username: member.username,
                                role: member.role,
                                communityRole: member.communityRole,
                              }))}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <details className="group">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-anil-200 hover:bg-anil-50">
                              Editar identidad
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
