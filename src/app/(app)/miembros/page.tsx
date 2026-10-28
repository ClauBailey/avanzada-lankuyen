import Link from "next/link";
import { Award, Compass, Mountain, Search, Trophy, UsersRound } from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS, ROLE_SHORT_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import {
  getDirectoryCommunities,
  getMembersDirectory,
} from "@/features/members/queries";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Miembros",
};

type SearchParams = {
  q?: string;
  community?: string;
};

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("member:view");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const community = params.community ?? "";

  const [members, communities] = await Promise.all([
    getMembersDirectory({ query, communityId: community }),
    getDirectoryCommunities(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Comunidad"
        title="Miembros"
        description="Conoce a las personas que caminan la Avanzada. Cada perfil muestra su comunidad, su etapa y los reconocimientos que ha construido."
      />

      <Card className="p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="member-search"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
            >
              Buscar por nombre o usuario
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
                aria-hidden="true"
              />
              <Input
                id="member-search"
                name="q"
                defaultValue={query}
                placeholder="Ej: Antonia o @antonia"
                className="pl-9"
              />
            </div>
          </div>

          <div className="sm:w-56 sm:space-y-1.5">
            <label
              htmlFor="member-community"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
            >
              Comunidad
            </label>
            <Select
              id="member-community"
              name="community"
              defaultValue={community}
            >
              <option value="">Todas</option>
              <option value="sin">Sin comunidad</option>
              {communities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="md">
              <Search aria-hidden="true" />
              Filtrar
            </Button>
            {query || community ? (
              <Link
                href="/miembros"
                className={buttonVariants({ variant: "secondary", size: "md" })}
              >
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {members.length} miembro{members.length === 1 ? "" : "s"} activo
          {members.length === 1 ? "" : "s"}
        </p>
        <p className="text-[11px] text-ink-soft">
          Solo se muestra información pública del perfil.
        </p>
      </div>

      {members.length === 0 ? (
        <Card className="border-dashed bg-surface/70 p-10 text-center">
          <UsersRound className="mx-auto size-9 text-anil-400" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-ink">
            No encontramos miembros
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
            Prueba con otro nombre o cambia el filtro de comunidad.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => {
            const fullName = `${member.firstName} ${member.lastName}`;
            const StageIcon =
              member.stage?.code === "CUMBRE" ? Mountain : Compass;

            return (
              <Link
                key={member.id}
                href={`/miembros/${member.username}`}
                className="group"
              >
                <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-anil-300 group-hover:bg-anil-50/30">
                  <div className="flex items-start gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-anil-950 font-display text-lg font-semibold text-white ring-2 ring-white/20">
                      {getInitials(member.firstName, member.lastName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-semibold text-ink">
                        {fullName}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        @{member.username}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={member.role === "AA" ? "gold" : "default"}>
                          {ROLE_SHORT_LABELS[member.role]}
                        </Badge>
                        {member.community ? (
                          <CommunityTag
                            name={member.community.name}
                            color={member.community.color}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/60 pt-3 text-[11px] text-ink-soft">
                    <span className="inline-flex items-center gap-1 font-semibold text-anil-800">
                      {member.stage ? (
                        <>
                          <StageIcon className="size-3.5" aria-hidden="true" />
                          {member.stage.name}
                        </>
                      ) : (
                        <>
                          <Compass className="size-3.5" aria-hidden="true" />
                          {ROLE_LABELS[member.role]}
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="size-3.5 text-gold" aria-hidden="true" />
                      {member.badgeCount} insignia
                      {member.badgeCount === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="size-3.5 text-gold" aria-hidden="true" />
                      {member.achievementCount} logro
                      {member.achievementCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
