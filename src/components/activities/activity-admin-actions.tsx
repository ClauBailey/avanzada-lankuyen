"use client";

import { useActionState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  cancelActivityAction,
  setActivityPublishedAction,
} from "@/features/activities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function ActivityPublishToggle({
  activityId,
  isPublished,
}: {
  activityId: string;
  isPublished: boolean;
}) {
  const [state, formAction] = useActionState(
    setActivityPublishedAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="activityId" value={activityId} />
      <input
        type="hidden"
        name="isPublished"
        value={isPublished ? "false" : "true"}
      />
      <SubmitButton
        size="sm"
        variant="secondary"
        pendingLabel={isPublished ? "Ocultando…" : "Publicando…"}
      >
        {isPublished ? (
          <EyeOff aria-hidden="true" />
        ) : (
          <Eye aria-hidden="true" />
        )}
        {isPublished ? "Ocultar" : "Publicar"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}

export function ActivityCancelButton({
  activityId,
  title,
}: {
  activityId: string;
  title: string;
}) {
  const [state, formAction] = useActionState(
    cancelActivityAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="activityId" value={activityId} />
      <ConfirmSubmitButton
        size="sm"
        variant="ghost"
        message={`¿Cancelar la actividad «${title}»? Dejará de aparecer en el calendario, pero se conserva el historial de asistencia.`}
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        <Trash2 aria-hidden="true" />
        Cancelar actividad
      </ConfirmSubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}
