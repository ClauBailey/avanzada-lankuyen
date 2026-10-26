"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Palette, Plus, Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createCommunityAction,
  updateCommunityAction,
} from "@/features/communities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#4b50a8",
  "#8b7fd4",
  "#2f7d68",
  "#3f7fb5",
  "#c9a24a",
  "#b5475b",
  "#626784",
] as const;

interface CommunityFormProps {
  mode?: "create" | "edit";
  community?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
}

export function CommunityForm({ mode = "create", community }: CommunityFormProps) {
  const action = mode === "create" ? createCommunityAction : updateCommunityAction;
  const [clientState, clientAction] = useActionState(action, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState(community?.color ?? PRESET_COLORS[0]);

  useEffect(() => {
    if (clientState.success && mode === "create") {
      formRef.current?.reset();
    }
  }, [clientState.success, mode]);

  return (
    <form
      ref={formRef}
      action={clientAction}
      onReset={() => setColor(PRESET_COLORS[0])}
      className="space-y-4"
    >
      {community ? <input type="hidden" name="id" value={community.id} /> : null}

      {clientState.error ? <Alert variant="error">{clientState.error}</Alert> : null}
      {clientState.success ? (
        <Alert variant="success">{clientState.success}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-name-${community?.id ?? "new"}`}>Nombre</Label>
          <Input
            id={`${mode}-name-${community?.id ?? "new"}`}
            name="name"
            defaultValue={community?.name}
            placeholder="Ej. Comunidad Cumbre"
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-description-${community?.id ?? "new"}`}>
            Descripción <span className="normal-case tracking-normal">(opcional)</span>
          </Label>
          <Input
            id={`${mode}-description-${community?.id ?? "new"}`}
            name="description"
            defaultValue={community?.description ?? ""}
            placeholder="Una frase que identifique al grupo"
            maxLength={300}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color de la etiqueta</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              aria-label={`Usar color ${preset}`}
              aria-pressed={color.toLowerCase() === preset}
              className={cn(
                "size-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-105",
                color.toLowerCase() === preset
                  ? "ring-anil-700"
                  : "ring-transparent",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
          <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-anil-200">
            <Palette className="size-3.5" aria-hidden="true" />
            Personalizado
            <input
              type="color"
              name="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
        </div>
        <p className="text-xs text-ink-soft">
          Se usa en la etiqueta de comunidad del perfil y en las listas de asistencia.
        </p>
      </div>

      <SubmitButton size="sm" pendingLabel={mode === "create" ? "Creando…" : "Guardando…"}>
        {mode === "create" ? (
          <>
            <Plus aria-hidden="true" />
            Crear comunidad
          </>
        ) : (
          <>
            <Save aria-hidden="true" />
            Guardar cambios
          </>
        )}
      </SubmitButton>
    </form>
  );
}
