"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ImagePlus,
  LoaderCircle,
  PenLine,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createLogbookEntryAction,
  updateLogbookEntryAction,
} from "@/features/logbook/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  isAllowedLogbookPhotoMime,
  LOGBOOK_CONTENT_MAX,
  LOGBOOK_PHOTO_ACCEPT,
  LOGBOOK_PHOTO_HINT,
  LOGBOOK_PHOTO_MAX_BYTES,
  LOGBOOK_PHOTO_MAX_SIDE,
  LOGBOOK_PHOTO_QUALITY,
  LOGBOOK_TITLE_MAX,
} from "@/lib/logbook";

interface ActivityOption {
  id: string;
  title: string;
}

interface EditableLogbookEntry {
  id: string;
  title: string;
  adventureDate: string;
  contentMd: string;
  activityId: string | null;
  photoFileId: string | null;
  rejectionReason: string | null;
}

interface LogbookEntryFormProps {
  mode: "create" | "edit";
  today: string;
  activities: ActivityOption[];
  entry?: EditableLogbookEntry;
  canReview: boolean;
}

function bytesLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressPhoto(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("No pudimos leer la imagen."));
      element.src = objectUrl;
    });

    const largestSide = Math.max(image.width, image.height);
    const scale = Math.min(1, LOGBOOK_PHOTO_MAX_SIDE / largestSide);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("El navegador no pudo preparar la imagen.");

    context.drawImage(image, 0, 0, width, height);

    const blob =
      (await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", LOGBOOK_PHOTO_QUALITY);
      })) ??
      (await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", LOGBOOK_PHOTO_QUALITY);
      }));

    if (!blob) throw new Error("No pudimos optimizar la imagen.");

    const extension =
      blob.type === "image/jpeg"
        ? "jpg"
        : blob.type === "image/png"
          ? "png"
          : "webp";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto-bitacora";
    return new File([blob], `${baseName}.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function LogbookEntryForm({
  mode,
  today,
  activities,
  entry,
  canReview,
}: LogbookEntryFormProps) {
  const [state, formAction] = useActionState(
    mode === "create" ? createLogbookEntryAction : updateLogbookEntryAction,
    EMPTY_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(entry?.contentMd ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<string | null>(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!state.success || mode !== "create") return;

    // Se limpia después del render para no encadenar actualizaciones de estado.
    const frame = window.requestAnimationFrame(() => {
      formRef.current?.reset();
      setContent("");
      setPreview(null);
      setPhotoInfo(null);
      setPhotoError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });

    return () => window.cancelAnimationFrame(frame);
  }, [state.success, mode]);

  const existingPhoto =
    entry?.photoFileId && !preview && !removeCurrentPhoto
      ? `/api/files/${entry.photoFileId}`
      : null;
  const currentPhotoSrc = preview ?? existingPhoto;

  async function handlePhoto(file: File | undefined) {
    setPhotoError(null);
    setPhotoInfo(null);

    if (!file) {
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!isAllowedLogbookPhotoMime(file.type)) {
      setPhotoError("La foto debe ser JPG, PNG o WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProcessing(true);

    try {
      const optimized = await compressPhoto(file);

      if (optimized.size > LOGBOOK_PHOTO_MAX_BYTES) {
        throw new Error(
          `La foto optimizada pesa ${bytesLabel(optimized.size)} y supera el máximo de 1.5 MB.`,
        );
      }

      const transfer = new DataTransfer();
      transfer.items.add(optimized);
      if (fileInputRef.current) fileInputRef.current.files = transfer.files;

      setPreview(URL.createObjectURL(optimized));
      const optimizedLabel =
        optimized.type === "image/png"
          ? "PNG"
          : optimized.type === "image/jpeg"
            ? "JPG"
            : "WEBP";
      setPhotoInfo(
        `${optimizedLabel} optimizado · ${bytesLabel(optimized.size)}`,
      );
      setRemoveCurrentPhoto(false);
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "No pudimos optimizar la foto. Prueba con otra imagen.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}

      {entry?.rejectionReason ? (
        <Alert variant="error">
          <strong className="font-semibold">Motivo del rechazo:</strong>{" "}
          {entry.rejectionReason}. Corrige el relato y vuelve a enviarlo.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1.7fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="logbook-title">Título de la aventura</Label>
          <Input
            id="logbook-title"
            name="title"
            defaultValue={entry?.title}
            placeholder="Ej. La noche bajo las estrellas"
            maxLength={LOGBOOK_TITLE_MAX}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logbook-date">Fecha de la aventura</Label>
          <Input
            id="logbook-date"
            name="adventureDate"
            type="date"
            defaultValue={entry?.adventureDate ?? today}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logbook-activity">
          Vincular a una actividad pasada{" "}
          <span className="normal-case tracking-normal">(opcional)</span>
        </Label>
        <select
          id="logbook-activity"
          name="activityId"
          defaultValue={entry?.activityId ?? ""}
          className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink shadow-sm"
        >
          <option value="">Sin actividad vinculada</option>
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.title}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-ink-soft">
          Solo aparecen actividades publicadas cuya hora de término ya pasó.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="logbook-content">Relato de la experiencia</Label>
          <span className="text-[11px] text-ink-soft">
            {content.length.toLocaleString("es-CL")} /{" "}
            {LOGBOOK_CONTENT_MAX.toLocaleString("es-CL")} caracteres
          </span>
        </div>
        <Textarea
          id="logbook-content"
          name="contentMd"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            "Cuenta qué pasó, quiénes estuvieron y qué aprendió la unidad.\n\nPuedes usar **negritas**, *cursivas*, encabezados (#), citas (>) y listas."
          }
          rows={14}
          maxLength={LOGBOOK_CONTENT_MAX}
          required
          className="min-h-[300px] font-mono text-[13px] leading-relaxed"
        />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Se admite Markdown sencillo. El texto se muestra de forma segura, sin
          ejecutar HTML.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-anil-50 text-anil-700">
            {processing ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="logbook-photo">
              Fotografía{" "}
              <span className="normal-case tracking-normal">(opcional, 1 foto)</span>
            </Label>
            <Input
              ref={fileInputRef}
              id="logbook-photo"
              name="photo"
              type="file"
              accept={LOGBOOK_PHOTO_ACCEPT}
              disabled={processing}
              className="h-auto cursor-pointer py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-anil-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              onChange={(event) => void handlePhoto(event.target.files?.[0])}
            />
            <p className="text-[11px] text-ink-soft">{LOGBOOK_PHOTO_HINT}</p>
            {photoInfo ? (
              <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <Sparkles className="size-3" aria-hidden="true" />
                {photoInfo}
              </p>
            ) : null}
            {photoError ? (
              <p className="text-[11px] font-medium text-red-700">{photoError}</p>
            ) : null}

            {currentPhotoSrc ? (
              <div className="space-y-2 pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPhotoSrc}
                  alt="Vista previa de la fotografía de la página"
                  className="max-h-52 w-full rounded-lg border border-line bg-white object-contain p-1"
                />
                {entry?.photoFileId && !preview ? (
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-red-700">
                    <input
                      type="checkbox"
                      name="removePhoto"
                      checked={removeCurrentPhoto}
                      onChange={(event) =>
                        setRemoveCurrentPhoto(event.target.checked)
                      }
                      className="size-3.5 accent-red-700"
                    />
                    <Trash2 className="size-3" aria-hidden="true" />
                    Quitar la foto actual al guardar
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {canReview ? (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gold/40 bg-gold-soft/30 p-3.5">
          <input
            type="checkbox"
            name="publishNow"
            defaultChecked
            className="mt-0.5 size-4 accent-anil-700"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              Publicar de inmediato
            </span>
            <span className="block text-[11px] text-ink-soft">
              Como AA o Guardián de La Bitácora puedes sumar la página al libro
              sin pasar por la bandeja de revisión.
            </span>
          </span>
        </label>
      ) : (
        <p className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-soft">
          <PenLine className="mt-0.5 size-3.5 shrink-0 text-anil-600" aria-hidden="true" />
          Tu página quedará pendiente hasta que un AA o el Guardián de La
          Bitácora la revise.
        </p>
      )}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton pendingLabel="Guardando página…">
          <PenLine aria-hidden="true" />
          {mode === "create" ? "Enviar página" : "Guardar y reenviar"}
        </SubmitButton>
        <Badge variant="outline">
          <CalendarDays className="size-3" aria-hidden="true" />
          Fecha en hora de Chile
        </Badge>
      </div>
    </form>
  );
}
