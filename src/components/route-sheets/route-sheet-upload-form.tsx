"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileUp, ListChecks, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { uploadRouteSheetAction } from "@/features/route-sheets/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  MAX_ROUTE_SHEET_BYTES,
  ROUTE_SHEET_ACCEPT,
  ROUTE_SHEET_FILE_HINT,
  ROUTE_SHEET_STRUCTURED_SECTIONS,
} from "@/lib/route-sheets";
import { cn } from "@/lib/utils";

interface RouteSheetUploadFormProps {
  activityId: string;
  activityTitle: string;
  nextVersion: number;
  isResubmission: boolean;
  projects?: { id: string; title: string }[];
}

export function RouteSheetUploadForm({
  activityId,
  activityTitle,
  nextVersion,
  isResubmission,
  projects = [],
}: RouteSheetUploadFormProps) {
  const [state, formAction] = useActionState(
    uploadRouteSheetAction,
    EMPTY_ACTION_STATE,
  );
  const [mode, setMode] = useState<"STRUCTURED" | "FILE">("STRUCTURED");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="inline-flex rounded-xl border border-line bg-canvas/40 p-1">
        <button
          type="button"
          onClick={() => setMode("STRUCTURED")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            mode === "STRUCTURED"
              ? "bg-surface text-anil-800 shadow-sm"
              : "text-ink-soft hover:text-ink",
          )}
          aria-pressed={mode === "STRUCTURED"}
        >
          <ListChecks className="size-3.5" aria-hidden="true" />
          Formulario oficial
        </button>
        <button
          type="button"
          onClick={() => setMode("FILE")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            mode === "FILE"
              ? "bg-surface text-anil-800 shadow-sm"
              : "text-ink-soft hover:text-ink",
          )}
          aria-pressed={mode === "FILE"}
        >
          <FileUp className="size-3.5" aria-hidden="true" />
          Subir archivo
        </button>
      </div>

      {mode === "STRUCTURED" ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-anil-200 bg-anil-50/50 px-3 py-2 text-[11px] leading-relaxed text-anil-900">
            Opción A · Formulario oficial de ocho secciones (Manual p. 230).
            Puedes acompañarlo con un archivo adjunto si lo necesitas.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {ROUTE_SHEET_STRUCTURED_SECTIONS.map((section) => (
              <div key={section.key} className="space-y-1.5">
                <Label htmlFor={`${section.key}-${activityId}`}>
                  {section.order}. {section.label}
                </Label>
                <Textarea
                  id={`${section.key}-${activityId}`}
                  name={section.key}
                  maxLength={6000}
                  className="min-h-20"
                  placeholder={section.hint}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
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
      )}

      {mode === "STRUCTURED" ? (
        <div className="space-y-2">
          <Label htmlFor={`route-sheet-file-optional-${activityId}`}>
            Archivo adjunto (opcional)
          </Label>
          <Input
            id={`route-sheet-file-optional-${activityId}`}
            name="file"
            type="file"
            accept={ROUTE_SHEET_ACCEPT}
            className="h-auto cursor-pointer py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-anil-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <p className="text-[11px] text-ink-soft">
            {ROUTE_SHEET_FILE_HINT}. El formulario queda como fuente principal.
          </p>
        </div>
      ) : null}

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

      {projects.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor={`route-sheet-project-${activityId}`}>
            Vincular a un proyecto (opcional)
          </Label>
          <Select
            id={`route-sheet-project-${activityId}`}
            name="projectId"
            defaultValue=""
          >
            <option value="">Sin proyecto vinculado</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <SubmitButton size="sm" pendingLabel="Enviando…">
        {isResubmission ? (
          <Send aria-hidden="true" />
        ) : (
          <FileUp aria-hidden="true" />
        )}
        {isResubmission
          ? `Enviar versión ${nextVersion}`
          : "Enviar hoja de ruta"}
      </SubmitButton>
    </form>
  );
}
