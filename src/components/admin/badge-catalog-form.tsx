"use client";

import { useActionState } from "react";
import { PencilLine, Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { updateBadgeCatalogAction } from "@/features/progression/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface BadgeCatalogFormProps {
  badge: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
}

export function BadgeCatalogForm({ badge }: BadgeCatalogFormProps) {
  const [state, formAction] = useActionState(
    updateBadgeCatalogAction,
    EMPTY_ACTION_STATE,
  );

  const fieldId = `catalog-${badge.code.toLowerCase()}`;

  return (
    <details className="group rounded-2xl border border-line bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink">
            {badge.name}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
            {badge.description}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-anil-700 group-open:text-anil-900">
          <PencilLine className="size-3.5" aria-hidden="true" />
          Editar
        </span>
      </summary>

      <form
        action={formAction}
        className="space-y-3 border-t border-line/70 bg-canvas/30 p-4"
      >
        <input type="hidden" name="badgeId" value={badge.id} />

        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-name`}>Título</Label>
          <Input
            id={`${fieldId}-name`}
            name="name"
            defaultValue={badge.name}
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-description`}>Descripción</Label>
          <Textarea
            id={`${fieldId}-description`}
            name="description"
            defaultValue={badge.description}
            maxLength={1000}
            className="min-h-24"
            required
          />
        </div>

        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.success ? <Alert variant="success">{state.success}</Alert> : null}

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton size="sm" pendingLabel="Guardando…">
            <Save aria-hidden="true" />
            Guardar en el catálogo
          </SubmitButton>
          <p className="text-[11px] text-ink-soft">
            Los cambios se reflejan en el perfil de todos los miembros.
          </p>
        </div>
      </form>
    </details>
  );
}
