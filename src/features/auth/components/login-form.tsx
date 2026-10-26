"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/components/password-field";
import type { ActionState } from "@/features/auth/types";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="identifier">Usuario o correo</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ej. nombre.apellido"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordField
          id="password"
          name="password"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Ingresando…">
        <LogIn aria-hidden="true" />
        Iniciar sesión
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-ink-soft">
        ¿Olvidaste tu contraseña? Contacta a un Adulto Acompañante.
        <br />
        Las cuentas son creadas y entregadas por la unidad; no existe registro público.
      </p>
    </form>
  );
}
