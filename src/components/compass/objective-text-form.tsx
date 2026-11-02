"use client";

import { useState } from "react";
import { CloudOff, PenLine } from "lucide-react";

import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createOfflineEditId,
  enqueueOfflineEdit,
  isOffline,
} from "@/features/compass/offline-sync";

export function ObjectiveTextForm({
  objectiveId,
  currentText,
  userId,
}: {
  objectiveId: string;
  currentText: string;
  userId?: string;
}) {
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = String(formData.get("currentText") ?? "").trim();

    if (!userId) {
      setError("No pudimos identificar tu sesión. Recarga la página.");
      return;
    }

    if (text.length < 3) {
      setError("Escribe al menos una frase para tu objetivo.");
      return;
    }

    const wasOffline = isOffline();

    enqueueOfflineEdit(userId, {
      id: createOfflineEditId(),
      kind: "OBJECTIVE_TEXT",
      objectiveId,
      offlineBaseText: currentText,
      offlineNewText: text,
      createdAt: new Date().toISOString(),
    });

    setError(null);
    setQueuedMessage(
      wasOffline
        ? "Sin conexión: guardamos tu redacción en este dispositivo. Se sincronizará al recuperar la red sin perder ninguna versión."
        : "Guardamos tu redacción en este dispositivo y la estamos sincronizando. Si la red falla, quedará pendiente aquí.",
    );
    window.dispatchEvent(new Event("lankuyen:compass-queue"));
    form.reset();
  }

  return (
    <details className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-anil-800 marker:text-anil-500">
        Reformular mi objetivo
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <Label htmlFor={`objective-text-${objectiveId}`} className="text-[11px]">
          Nueva redacción
        </Label>
        <Textarea
          id={`objective-text-${objectiveId}`}
          name="currentText"
          defaultValue={currentText}
          maxLength={2000}
          className="min-h-20"
          required
        />
        <p className="text-[10px] leading-relaxed text-ink-soft">
          Tu redacción anterior se conserva siempre en el historial. Si el
          objetivo cambió en otro dispositivo, se guardan ambas versiones.
        </p>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-2 text-[11px] text-red-800">
            {error}
          </p>
        ) : null}

        {queuedMessage ? (
          <p className="inline-flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
            <CloudOff
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            {queuedMessage}
          </p>
        ) : null}

        <SubmitButton size="sm" pendingLabel="Guardando…">
          <PenLine aria-hidden="true" />
          Guardar nueva redacción
        </SubmitButton>
      </form>
    </details>
  );
}
