"use client";

import { useActionState, useState } from "react";
import {
  CalendarCheck2,
  CalendarX2,
  Check,
  FileText,
  Lock,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { submitRsvpAction } from "@/features/attendance/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import type { RsvpStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface RsvpPanelProps {
  activityId: string;
  canRespond: boolean;
  isRatified: boolean;
  initialStatus: RsvpStatus | null;
  initialText: string | null;
  initialFile: { id: string; originalName: string } | null;
}

export function RsvpPanel({
  activityId,
  canRespond,
  isRatified,
  initialStatus,
  initialText,
  initialFile,
}: RsvpPanelProps) {
  const [confirmState, confirmAction] = useActionState(
    submitRsvpAction,
    EMPTY_ACTION_STATE,
  );
  const [absenceState, absenceAction] = useActionState(
    submitRsvpAction,
    EMPTY_ACTION_STATE,
  );
  const [showAbsenceForm, setShowAbsenceForm] = useState(
    initialStatus === "NO_ASISTE",
  );

  const state = confirmState.error || confirmState.success ? confirmState : absenceState;

  return (
    <div id="asistencia" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Fase 1 · Confirmación previa
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            Tu asistencia
          </h2>
        </div>
        {initialStatus ? (
          <Badge variant={initialStatus === "CONFIRMADO" ? "success" : "warning"}>
            {initialStatus === "CONFIRMADO"
              ? "Confirmaste asistencia"
              : "Avisaste que no podrás ir"}
          </Badge>
        ) : (
          <Badge variant="outline">Sin respuesta</Badge>
        )}
      </div>

      {initialText ? (
        <div className="rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-sm text-ink">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Motivo registrado
          </p>
          <p className="mt-1 whitespace-pre-line">{initialText}</p>
        </div>
      ) : null}

      {initialFile ? (
        <a
          href={`/api/files/${initialFile.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-anil-700 hover:text-anil-900"
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          {initialFile.originalName}
        </a>
      ) : null}

      {canRespond ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <form action={confirmAction}>
              <input type="hidden" name="activityId" value={activityId} />
              <input type="hidden" name="status" value="CONFIRMADO" />
              <SubmitButton
                className="w-full justify-center"
                variant={
                  initialStatus === "CONFIRMADO" ? "secondary" : "primary"
                }
                pendingLabel="Confirmando…"
              >
                <CalendarCheck2 aria-hidden="true" />
                Confirmar asistencia
              </SubmitButton>
            </form>

            <button
              type="button"
              onClick={() => setShowAbsenceForm((open) => !open)}
              aria-expanded={showAbsenceForm}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50",
                initialStatus === "NO_ASISTE" && "border-amber-300 bg-amber-50",
              )}
            >
              <CalendarX2 className="size-4" aria-hidden="true" />
              No podré ir
            </button>
          </div>

          {showAbsenceForm ? (
            <form
              action={absenceAction}
              className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"
            >
              <input type="hidden" name="activityId" value={activityId} />
              <input type="hidden" name="status" value="NO_ASISTE" />

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Justifica tu inasistencia
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Escribe el motivo y/o adjunta un documento. Tus AA podrán
                    revisarlo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAbsenceForm(false)}
                  className="rounded-lg p-1 text-ink-soft hover:bg-white/70 hover:text-ink"
                  aria-label="Cerrar formulario de inasistencia"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`absence-${activityId}`}>Motivo</Label>
                <Textarea
                  id={`absence-${activityId}`}
                  name="justificationText"
                  defaultValue={initialText ?? ""}
                  placeholder="Cuéntanos brevemente por qué no podrás asistir…"
                  maxLength={1200}
                  className="min-h-24 bg-surface"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`absence-file-${activityId}`}>
                  Adjunto (opcional)
                </Label>
                <input
                  id={`absence-file-${activityId}`}
                  name="justificationFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  className="block w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-anil-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-anil-800"
                />
                <p className="text-[11px] text-ink-soft">
                  PDF, JPG, PNG o WEBP · máximo 10 MB.
                  {initialFile
                    ? " Si no adjuntas uno nuevo, se conserva el archivo actual."
                    : ""}
                </p>
              </div>

              <SubmitButton
                size="sm"
                variant="secondary"
                pendingLabel="Enviando aviso…"
              >
                <Send aria-hidden="true" />
                Enviar aviso de inasistencia
              </SubmitButton>
            </form>
          ) : null}

          <p className="text-[11px] leading-relaxed text-ink-soft">
            Puedes cambiar tu respuesta mientras la actividad no haya comenzado y
            la asistencia no esté ratificada.
          </p>
        </>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-sm text-ink-soft">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {isRatified
              ? "La asistencia ya fue ratificada por un AA. Tu respuesta quedó en modo lectura."
              : "La actividad ya comenzó. Tu respuesta quedó en modo lectura."}
          </p>
        </div>
      )}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4" aria-hidden="true" />
            {state.success}
          </span>
        </Alert>
      ) : null}

      {!initialStatus && !canRespond ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <FileText className="size-3.5" aria-hidden="true" />
          No registraste una respuesta antes del cierre.
        </p>
      ) : null}
    </div>
  );
}
