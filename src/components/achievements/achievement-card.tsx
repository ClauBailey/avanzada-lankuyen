import { CalendarCheck2, MessageSquareQuote } from "lucide-react";

import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { DeleteAchievementDialog } from "@/components/achievements/delete-achievement-dialog";
import { Badge } from "@/components/ui/badge";
import type { AchievementCategory, AchievementVisibility } from "@/generated/prisma/enums";
import type { AchievementRarity } from "@/features/achievements/rarity";
import { formatFullDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  AVANZADA: "Avanzada",
  COMUNIDAD: "Comunidad",
  ESPECIAL: "Especial",
  SECRETO: "Secreto",
};

export const ACHIEVEMENT_VISIBILITY_LABELS: Record<
  AchievementVisibility,
  string
> = {
  PUBLIC: "Público",
  HINT: "Con pista",
  SECRET: "Secreto",
};

export interface AchievementCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlockedAt?: string | null;
  note?: string | null;
  awardedBy?: string | null;
  memberCount?: number;
}

interface AchievementCardProps {
  achievement: AchievementCardData;
  /** Solo en la vista AA: permite eliminar el logro del catálogo. */
  showManageActions?: boolean;
}

export function AchievementCard({
  achievement,
  showManageActions = false,
}: AchievementCardProps) {
  const unlocked = achievement.unlocked;
  const rarity = achievement.rarity;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 transition-colors",
        unlocked
          ? cn("bg-surface shadow-card", rarity.borderClass)
          : "border-dashed border-line bg-canvas/50 opacity-80",
      )}
    >
      {unlocked ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[3px]",
            rarity.accentClass,
          )}
          aria-hidden="true"
        />
      ) : null}

      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
            unlocked
              ? cn(rarity.borderClass, rarity.badgeClass)
              : "border-line bg-canvas text-ink-soft grayscale",
          )}
        >
          <AchievementIcon name={achievement.icon} className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display text-base font-semibold leading-tight text-ink">
              {achievement.title}
            </h3>
            <Badge className={cn("normal-case", rarity.badgeClass)}>
              {rarity.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-anil-600">
            {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
            {rarity.key !== "HIDDEN" ? ` · ${rarity.subtitle}` : null}
          </p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
        {achievement.description}
      </p>

      {achievement.memberCount !== undefined ? (
        <p className="mt-3 text-[11px] font-semibold text-anil-700">
          {achievement.memberCount === 0
            ? "Nadie lo ha desbloqueado todavía"
            : `${achievement.memberCount} miembro${
                achievement.memberCount === 1 ? "" : "s"
              } lo ${achievement.memberCount === 1 ? "ha" : "han"} desbloqueado`}
        </p>
      ) : null}

      {unlocked && achievement.unlockedAt ? (
        <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-anil-800">
            <CalendarCheck2 className="size-3.5" aria-hidden="true" />
            Obtenido el {formatFullDate(achievement.unlockedAt)}
          </p>

          {achievement.note ? (
            <p className="rounded-lg border-l-2 border-gold/50 bg-gold-soft/25 px-3 py-2 text-xs italic leading-relaxed text-ink">
              <MessageSquareQuote
                className="mr-1 inline size-3 text-gold"
                aria-hidden="true"
              />
              {achievement.note}
              {achievement.awardedBy ? (
                <span className="mt-1 block not-italic text-[10px] font-semibold text-ink-soft">
                  — {achievement.awardedBy}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-ink-soft/70">
          {achievement.title === "???"
            ? "Sigue participando: los secretos aparecen cuando menos lo esperas."
            : "Aún no lo has desbloqueado."}
        </p>
      )}

      {showManageActions ? (
        <div className="mt-3 flex justify-end border-t border-line/60 pt-2">
          <DeleteAchievementDialog
            achievementId={achievement.id}
            title={achievement.title}
          />
        </div>
      ) : null}
    </article>
  );
}
