import Image from "next/image";
import { Compass, Mountain } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden bg-anil-950 lg:flex lg:flex-col">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute -left-24 top-24 size-80 rounded-full bg-anil-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-24 size-96 rounded-full bg-lavender/15 blur-3xl" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-80" />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <div className="flex items-center gap-4">
            <BrandMark size={56} className="ring-2 ring-white/15" />
            <div>
              <p className="font-display text-xl font-semibold text-white">Lankuyen</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-200/60">
                Avanzada · Alfa Cruz
              </p>
            </div>
          </div>

          <div className="my-auto max-w-xl py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
              Sendero · Cumbre
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-white text-balance xl:text-6xl">
              Pioneros siempre adelante.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-anil-100/70 xl:text-base">
              Este es el espacio de la Avanzada Lankuyen: tu progresión personal,
              el calendario de la unidad, las hojas de ruta y el material que nos
              da identidad.
            </p>

            <div className="mt-10 grid max-w-md gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <Image
                  src="/badges/etapa-sendero.svg"
                  alt=""
                  width={52}
                  height={52}
                  unoptimized
                  className="rounded-full"
                />
                <div>
                  <p className="flex items-center gap-2 font-display text-base font-semibold text-white">
                    <Compass className="size-4 text-gold" aria-hidden="true" />
                    Sendero
                  </p>
                  <p className="mt-0.5 text-xs text-anil-100/60">
                    Explorar, aprender y descubrir el propio camino.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <Image
                  src="/badges/etapa-cumbre.svg"
                  alt=""
                  width={52}
                  height={52}
                  unoptimized
                  className="rounded-full"
                />
                <div>
                  <p className="flex items-center gap-2 font-display text-base font-semibold text-white">
                    <Mountain className="size-4 text-gold" aria-hidden="true" />
                    Cumbre
                  </p>
                  <p className="mt-0.5 text-xs text-anil-100/60">
                    Consolidar el liderazgo y alcanzar la cima del proceso.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-anil-200/45">
            «Caminar al mismo paso, camaradas de verdad.»
          </p>
        </div>
      </section>

      {/* Formulario */}
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.25]" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={48} />
            <div>
              <p className="font-display text-lg font-semibold text-ink">Lankuyen</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Avanzada · Pioneros
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-float sm:p-8">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                Bienvenido/a de vuelta
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Ingresa con el usuario que te entregó tu Adulto Acompañante.
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-[11px] text-ink-soft">
            Avanzada Lankuyen · Pioneros
          </p>
        </div>
      </section>
    </div>
  );
}
