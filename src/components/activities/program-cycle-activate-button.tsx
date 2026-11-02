"use client";

import { useActionState } from "react";
import { Power } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { activateProgramCycleAction } from "@/features/activities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function ProgramCycleActivateButton({
  cycleId,
  isActive,
}: {
  cycleId: string;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState(
    activateProgramCycleAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="cycleId" value={cycleId} />
      <SubmitButton
        size="sm"
        variant={isActive ? "secondary" : "primary"}
        disabled={isActive}
        pendingLabel="Activando…"
      >
        <Power aria-hidden="true" />
        {isActive ? "Ciclo activo" : "Activar ciclo"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
    </form>
  );
}
