"use client";

import { useActionState } from "react";
import { Check, Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { registerMilestoneAction } from "@/features/journey/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import type { SymbolicMomentKey } from "@/lib/symbolic-path";

export interface MilestoneView {
  occurredAt: string | null;
  place: string | null;
  story: string | null;
  accompaniedBy: string | null;
}

interface MilestoneFormProps {
  moment: Exclude<SymbolicMomentKey, "PROMESA">;
  targetUserId?: string;
  initial: MilestoneView | null;
  defaultOpen?: boolean;
}

export function MilestoneForm({
  moment,
  targetUserId,
  initial,
  defaultOpen = false,
}: MilestoneFormProps) {
  const [state, action] = useActionState(
    registerMilestoneAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details
      open={defaultOpen || Boolean(initial)}
      className="rounded-xl border border-line bg-canvas/40 px-4 py-3"
    >
      <summary className="cursor-pointer text-xs font-semibold text-anil-800 marker:text-anil-500">
        {initial ? "Actualizar este hito" : "Registrar este hito"}
      </summary>

      <form action={action} className="mt-3 space-y-3">
        {targetUserId ? (
          <input type="hidden" name="userId" value={targetUserId} />
        ) : null}
        <input type="hidden" name="moment" value={moment} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${moment}-date-${targetUserId ?? "self"}`}>
              Fecha
            </Label>
            <Input
              id={`${moment}-date-${targetUserId ?? "self"}`}
              type="date"
              name="occurredAt"
              required
              defaultValue={initial?.occurredAt?.slice(0, 10) ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${moment}-place-${targetUserId ?? "self"}`}>
              Lugar
            </Label>
            <Input
              id={`${moment}-place-${targetUserId ?? "self"}`}
              name="place"
              maxLength={180}
              defaultValue={initial?.place ?? ""}
              placeholder="Cerro, sede, campamento…"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${moment}-accompany-${targetUserId ?? "self"}`}>
            ¿Quién te acompañó?
          </Label>
          <Input
            id={`${moment}-accompany-${targetUserId ?? "self"}`}
            name="accompaniedBy"
            maxLength={180}
            defaultValue={initial?.accompaniedBy ?? ""}
            placeholder="Nombre o descripción del acompañamiento"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${moment}-story-${targetUserId ?? "self"}`}>
            Relato o dedicatoria
          </Label>
          <Textarea
            id={`${moment}-story-${targetUserId ?? "self"}`}
            name="story"
            maxLength={3000}
            defaultValue={initial?.story ?? ""}
            placeholder="¿Qué significó este momento para ti?"
            className="min-h-24 bg-surface"
          />
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

        <SubmitButton pendingLabel="Guardando hito…">
          <Save aria-hidden="true" />
          Guardar hito
        </SubmitButton>
      </form>
    </details>
  );
}
