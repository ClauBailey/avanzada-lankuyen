"use client";

import { useActionState, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createAchievementAction } from "@/features/achievements/actions";
import { ACHIEVEMENT_ICON_OPTIONS } from "@/features/achievements/schemas";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function CreateAchievementDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    createAchievementAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Crear logro
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 cursor-default bg-anil-950/60 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-achievement-title"
            className="relative my-6 w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line/70 bg-anil-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold ring-1 ring-white/15">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="create-achievement-title"
                    className="font-display text-lg font-semibold leading-tight"
                  >
                    Nuevo logro
                  </h2>
                  <p className="text-[11px] text-anil-100/70">
                    Se añade al catálogo de toda la unidad.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-anil-100/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {state.success ? (
              <div className="space-y-4 p-5">
                <p className="text-sm leading-relaxed text-ink-soft">
                  {state.success}
                </p>
                <Button type="button" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <form action={formAction} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="achievement-title">Título</Label>
                  <Input
                    id="achievement-title"
                    name="title"
                    required
                    maxLength={120}
                    placeholder="Ej: El guardián del fuego"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="achievement-description">Descripción</Label>
                  <Textarea
                    id="achievement-description"
                    name="description"
                    required
                    maxLength={2000}
                    placeholder="Qué hizo la persona para desbloquearlo."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="achievement-hint">
                    Pista (opcional, para logros HINT)
                  </Label>
                  <Input
                    id="achievement-hint"
                    name="hint"
                    maxLength={500}
                    placeholder="Una pista sin revelar el requisito completo."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="achievement-category">Categoría</Label>
                    <Select
                      id="achievement-category"
                      name="category"
                      defaultValue="AVANZADA"
                    >
                      <option value="AVANZADA">Avanzada</option>
                      <option value="COMUNIDAD">Comunidad</option>
                      <option value="ESPECIAL">Especial</option>
                      <option value="SECRETO">Secreto</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="achievement-visibility">Visibilidad</Label>
                    <Select
                      id="achievement-visibility"
                      name="visibility"
                      defaultValue="PUBLIC"
                    >
                      <option value="PUBLIC">Público</option>
                      <option value="HINT">Con pista</option>
                      <option value="SECRET">Secreto</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="achievement-icon">Ícono</Label>
                    <Select
                      id="achievement-icon"
                      name="icon"
                      defaultValue="Trophy"
                    >
                      {ACHIEVEMENT_ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="achievement-points">Puntos</Label>
                    <Input
                      id="achievement-points"
                      name="points"
                      type="number"
                      min={0}
                      max={1000}
                      defaultValue={10}
                      required
                    />
                  </div>
                </div>

                {state.error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                    {state.error}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <SubmitButton pendingLabel="Creando...">
                    <Sparkles aria-hidden="true" />
                    Crear logro
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
