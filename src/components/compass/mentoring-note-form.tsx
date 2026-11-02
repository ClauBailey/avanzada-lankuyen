"use client";

import { useActionState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveMentoringNoteAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function MentoringNoteForm({
  studentId,
  noteId,
  initialContent = "",
  initialShared = false,
  compact = false,
}: {
  studentId: string;
  noteId?: string;
  initialContent?: string;
  initialShared?: boolean;
  compact?: boolean;
}) {
  const [state, action] = useActionState(
    saveMentoringNoteAction,
    EMPTY_ACTION_STATE,
  );

  if (compact) {
    return (
      <details className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
        <summary className="cursor-pointer text-[11px] font-semibold text-anil-800 marker:text-anil-500">
          Editar esta nota
        </summary>
        <NoteFields
          action={action}
          state={state}
          studentId={studentId}
          noteId={noteId}
          initialContent={initialContent}
          initialShared={initialShared}
          compact
        />
      </details>
    );
  }

  return (
    <NoteFields
      action={action}
      state={state}
      studentId={studentId}
      noteId={noteId}
      initialContent={initialContent}
      initialShared={initialShared}
    />
  );
}

function NoteFields({
  action,
  state,
  studentId,
  noteId,
  initialContent,
  initialShared,
  compact = false,
}: {
  action: (formData: FormData) => void;
  state: { error?: string; success?: string };
  studentId: string;
  noteId?: string;
  initialContent: string;
  initialShared: boolean;
  compact?: boolean;
}) {
  return (
    <form action={action} className={compact ? "mt-2 space-y-2" : "space-y-3"}>
      <input type="hidden" name="studentId" value={studentId} />
      {noteId ? <input type="hidden" name="noteId" value={noteId} /> : null}

      <Textarea
        name="content"
        required
        minLength={3}
        maxLength={4000}
        defaultValue={initialContent}
        placeholder="Una observación positiva sobre lo que viste crecer, sostener o intentar…"
        className={compact ? "min-h-24 bg-surface text-sm" : "bg-surface"}
      />

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2.5 text-[11px] leading-relaxed text-ink">
        <input
          type="checkbox"
          name="sharedWithStudent"
          defaultChecked={initialShared}
          className="mt-0.5 size-3.5 accent-anil-800"
        />
        <span>
          Compartir esta nota con la o el joven.
          <span className="mt-0.5 block text-[10px] text-ink-soft">
            Si la dejas sin marcar, la nota será privada del AA encargado. Nunca
            es una evaluación ni una nota académica.
          </span>
        </span>
      </label>

      {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success" className="text-xs">{state.success}</Alert>
      ) : null}

      <SubmitButton variant="secondary" size="sm">
        <MessageSquarePlus aria-hidden="true" />
        {noteId ? "Guardar cambios" : "Guardar nota"}
      </SubmitButton>
    </form>
  );
}
