"use server";

import { revalidatePath } from "next/cache";

import { readField } from "@/lib/form-data";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateNotifications() {
  revalidatePath("/notificaciones");
  revalidatePath("/inicio");
  // El contador de la campana vive en los layouts; se refresca junto al resto.
  revalidatePath("/", "layout");
}

/** Marca una notificación propia como leída. */
export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = readField(formData, "id");

  if (!id) return;

  await prisma.notification.updateMany({
    where: { id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateNotifications();
}

/** Marca como leídas todas las notificaciones pendientes de la persona. */
export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateNotifications();
}

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;

type PushActionError = { ok: false; error: string };

/** Valida que el endpoint sea una URL https y que las claves no estén vacías. */
function validateEndpoint(endpoint: string): PushActionError | null {
  if (!endpoint || endpoint.length > MAX_ENDPOINT_LENGTH) {
    return { ok: false, error: "La suscripción del dispositivo no es válida." };
  }

  try {
    if (new URL(endpoint).protocol !== "https:") {
      return { ok: false, error: "La suscripción del dispositivo no es válida." };
    }
  } catch {
    return { ok: false, error: "La suscripción del dispositivo no es válida." };
  }

  return null;
}

/**
 * Guarda o actualiza la suscripción push de este dispositivo para la persona
 * autenticada. Un endpoint pertenece a un solo dispositivo: si otra cuenta
 * inicia sesión en el mismo navegador, la suscripción se reasigna.
 */
export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ ok: true } | PushActionError> {
  const user = await requireUser();

  const endpoint = subscription?.endpoint?.trim() ?? "";
  const p256dh = subscription?.keys?.p256dh?.trim() ?? "";
  const auth = subscription?.keys?.auth?.trim() ?? "";

  const endpointError = validateEndpoint(endpoint);
  if (endpointError) return endpointError;

  if (
    !p256dh ||
    !auth ||
    p256dh.length > MAX_KEY_LENGTH ||
    auth.length > MAX_KEY_LENGTH
  ) {
    return { ok: false, error: "La suscripción del dispositivo no es válida." };
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userId: user.id },
    update: { p256dh, auth, userId: user.id },
  });

  return { ok: true };
}

/**
 * Elimina la suscripción push de este dispositivo. Solo afecta suscripciones
 * de la persona autenticada.
 */
export async function unsubscribeFromPush(
  endpoint: string,
): Promise<{ ok: true } | PushActionError> {
  const user = await requireUser();
  const normalized = endpoint?.trim() ?? "";

  const endpointError = validateEndpoint(normalized);
  if (endpointError) return endpointError;

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: normalized, userId: user.id },
  });

  return { ok: true };
}

/** Indica si este dispositivo ya está suscrito para la persona autenticada. */
export async function getPushSubscriptionStatus(
  endpoint: string,
): Promise<boolean> {
  const user = await requireUser();
  const normalized = endpoint?.trim() ?? "";

  if (validateEndpoint(normalized)) return false;

  const subscription = await prisma.pushSubscription.findFirst({
    where: { endpoint: normalized, userId: user.id },
    select: { id: true },
  });

  return Boolean(subscription);
}
