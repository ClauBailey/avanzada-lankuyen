"use client";

import { useEffect, useState } from "react";
import { Download, LoaderCircle, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatFullDate } from "@/lib/dates";
import { badgeShareFilename, badgeShareMotto } from "@/lib/logbook";

export interface BadgeShareIdentity {
  fullName: string;
  username: string;
  communityName: string | null;
}

export interface ShareableBadge {
  code: string;
  name: string;
  imagePath: string;
  category: "ETAPA" | "COMPETENCIA" | "PROMESA";
}

interface BadgeShareDialogProps {
  onClose: () => void;
  badge: ShareableBadge;
  grant: { grantedAt: string; note: string | null };
  identity: BadgeShareIdentity;
}

const WIDTH = 1080;
const HEIGHT = 1920;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No pudimos cargar ${src}.`));
    image.src = src;
  });
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawCenteredLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function drawTopography(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.055)";
  context.lineWidth = 2;

  for (let row = 0; row < 18; row += 1) {
    const baseY = 80 + row * 112;
    context.beginPath();
    for (let x = -40; x <= WIDTH + 40; x += 12) {
      const y =
        baseY +
        Math.sin(x / 150 + row * 0.6) * 26 +
        Math.sin(x / 61 + row) * 10;
      if (x === -40) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  // Sol/contorno de cumbre al fondo.
  context.strokeStyle = "rgba(201, 162, 74, 0.16)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(WIDTH - 190, 250, 150, 0, Math.PI * 2);
  context.stroke();

  context.restore();
}

async function renderBadgeStory({
  badge,
  grant,
  identity,
}: Omit<BadgeShareDialogProps, "onClose">) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("El navegador no pudo preparar la imagen.");

  const [logo, badgeImage] = await Promise.all([
    loadImage("/brand/logo-lankuyen.svg"),
    loadImage(badge.imagePath),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  // Fondo Añil con gradiente profundo.
  const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#101231");
  background.addColorStop(0.52, "#26295e");
  background.addColorStop(1, "#15173a");
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  drawTopography(context);

  // Halo dorado tras la tarjeta.
  const glow = context.createRadialGradient(
    WIDTH / 2,
    780,
    40,
    WIDTH / 2,
    900,
    620,
  );
  glow.addColorStop(0, "rgba(201, 162, 74, 0.22)");
  glow.addColorStop(1, "rgba(201, 162, 74, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 200, WIDTH, 1400);

  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  // Cabecera: logo + nombre de la unidad.
  context.save();
  roundRect(context, WIDTH / 2 - 58, 92, 116, 116, 58);
  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  context.fill();
  context.strokeStyle = "rgba(201, 162, 74, 0.55)";
  context.lineWidth = 3;
  context.stroke();
  context.drawImage(logo, WIDTH / 2 - 40, 110, 80, 80);
  context.restore();

  context.fillStyle = "#f5e8c8";
  context.font = '600 27px "Inter", Arial, sans-serif';
  context.fillText(
    "AVANZADA LANKUYEN · GRUPO GUÍAS Y SCOUTS ALFA CRUZ",
    WIDTH / 2,
    276,
  );

  // Tarjeta central.
  const cardX = 86;
  const cardY = 330;
  const cardWidth = WIDTH - cardX * 2;
  const cardHeight = 1170;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 70;
  context.shadowOffsetY = 28;
  roundRect(context, cardX, cardY, cardWidth, cardHeight, 54);
  const cardGradient = context.createLinearGradient(
    cardX,
    cardY,
    cardX + cardWidth,
    cardY + cardHeight,
  );
  cardGradient.addColorStop(0, "#fffdf8");
  cardGradient.addColorStop(0.6, "#ffffff");
  cardGradient.addColorStop(1, "#fbf4e4");
  context.fillStyle = cardGradient;
  context.fill();
  context.restore();

  context.save();
  roundRect(context, cardX, cardY, cardWidth, cardHeight, 54);
  context.strokeStyle = "rgba(201, 162, 74, 0.55)";
  context.lineWidth = 3;
  context.stroke();
  roundRect(context, cardX + 18, cardY + 18, cardWidth - 36, cardHeight - 36, 42);
  context.strokeStyle = "rgba(59, 64, 144, 0.14)";
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();

  // Insignia a todo color.
  const badgeSize = 340;
  const badgeCenterY = cardY + 250;

  context.save();
  context.beginPath();
  context.arc(WIDTH / 2, badgeCenterY, badgeSize / 2 + 24, 0, Math.PI * 2);
  const badgeHalo = context.createRadialGradient(
    WIDTH / 2,
    badgeCenterY,
    badgeSize * 0.3,
    WIDTH / 2,
    badgeCenterY,
    badgeSize * 0.72,
  );
  badgeHalo.addColorStop(0, "rgba(201, 162, 74, 0.24)");
  badgeHalo.addColorStop(1, "rgba(201, 162, 74, 0)");
  context.fillStyle = badgeHalo;
  context.fill();

  context.beginPath();
  context.arc(WIDTH / 2, badgeCenterY, badgeSize / 2 + 8, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.strokeStyle = "rgba(201, 162, 74, 0.65)";
  context.lineWidth = 4;
  context.stroke();
  context.restore();

  context.drawImage(
    badgeImage,
    WIDTH / 2 - badgeSize / 2,
    badgeCenterY - badgeSize / 2,
    badgeSize,
    badgeSize,
  );

  // Etiqueta de categoría.
  const categoryLabel =
    badge.category === "ETAPA"
      ? "INSIGNIA DE ETAPA"
      : badge.category === "PROMESA"
        ? "INSIGNIA DE LA PROMESA"
        : "INSIGNIA DE COMPETENCIA";

  context.font = '700 22px "Inter", Arial, sans-serif';
  const labelWidth = context.measureText(categoryLabel).width + 48;
  roundRect(context, WIDTH / 2 - labelWidth / 2, cardY + 462, labelWidth, 44, 22);
  context.fillStyle = "#f5e8c8";
  context.fill();
  context.fillStyle = "#7a5a16";
  context.fillText(categoryLabel, WIDTH / 2, cardY + 492);

  // Título principal.
  context.fillStyle = "#1a1d33";
  context.font = '600 62px "Fraunces", Georgia, serif';
  const titleLines = wrapLines(
    context,
    `¡Felicidades por tu ${badge.name}!`,
    cardWidth - 130,
  ).slice(0, 3);
  drawCenteredLines(
    context,
    titleLines,
    WIDTH / 2,
    cardY + 580,
    70,
  );

  const afterTitleY = cardY + 580 + (titleLines.length - 1) * 70;

  // Nombre y usuario.
  context.fillStyle = "#26295e";
  context.font = '700 46px "Inter", Arial, sans-serif';
  context.fillText(identity.fullName, WIDTH / 2, afterTitleY + 92);

  context.fillStyle = "#626784";
  context.font = '500 30px "Inter", Arial, sans-serif';
  context.fillText(`@${identity.username}`, WIDTH / 2, afterTitleY + 140);

  let infoY = afterTitleY + 140;

  if (identity.communityName) {
    context.font = '600 24px "Inter", Arial, sans-serif';
    const communityLabel = identity.communityName;
    const width = context.measureText(communityLabel).width + 52;
    roundRect(context, WIDTH / 2 - width / 2, infoY + 26, width, 46, 23);
    context.fillStyle = "#e6e8f8";
    context.fill();
    context.fillStyle = "#3b4090";
    context.fillText(communityLabel, WIDTH / 2, infoY + 57);
    infoY += 76;
  }

  // Fecha de otorgamiento en hora de Chile.
  context.fillStyle = "#626784";
  context.font = '500 26px "Inter", Arial, sans-serif';
  context.fillText(
    `Otorgada el ${formatFullDate(grant.grantedAt)}`,
    WIDTH / 2,
    infoY + 58,
  );

  // Dedicatoria del AA o lema por defecto.
  const quote = grant.note?.trim()
    ? grant.note.trim()
    : badgeShareMotto(badge.code, badge.category);

  const quoteBoxX = cardX + 64;
  const quoteBoxY = infoY + 96;
  const quoteBoxWidth = cardWidth - 128;

  context.font = 'italic 500 28px "Inter", Arial, sans-serif';
  const quoteLines = wrapLines(
    context,
    `“${quote}”`,
    quoteBoxWidth - 72,
  ).slice(0, 4);
  const quoteBoxHeight = 58 + quoteLines.length * 40;

  roundRect(
    context,
    quoteBoxX,
    quoteBoxY,
    quoteBoxWidth,
    quoteBoxHeight,
    24,
  );
  context.fillStyle = "rgba(245, 232, 200, 0.55)";
  context.fill();
  context.strokeStyle = "rgba(201, 162, 74, 0.4)";
  context.lineWidth = 1.5;
  context.stroke();

  context.fillStyle = "#4b3b23";
  drawCenteredLines(
    context,
    quoteLines,
    WIDTH / 2,
    quoteBoxY + 52,
    40,
  );

  // Pie de la tarjeta.
  context.fillStyle = "#8d7442";
  context.font = '600 20px "Inter", Arial, sans-serif';
  context.fillText(
    "SIEMPRE MÁS ALTO · SIEMPRE MÁS LEJOS · SIEMPRE JUNTOS",
    WIDTH / 2,
    cardY + cardHeight - 52,
  );

  // Pie de la imagen.
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.font = '500 25px "Inter", Arial, sans-serif';
  context.fillText(
    "Un camino que se recorre en comunidad",
    WIDTH / 2,
    HEIGHT - 132,
  );
  context.fillStyle = "rgba(201, 162, 74, 0.9)";
  context.font = '600 22px "Inter", Arial, sans-serif';
  context.fillText("avanzadalankuyen.cl", WIDTH / 2, HEIGHT - 86);

  return canvas;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

export function BadgeShareDialog({
  onClose,
  badge,
  grant,
  identity,
}: BadgeShareDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const filename = badgeShareFilename(badge.name, identity.username);

  useEffect(() => {
    let cancelled = false;

    renderBadgeStory({ badge, grant, identity })
      .then((canvas) => {
        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL("image/png"));
      })
      .catch((renderError: unknown) => {
        if (cancelled) return;
        setError(
          renderError instanceof Error
            ? renderError.message
            : "No pudimos generar la imagen de la insignia.",
        );
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [badge, grant, identity]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleDownload() {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleShare() {
    setShareFeedback(null);

    if (!previewUrl) return;

    try {
      const file = new File([dataUrlToBlob(previewUrl)], filename, {
        type: "image/png",
      });

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `¡Felicidades por tu ${badge.name}!`,
          text: `Comparto mi insignia ${badge.name} de la Avanzada Lankuyen.`,
        });
        return;
      }

      handleDownload();
      setShareFeedback(
        "Tu navegador no permite compartir archivos. Descargamos la imagen para que puedas subirla a tus historias.",
      );
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      handleDownload();
      setShareFeedback(
        "No pudimos abrir el menú de compartir. Descargamos la imagen por ti.",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-share-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-anil-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-anil-950 shadow-float lg:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Cerrar vista previa"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-anil-950 p-4 sm:p-6">
          {rendering || !previewUrl ? (
            <div className="flex flex-col items-center gap-3 py-16 text-anil-100">
              <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
              <p className="text-sm">Preparando tu historia 9:16…</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`Vista previa de la insignia ${badge.name} para compartir`}
              className="max-h-[76vh] w-auto rounded-xl shadow-float"
            />
          )}
        </div>

        <div className="w-full shrink-0 space-y-4 border-t border-white/10 bg-anil-900 p-5 text-white lg:w-80 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Historia 9:16 · 1080 × 1920
            </p>
            <h2
              id="badge-share-title"
              className="mt-1 font-display text-2xl font-semibold leading-tight"
            >
              Comparte tu {badge.name}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-anil-100/75">
              Una imagen lista para Instagram Stories o WhatsApp, generada en tu
              dispositivo.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="gold"
              className="w-full"
              onClick={() => void handleShare()}
              disabled={!previewUrl || rendering}
            >
              <Share2 aria-hidden="true" />
              Compartir
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDownload}
              disabled={!previewUrl || rendering}
            >
              <Download aria-hidden="true" />
              Descargar imagen PNG
            </Button>
          </div>

          <p className="break-all rounded-lg bg-white/5 px-3 py-2 font-mono text-[10px] text-anil-100/70">
            {filename}
          </p>

          {error ? (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          ) : null}

          {shareFeedback ? (
            <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold-soft">
              {shareFeedback}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
