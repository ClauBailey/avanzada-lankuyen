"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Feather,
  Image as ImageIcon,
  ShieldCheck,
  X,
} from "lucide-react";

import { MarkdownContent } from "@/components/material/markdown-content";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface LogbookPageView {
  id: string;
  pageNumber: number;
  title: string;
  adventureDate: string;
  contentMd: string;
  authorName: string;
  communityName: string | null;
  photoFileId: string | null;
}

interface LogbookBookProps {
  entries: LogbookPageView[];
  keeperName: string | null;
  canReview: boolean;
  canWrite: boolean;
  reviewHref: string;
}

export function LogbookBook({
  entries,
  keeperName,
  canReview,
  canWrite,
  reviewHref,
}: LogbookBookProps) {
  // -1 = portada, 0..n-1 = páginas, n = página en blanco.
  const [current, setCurrent] = useState(-1);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const total = entries.length;
  const blankIndex = total;
  const page = current >= 0 && current < total ? entries[current] : null;

  const goTo = useCallback(
    (target: number) => {
      setCurrent(Math.max(-1, Math.min(blankIndex, target)));
    },
    [blankIndex],
  );

  const previous = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (lightbox) {
        if (event.key === "Escape") setLightbox(null);
        return;
      }
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, previous, next]);

  useEffect(() => {
    let startX: number | null = null;

    function onTouchStart(event: TouchEvent) {
      startX = event.touches[0]?.clientX ?? null;
    }

    function onTouchEnd(event: TouchEvent) {
      if (startX === null) return;
      const endX = event.changedTouches[0]?.clientX ?? startX;
      const delta = endX - startX;
      if (Math.abs(delta) < 55) return;
      if (delta > 0) previous();
      else next();
      startX = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [previous, next]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#c9b68e] bg-[#e9dcc0] p-2 shadow-float sm:p-3">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[#b9a27a]/25" />
        <div className="relative overflow-hidden rounded-[1.6rem] border border-[#d7c7a6] bg-[#f7f0df]">
          <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.16]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#cbb88f]/45 to-transparent sm:w-12" />
          <div className="pointer-events-none absolute inset-y-0 left-3 w-px bg-[#b9a27a]/35 sm:left-5" />

          <div className="relative min-h-[560px] px-5 py-6 sm:px-10 sm:py-9 lg:px-14">
            {current === -1 ? (
              <Cover
                entries={entries}
                keeperName={keeperName}
                canReview={canReview}
                canWrite={canWrite}
                reviewHref={reviewHref}
                onOpenPage={goTo}
              />
            ) : current === blankIndex ? (
              <BlankPage canWrite={canWrite} />
            ) : page ? (
              <article key={page.id} className="logbook-page-enter mx-auto max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d7442]">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="size-3.5" aria-hidden="true" />
                    La Bitácora
                  </span>
                  <span>{formatDateOnly(page.adventureDate)}</span>
                </div>

                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#2b2417] sm:text-4xl">
                  {page.title}
                </h2>
                <div className="mt-3 flex h-px w-24 bg-gradient-to-r from-gold to-transparent" />

                {page.photoFileId ? (
                  <button
                    type="button"
                    onClick={() => setLightbox(`/api/files/${page.photoFileId}`)}
                    className="group mx-auto mt-6 block w-full max-w-md rotate-[-1.4deg] rounded-sm border border-[#d9c8a5] bg-white p-2.5 pb-9 shadow-[0_18px_30px_-22px_rgba(60,45,20,0.55)] transition-transform hover:rotate-0 focus-visible:rotate-0"
                    aria-label="Ampliar fotografía de la página"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${page.photoFileId}`}
                      alt={`Fotografía de ${page.title}`}
                      className="max-h-[420px] w-full object-cover"
                    />
                    <span className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d7442]">
                      <ImageIcon className="size-3" aria-hidden="true" />
                      Toca para ampliar
                    </span>
                  </button>
                ) : null}

                <div className="mt-6">
                  <MarkdownContent content={page.contentMd} />
                </div>

                <footer className="mt-8 border-t border-[#d9c8a5] pt-4">
                  <p className="font-display text-sm font-semibold italic text-[#4b3b23]">
                    Escrito por {page.authorName}
                    {page.communityName ? ` (${page.communityName})` : ""}
                  </p>
                  <p className="mt-1 text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9b8352]">
                    Página {page.pageNumber}
                  </p>
                </footer>
              </article>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={previous}
            disabled={current === -1}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ChevronLeft aria-hidden="true" />
            Página anterior
          </button>
          <button
            type="button"
            onClick={next}
            disabled={current === blankIndex}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Página siguiente
            <ChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {current !== -1 ? (
            <button
              type="button"
              onClick={() => goTo(-1)}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ArrowLeft aria-hidden="true" />
              Portada e índice
            </button>
          ) : null}
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink-soft">
            {current === -1
              ? "Portada"
              : current === blankIndex
                ? "Página en blanco"
                : `Página ${page?.pageNumber ?? current + 1} de ${total}`}
          </span>
        </div>
      </div>

      <p className="text-center text-[11px] text-ink-soft">
        Usa las flechas del teclado o desliza sobre el libro para pasar las
        páginas.
      </p>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fotografía ampliada"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-anil-950/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar fotografía"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Fotografía ampliada de La Bitácora"
            className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-float"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

function Cover({
  entries,
  keeperName,
  canReview,
  canWrite,
  reviewHref,
  onOpenPage,
}: {
  entries: LogbookPageView[];
  keeperName: string | null;
  canReview: boolean;
  canWrite: boolean;
  reviewHref: string;
  onOpenPage: (index: number) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#c9b68e] bg-[#efe3c9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7e6635]">
          <BookOpen className="size-3.5" aria-hidden="true" />
          Libro de aventuras de la unidad
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-none text-[#2b2417] sm:text-6xl">
          La Bitácora
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6d5a38]">
          Cada página guarda una aventura, un desafío y una huella de la
          Avanzada Lankuyen.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#d9c8a5] bg-white/55 p-4 text-center">
          <p className="font-display text-3xl font-semibold text-[#2b2417]">
            {entries.length}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d7442]">
            Página{entries.length === 1 ? "" : "s"} escrita
            {entries.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-xl border border-[#d9c8a5] bg-white/55 p-4 text-center sm:col-span-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d7442]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Guardián de La Bitácora
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-[#2b2417]">
            {keeperName ?? "Cargo vacante"}
          </p>
          <p className="mt-1 text-[11px] text-[#6d5a38]">
            {keeperName
              ? "Cuida el libro y acompaña su revisión junto a los AA."
              : "Un AA puede asignar este cargo desde el panel de administración."}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#d9c8a5] bg-white/45 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-[#2b2417]">
            Índice de aventuras
          </h2>
          {canReview ? (
            <Link
              href={reviewHref}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ShieldCheck aria-hidden="true" />
              Bandeja de revisión
            </Link>
          ) : null}
        </div>

        {entries.length > 0 ? (
          <ol className="mt-3 divide-y divide-[#d9c8a5]/70">
            {entries.map((entry, index) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onOpenPage(index)}
                  className="group flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[#efe3c9]/60"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#c9b68e] bg-[#f7f0df] text-[11px] font-bold text-[#7e6635]">
                    {entry.pageNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-semibold text-[#2b2417] group-hover:text-[#5a451f]">
                      {entry.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#8d7442]">
                      {formatDateOnly(entry.adventureDate)} · {entry.authorName}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 size-4 shrink-0 text-[#b39a68] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-[#c9b68e] bg-[#f7f0df]/70 p-4 text-sm text-[#6d5a38]">
            El libro aún está en blanco. La primera aventura puede ser la tuya.
          </p>
        )}

        {canWrite ? (
          <Link
            href="/bitacora/nueva"
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-4 bg-[#3b4090] hover:bg-[#2f3375]",
            )}
          >
            <Feather aria-hidden="true" />
            Escribir una nueva página
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function BlankPage({ canWrite }: { canWrite: boolean }) {
  return (
    <div className="mx-auto flex min-h-[460px] max-w-2xl flex-col items-center justify-center text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-[#c9b68e] bg-[#f7f0df] text-[#b39a68]">
        <Feather className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-3xl font-semibold text-[#2b2417]">
        Página en blanco
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6d5a38]">
        Toda aventura merece ser contada. Esta página espera el próximo relato
        de la unidad.
      </p>
      {canWrite ? (
        <Link
          href="/bitacora/nueva"
          className={cn(buttonVariants({ size: "md" }), "mt-6 bg-[#3b4090]")}
        >
          <Feather aria-hidden="true" />
          Escribir una nueva página en La Bitácora
        </Link>
      ) : (
        <Badge variant="outline" className="mt-6">
          Solo lectura
        </Badge>
      )}
    </div>
  );
}
