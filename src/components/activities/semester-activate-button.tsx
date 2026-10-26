"use client";

import { useActionState } from "react";
import { Power } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { activateSemesterAction } from "@/features/activities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function SemesterActivateButton({
  semesterId,
  isActive,
}: {
  semesterId: string;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState(
    activateSemesterAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="semesterId" value={semesterId} />
      <SubmitButton
        size="sm"
        variant={isActive ? "secondary" : "primary"}
        disabled={isActive}
        pendingLabel="Activando…"
      >
        <Power aria-hidden="true" />
        {isActive ? "Semestre activo" : "Activar semestre"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
    </form>
  );
}
