"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAchievementAction } from "@/features/achievements/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface DeleteAchievementDialogProps {
  achievementId: string;
  title: string;
}

export function DeleteAchievementDialog({
  achievementId,
  title,
}: DeleteAchievementDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    deleteAchievementAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Eliminar logro
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-anil-950/60 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-achievement-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line/70 bg-red-50/60 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="delete-achievement-title"
                    className="font-display text-lg font-semibold text-ink"
                  >
                    Eliminar logro
                  </h2>
                  <p className="text-[11px] text-ink-soft">
                    Esta acción es irreversible.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-red-100 hover:text-red-700"
                aria-label="Cerrar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {state.success ? (
              <div className="space-y-4 p-5">
                <p className="text-sm leading-relaxed text-ink-soft">
                  {state.success}
                </p>
                <Button type="button" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <form action={formAction} className="space-y-4 p-5">
                <input
                  type="hidden"
                  name="achievementId"
                  value={achievementId}
                />

                <p className="text-sm leading-relaxed text-ink-soft">
                  ¿Eliminar permanentemente el logro{" "}
                  <strong className="text-ink">«{title}»</strong>? Si algún joven
                  ya lo había desbloqueado, se quitará de su perfil. Esta acción
                  no se puede deshacer.
                </p>

                {state.error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                    {state.error}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <SubmitButton
                    variant="danger"
                    pendingLabel="Eliminando..."
                  >
                    <Trash2 aria-hidden="true" />
                    Eliminar logro
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
