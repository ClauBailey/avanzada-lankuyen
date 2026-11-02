"use client";

import { useActionState } from "react";
import { Archive, Plus, Save, ShieldCheck } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  saveSupportContactAction,
  toggleSupportContactAction,
} from "@/features/projects/actions";
import { COMPETENCY_AREA_OPTIONS } from "@/features/projects/rules";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export interface SupportContactValues {
  id: string;
  fullName: string;
  relationshipOrRole: string;
  organization: string | null;
  contactInfo: string | null;
  supportedAreas: string[];
  collaborationNotes: string | null;
  isActive: boolean;
}

export function SupportContactForm({
  contact,
  readOnly = false,
}: {
  contact?: SupportContactValues;
  readOnly?: boolean;
}) {
  const [state, formAction] = useActionState(
    saveSupportContactAction,
    EMPTY_ACTION_STATE,
  );

  const idPrefix = contact ? `contact-${contact.id}` : "contact-new";

  return (
    <form action={formAction} className="space-y-3">
      {contact ? <input type="hidden" name="contactId" value={contact.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Nombre completo</Label>
          <Input
            id={`${idPrefix}-name`}
            name="fullName"
            defaultValue={contact?.fullName ?? ""}
            maxLength={160}
            required
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-role`}>Vínculo o rol</Label>
          <Input
            id={`${idPrefix}-role`}
            name="relationshipOrRole"
            defaultValue={contact?.relationshipOrRole ?? ""}
            placeholder="Apoderado, instructora de escalada, junta de vecinos…"
            maxLength={160}
            required
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-organization`}>Organización (opcional)</Label>
          <Input
            id={`${idPrefix}-organization`}
            name="organization"
            defaultValue={contact?.organization ?? ""}
            maxLength={160}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-info`}>
            Teléfono o correo (solo AA y coordinación)
          </Label>
          <Input
            id={`${idPrefix}-info`}
            name="contactInfo"
            defaultValue={contact?.contactInfo ?? ""}
            maxLength={200}
            disabled={readOnly}
          />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-semibold text-ink">
          Áreas en que puede apoyar
        </legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {COMPETENCY_AREA_OPTIONS.map((area) => (
            <label
              key={area.key}
              className="flex items-center gap-2 rounded-lg border border-line bg-canvas/30 px-2.5 py-1.5 text-xs text-ink"
            >
              <input
                type="checkbox"
                name="supportedAreas"
                value={area.key}
                defaultChecked={contact?.supportedAreas.includes(area.key)}
                className="size-4 rounded border-line"
                disabled={readOnly}
              />
              {area.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>
          Historial de apoyo a la Avanzada (opcional)
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="collaborationNotes"
          defaultValue={contact?.collaborationNotes ?? ""}
          maxLength={4000}
          className="min-h-16"
          disabled={readOnly}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={contact?.isActive ?? true}
          className="size-4 rounded border-line"
          disabled={readOnly}
        />
        Contacto activo y disponible para los proyectos
      </label>

      {readOnly ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11px] text-ink-soft">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          La edición del directorio corresponde al Equipo Adulto. La coordinación
          puede consultarlo.
        </p>
      ) : (
        <>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.success ? (
            <Alert variant="success">{state.success}</Alert>
          ) : null}
          <SubmitButton size="sm" pendingLabel="Guardando…">
            {contact ? <Save aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {contact ? "Guardar contacto" : "Agregar a la Red de Apoyo"}
          </SubmitButton>
        </>
      )}
    </form>
  );
}

export function SupportContactToggle({
  contactId,
  isActive,
}: {
  contactId: string;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState(
    toggleSupportContactAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="contactId" value={contactId} />
      <input
        type="hidden"
        name="isActive"
        value={isActive ? "false" : "true"}
      />
      <SubmitButton
        size="sm"
        variant={isActive ? "ghost" : "secondary"}
        pendingLabel="Actualizando…"
      >
        <Archive aria-hidden="true" />
        {isActive ? "Archivar contacto" : "Reactivar contacto"}
      </SubmitButton>
      {state.error ? (
        <p className="text-[11px] text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}
