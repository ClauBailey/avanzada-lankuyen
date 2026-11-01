"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check, Compass, Lock, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { submitActivityEvaluationAction } from "@/features/evaluations/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  DEVELOPMENT_AREAS,
  OBJECTIVE_ACHIEVEMENT_LEVELS,
  type DevelopmentAreaKey,
  type ObjectiveAchievementLevel,
} from "@/lib/evaluations";

export interface OwnEvaluation {
  objectiveAchievementLevel: ObjectiveAchievementLevel;
  experiencedAreas: DevelopmentAreaKey[];
  organizationFeedback: string | null;
  emotionalResonance: string | null;
  learningsForNextTime: string | null;
}

interface EvaluationFormProps {
  activityId: string;
  initialEvaluation: OwnEvaluation | null;
  showCompassPrompt?: boolean;
}

export function EvaluationForm({
  activityId,
  initialEvaluation,
  showCompassPrompt = false,
}: EvaluationFormProps) {
  const [state, action] = useActionState(
    submitActivityEvaluationAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="activityId" value={activityId} />

      <div className="rounded-xl border border-anil-100 bg-anil-50/60 px-3.5 py-3 text-xs leading-relaxed text-anil-900">
        Esta no es una nota. Observa la actividad desde lo que viviste: qué
        logramos respecto de los objetivos, qué áreas de desarrollo aparecieron
        y qué palabras quieres dejar al grupo.
      </div>

      <fieldset className="space-y-2">
        <legend className="font-display text-sm font-semibold text-ink">
          ¿Cómo se lograron los objetivos de la actividad?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {OBJECTIVE_ACHIEVEMENT_LEVELS.map((level) => (
            <label
              key={level.key}
              className="cursor-pointer rounded-2xl border border-line bg-surface p-3.5 shadow-sm transition-colors has-checked:border-anil-700 has-checked:bg-anil-50 has-checked:ring-1 has-checked:ring-anil-700/30"
            >
              <span className="flex items-start gap-2">
                <input
                  type="radio"
                  name="objectiveAchievementLevel"
                  value={level.key}
                  required
                  defaultChecked={
                    initialEvaluation?.objectiveAchievementLevel === level.key
                  }
                  className="mt-0.5 size-4 accent-anil-800"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {level.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
                    {level.description}
                  </span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-display text-sm font-semibold text-ink">
          ¿Qué áreas de desarrollo sentiste presentes?
        </legend>
        <p className="text-[11px] text-ink-soft">
          Marca todas las que reconozcas; no hay una cantidad correcta.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {DEVELOPMENT_AREAS.map((area) => (
            <label
              key={area.key}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs text-ink shadow-sm transition-colors has-checked:border-anil-300 has-checked:bg-anil-50/60"
            >
              <input
                type="checkbox"
                name="experiencedAreas"
                value={area.key}
                defaultChecked={initialEvaluation?.experiencedAreas.includes(
                  area.key,
                )}
                className="mt-0.5 size-3.5 accent-anil-800"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {area.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
                  {area.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`organization-${activityId}`}>
            Organización y logística
          </Label>
          <Textarea
            id={`organization-${activityId}`}
            name="organizationFeedback"
            defaultValue={initialEvaluation?.organizationFeedback ?? ""}
            placeholder="Preparación, materiales, tiempos, coordinación con las familias…"
            maxLength={2000}
            className="min-h-28 bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`resonance-${activityId}`}>
            Clima y resonancia emocional
          </Label>
          <Textarea
            id={`resonance-${activityId}`}
            name="emotionalResonance"
            defaultValue={initialEvaluation?.emotionalResonance ?? ""}
            placeholder="El ritmo, el clima humano, lo que se sintió en el grupo…"
            maxLength={2000}
            className="min-h-28 bg-surface"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`learnings-${activityId}`}>
            Aprendizajes para la próxima vez
          </Label>
          <Textarea
            id={`learnings-${activityId}`}
            name="learningsForNextTime"
            defaultValue={initialEvaluation?.learningsForNextTime ?? ""}
            placeholder="Qué conviene cuidar, cambiar o volver a intentar…"
            maxLength={2000}
            className="min-h-28 bg-surface"
          />
        </div>
      </div>

      {showCompassPrompt ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold-soft/25 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Compass
              className="mt-0.5 size-4 shrink-0 text-gold"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-ink">
                ¿Viviste algo en esta actividad que quieras guardar en tu
                Brújula?
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                Tu Brújula personal reúne las experiencias que te van formando.
                Estará disponible en la próxima etapa del camino.
              </p>
            </div>
          </div>
          <Link
            href="/camino"
            className="shrink-0 text-xs font-semibold text-anil-800 underline-offset-2 hover:underline"
          >
            Ver mi camino simbólico
          </Link>
        </div>
      ) : null}

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
          Tu observación queda asociada a tu cuenta y solo la lee el Equipo
          Adulto.
        </p>
        <SubmitButton pendingLabel="Guardando observación…">
          <Send aria-hidden="true" />
          {initialEvaluation ? "Actualizar observación" : "Enviar observación"}
        </SubmitButton>
      </div>
    </form>
  );
}
