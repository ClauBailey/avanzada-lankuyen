"use client";

import { useActionState } from "react";
import { Check, Flag, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  celebratePromiseAction,
  requestPromiseAction,
} from "@/features/journey/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { PROMISE_FORMULAS, type PromiseFormulaKey } from "@/lib/symbolic-path";
import { cn } from "@/lib/utils";

export interface PromiseView {
  formula: PromiseFormulaKey | null;
  status: "PREPARACION" | "SOLICITADA" | "CELEBRADA";
  desiredPlace: string | null;
  motivation: string | null;
  celebratedAt: string | null;
  celebrationPlace: string | null;
  story: string | null;
  accompaniedBy: string | null;
}

interface PromiseFormProps {
  mode: "request" | "celebrate";
  targetUserId?: string;
  initial: PromiseView | null;
}

export function PromiseForm({ mode, targetUserId, initial }: PromiseFormProps) {
  const [state, action] = useActionState(
    mode === "request" ? requestPromiseAction : celebratePromiseAction,
    EMPTY_ACTION_STATE,
  );

  const idSuffix = targetUserId ?? "self";

  return (
    <form action={action} className="space-y-4">
      {targetUserId ? (
        <input type="hidden" name="userId" value={targetUserId} />
      ) : null}

      <fieldset className="space-y-2">
        <legend className="font-display text-sm font-semibold text-ink">
          Fórmula que deseas pronunciar
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROMISE_FORMULAS.map((formula) => (
            <label
              key={formula.key}
              className="cursor-pointer rounded-xl border border-line bg-surface p-3 text-xs shadow-sm transition-colors has-checked:border-anil-700 has-checked:bg-anil-50"
            >
              <span className="flex items-start gap-2">
                <input
                  type="radio"
                  name="formula"
                  value={formula.key}
                  required
                  defaultChecked={initial?.formula === formula.key}
                  className="mt-0.5 size-4 accent-anil-800"
                />
                <span>
                  <span className="block font-semibold text-ink">
                    {formula.label}
                  </span>
                  <span className="mt-0.5 block italic text-ink-soft">
                    {formula.phrase}
                  </span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "request" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`promise-place-${idSuffix}`}>
              Lugar soñado para la ceremonia
            </Label>
            <Input
              id={`promise-place-${idSuffix}`}
              name="desiredPlace"
              maxLength={180}
              defaultValue={initial?.desiredPlace ?? ""}
              placeholder="Un lugar con sentido para ti y tu comunidad"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`promise-motivation-${idSuffix}`}>
              Tu reflexión personal
            </Label>
            <Textarea
              id={`promise-motivation-${idSuffix}`}
              name="motivation"
              maxLength={3000}
              defaultValue={initial?.motivation ?? ""}
              placeholder="¿Por qué quieres hacer tu Promesa ahora?"
              className="min-h-24 bg-surface"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`promise-date-${idSuffix}`}>Fecha</Label>
              <Input
                id={`promise-date-${idSuffix}`}
                type="date"
                name="celebratedAt"
                required
                defaultValue={initial?.celebratedAt?.slice(0, 10) ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`promise-ceremony-place-${idSuffix}`}>
                Lugar de la ceremonia
              </Label>
              <Input
                id={`promise-ceremony-place-${idSuffix}`}
                name="celebrationPlace"
                maxLength={180}
                defaultValue={initial?.celebrationPlace ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`promise-accompany-${idSuffix}`}>
              ¿Quién te acompañó?
            </Label>
            <Input
              id={`promise-accompany-${idSuffix}`}
              name="accompaniedBy"
              maxLength={180}
              defaultValue={initial?.accompaniedBy ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`promise-story-${idSuffix}`}>
              Relato o dedicatoria
            </Label>
            <Textarea
              id={`promise-story-${idSuffix}`}
              name="story"
              maxLength={3000}
              defaultValue={initial?.story ?? ""}
              placeholder="Lo que quieras recordar de este día"
              className="min-h-24 bg-surface"
            />
          </div>
        </>
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

      <SubmitButton
        pendingLabel={mode === "request" ? "Enviando solicitud…" : "Guardando Promesa…"}
      >
        {mode === "request" ? (
          <>
            <Send aria-hidden="true" />
            Solicitar ceremonia
          </>
        ) : (
          <>
            <Flag aria-hidden="true" />
            Registrar Promesa
          </>
        )}
      </SubmitButton>

      <p
        className={cn(
          "text-[11px] leading-relaxed text-ink-soft",
          mode === "celebrate" && "border-t border-line/70 pt-3",
        )}
      >
        {mode === "request"
          ? "La solicitud avisará al Equipo Adulto para acompañar la preparación junto a tu familia. No depende de tu etapa ni de tu antigüedad."
          : "La Promesa puede registrarse en cualquier momento, sin depender de las etapas Sendero o Cumbre."}
      </p>
    </form>
  );
}
