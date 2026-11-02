"use client";

import { useActionState } from "react";
import { PenLine } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateCompassObjectiveTextAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function ObjectiveTextForm({
  objectiveId,
  currentText,
}: {
  objectiveId: string;
  currentText: string;
}) {
  const [state, action] = useActionState(
    updateCompassObjectiveTextAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-anil-800 marker:text-anil-500">
        Reformular mi objetivo
      </summary>
      <form action={action} className="mt-3 space-y-2">
        <input type="hidden" name="objectiveId" value={objectiveId} />
        <div className="space-y-1.5">
          <Label htmlFor={`text-${objectiveId}`}>
            Nueva redacción, con mis palabras
          </Label>
          <Textarea
            id={`text-${objectiveId}`}
            name="currentText"
            required
            minLength={3}
            maxLength={2000}
            defaultValue={currentText}
            className="min-h-24 bg-surface text-sm"
          />
        </div>
        <p className="text-[10px] leading-relaxed text-ink-soft">
          Al guardar, tu redacción anterior queda intacta en el historial de
          versiones. Nada se borra.
        </p>
        {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
        {state.success ? (
          <Alert variant="success" className="text-xs">{state.success}</Alert>
        ) : null}
        <SubmitButton variant="secondary" size="sm">
          <PenLine aria-hidden="true" />
          Guardar nueva versión
        </SubmitButton>
      </form>
    </details>
  );
}
