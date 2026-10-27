"use client";

import { useActionState, useState } from "react";
import {
  CalendarDays,
  Check,
  Image as ImageIcon,
  MessageSquareQuote,
  ThumbsDown,
  UserRound,
} from "lucide-react";

import { MarkdownContent } from "@/components/material/markdown-content";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { reviewLogbookEntryAction } from "@/features/logbook/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { LOGBOOK_REJECTION_MAX } from "@/lib/logbook";

export interface ReviewEntryView {
  id: string;
  title: string;
  adventureDate: string;
  contentMd: string;
  photoFileId: string | null;
  submittedAt: string;
  authorName: string;
  authorUsername: string;
  communityName: string | null;
  status: "PENDIENTE_APROBACION" | "PUBLICADA" | "RECHAZADA";
  pageNumber: number | null;
  rejectionReason: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

export function LogbookReviewCard({ entry }: { entry: ReviewEntryView }) {
  const [state, formAction] = useActionState(
    reviewLogbookEntryAction,
    EMPTY_ACTION_STATE,
  );
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <article
      id={`pagina-${entry.id}`}
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 bg-canvas/40 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Pendiente</Badge>
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
              <CalendarDays className="size-3" aria-hidden="true" />
              {formatDateOnly(entry.adventureDate)}
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-ink">
            {entry.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3" aria-hidden="true" />
              {entry.authorName} · @{entry.authorUsername}
              {entry.communityName ? ` · ${entry.communityName}` : ""}
            </span>
            <span>Enviada el {formatTimestamp(entry.submittedAt)}</span>
          </p>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        {entry.photoFileId ? (
          <a
            href={`/api/files/${entry.photoFileId}`}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-line bg-canvas/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${entry.photoFileId}`}
              alt={`Fotografía de ${entry.title}`}
              className="max-h-64 w-full object-contain"
            />
            <span className="flex items-center justify-center gap-1 border-t border-line/70 bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              <ImageIcon className="size-3" aria-hidden="true" />
              Abrir fotografía
            </span>
          </a>
        ) : null}

        <div className="max-h-72 overflow-y-auto rounded-xl border border-line/70 bg-canvas/25 px-4 py-3">
          <MarkdownContent content={entry.contentMd} />
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="entryId" value={entry.id} />

          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.success ? <Alert variant="success">{state.success}</Alert> : null}

          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton
              name="decision"
              value="approve"
              pendingLabel="Aprobando…"
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              <Check aria-hidden="true" />
              Aprobar y numerar
            </SubmitButton>
            <button
              type="button"
              onClick={() => setShowReject((current) => !current)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
            >
              <ThumbsDown aria-hidden="true" />
              {showReject ? "Cancelar rechazo" : "Rechazar con feedback"}
            </button>
          </div>

          {showReject ? (
            <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/60 p-3.5">
              <label
                htmlFor={`reason-${entry.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-900"
              >
                <MessageSquareQuote className="size-3.5" aria-hidden="true" />
                Motivo para el autor
              </label>
              <Textarea
                id={`reason-${entry.id}`}
                name="rejectionReason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                maxLength={LOGBOOK_REJECTION_MAX}
                placeholder="Ej. Falta el nombre de la comunidad y la fecha no coincide con la actividad. Corrige esos datos y reenvía."
                className="bg-white"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-red-800/70">
                  {rejectReason.length} / {LOGBOOK_REJECTION_MAX} caracteres
                </span>
                <SubmitButton
                  name="decision"
                  value="reject"
                  variant="danger"
                  size="sm"
                  pendingLabel="Rechazando…"
                >
                  <ThumbsDown aria-hidden="true" />
                  Enviar rechazo
                </SubmitButton>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </article>
  );
}

export function ReviewedLogbookCard({ entry }: { entry: ReviewEntryView }) {
  const approved = entry.status === "PUBLICADA";

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={approved ? "success" : "danger"}>
              {approved ? `Publicada · Página ${entry.pageNumber}` : "Rechazada"}
            </Badge>
            <span className="text-[11px] text-ink-soft">
              {formatDateOnly(entry.adventureDate)}
            </span>
          </div>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">
            {entry.title}
          </h3>
          <p className="text-[11px] text-ink-soft">
            {entry.authorName}
            {entry.communityName ? ` · ${entry.communityName}` : ""}
          </p>
        </div>
        <p className="text-right text-[10px] text-ink-soft">
          {entry.reviewedByName ? `Revisó ${entry.reviewedByName}` : null}
          {entry.reviewedAt ? (
            <span className="block">{formatTimestamp(entry.reviewedAt)}</span>
          ) : null}
        </p>
      </div>

      {!approved && entry.rejectionReason ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-900">
          <strong className="font-semibold">Motivo:</strong>{" "}
          {entry.rejectionReason}
        </p>
      ) : null}
    </article>
  );
}
