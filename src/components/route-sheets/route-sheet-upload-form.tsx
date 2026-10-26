"use client";

import { useActionState, useEffect, useRef } from "react";
import { FileUp, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { uploadRouteSheetAction } from "@/features/route-sheets/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  MAX_ROUTE_SHEET_BYTES,
  ROUTE_SHEET_ACCEPT,
  ROUTE_SHEET_FILE_HINT,
} from "@/lib/route-sheets";

interface RouteSheetUploadFormProps {
  activityId: string;
  activityTitle: string;
  nextVersion: number;
  isResubmission: boolean;
}

export function RouteSheetUploadForm({
  activityId,
  activityTitle,
  nextVersion,
  isResubmission,
}: RouteSheetUploadFormProps) {
  const [state, formAction] = useActionState(
    uploadRouteSheetAction,
    EMPTY_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="activityId" value={activityId} />

      <div className="space-y-2">
        <Label htmlFor={`route-sheet-file-${activityId}`}>
          {isResubmission
            ? `Archivo corregido · versión ${nextVersion}`
            : "Archivo de la hoja de ruta"}
        </Label>
        <Input
          id={`route-sheet-file-${activityId}`}
          name="file"
          type="file"
          accept={ROUTE_SHEET_ACCEPT}
          required
          className="h-auto cursor-pointer py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-anil-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        <p className="text-[11px] text-ink-soft">
          {ROUTE_SHEET_FILE_HINT} · máximo{" "}
          {MAX_ROUTE_SHEET_BYTES / (1024 * 1024)} MB.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`route-sheet-title-${activityId}`}>
            Título (opcional)
          </Label>
          <Input
            id={`route-sheet-title-${activityId}`}
            name="title"
            maxLength={160}
            placeholder={`Hoja de ruta · ${activityTitle}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`route-sheet-description-${activityId}`}>
            Nota para los AA (opcional)
          </Label>
          <Textarea
            id={`route-sheet-description-${activityId}`}
            name="description"
            maxLength={1200}
            className="min-h-11"
            rows={1}
            placeholder="Ej.: corregimos el horario y los materiales."
          />
        </div>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <SubmitButton size="sm" pendingLabel="Subiendo…">
        {isResubmission ? <Send aria-hidden="true" /> : <FileUp aria-hidden="true" />}
        {isResubmission
          ? `Enviar versión ${nextVersion}`
          : "Enviar hoja de ruta"}
      </SubmitButton>
    </form>
  );
}
