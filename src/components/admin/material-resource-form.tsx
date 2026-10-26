"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import { MarkdownContent } from "@/components/material/markdown-content";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveMaterialResourceAction } from "@/features/material/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  findMaterialCore,
  MATERIAL_IMAGE_ACCEPT,
  MATERIAL_IMAGE_HINT,
  materialToneForSlug,
} from "@/lib/material";
import { cn } from "@/lib/utils";

interface EditableResource {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMd: string;
  sortOrder: number;
  isPublished: boolean;
  imageFileId: string | null;
}

interface MaterialResourceFormProps {
  mode: "create" | "edit";
  resource?: EditableResource;
  nextSortOrder?: number;
}

export function MaterialResourceForm({
  mode,
  resource,
  nextSortOrder = 60,
}: MaterialResourceFormProps) {
  const [state, formAction] = useActionState(
    saveMaterialResourceAction,
    EMPTY_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState(resource?.bodyMd ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const tone = materialToneForSlug(resource?.slug ?? "");
  const core = resource ? findMaterialCore(resource.slug) : null;
  const existingImage =
    resource?.imageFileId && !removeImage && !preview
      ? `/api/files/${resource.imageFileId}`
      : null;
  const imageSrc = preview ?? existingImage;

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!state.success) return;

    // `reset()` dispara `onReset`, donde se limpian los campos controlados.
    if (mode === "create") {
      formRef.current?.reset();
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [state.success, mode]);

  const fieldId = resource?.id ?? "nuevo";

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={() => {
        setBody(resource?.bodyMd ?? "");
        setPreview(null);
        setRemoveImage(false);
      }}
      className="space-y-5"
    >
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <div className="grid gap-5 xl:grid-cols-[1.08fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor={`material-title-${fieldId}`}>Título</Label>
              <Input
                id={`material-title-${fieldId}`}
                name="title"
                defaultValue={resource?.title}
                placeholder="Ej. Historia de Lankuyen"
                maxLength={160}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`material-sort-${fieldId}`}>Orden</Label>
              <Input
                id={`material-sort-${fieldId}`}
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                step={1}
                defaultValue={resource?.sortOrder ?? nextSortOrder}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`material-summary-${fieldId}`}>
              Resumen{" "}
              <span className="normal-case tracking-normal">(opcional)</span>
            </Label>
            <Input
              id={`material-summary-${fieldId}`}
              name="summary"
              defaultValue={resource?.summary ?? ""}
              placeholder="Una frase que invite a leer el recurso"
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={`material-body-${fieldId}`}>
                Contenido (Markdown)
              </Label>
              <span className="text-[11px] text-ink-soft">
                {body.length.toLocaleString("es-CL")} caracteres
              </span>
            </div>
            <Textarea
              id={`material-body-${fieldId}`}
              name="bodyMd"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={"# Título\n\nEscribe aquí los versos, las estrofas o la explicación.\n\n**Negritas**, *cursivas* y listas con - guiones."}
              rows={16}
              maxLength={60000}
              required
              className="min-h-[320px] font-mono text-[13px] leading-relaxed"
            />
            <p className="text-[11px] leading-relaxed text-ink-soft">
              Los saltos de línea se conservan al leer: úsalos para versos,
              estrofas y respuestas. Puedes usar encabezados (#), citas (&gt;),
              listas, negritas y enlaces.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-anil-50 text-anil-700">
                <ImagePlus className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`material-image-${fieldId}`}>
                  Imagen{" "}
                  <span className="normal-case tracking-normal">
                    (bandera o ilustración)
                  </span>
                </Label>
                <Input
                  ref={fileInputRef}
                  id={`material-image-${fieldId}`}
                  name="image"
                  type="file"
                  accept={MATERIAL_IMAGE_ACCEPT}
                  className="h-auto cursor-pointer py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-anil-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setPreview(file ? URL.createObjectURL(file) : null);
                    if (file) setRemoveImage(false);
                  }}
                />
                <p className="text-[11px] text-ink-soft">{MATERIAL_IMAGE_HINT}</p>

                {imageSrc ? (
                  <div className="space-y-2 pt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="Vista previa de la imagen del recurso"
                      className="max-h-36 w-full rounded-lg border border-line bg-white object-contain p-1"
                    />
                    {resource?.imageFileId && !preview ? (
                      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-red-700">
                        <input
                          type="checkbox"
                          name="removeImage"
                          checked={removeImage}
                          onChange={(event) => setRemoveImage(event.target.checked)}
                          className="size-3.5 accent-red-700"
                        />
                        <Trash2 className="size-3" aria-hidden="true" />
                        Quitar la imagen actual al guardar
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {mode === "create" ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface p-3.5">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={false}
                className="mt-0.5 size-4 accent-anil-700"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Publicar ahora
                </span>
                <span className="block text-[11px] text-ink-soft">
                  Si lo dejas sin marcar, el recurso quedará en borrador y solo
                  los AA podrán verlo hasta que lo publiques.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-[11px] text-ink-soft">
              El estado de publicación se cambia con el botón Publicar / Volver a
              borrador de la tarjeta, para que quede auditado por separado.
            </p>
          )}

          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.success ? (
            <Alert variant="success">{state.success}</Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton size="sm" pendingLabel="Guardando…">
              <Save aria-hidden="true" />
              {mode === "create" ? "Crear recurso" : "Guardar cambios"}
            </SubmitButton>
            <p className="text-[11px] text-ink-soft">
              Cada cambio queda registrado en la auditoría de la unidad.
            </p>
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-line bg-canvas/50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Vista previa en vivo
              </p>
              <Badge variant="outline">
                {core?.label ?? "Recurso de biblioteca"}
              </Badge>
            </div>

            <div
              className={cn(
                "mt-3 min-h-64 rounded-xl border p-4 shadow-card sm:p-5",
                tone === "grito"
                  ? "border-anil-900 bg-anil-950 text-white"
                  : "border-line bg-surface",
              )}
            >
              {body.trim() ? (
                <MarkdownContent
                  content={body}
                  tone={tone}
                  omitHeading={resource?.title}
                />
              ) : (
                <p
                  className={cn(
                    "flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm",
                    tone === "grito" ? "text-anil-200/60" : "text-ink-soft",
                  )}
                >
                  <LoaderCircle className="size-5 opacity-50" aria-hidden="true" />
                  Escribe el contenido para ver cómo quedará al leerlo desde el
                  teléfono.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
