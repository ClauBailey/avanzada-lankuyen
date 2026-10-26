import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { requireUser } from "@/server/auth/session";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  if (!user.mustChangePassword) {
    redirect("/inicio");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-anil-950 px-5 py-10">
      <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-anil-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-lavender/15 blur-3xl" />
      <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-70" />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-3">
          <BrandMark size={52} className="ring-2 ring-white/15" />
          <div>
            <p className="font-display text-lg font-semibold text-white">Lankuyen</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-200/60">
              Avanzada · Pioneros
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-float sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-anil-100 text-anil-800">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <Badge variant="gold" className="mt-4">
            Primer ingreso
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
            Actualiza tu contraseña
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Hola, {user.firstName}. Antes de comenzar, reemplaza la contraseña
            inicial que te entregaron por una personal. Solo tú debes conocerla.
          </p>

          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-anil-200/50">
          Si no reconoces esta cuenta, cierra la sesión y avisa a un Adulto Acompañante.
        </p>
      </div>
    </div>
  );
}
