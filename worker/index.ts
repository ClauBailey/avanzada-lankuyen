/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

export {};

/**
 * Custom worker de @ducanh2912/next-pwa.
 *
 * Next PWA compila este archivo por separado, le agrega un hash al nombre y lo
 * importa desde el service worker generado. Aquí viven los eventos de push,
 * que no forman parte de Workbox.
 */

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  tag?: string;
}

const BRAND_ICON = "/brand/icon-192x192.png";
const DEFAULT_URL = "/notificaciones";
const DEFAULT_TITLE = "Avanzada Lankuyen";

function parsePayload(data: PushMessageData | null): PushPayload {
  if (!data) return {};

  try {
    const parsed: unknown = data.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { body: data.text() };
    }
    return parsed as PushPayload;
  } catch {
    return { body: data.text() };
  }
}

/** Solo se permiten rutas internas: la notificación nunca abre otro origen. */
function resolveTarget(rawUrl: unknown): string {
  const fallback = new URL(DEFAULT_URL, self.location.origin).href;

  if (typeof rawUrl !== "string" || rawUrl.length === 0) return fallback;

  try {
    const url = new URL(rawUrl, self.location.origin);
    return url.origin === self.location.origin ? url.href : fallback;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePayload(event.data);
  const title = payload.title?.trim() || DEFAULT_TITLE;
  const targetUrl = resolveTarget(payload.url);

  const options: NotificationOptions & { renotify?: boolean } = {
    body: payload.body ?? "",
    icon: payload.icon || BRAND_ICON,
    badge: BRAND_ICON,
    tag: payload.tag,
    data: { url: targetUrl },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data as { url?: unknown } | null | undefined;
  const targetUrl = resolveTarget(data?.url);

  event.waitUntil(openOrFocus(targetUrl));
});

async function openOrFocus(targetUrl: string) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windows) {
    if (client.url === targetUrl) return client.focus();
  }

  const sameOrigin = windows.find((client) => {
    try {
      return new URL(client.url).origin === self.location.origin;
    } catch {
      return false;
    }
  });

  if (sameOrigin) {
    try {
      await sameOrigin.navigate(targetUrl);
    } catch {
      // Si la ventana ya no se puede controlar, al menos se enfoca.
    }
    return sameOrigin.focus();
  }

  return self.clients.openWindow(targetUrl);
}
