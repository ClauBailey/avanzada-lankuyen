"use client";

import { useActionState } from "react";
import { NotebookPen } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createCompassReflectionAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function ReflectionForm({
  objectiveId,
  activityId,
  allowCycle = true,
  compact = false,
}: {
  objectiveId?: string;
  activityId?: string;
  allowCycle?: boolean;
  compact?: boolean;
}) {
  const [state, action] = useActionState(
    createCompassReflectionAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={action} className={compact ? "space-y-2" : "space-y-3"}>
      {objectiveId ? (
        <input type="hidden" name="objectiveId" value={objectiveId} />
      ) : null}
      {activityId ? (
        <input type="hidden" name="activityId" value={activityId} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={`reflection-${objectiveId ?? activityId ?? "general"}`}>
          {allowCycle ? "Mi reflexión o autoevaluación de ciclo" : "Mi reflexión"}
        </Label>
        <Textarea
          id={`reflection-${objectiveId ?? activityId ?? "general"}`}
          name="content"
          required
          minLength={3}
          maxLength={4000}
          placeholder="¿Qué viviste? ¿Qué descubriste de ti? ¿Qué quieres cuidar de ahora en adelante?"
          className={compact ? "min-h-24 bg-surface text-sm" : "bg-surface"}
        />
      </div>

      {allowCycle ? (
        <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-ink">
            <input
              type="checkbox"
              name="isCycleSelfEvaluation"
              className="size-3.5 accent-anil-800"
            />
            Es una autoevaluación de ciclo
          </label>
          <input
            name="cycleLabel"
            maxLength={120}
            placeholder="Nombre del ciclo (opcional)"
            className="flex h-9 w-full rounded-xl border border-line bg-surface px-3 text-xs text-ink shadow-sm focus:border-anil-500 focus:outline-none focus:ring-2 focus:ring-anil-500/20"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink">
          <input
            type="checkbox"
            name="sharedWithAa"
            defaultChecked
            className="size-3.5 accent-anil-800"
          />
          Compartir con mi AA encargado
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink">
          <input
            type="checkbox"
            name="sharedWithCommunity"
            className="size-3.5 accent-anil-800"
          />
          Compartir con mi comunidad
        </label>
      </div>

      {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success" className="text-xs">{state.success}</Alert> : null}

      <SubmitButton variant="secondary" size="sm">
        <NotebookPen aria-hidden="true" />
        Guardar reflexión
      </SubmitButton>
    </form>
  );
}
