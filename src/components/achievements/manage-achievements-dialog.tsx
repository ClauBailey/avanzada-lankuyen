"use client";

import { useActionState, useState } from "react";
import { Check, Trophy, Undo2, X } from "lucide-react";

import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  grantAchievementAction,
  revokeAchievementAction,
} from "@/features/achievements/actions";
import type { AchievementManagerData } from "@/features/achievements/queries";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { cn } from "@/lib/utils";

interface ManageAchievementsDialogProps {
  targetUserId: string;
  targetName: string;
  data: AchievementManagerData;
}

function GrantAchievementForm({
  targetUserId,
  achievementId,
  title,
}: {
  targetUserId: string;
  achievementId: string;
  title: string;
}) {
  const [state, formAction] = useActionState(
    grantAchievementAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="achievementId" value={achievementId} />
      <Input
        name="note"
        maxLength={280}
        placeholder={`Nota para «${title}» (opcional)`}
        className="h-9 flex-1 text-xs"
        aria-label={`Nota para ${title}`}
      />
      <SubmitButton size="sm" pendingLabel="Otorgando...">
        <Check aria-hidden="true" />
        Otorgar
      </SubmitButton>
      {state.error ? (
        <p className="text-[11px] text-red-700 sm:sr-only">{state.error}</p>
      ) : null}
    </form>
  );
}

function RevokeAchievementForm({
  targetUserId,
  achievementId,
  title,
}: {
  targetUserId: string;
  achievementId: string;
  title: string;
}) {
  const [state, formAction] = useActionState(
    revokeAchievementAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="achievementId" value={achievementId} />
      <SubmitButton
        variant="ghost"
        size="sm"
        pendingLabel="Retirando..."
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
        onClick={(event) => {
          if (!window.confirm(`¿Retirar el logro «${title}»?`)) {
            event.preventDefault();
          }
        }}
      >
        <Undo2 aria-hidden="true" />
        Revocar
      </SubmitButton>
      {state.error ? (
        <p className="text-[11px] text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}

export function ManageAchievementsDialog({
  targetUserId,
  targetName,
  data,
}: ManageAchievementsDialogProps) {
  const [open, setOpen] = useState(false);
  const locked = data.achievements.filter((achievement) => !achievement.unlocked);
  const unlocked = data.achievements.filter((achievement) => achievement.unlocked);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Trophy aria-hidden="true" />
        Gestionar logros
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 cursor-default bg-anil-950/60 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-achievements-title"
            className="relative my-6 w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line/70 bg-anil-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold ring-1 ring-white/15">
                  <Trophy className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="manage-achievements-title"
                    className="font-display text-lg font-semibold leading-tight"
                  >
                    Logros de {targetName}
                  </h2>
                  <p className="text-[11px] text-anil-100/70">
                    {unlocked.length} desbloqueado
                    {unlocked.length === 1 ? "" : "s"} de {data.achievements.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-anil-100/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              <section className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Ya desbloqueados
                </h3>
                {unlocked.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-3 text-xs text-ink-soft">
                    Todavía no tiene logros.
                  </p>
                ) : (
                  <ul className="divide-y divide-line/60 rounded-xl border border-line">
                    {unlocked.map((achievement) => {
                      return (
                        <li
                          key={achievement.id}
                          className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <AchievementIcon
                              name={achievement.icon}
                              className="size-4 text-gold"
                            />
                            <span className="text-sm font-semibold text-ink">
                              {achievement.title}
                            </span>
                            {achievement.note ? (
                              <span className="text-[11px] text-ink-soft">
                                · {achievement.note}
                              </span>
                            ) : null}
                          </div>
                          <RevokeAchievementForm
                            targetUserId={targetUserId}
                            achievementId={achievement.id}
                            title={achievement.title}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Disponibles para otorgar
                </h3>
                {locked.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-3 text-xs text-ink-soft">
                    Ya tiene todos los logros del catálogo.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {locked.map((achievement) => {
                      return (
                        <li
                          key={achievement.id}
                          className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5"
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface",
                                achievement.visibility === "SECRET"
                                  ? "text-ink-soft"
                                  : "text-anil-700",
                              )}
                            >
                              <AchievementIcon
                                name={
                                  achievement.visibility === "SECRET"
                                    ? "Lock"
                                    : achievement.icon
                                }
                                className="size-4"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">
                                {achievement.title}
                              </p>
                              <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                                {achievement.description}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                achievement.rarity.badgeClass,
                              )}
                            >
                              {achievement.rarity.label}
                            </span>
                          </div>
                          <GrantAchievementForm
                            targetUserId={targetUserId}
                            achievementId={achievement.id}
                            title={achievement.title}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            <div className="flex justify-end border-t border-line/70 px-5 py-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
