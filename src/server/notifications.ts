import "server-only";

import type { NotificationType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

interface NotifyInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  dedupeKey?: string;
  priority?: number;
}

/**
 * Crea una notificación in-app.
 *
 * `dedupeKey` evita duplicados ante reintentos o dobles envíos: si la clave
 * ya existe, la notificación no se vuelve a crear.
 */
export async function notifyUser(
  input: NotifyInput,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  if (input.dedupeKey) {
    const existing = await client.notification.findUnique({
      where: { dedupeKey: input.dedupeKey },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const notification = await client.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      actionUrl: input.actionUrl ?? null,
      priority: input.priority ?? 0,
      dedupeKey: input.dedupeKey ?? null,
    },
    select: { id: true },
  });

  return notification.id;
}

/** Cantidad de notificaciones sin leer; alimenta la campana del AppShell. */
export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}
