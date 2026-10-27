"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { deleteLogbookEntryAction } from "@/features/logbook/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function LogbookDeleteButton({
  entryId,
  title,
  compact = true,
}: {
  entryId: string;
  title: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(
    deleteLogbookEntryAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="entryId" value={entryId} />
      <ConfirmSubmitButton
        variant="ghost"
        size="sm"
        message={`¿Retirar «${title}» de La Bitácora? La página dejará de mostrarse en el libro.`}
        className={compact ? "text-red-700 hover:bg-red-50" : "text-red-700"}
      >
        <Trash2 aria-hidden="true" />
        Retirar
      </ConfirmSubmitButton>
      {state.error ? (
        <p className="text-[10px] font-medium text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-[10px] font-medium text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}
