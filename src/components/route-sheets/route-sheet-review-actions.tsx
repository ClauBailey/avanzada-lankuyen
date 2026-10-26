"use client";

import { useActionState } from "react";
import { Check, FileX2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRouteSheetAction,
  rejectRouteSheetAction,
} from "@/features/route-sheets/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function RouteSheetReviewActions({
  routeSheetId,
  activityTitle,
  version,
}: {
  routeSheetId: string;
  activityTitle: string;
  version: number;
}) {
  const [approveState, approveAction] = useActionState(
    approveRouteSheetAction,
    EMPTY_ACTION_STATE,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectRouteSheetAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <form action={approveAction}>
          <input type="hidden" name="routeSheetId" value={routeSheetId} />
          <ConfirmSubmitButton
            size="sm"
            message={`¿Autorizar la versión ${version} de la hoja de ruta de «${activityTitle}»? Quedará visible para toda la unidad.`}
          >
            <Check aria-hidden="true" />
            Autorizar hoja de ruta
          </ConfirmSubmitButton>
        </form>

        <p className="max-w-md text-[11px] leading-relaxed text-ink-soft">
          Al autorizar, la actividad dejará de mostrar «Pendiente» en el
          calendario y el PDF quedará disponible para todos los miembros.
        </p>
      </div>

      {approveState.error ? (
        <Alert variant="error">{approveState.error}</Alert>
      ) : null}
      {approveState.success ? (
        <Alert variant="success">{approveState.success}</Alert>
      ) : null}

      <details className="group rounded-xl border border-red-200 bg-red-50/40">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-xs font-semibold text-red-800">
          <FileX2 className="size-3.5" aria-hidden="true" />
          Rechazar y pedir correcciones
        </summary>

        <form
          action={rejectAction}
          className="space-y-3 border-t border-red-200/70 bg-surface/70 px-3.5 py-4"
        >
          <input type="hidden" name="routeSheetId" value={routeSheetId} />

          <div className="space-y-2">
            <Label htmlFor={`rejection-${routeSheetId}`}>
              Motivo para los encargados
            </Label>
            <Textarea
              id={`rejection-${routeSheetId}`}
              name="rejectionReason"
              minLength={10}
              maxLength={1200}
              required
              rows={3}
              placeholder="Ej.: falta el detalle de los materiales y la hora de encuentro no coincide con el calendario."
            />
          </div>

          {rejectState.error ? (
            <Alert variant="error">{rejectState.error}</Alert>
          ) : null}
          {rejectState.success ? (
            <Alert variant="success">{rejectState.success}</Alert>
          ) : null}

          <SubmitButton size="sm" variant="danger" pendingLabel="Rechazando…">
            <FileX2 aria-hidden="true" />
            Rechazar con este motivo
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
