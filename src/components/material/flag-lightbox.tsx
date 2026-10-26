"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface FlagLightboxProps {
  src: string;
  alt: string;
  isPlaceholder?: boolean;
}

export function FlagLightbox({
  src,
  alt,
  isPlaceholder = false,
}: FlagLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isPlaceholder ? "Ver imagen de referencia de la bandera" : "Ampliar imagen de la bandera"}
        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "mx-auto max-h-[420px] w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.015]",
            isPlaceholder && "opacity-95",
          )}
        />
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-anil-950/75 px-3 py-1.5 text-[11px] font-semibold text-white shadow-float backdrop-blur">
          <Maximize2 className="size-3.5" aria-hidden="true" />
          Ver en grande
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-anil-950/92 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar imagen"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[82vh] max-w-full rounded-2xl bg-white object-contain shadow-float"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="max-w-xl text-center text-xs text-anil-100/80">
            {alt}
            {isPlaceholder
              ? " · Imagen de referencia; los AA pueden subir la bandera oficial."
              : ""}
          </p>
        </div>
      ) : null}
    </>
  );
}
