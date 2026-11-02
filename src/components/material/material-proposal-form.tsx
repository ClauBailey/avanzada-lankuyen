"use client";

import { useActionState, useEffect, useRef } from "react";
import { Lightbulb, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { proposeUnitResourceAction } from "@/features/material/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

/**
 * Formulario de propuesta de material para la coordinación (RF-MAT-02).
 * La ficha queda en borrador hasta que un AA la revise y publique.
 */
export function MaterialProposalForm() {
  const [state, formAction] = useActionState(
    proposeUnitResourceAction,
    EMPTY_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="proposal-title">Título de la ficha o recurso</Label>
        <Input
          id="proposal-title"
          name="title"
          maxLength={160}
          placeholder="Ej.: Guía de campamento de invierno"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proposal-summary">Resumen breve (opcional)</Label>
        <Input
          id="proposal-summary"
          name="summary"
          maxLength={300}
          placeholder="Para qué sirve y a quién está dirigido."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proposal-body">Contenido de la ficha</Label>
        <Textarea
          id="proposal-body"
          name="bodyMd"
          maxLength={60000}
          className="min-h-32"
          placeholder="Escribe la ficha técnica o el recurso. Puedes usar Markdown."
          required
        />
      </div>

      <p className="inline-flex items-start gap-1.5 rounded-lg border border-anil-200 bg-anil-50/50 px-3 py-2 text-[11px] leading-relaxed text-anil-900">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Tu propuesta queda en borrador. El Equipo Adulto la revisa, ajusta y
        decide cuándo publicarla para toda la unidad.
      </p>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <SubmitButton size="sm" pendingLabel="Enviando propuesta…">
        <Send aria-hidden="true" />
        Proponer material
      </SubmitButton>
    </form>
  );
}
