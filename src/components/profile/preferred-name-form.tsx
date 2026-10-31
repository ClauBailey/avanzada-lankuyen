"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePreferredNameAction } from "@/features/users/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface PreferredNameFormProps {
  preferredName: string | null;
  /** Nombre registral para mostrar como referencia, nunca se modifica aquí. */
  registralName: string;
}

export function PreferredNameForm({
  preferredName,
  registralName,
}: PreferredNameFormProps) {
  const [state, formAction] = useActionState(
    updatePreferredNameAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="preferredName">Nombre social</Label>
        <Input
          id="preferredName"
          name="preferredName"
          defaultValue={preferredName ?? ""}
          placeholder={registralName.split(" ")[0]}
          maxLength={80}
          autoComplete="nickname"
        />
        <p className="text-xs leading-relaxed text-ink-soft">
          Es el nombre con el que te sientes reconocido/a. Reemplaza tu nombre
          registral en toda la aplicación, en las tarjetas de logros y en los
          PNG que compartas. Déjalo vacío para volver a tu nombre registral.
        </p>
      </div>

      <SubmitButton size="sm" pendingLabel="Guardando…">
        <Sparkles aria-hidden="true" />
        Guardar nombre social
      </SubmitButton>
    </form>
  );
}
