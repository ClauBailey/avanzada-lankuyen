"use client";

import { useActionState, useState } from "react";
import { UsersRound } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { assignCommunityAaAction } from "@/features/users/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface CommunityBatchAaProps {
  communityId: string;
  aaOptions: Array<{ id: string; name: string; assignedCount: number }>;
  hasEarlyAssignments: boolean;
}

export function CommunityBatchAa({
  communityId,
  aaOptions,
  hasEarlyAssignments,
}: CommunityBatchAaProps) {
  const [state, formAction] = useActionState(
    assignCommunityAaAction,
    EMPTY_ACTION_STATE,
  );
  const [selected, setSelected] = useState("");
  const needsConfirmation = hasEarlyAssignments && selected !== "";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="communityId" value={communityId} />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          name="assignedAaId"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          aria-label="Asignar AA a toda la comunidad"
          className="h-9 min-w-48 flex-1 py-0 text-xs"
        >
          <option value="">Retirar acompañamiento del grupo</option>
          {aaOptions.map((aa) => (
            <option key={aa.id} value={aa.id}>
              {aa.name} · {aa.assignedCount} persona
              {aa.assignedCount === 1 ? "" : "s"} joven
              {aa.assignedCount === 1 ? "" : "es"}
              {aa.assignedCount === 1 ? "" : "es"}
            </option>
          ))}
        </Select>
        <SubmitButton size="sm" variant="secondary" pendingLabel="Asignando…">
          <UsersRound aria-hidden="true" />
          Asignar al grupo
        </SubmitButton>
      </div>

      {needsConfirmation ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
          <input
            type="checkbox"
            name="confirmEarlyReassignment"
            value="on"
            className="mt-0.5 size-4 rounded border-line text-anil-800"
          />
          <span>
            Hay personas jóvenes con menos de un año junto a su AA actual. Confirmo el
            cambio anticipado para todo el grupo.
          </span>
        </label>
      ) : null}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}
