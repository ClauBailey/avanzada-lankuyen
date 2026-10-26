"use client";

import { useActionState } from "react";
import { CalendarPlus, Check } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSemesterAction } from "@/features/activities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function SemesterForm({ hasActiveSemester }: { hasActiveSemester: boolean }) {
  const [state, formAction] = useActionState(
    createSemesterAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details className="group rounded-2xl border border-line bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div>
          <p className="font-display text-sm font-semibold text-ink">
            Crear semestre
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Formato 2026-S1 (marzo–julio) o 2026-S2 (agosto–diciembre).
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-anil-700">
          <CalendarPlus className="size-3.5" aria-hidden="true" />
          Nuevo
        </span>
      </summary>

      <form
        action={formAction}
        className="space-y-4 border-t border-line/70 bg-canvas/30 p-4"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_1.1fr]">
          <div className="space-y-2">
            <Label htmlFor="semester-name">Nombre</Label>
            <Input
              id="semester-name"
              name="name"
              placeholder="2026-S2"
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-start">Inicio</Label>
            <Input
              id="semester-start"
              name="startsOn"
              type="date"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-end">Término</Label>
            <Input id="semester-end" name="endsOn" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-active">Estado</Label>
            <Select
              id="semester-active"
              name="isActive"
              defaultValue={hasActiveSemester ? "false" : "true"}
            >
              <option value="false">Inactivo</option>
              <option value="true">Activo</option>
            </Select>
          </div>
        </div>

        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.success ? <Alert variant="success">{state.success}</Alert> : null}

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton size="sm" pendingLabel="Creando…">
            <Check aria-hidden="true" />
            Crear semestre
          </SubmitButton>
          <p className="text-[11px] text-ink-soft">
            Solo puede existir un semestre activo a la vez.
          </p>
        </div>
      </form>
    </details>
  );
}
