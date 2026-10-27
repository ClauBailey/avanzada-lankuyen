"use client";

import { useActionState } from "react";
import { BookOpen, ShieldOff } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { setLogbookKeeperAction } from "@/features/logbook/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface LogbookKeeperButtonProps {
  userId: string;
  fullName: string;
  isKeeper: boolean;
  compact?: boolean;
}

export function LogbookKeeperButton({
  userId,
  fullName,
  isKeeper,
  compact = false,
}: LogbookKeeperButtonProps) {
  const [state, formAction] = useActionState(
    setLogbookKeeperAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isKeeper" value={isKeeper ? "false" : "true"} />

      {isKeeper ? (
        <ConfirmSubmitButton
          variant="secondary"
          size="sm"
          message={`¿Retirar el cargo de Guardián de La Bitácora a ${fullName}?`}
          className={compact ? undefined : "w-full"}
        >
          <ShieldOff aria-hidden="true" />
          Retirar cargo
        </ConfirmSubmitButton>
      ) : (
        <ConfirmSubmitButton
          variant="secondary"
          size="sm"
          message={`¿Asignar a ${fullName} como Guardián de La Bitácora? Si otra persona tiene el cargo, se le retirará automáticamente.`}
          className={compact ? undefined : "w-full"}
        >
          <BookOpen aria-hidden="true" />
          Asignar Guardián
        </ConfirmSubmitButton>
      )}

      {state.error ? (
        <p className="text-[10px] font-medium text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-[10px] font-medium text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}

export function LogbookKeeperHint() {
  return (
    <p className="text-[11px] leading-relaxed text-ink-soft">
      El cargo es acumulable: la persona sigue siendo PP o Coordinador/a y suma
      la moderación de La Bitácora. Solo puede haber un Guardián activo.
    </p>
  );
}
