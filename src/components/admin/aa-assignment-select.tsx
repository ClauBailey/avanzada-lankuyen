"use client";

import { useActionState, useState } from "react";
import { HeartHandshake } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { assignAaAction } from "@/features/users/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface AaOption {
  id: string;
  name: string;
  assignedCount: number;
}

interface AaAssignmentSelectProps {
  userId: string;
  assignedAaId: string | null;
  requiresEarlyConfirmation: boolean;
  aaOptions: AaOption[];
}

export function AaAssignmentSelect({
  userId,
  assignedAaId,
  requiresEarlyConfirmation,
  aaOptions,
}: AaAssignmentSelectProps) {
  const [state, formAction] = useActionState(
    assignAaAction,
    EMPTY_ACTION_STATE,
  );
  const [selected, setSelected] = useState(assignedAaId ?? "");

  const changing = selected !== (assignedAaId ?? "");
  const needsConfirmation =
    requiresEarlyConfirmation && changing && selected !== "";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="assignedAaId"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        aria-label="AA de acompañamiento personal"
        className="h-9 py-0 text-xs"
      >
        <option value="">Sin acompañamiento asignado</option>
        {aaOptions.map((aa) => (
          <option key={aa.id} value={aa.id}>
            {aa.name} · {aa.assignedCount} joven
            {aa.assignedCount === 1 ? "" : "es"}
          </option>
        ))}
      </Select>

      {needsConfirmation ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
          <input
            type="checkbox"
            name="confirmEarlyReassignment"
            value="on"
            required
            className="mt-0.5 size-4 rounded border-line text-anil-800"
          />
          <span>
            Confirmo el cambio antes de un año de acompañamiento. El Manual
            recomienda una estabilidad mínima de 365 días.
          </span>
        </label>
      ) : null}

      <SubmitButton
        size="sm"
        variant="secondary"
        pendingLabel="Asignando…"
        disabled={!changing}
      >
        <HeartHandshake aria-hidden="true" />
        Guardar acompañamiento
      </SubmitButton>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}
