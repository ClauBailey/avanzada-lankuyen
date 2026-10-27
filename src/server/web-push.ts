import "server-only";

import { after } from "next/server";
import webpush from "web-push";

import { prisma } from "@/server/db";

/** Contenido que verá la persona en la notificación del sistema. */
export interface PushNotificationPayload {
  title: string;
  body: string;
  /** Ruta interna que se abre al tocar la notificación. */
  url?: string;
  /** Ícono alternativo; por defecto se usa el de la marca. */
  icon?: string;
  /** Agrupa notificaciones del mismo tipo en el sistema operativo. */
  tag?: string;
}

export interface PushSendResult {
  /** Dispositivos que recibieron el mensaje. */
  sent: number;
  /** Dispositivos con error temporal (se reintentará en un próximo envío). */
  failed: number;
  /** Suscripciones caducadas que se eliminaron de la base. */
  removed: number;
}

const DEFAULT_ICON = "/brand/icon-192x192.png";
const DEFAULT_URL = "/notificaciones";

let vapidConfigured = false;

/**
 * Configura VAPID una sola vez por proceso.
 *
 * Si falta alguna variable no se lanza una excepción: el envío de push es un
 * extra sobre la notificación in-app y nunca debe romper la acción principal.
 */
function configureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (error) {
    console.error("[push] La configuración VAPID no es válida:", error);
    return false;
  }

  vapidConfigured = true;
  return true;
}

/**
 * Envía una notificación push a todos los dispositivos suscritos de una
 * persona.
 *
 * Las suscripciones que el servicio de push ya no reconoce (404/410) se
 * eliminan para no acumular registros muertos.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
): Promise<PushSendResult> {
  const result: PushSendResult = { sent: 0, failed: 0, removed: 0 };

  if (!configureVapid()) {
    console.warn(
      "[push] Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT; no se envió la notificación.",
    );
    return result;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return result;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? DEFAULT_URL,
    icon: payload.icon ?? DEFAULT_ICON,
    tag: payload.tag,
  });

  const staleIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
          { TTL: 60 * 60 * 24 },
        );
        result.sent += 1;
      } catch (error) {
        if (
          error instanceof webpush.WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          staleIds.push(subscription.id);
          return;
        }

        result.failed += 1;
        console.error(
          `[push] No se pudo enviar a la suscripción ${subscription.id}:`,
          error,
        );
      }
    }),
  );

  if (staleIds.length > 0) {
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { id: { in: staleIds } },
    });
    result.removed = deleted.count;
  }

  return result;
}

/**
 * Programa un push para después de que la respuesta HTTP haya terminado.
 *
 * Se usa en Server Actions y route handlers una vez que la transacción de
 * negocio ya hizo commit. El envío nunca bloquea ni hace fallar la operación
 * principal: cualquier error se registra solo en el servidor.
 */
export function enqueuePushNotification(
  userId: string,
  payload: PushNotificationPayload,
): void {
  const send = async () => {
    try {
      await sendPushNotification(userId, payload);
    } catch (error) {
      console.error(
        `[push] Error al procesar la notificación para ${userId}:`,
        error,
      );
    }
  };

  try {
    after(send);
  } catch {
    // Fuera de un request de Next.js (por ejemplo, un script de mantenimiento)
    // no existe `after`; se intenta en segundo plano sin bloquear al llamador.
    void send();
  }
}
