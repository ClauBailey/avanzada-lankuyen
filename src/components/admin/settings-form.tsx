"use client";

import { useActionState } from "react";
import { Save, Settings2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateAdminSettingsAction } from "@/features/settings/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface SettingsFormProps {
  leadDays: number;
  allowAnyPpUpload: boolean;
}

export function SettingsForm({
  leadDays,
  allowAnyPpUpload,
}: SettingsFormProps) {
  const [state, formAction] = useActionState(
    updateAdminSettingsAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="settings-lead-days">Días de anticipación del recordatorio</Label>
        <Input
          id="settings-lead-days"
          name="leadDays"
          type="number"
          min={1}
          max={60}
          step={1}
          defaultValue={leadDays}
          required
          className="max-w-40"
        />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          El cron busca actividades dentro de esta ventana de días y avisa a los
          encargados cuando falta la hoja de ruta. Valor actual:{" "}
          <strong className="text-ink">{leadDays} día{leadDays === 1 ? "" : "s"}</strong>.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas/40 p-4">
        <input
          type="checkbox"
          name="allowAnyPpUpload"
          defaultChecked={allowAnyPpUpload}
          className="mt-0.5 size-4 accent-anil-700"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">
            Permitir que cualquier Pionero/a suba hojas de ruta
          </span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
            Si está activo, además de los encargados y los AA, cualquier PP o
            COORDINADOR puede subir una hoja de ruta. Si está desactivado, solo
            los encargados de la actividad y los AA pueden hacerlo.
          </span>
        </span>
      </label>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton size="sm" pendingLabel="Guardando ajustes…">
          <Save aria-hidden="true" />
          Guardar ajustes
        </SubmitButton>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
          <Settings2 className="size-3.5" aria-hidden="true" />
          Se aplican en caliente, sin reiniciar el servidor.
        </span>
      </div>
    </form>
  );
}
