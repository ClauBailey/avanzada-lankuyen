"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePasswordAction } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/components/password-field";
import type { ActionState } from "@/features/auth/types";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          placeholder="La contraseña que te entregaron"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <PasswordField
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Mínimo 10 caracteres"
          minLength={10}
          required
        />
        <p className="text-xs text-ink-soft">
          Debe tener al menos 10 caracteres, incluir una letra y un número.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repite la nueva contraseña</Label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repite tu nueva contraseña"
          minLength={10}
          required
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Actualizando…">
        <KeyRound aria-hidden="true" />
        Guardar nueva contraseña
      </SubmitButton>
    </form>
  );
}
