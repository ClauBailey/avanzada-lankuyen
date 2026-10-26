"use client";

import { useActionState } from "react";
import { Play, RefreshCw } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { runRouteSheetReminderAction } from "@/features/route-sheets/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function RunReminderButton({
  lastRunLabel,
}: {
  lastRunLabel?: string;
}) {
  const [state, formAction] = useActionState(
    runRouteSheetReminderAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-anil-200 bg-anil-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-lg">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Prueba manual del cron
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Ejecuta ahora la búsqueda de actividades sin hoja de ruta, sin
            esperar al miércoles a las 11:00. Los avisos siguen siendo
            idempotentes por semana.
          </p>
          {lastRunLabel ? (
            <p className="mt-1 text-[11px] text-ink-soft">{lastRunLabel}</p>
          ) : null}
        </div>

        <form action={formAction}>
          <SubmitButton size="sm" pendingLabel="Verificando…">
            <Play aria-hidden="true" />
            Ejecutar verificación ahora
          </SubmitButton>
        </form>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </div>
  );
}
