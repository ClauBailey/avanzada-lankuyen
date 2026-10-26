"use client";

import { useActionState, useState } from "react";
import { KeyRound, ShieldCheck, UserCheck, UserX } from "lucide-react";

import { CredentialsDialog } from "@/components/admin/credentials-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  resetUserPasswordAction,
  setUserActiveAction,
  setUserCommunityAction,
  setUserRoleAction,
} from "@/features/users/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { EMPTY_USER_ACTION_STATE } from "@/features/users/types";
import { cn } from "@/lib/utils";

interface CommunityOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface UserCommunitySelectProps {
  userId: string;
  communityId: string | null;
  communities: CommunityOption[];
}

export function UserCommunitySelect({
  userId,
  communityId,
  communities,
}: UserCommunitySelectProps) {
  const [state, formAction, pending] = useActionState(
    setUserCommunityAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="min-w-40">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="communityId"
        defaultValue={communityId ?? ""}
        disabled={pending}
        aria-label="Cambiar comunidad"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          "h-9 py-0 text-xs",
          pending && "opacity-60",
        )}
      >
        <option value="" disabled>
          Sin comunidad
        </option>
        {communities.map((community) => (
          <option key={community.id} value={community.id}>
            {community.name}
            {community.isActive ? "" : " (inactiva)"}
          </option>
        ))}
      </Select>
      <noscript>
        <Button type="submit" size="sm" variant="secondary" className="mt-2">
          Guardar comunidad
        </Button>
      </noscript>
      {state.error ? (
        <p className="mt-1 text-[11px] text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}

interface UserRoleButtonProps {
  userId: string;
  role: "PP" | "COORDINADOR";
}

export function UserRoleButton({ userId, role }: UserRoleButtonProps) {
  const [state, formAction] = useActionState(
    setUserRoleAction,
    EMPTY_ACTION_STATE,
  );
  const nextRole = role === "PP" ? "COORDINADOR" : "PP";

  return (
    <form action={formAction} className="inline-flex flex-col items-start">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={nextRole} />
      <SubmitButton variant="ghost" size="sm" pendingLabel="Cambiando…">
        <ShieldCheck aria-hidden="true" />
        {nextRole === "COORDINADOR" ? "Hacer Coordinador/a" : "Hacer Pionero/a"}
      </SubmitButton>
      {state.error ? (
        <p className="max-w-52 text-[11px] text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}

interface UserActiveToggleProps {
  userId: string;
  fullName: string;
  isActive: boolean;
}

export function UserActiveToggle({
  userId,
  fullName,
  isActive,
}: UserActiveToggleProps) {
  const [state, formAction] = useActionState(
    setUserActiveAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-start">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      {isActive ? (
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          message={`¿Desactivar la cuenta de ${fullName}? No podrá iniciar sesión hasta que la reactives.`}
          className="text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          <UserX aria-hidden="true" />
          Desactivar
        </ConfirmSubmitButton>
      ) : (
        <SubmitButton variant="ghost" size="sm" pendingLabel="Activando…">
          <UserCheck aria-hidden="true" />
          Activar
        </SubmitButton>
      )}
      {state.error ? (
        <p className="max-w-52 text-[11px] text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}

interface UserResetButtonProps {
  userId: string;
  fullName: string;
}

export function UserResetButton({ userId, fullName }: UserResetButtonProps) {
  const [state, formAction] = useActionState(
    resetUserPasswordAction,
    EMPTY_USER_ACTION_STATE,
  );
  const [dismissedPassword, setDismissedPassword] = useState<string | null>(
    null,
  );
  const credentials = state.credentials ?? null;
  const open = Boolean(
    credentials && dismissedPassword !== credentials.password,
  );

  return (
    <>
      <form action={formAction} className="inline-flex flex-col items-start">
        <input type="hidden" name="userId" value={userId} />
        <SubmitButton
          variant="ghost"
          size="sm"
          pendingLabel="Generando…"
          onClick={(event) => {
            if (
              !window.confirm(
                `¿Restablecer la contraseña de ${fullName}? Se generará una clave temporal y deberá cambiarla al ingresar.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <KeyRound aria-hidden="true" />
          Resetear contraseña
        </SubmitButton>
        {state.error ? (
          <p className="max-w-52 text-[11px] text-red-700">{state.error}</p>
        ) : null}
      </form>

      <CredentialsDialog
        key={credentials?.password ?? "none"}
        credentials={open ? credentials : null}
        onClose={() => setDismissedPassword(credentials?.password ?? null)}
      />
    </>
  );
}
