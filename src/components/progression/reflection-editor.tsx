"use client";

import { useActionState, useState } from "react";
import { Check, Feather, LoaderCircle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveStageReflectionAction } from "@/features/progression/actions";
import { EMPTY_REFLECTION_STATE } from "@/features/progression/types";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;

interface ReflectionEditorProps {
  stageCode: "SENDERO" | "CUMBRE";
  stageName: string;
  initialContent: string;
  initialSavedAt: string | null;
}

export function ReflectionEditor({
  stageCode,
  stageName,
  initialContent,
  initialSavedAt,
}: ReflectionEditorProps) {
  const [state, formAction, pending] = useActionState(
    saveStageReflectionAction,
    EMPTY_REFLECTION_STATE,
  );
  const [content, setContent] = useState(initialContent);
  const [edited, setEdited] = useState(false);

  const savedAt = state.savedAt !== undefined ? state.savedAt : initialSavedAt;
  const showSaved = Boolean(state.success) && !edited && !pending;

  const remaining = MAX_LENGTH - content.length;
  const hintId = `reflection-hint-${stageCode.toLowerCase()}`;

  return (
    <form
      action={(formData) => {
        setEdited(false);
        formAction(formData);
      }}
      className="space-y-3"
    >
      <input type="hidden" name="stageCode" value={stageCode} />
      <input type="hidden" name="content" value={content} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`reflection-${stageCode.toLowerCase()}`}
          className="flex items-center gap-2 text-sm font-semibold text-ink"
        >
          <Feather className="size-4 text-anil-600" aria-hidden="true" />
          ¿Qué sentiste en esta etapa?
        </label>
        <span
          className={cn(
            "text-[11px]",
            remaining < 0 ? "font-semibold text-red-700" : "text-ink-soft",
          )}
        >
          {content.length} / {MAX_LENGTH}
        </span>
      </div>

      <Textarea
        id={`reflection-${stageCode.toLowerCase()}`}
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setEdited(true);
        }}
        placeholder={`Escribe lo que viviste en la etapa ${stageName}. Puedes volver a editarlo cuando quieras.`}
        aria-describedby={hintId}
        aria-invalid={remaining < 0}
        maxLength={MAX_LENGTH + 100}
        className="min-h-32 bg-canvas/40"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={hintId} className="text-[11px] leading-relaxed text-ink-soft">
          {savedAt
            ? `Última edición: ${formatTimestamp(savedAt)} · visible para tus AA.`
            : "Aún no has escrito tu reflexión. Solo tú puedes editarla; tus AA pueden leerla."}
        </p>

        <div className="flex items-center gap-2">
          {showSaved ? (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
            >
              <Check className="size-3" aria-hidden="true" />
              {state.success === "Guardado" ? "Guardado" : state.success}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setContent("");
              setEdited(true);
            }}
            disabled={pending || content.length === 0}
          >
            Limpiar
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={pending || remaining < 0 || content === initialContent}
          >
            {pending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Guardando…
              </>
            ) : (
              "Guardar reflexión"
            )}
          </Button>
        </div>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
    </form>
  );
}
