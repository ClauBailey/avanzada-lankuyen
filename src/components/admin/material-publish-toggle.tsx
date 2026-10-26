"use client";

import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { toggleMaterialPublishAction } from "@/features/material/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

interface MaterialPublishToggleProps {
  id: string;
  title: string;
  isPublished: boolean;
}

export function MaterialPublishToggle({
  id,
  title,
  isPublished,
}: MaterialPublishToggleProps) {
  const [state, formAction] = useActionState(
    toggleMaterialPublishAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        variant={isPublished ? "secondary" : "primary"}
        size="sm"
        message={
          isPublished
            ? `¿Volver a borrador «${title}»? Dejará de estar visible para los Pioneros/as hasta que lo publiques otra vez.`
            : `¿Publicar «${title}»? Todo miembro activo de la unidad podrá leerlo desde Material.`
        }
      >
        {isPublished ? (
          <>
            <EyeOff aria-hidden="true" />
            Volver a borrador
          </>
        ) : (
          <>
            <Eye aria-hidden="true" />
            Publicar
          </>
        )}
      </ConfirmSubmitButton>

      {state.error ? (
        <span className="max-w-56 text-right text-[11px] text-red-700">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="max-w-56 text-right text-[11px] text-emerald-700">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
