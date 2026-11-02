"use client";

import { useActionState } from "react";
import { Compass } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { adoptTemplateObjectiveAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import type { CatalogTemplateView } from "@/components/compass/types";

export function CatalogAdoptForm({
  template,
}: {
  template: CatalogTemplateView;
}) {
  const [state, action] = useActionState(
    adoptTemplateObjectiveAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-anil-700">
        {template.code}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-ink">
        {template.intermediateObjective}
      </h4>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink-soft">Objetivo terminal: </span>
        {template.terminalObjective}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] font-semibold text-anil-800 marker:text-anil-500">
          Adoptar con mi propia redacción
        </summary>
        <form action={action} className="mt-2 space-y-2">
          <input type="hidden" name="templateId" value={template.id} />
          <textarea
            name="currentText"
            rows={3}
            maxLength={2000}
            placeholder="Puedes escribir este objetivo con tus palabras…"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-sm focus:border-anil-500 focus:outline-none focus:ring-2 focus:ring-anil-500/20"
          />
          <SubmitButton variant="secondary" size="sm">
            <Compass aria-hidden="true" />
            Adoptar personalizado
          </SubmitButton>
        </form>
      </details>

      <form action={action} className="mt-3">
        <input type="hidden" name="templateId" value={template.id} />
        <SubmitButton size="sm">
          <Compass aria-hidden="true" />
          Adoptar tal cual
        </SubmitButton>
      </form>

      {state.error ? (
        <Alert variant="error" className="mt-3 text-xs">
          {state.error}
        </Alert>
      ) : null}
      {state.success ? (
        <Alert variant="success" className="mt-3 text-xs">
          {state.success}
        </Alert>
      ) : null}
    </div>
  );
}
