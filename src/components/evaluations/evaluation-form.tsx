"use client";

import { useActionState } from "react";
import { Check, Lock, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { submitActivityEvaluationAction } from "@/features/evaluations/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  EVALUATION_AREAS,
  EVALUATION_SCALE,
  type EvaluationScores,
} from "@/lib/evaluations";
import { cn } from "@/lib/utils";

interface EvaluationFormProps {
  activityId: string;
  initialScores: EvaluationScores | null;
  initialComment: string | null;
}

export function EvaluationForm({
  activityId,
  initialScores,
  initialComment,
}: EvaluationFormProps) {
  const [state, action] = useActionState(
    submitActivityEvaluationAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="activityId" value={activityId} />

      <div className="rounded-xl border border-anil-100 bg-anil-50/60 px-3.5 py-3 text-xs leading-relaxed text-anil-900">
        Evalúa cada área de <strong>1 a 7</strong>, donde 1 es muy bajo y 7 es
        muy alto. Puedes volver a guardar tu evaluación si necesitas corregirla.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EVALUATION_AREAS.map((area) => (
          <fieldset
            key={area.key}
            className="rounded-2xl border border-line bg-canvas/35 p-4"
          >
            <legend className="px-1 font-display text-sm font-semibold text-ink">
              {area.label}
            </legend>
            <p className="mt-1 min-h-10 text-[11px] leading-relaxed text-ink-soft">
              {area.description}
            </p>

            <div className="mt-3 flex items-center justify-between gap-1">
              {EVALUATION_SCALE.map((value) => (
                <label
                  key={value}
                  className="cursor-pointer"
                  title={`${area.label}: ${value} de 7`}
                >
                  <input
                    type="radio"
                    name={area.key}
                    value={value}
                    required
                    defaultChecked={initialScores?.[area.key] === value}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-xs font-semibold text-ink-soft shadow-sm transition-colors",
                      "hover:border-anil-300 hover:text-anil-800",
                      "peer-checked:border-anil-800 peer-checked:bg-anil-800 peer-checked:text-white",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-anil-500/40 peer-focus-visible:ring-offset-1",
                    )}
                  >
                    {value}
                  </span>
                  <span className="sr-only">
                    {area.label}: {value} de 7
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`evaluation-comment-${activityId}`}>
          Evaluación escrita{" "}
          <span className="font-normal normal-case tracking-normal text-ink-soft">
            (opcional)
          </span>
        </Label>
        <Textarea
          id={`evaluation-comment-${activityId}`}
          name="comment"
          defaultValue={initialComment ?? ""}
          placeholder="¿Cómo encontraron la actividad? Puedes comentar lo que observaron, lo que funcionó y lo que conviene cuidar la próxima vez…"
          maxLength={2000}
          className="min-h-28 bg-surface"
        />
        <p className="text-[11px] text-ink-soft">
          Hasta 2000 caracteres. Esta respuesta será visible para los AA.
        </p>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4" aria-hidden="true" />
            {state.success}
          </span>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
          <Lock className="size-3.5" aria-hidden="true" />
          Tu evaluación queda asociada a tu cuenta y solo la ven los AA.
        </p>
        <SubmitButton pendingLabel="Guardando evaluación…">
          <Send aria-hidden="true" />
          {initialScores ? "Actualizar evaluación" : "Enviar evaluación"}
        </SubmitButton>
      </div>
    </form>
  );
}
