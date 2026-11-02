"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createCustomCompassObjectiveAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { COMPASS_AREAS } from "@/features/compass/catalog";

export function CustomObjectiveForm({ area }: { area: string }) {
  const [state, action] = useActionState(
    createCustomCompassObjectiveAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details className="rounded-2xl border border-dashed border-anil-200 bg-anil-50/40 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-anil-900 marker:text-anil-500">
        Crear un objetivo propio
      </summary>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
        Puedes nombrar un objetivo que no aparezca en el catálogo. Quedará
        vinculado a un Área de Desarrollo y será tuyo desde el primer momento.
      </p>

      <form action={action} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="custom-area">Área de Desarrollo</Label>
            <Select id="custom-area" name="area" defaultValue={area}>
              {COMPASS_AREAS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custom-terminal">Línea u objetivo terminal</Label>
            <input
              id="custom-terminal"
              name="terminalObjectiveRef"
              maxLength={600}
              placeholder="¿Hacia dónde apunta este objetivo?"
              className="flex h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink shadow-sm focus:border-anil-500 focus:outline-none focus:ring-2 focus:ring-anil-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="custom-text">Mi objetivo, con mis palabras</Label>
          <Textarea
            id="custom-text"
            name="currentText"
            required
            minLength={3}
            maxLength={2000}
            placeholder="Yo quiero…"
            className="bg-surface"
          />
        </div>

        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.success ? (
          <Alert variant="success">{state.success}</Alert>
        ) : null}

        <SubmitButton size="sm">
          <Plus aria-hidden="true" />
          Crear objetivo
        </SubmitButton>
      </form>
    </details>
  );
}
