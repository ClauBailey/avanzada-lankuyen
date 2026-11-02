"use client";

import { useActionState } from "react";
import { BookOpenCheck, Pencil } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveCommunityLogEntryAction } from "@/features/communities/log-actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface CommunityLogEntryFormProps {
  entryId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialSharedWithAa?: boolean;
  initialSharedWithCoordinators?: boolean;
  compact?: boolean;
}

export function CommunityLogEntryForm({
  entryId,
  initialTitle = "",
  initialContent = "",
  initialSharedWithAa = false,
  initialSharedWithCoordinators = false,
  compact = false,
}: CommunityLogEntryFormProps) {
  const [state, action] = useActionState(
    saveCommunityLogEntryAction,
    EMPTY_ACTION_STATE,
  );

  const fields = (
    <form action={action} className="space-y-3">
      {entryId ? <input type="hidden" name="entryId" value={entryId} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor={`log-title-${entryId ?? "new"}`}>Título</Label>
        <Input
          id={`log-title-${entryId ?? "new"}`}
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={initialTitle}
          placeholder="Acuerdo, anécdota o tradición de la comunidad"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`log-content-${entryId ?? "new"}`}>Entrada</Label>
        <Textarea
          id={`log-content-${entryId ?? "new"}`}
          name="content"
          required
          minLength={3}
          maxLength={8000}
          defaultValue={initialContent}
          placeholder="Escriban libremente. La bitácora es de la comunidad y no necesita moderación previa."
          className={compact ? "min-h-28 bg-surface text-sm" : "bg-surface"}
        />
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2.5 text-[11px] leading-relaxed text-ink">
          <input
            type="checkbox"
            name="sharedWithAa"
            defaultChecked={initialSharedWithAa}
            className="mt-0.5 size-3.5 accent-anil-800"
          />
          <span>
            Compartir esta entrada con nuestro AA encargado.
            <span className="mt-0.5 block text-[10px] text-ink-soft">
              Solo su AA encargado podrá leerla. El resto del Equipo Adulto no
              accede a la bitácora.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2.5 text-[11px] leading-relaxed text-ink">
          <input
            type="checkbox"
            name="sharedWithCoordinators"
            defaultChecked={initialSharedWithCoordinators}
            className="mt-0.5 size-3.5 accent-anil-800"
          />
          <span>
            Compartir este acuerdo o diagnóstico con la Reunión de Coordinadores.
            <span className="mt-0.5 block text-[10px] text-ink-soft">
              La Reunión de Coordinadores verá únicamente las entradas marcadas
              explícitamente.
            </span>
          </span>
        </label>
      </div>

      {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success" className="text-xs">{state.success}</Alert>
      ) : null}

      <SubmitButton variant={entryId ? "secondary" : "primary"} size="sm">
        {entryId ? (
          <Pencil aria-hidden="true" />
        ) : (
          <BookOpenCheck aria-hidden="true" />
        )}
        {entryId ? "Guardar cambios" : "Guardar en la bitácora"}
      </SubmitButton>
    </form>
  );

  if (!compact) return fields;

  return (
    <details className="mt-2 rounded-xl border border-line bg-surface px-3 py-2.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-anil-800 marker:text-anil-500">
        Editar esta entrada
      </summary>
      <div className="mt-3">{fields}</div>
    </details>
  );
}
