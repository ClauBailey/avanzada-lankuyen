"use client";

import { useEffect, useState } from "react";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/features/notifications/actions";

type PushStatus =
  | "loading"
  | "unsupported"
  | "inactive"
  | "active"
  | "denied"
  | "misconfigured";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convierte la clave VAPID (base64url) al formato que exige PushManager. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la operación. Inténtalo nuevamente.";
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        if (!cancelled) setStatus("misconfigured");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = registration
          ? await registration.pushManager.getSubscription()
          : null;

        if (subscription) {
          const active = await getPushSubscriptionStatus(subscription.endpoint);
          if (!cancelled) setStatus(active ? "active" : "inactive");
          return;
        }
      } catch (error) {
        if (!cancelled) setMessage(getErrorMessage(error));
      }

      if (!cancelled) setStatus("inactive");
    }

    void detect();

    return () => {
      cancelled = true;
    };
  }, []);

  async function activate() {
    setBusy(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        setMessage(
          "El service worker todavía no está activo. Recarga la página e inténtalo otra vez.",
        );
        return;
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const keys = subscription.toJSON().keys;
      const p256dh = keys?.p256dh;
      const auth = keys?.auth;

      if (!p256dh || !auth) {
        setMessage("El navegador no entregó las claves de la suscripción.");
        return;
      }

      const result = await subscribeToPush({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
      });

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setStatus("active");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (subscription) {
        const result = await unsubscribeFromPush(subscription.endpoint);

        if (!result.ok) {
          setMessage(result.error);
          return;
        }

        try {
          await subscription.unsubscribe();
        } catch {
          // La base ya no enviará a este endpoint; si el navegador falla al
          // limpiarlo, la próxima activación reutiliza y vuelve a guardar la
          // suscripción.
        }
      }

      setStatus("inactive");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const badge =
    status === "active"
      ? { label: "Activado", variant: "success" as const }
      : status === "denied"
        ? { label: "Denegado", variant: "danger" as const }
        : status === "unsupported"
          ? { label: "No compatible", variant: "outline" as const }
          : status === "misconfigured"
            ? { label: "Sin configurar", variant: "warning" as const }
            : status === "loading"
              ? { label: "Verificando", variant: "outline" as const }
              : { label: "Desactivado", variant: "outline" as const };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-50 text-anil-700"
          aria-hidden="true"
        >
          {status === "active" ? (
            <CheckCircle2 className="size-5" />
          ) : status === "denied" ? (
            <BellOff className="size-5" />
          ) : (
            <BellRing className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">
              Notificaciones en este dispositivo
            </h2>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Recibe un aviso del sistema cuando llegue una insignia, una hoja de
            ruta o un recordatorio, incluso si la pestaña está cerrada. Puedes
            desactivarlas cuando quieras.
          </p>

          {status === "unsupported" ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-800">
              Este navegador no admite notificaciones push. Prueba con una
              versión reciente de Chrome o Edge.
            </p>
          ) : null}

          {status === "misconfigured" ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-800">
              Falta configurar la clave pública VAPID en el entorno. Avisa a
              quien administra la plataforma.
            </p>
          ) : null}

          {status === "denied" ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Bloqueaste las notificaciones para este sitio. Habilítalas desde
              el candado de la barra de direcciones y vuelve a intentarlo.
            </p>
          ) : null}

          {message ? (
            <p
              role="alert"
              className="mt-3 text-xs font-medium leading-relaxed text-red-700"
            >
              {message}
            </p>
          ) : null}

          {status === "active" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={deactivate}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <BellOff aria-hidden="true" />
              )}
              {busy ? "Desactivando…" : "Desactivar en este dispositivo"}
            </Button>
          ) : status === "unsupported" ||
            status === "denied" ||
            status === "misconfigured" ? null : (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={activate}
              disabled={busy || status === "loading"}
              aria-busy={busy || status === "loading"}
            >
              {busy || status === "loading" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <BellRing aria-hidden="true" />
              )}
              {busy
                ? "Activando…"
                : status === "loading"
                  ? "Comprobando…"
                  : "Activar notificaciones en este dispositivo"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
