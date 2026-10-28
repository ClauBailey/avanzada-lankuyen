import Link from "next/link";
import { Award, Sparkles, Trophy, UsersRound } from "lucide-react";

import {
  AchievementCard,
  ACHIEVEMENT_VISIBILITY_LABELS,
} from "@/components/achievements/achievement-card";
import { AchievementFilters } from "@/components/achievements/achievement-filters";
import { CreateAchievementDialog } from "@/components/achievements/create-achievement-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AchievementCategory } from "@/generated/prisma/enums";
import {
  achievementProgress,
  getAchievementsForViewer,
} from "@/features/achievements/queries";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Logros",
};

const CATEGORY_VALUES: AchievementCategory[] = [
  "AVANZADA",
  "COMUNIDAD",
  "ESPECIAL",
  "SECRETO",
];

type SearchParams = {
  category?: string;
  state?: string;
};

export default async function LogrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission("achievement:view");
  const params = await searchParams;

  const category = CATEGORY_VALUES.includes(
    params.category as AchievementCategory,
  )
    ? (params.category as AchievementCategory)
    : "";
  const filterState =
    params.state === "unlocked" || params.state === "locked"
      ? params.state
      : "";

  const achievements = await getAchievementsForViewer(user);
  const isAA = user.role === "AA";
  const progress = achievementProgress(achievements);

  const filtered = achievements.filter((achievement) => {
    if (category && achievement.category !== category) return false;
    if (filterState === "unlocked" && !achievement.unlocked) return false;
    if (filterState === "locked" && achievement.unlocked) return false;
    return true;
  });

  const totalUnlocks = achievements.reduce(
    (total, achievement) => total + achievement.memberCount,
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Camino personal"
        title="Logros"
        description={
          isAA
            ? "Catálogo completo sin censura: revisa cuántos miembros han desbloqueado cada logro, crea nuevos desafíos y asigna reconocimientos."
            : "Cada aventura deja una marca. Descubre los logros de la Avanzada, revisa los que ya desbloqueaste y sigue explorando los que aún guardan secretos."
        }
        actions={
          isAA ? (
            <>
              <CreateAchievementDialog />
              <Link
                href="/miembros"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <UsersRound aria-hidden="true" />
                Asignar a miembros
              </Link>
            </>
          ) : (
            <Link
              href="/miembros"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <UsersRound aria-hidden="true" />
              Ver miembros
            </Link>
          )
        }
      />

      {isAA ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Catálogo activo
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {achievements.length}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              logros disponibles para la unidad
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Desbloqueos totales
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {totalUnlocks}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              reconocimientos otorgados
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Puntos en juego
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {progress.maxPoints}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              suma de todos los logros activos
            </p>
          </Card>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 text-white shadow-float sm:p-8">
          <div className="topo-bg pointer-events-none absolute inset-0 opacity-25" />
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-gold ring-1 ring-white/20">
                <Trophy className="size-8" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-200/70">
                  Tu vitrina
                </p>
                <p className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
                  {progress.unlockedCount} / {progress.totalCount}
                </p>
                <p className="text-sm text-anil-100/70">
                  logros desbloqueados · {progress.points} puntos
                </p>
              </div>
            </div>

            <div className="w-full sm:max-w-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-anil-100/80">
                <span>Progreso</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold via-[#c8a45a] to-lavender transition-[width]"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-anil-100/60">
                Los logros secretos también cuentan para tu progreso.
              </p>
            </div>
          </div>
        </section>
      )}

      <AchievementFilters category={category} state={filterState} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          <Award className="size-3" aria-hidden="true" />
          {filtered.length} logro{filtered.length === 1 ? "" : "s"}
        </Badge>
        {isAA ? (
          <span className="text-[11px] text-ink-soft">
            Vista AA: títulos, descripciones y pistas sin censura.
          </span>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed bg-surface/70 p-10 text-center">
          <Sparkles className="mx-auto size-9 text-gold" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-ink">
            No hay logros con esos filtros
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
            Prueba con otra categoría o vuelve a “Todos” para ver el catálogo
            completo.
          </p>
          <Link
            href="/logros"
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "mt-5",
            })}
          >
            Ver todos
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={{
                id: achievement.id,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category,
                points: achievement.points,
                unlocked: achievement.unlocked,
                unlockedAt: achievement.unlockedAt,
                note: achievement.note,
                awardedBy: achievement.awardedBy,
                memberCount: isAA ? achievement.memberCount : undefined,
              }}
            />
          ))}
        </div>
      )}

      {isAA ? (
        <p className="text-xs leading-relaxed text-ink-soft">
          Los logros marcados como{" "}
          <strong>{ACHIEVEMENT_VISIBILITY_LABELS.SECRET}</strong> se muestran
          como “???” a los Pioneros/as hasta que se los otorgues. Los{" "}
          <strong>{ACHIEVEMENT_VISIBILITY_LABELS.HINT}</strong> revelan solo su
          pista.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-soft">
          Los logros los otorgan tus Adultos Acompañantes. Si crees que falta
          uno, conversa con ellos en el próximo encuentro.
        </p>
      )}
    </div>
  );
}
