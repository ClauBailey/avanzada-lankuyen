"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Download, FileText, ShieldCheck, UserRoundX } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requestAccountDeletionOrClanStepAction } from "@/features/profile/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function DataSovereigntyCard({
  requestedAt,
  displayName,
  canRequestClan = true,
}: {
  requestedAt: string | null;
  displayName: string;
  canRequestClan?: boolean;
}) {
  const [state, formAction] = useActionState(
    requestAccountDeletionOrClanStepAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="/api/perfil/exportar"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
          download
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar todo en JSON
        </a>
        <Link
          href="/perfil/imprimir"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <FileText className="size-4" aria-hidden="true" />
          Ver e imprimir como PDF
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-ink-soft">
        La exportación incluye tu identidad, tu Brújula completa con{" "}
        <span className="font-semibold text-ink">
          todas las versiones de cada objetivo
        </span>
        , tus reflexiones, tus hitos del camino y tu Promesa, tus competencias,
        tus logros y tus páginas de bitácora.
      </p>

      {!canRequestClan ? (
        <p className="rounded-xl border border-line bg-canvas/30 px-3.5 py-3 text-xs leading-relaxed text-ink-soft">
          El Paso al Clan acompaña a las personas jóvenes de la Rama. Como
          integrante del Equipo Adulto, puedes exportar e imprimir tu propia
          información y gestionar tu cuenta con el resto del equipo.
        </p>
      ) : requestedAt ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <Badge variant="warning">Solicitud registrada</Badge>
          <p className="text-sm text-amber-900">
            {displayName}, registramos tu solicitud el {requestedAt}. Un adulto
            de la Avanzada te acompañará en el Paso al Clan. Tus datos siguen
            disponibles para exportar mientras el proceso se resuelve.
          </p>
        </div>
      ) : (
        <details className="rounded-xl border border-line/70 bg-canvas/30">
          <summary className="cursor-pointer list-none px-3.5 py-2.5 text-xs font-semibold text-anil-700 marker:text-anil-500">
            <span className="inline-flex items-center gap-1.5">
              <UserRoundX className="size-3.5" aria-hidden="true" />
              Solicitar el Paso al Clan o la baja de mi cuenta
            </span>
          </summary>
          <form
            action={formAction}
            className="space-y-3 border-t border-line/70 px-3.5 py-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="account-deletion-reason">
                ¿Quieres contarnos por qué? (opcional)
              </Label>
              <Textarea
                id="account-deletion-reason"
                name="reason"
                maxLength={2000}
                className="min-h-20"
                placeholder="Este mensaje llega al Equipo Adulto y queda en auditoría."
              />
            </div>

            <label className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                name="confirm"
                className="mt-0.5 size-4 rounded border-line"
                required
              />
              <span>
                Confirmo que quiero solicitar el Paso al Clan. Entiendo que la
                solicitud no borra mis datos de inmediato: el Equipo Adulto me
                acompañará y podré exportar mi historial antes de cualquier
                borrado.
              </span>
            </label>

            <p className="inline-flex items-start gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
              <ShieldCheck
                className="mt-0.5 size-3.5 shrink-0 text-anil-700"
                aria-hidden="true"
              />
              Tu solicitud notifica a los adultos de la Avanzada y queda
              registrada en la auditoría. No se elimina nada automáticamente.
            </p>

            {state.error ? <Alert variant="error">{state.error}</Alert> : null}
            {state.success ? (
              <Alert variant="success">{state.success}</Alert>
            ) : null}

            <SubmitButton
              size="sm"
              variant="secondary"
              pendingLabel="Registrando solicitud…"
            >
              <UserRoundX aria-hidden="true" />
              Registrar solicitud de Paso al Clan
            </SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
