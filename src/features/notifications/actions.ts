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
