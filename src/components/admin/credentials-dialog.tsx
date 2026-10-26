"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TemporaryCredentials } from "@/features/users/types";

interface CredentialsDialogProps {
  credentials: TemporaryCredentials | null;
  onClose: () => void;
}

export function CredentialsDialog({ credentials, onClose }: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!credentials) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [credentials, onClose]);

  if (!credentials) return null;

  const text = [
    "Avanzada Lankuyen",
    `Usuario: ${credentials.username}`,
    `Contraseña temporal: ${credentials.password}`,
    "",
    "Ingresa en la plataforma y cambia la contraseña en tu primer inicio de sesión.",
  ].join("\n");

  async function copy() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-anil-950/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
      >
        <div className="relative bg-anil-950 p-5 text-white">
          <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold ring-1 ring-white/15">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold leading-tight">
                  Credenciales temporales
                </p>
                <p className="text-[11px] text-anil-100/70">
                  {credentials.fullName} · {credentials.role}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-anil-100/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Comparte estos datos con la persona. La contraseña <strong>no se
            volverá a mostrar</strong>: si se pierde, deberás restablecerla.
          </p>

          <div className="space-y-2">
            <div className="rounded-xl border border-line bg-canvas/70 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Usuario
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
                {credentials.username}
              </p>
            </div>
            <div className="rounded-xl border border-gold/40 bg-gold-soft/40 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
                Contraseña temporal
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
                {credentials.password}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={copy} className="flex-1">
              {copied ? (
                <>
                  <Check aria-hidden="true" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" />
                  Copiar credenciales
                </>
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
