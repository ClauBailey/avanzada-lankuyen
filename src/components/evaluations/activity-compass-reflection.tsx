"use client";

import { useActionState } from "react";
import { Compass, Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createCompassReflectionAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { formatTimestamp } from "@/lib/dates";

interface CompassObjectiveOption {
  id: string;
  currentText: string;
}

interface ActivityReflection {
  id: string;
  content: string;
  createdAt: string;
  objectiveText: string | null;
}

export function ActivityCompassReflection({
  activityId,
  objectives,
  reflections,
}: {
  activityId: string;
  objectives: CompassObjectiveOption[];
  reflections: ActivityReflection[];
}) {
  const [state, action] = useActionState(
    createCompassReflectionAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-3 border-t border-line/70 pt-5">
      <div className="flex items-start gap-2.5">
        <Compass className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink">
            ¿Viviste algo en esta actividad que quieras guardar en tu Brújula?
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
            Elige uno de tus objetivos o guárdalo como reflexión general. Queda
            vinculado a esta actividad y solo tú decides con quién compartirlo.
          </p>
        </div>
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="activityId" value={activityId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`compass-objective-${activityId}`}>
              Objetivo de mi Brújula (opcional)
            </Label>
            <Select
              id={`compass-objective-${activityId}`}
              name="objectiveId"
              defaultValue=""
            >
              <option value="">Reflexión general de mi Brújula</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.currentText.slice(0, 90)}
                  {objective.currentText.length > 90 ? "…" : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink">
              <input
                type="checkbox"
                name="sharedWithAa"
                defaultChecked
                className="size-3.5 accent-anil-800"
              />
              Compartir con mi AA
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`compass-reflection-${activityId}`}>
            Mi reflexión
          </Label>
          <Textarea
            id={`compass-reflection-${activityId}`}
            name="content"
            required
            minLength={3}
            maxLength={4000}
            placeholder="¿Qué te dejó esta actividad? ¿Qué descubriste de ti?"
            className="min-h-24 bg-surface text-sm"
          />
        </div>

        {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
        {state.success ? (
          <Alert variant="success" className="text-xs">{state.success}</Alert>
        ) : null}

        <SubmitButton variant="secondary" size="sm">
          <Save aria-hidden="true" />
          Guardar en mi Brújula
        </SubmitButton>
      </form>

      {reflections.length > 0 ? (
        <ul className="space-y-2">
          {reflections.map((reflection) => (
            <li
              key={reflection.id}
              className="rounded-xl border border-line bg-canvas/40 px-3 py-2"
            >
              <p className="text-[10px] text-ink-soft">
                {formatTimestamp(reflection.createdAt)}
                {reflection.objectiveText
                  ? ` · Objetivo: ${reflection.objectiveText}`
                  : " · Reflexión general"}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-ink">
                {reflection.content}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
