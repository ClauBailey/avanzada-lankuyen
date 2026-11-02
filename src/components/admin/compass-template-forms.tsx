"use client";

import { useActionState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createCompassObjectiveTemplateAction,
  deleteCompassObjectiveTemplateAction,
  updateCompassObjectiveTemplateAction,
} from "@/features/compass/actions";
import { COMPASS_AREAS } from "@/features/compass/catalog";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export interface TemplateValues {
  id: string;
  code: string;
  area: string;
  terminalObjective: string;
  intermediateObjective: string;
  sortOrder: number;
}

function TemplateFields({
  values,
  idPrefix,
}: {
  values?: Partial<TemplateValues>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_0.6fr]">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-code`}>Código</Label>
          <Input
            id={`${idPrefix}-code`}
            name="code"
            defaultValue={values?.code ?? ""}
            placeholder="COR-01"
            maxLength={40}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-area`}>Área de Desarrollo</Label>
          <Select
            id={`${idPrefix}-area`}
            name="area"
            defaultValue={values?.area ?? "CORPORALIDAD"}
          >
            {COMPASS_AREAS.map((area) => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-order`}>Orden</Label>
          <Input
            id={`${idPrefix}-order`}
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={values?.sortOrder ?? 0}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-terminal`}>
          Objetivo terminal (horizonte)
        </Label>
        <Textarea
          id={`${idPrefix}-terminal`}
          name="terminalObjective"
          defaultValue={values?.terminalObjective ?? ""}
          maxLength={2000}
          className="min-h-20"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-intermediate`}>
          Objetivo intermedio (15–17 años)
        </Label>
        <Textarea
          id={`${idPrefix}-intermediate`}
          name="intermediateObjective"
          defaultValue={values?.intermediateObjective ?? ""}
          maxLength={2000}
          className="min-h-20"
          required
        />
      </div>
    </>
  );
}

export function CompassTemplateEditForm({
  template,
}: {
  template: TemplateValues;
}) {
  const [state, formAction] = useActionState(
    updateCompassObjectiveTemplateAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details className="rounded-xl border border-line bg-canvas/30">
      <summary className="cursor-pointer list-none px-3.5 py-2.5 text-xs font-semibold text-anil-700 marker:text-anil-500">
        <span className="inline-flex items-center gap-1.5">
          <Save className="size-3.5" aria-hidden="true" />
          Editar plantilla
        </span>
      </summary>
      <form
        action={formAction}
        className="space-y-3 border-t border-line/70 px-3.5 py-3"
      >
        <input type="hidden" name="templateId" value={template.id} />
        <TemplateFields
          values={template}
          idPrefix={`template-${template.id}`}
        />
        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.success ? <Alert variant="success">{state.success}</Alert> : null}
        <SubmitButton size="sm" pendingLabel="Guardando…">
          <Save aria-hidden="true" />
          Guardar cambios del catálogo
        </SubmitButton>
      </form>
    </details>
  );
}

export function CompassTemplateCreateForm({
  nextSortOrder,
}: {
  nextSortOrder: number;
}) {
  const [state, formAction] = useActionState(
    createCompassObjectiveTemplateAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <TemplateFields
        values={{ sortOrder: nextSortOrder }}
        idPrefix="new-template"
      />
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Agregando…">
        <Plus aria-hidden="true" />
        Agregar objetivo al catálogo
      </SubmitButton>
    </form>
  );
}

export function DeleteCompassTemplateButton({
  templateId,
  code,
  adoptions,
}: {
  templateId: string;
  code: string;
  adoptions: number;
}) {
  const [state, formAction] = useActionState(
    deleteCompassObjectiveTemplateAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const message =
          adoptions > 0
            ? `¿Eliminar la plantilla ${code}? ${adoptions} objetivo(s) personal(es) ya adoptado(s) se conservarán como objetivos propios, con su redacción e historial.`
            : `¿Eliminar la plantilla ${code} del catálogo referencial?`;
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="space-y-1"
    >
      <input type="hidden" name="templateId" value={templateId} />
      <SubmitButton size="sm" variant="ghost" pendingLabel="Eliminando…">
        <Trash2 aria-hidden="true" />
        Eliminar plantilla
      </SubmitButton>
      {state.error ? (
        <p className="text-[11px] text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-[11px] text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}
