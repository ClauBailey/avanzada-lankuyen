"use client";

import { useActionState } from "react";
import { Power, PowerOff } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { toggleCommunityAction } from "@/features/communities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface CommunityToggleProps {
  id: string;
  name: string;
  isActive: boolean;
}

export function CommunityToggle({ id, name, isActive }: CommunityToggleProps) {
  const [state, formAction] = useActionState(
    toggleCommunityAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {isActive ? (
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          message={`¿Desactivar la comunidad «${name}»? Sus miembros conservarán la asignación hasta que los muevas a otra comunidad.`}
          className="text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          <PowerOff aria-hidden="true" />
          Desactivar
        </ConfirmSubmitButton>
      ) : (
        <Button variant="secondary" size="sm">
          <Power aria-hidden="true" />
          Reactivar
        </Button>
      )}
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}
