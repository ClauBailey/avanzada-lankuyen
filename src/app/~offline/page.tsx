import type { Metadata } from "next";
import { Compass, Mountain, RotateCw, WifiOff } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";

export const metadata: Metadata = {
  title: "Sin conexión",
  description:
    "No pudimos conectarnos a internet. Revisa tu conexión e inténtalo nuevamente.",
};

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-anil-950 px-5 py-12">
      <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-16 size-80 rounded-full bg-anil-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 size-96 rounded-full bg-lavender/15 blur-3xl" />
      <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-80" />

      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-float backdrop-blur-sm sm:p-10">
        <div className="flex items-center justify-center gap-3">
          <BrandMark size={52} className="ring-2 ring-white/15" />
          <div className="text-left">
            <p className="font-display text-lg font-semibold text-white">
              Lankuyen
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-200/60">
              Avanzada · Pioneros
            </p>
          </div>
        </div>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
          Sendero · Cumbre
        </p>

        <div className="mx-auto mt-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-anil-100">
          <WifiOff className="size-7" aria-hidden="true" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-white text-balance">
          Parece que no tienes conexión a internet
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-anil-100/70">
          No pudimos cargar esta página. Revisa tu conexión y vuelve a
          intentarlo. El sendero sigue ahí, esperándote.
        </p>

        {/* Recarga completa intencional: queremos reintentar la red, no una navegación cliente. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-anil-950 transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Reintentar
        </a>

        <div className="mt-8 flex items-center justify-center gap-6 border-t border-white/10 pt-6 text-[11px] font-medium uppercase tracking-[0.18em] text-anil-200/55">
          <span className="inline-flex items-center gap-2">
            <Compass className="size-3.5 text-gold" aria-hidden="true" />
            Sendero
          </span>
          <span className="inline-flex items-center gap-2">
            <Mountain className="size-3.5 text-gold" aria-hidden="true" />
            Cumbre
          </span>
        </div>
      </section>
    </main>
  );
}
