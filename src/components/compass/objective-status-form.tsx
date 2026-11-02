"use client";

import { useActionState } from "react";
import { Check, Compass } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateCompassObjectiveStatusAction, toggleCompassObjectiveSharingAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { COMPASS_STATUSES } from "@/features/compass/rules";
import { cn } from "@/lib/utils";

export function ObjectiveStatusForm({
  objectiveId,
  status,
}: {
  objectiveId: string;
  status: "EXPLORANDO" | "LOGRADO_EN_VIDA_COTIDIANA";
}) {
  const [state, action] = useActionState(
    updateCompassObjectiveStatusAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="objectiveId" value={objectiveId} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Mi autoevaluación
      </p>
      <div className="flex flex-wrap gap-2">
        {COMPASS_STATUSES.map((item) => (
          <button
            key={item.key}
            type="submit"
            name="status"
            value={item.key}
            title={item.description}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              status === item.key
                ? item.key === "LOGRADO_EN_VIDA_COTIDIANA"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-anil-700 bg-anil-50 text-anil-900 ring-1 ring-anil-700/20"
                : "border-line bg-surface text-ink-soft hover:border-anil-300 hover:text-anil-800",
            )}
          >
            {status === item.key ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Compass className="size-3.5" aria-hidden="true" />
            )}
            {item.shortLabel}
          </button>
        ))}
      </div>
      {state.error ? (
        <Alert variant="error" className="text-xs">
          {state.error}
        </Alert>
      ) : null}
      {state.success ? (
        <Alert variant="success" className="text-xs">
          {state.success}
        </Alert>
      ) : null}
    </form>
  );
}

export function ObjectiveSharingForm({
  objectiveId,
  sharedWithCommunity,
}: {
  objectiveId: string;
  sharedWithCommunity: boolean;
}) {
  const [state, action] = useActionState(
    toggleCompassObjectiveSharingAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="objectiveId" value={objectiveId} />
      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2.5 text-[11px] leading-relaxed text-ink">
        <input
          type="checkbox"
          name="sharedWithCommunity"
          defaultChecked={sharedWithCommunity}
          className="mt-0.5 size-3.5 accent-anil-800"
        />
        <span>
          Compartir este objetivo con mi comunidad.
          <span className="mt-0.5 block text-[10px] text-ink-soft">
            Solo los compañeros activos de mi comunidad podrán verlo. Mi AA
            encargado siempre puede leerlo.
          </span>
        </span>
      </label>
      <SubmitButton variant="secondary" size="sm">
        Guardar visibilidad
      </SubmitButton>
      {state.error ? (
        <Alert variant="error" className="text-xs">
          {state.error}
        </Alert>
      ) : null}
      {state.success ? (
        <Alert variant="success" className="text-xs">
          {state.success}
        </Alert>
      ) : null}
    </form>
  );
}
