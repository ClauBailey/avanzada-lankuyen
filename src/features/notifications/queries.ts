import "server-only";

import { prisma } from "@/server/db";
import {
  NOTIFICATIONS_ORDER_BY,
  notificationPageWindow,
  notificationTotalPages,
} from "@/features/notifications/pagination";

export interface NotificationPageResult {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    actionUrl: string | null;
    readAt: Date | null;
    createdAt: Date;
  }>;
  page: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

/**
 * Bandeja paginada de 10 avisos por página.
 *
 * Las notificaciones no leídas ya no se fuerzan arriba: el orden es
 * estrictamente cronológico inverso, como pide la especificación v1.3.
 */
export async function getNotificationsPage(
  userId: string,
  requestedPage: number,
): Promise<NotificationPageResult> {
  const window = notificationPageWindow(requestedPage);

  const [firstPage, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: NOTIFICATIONS_ORDER_BY,
      skip: window.skip,
      take: window.take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        actionUrl: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    }),
  ]);

  const totalPages = notificationTotalPages(totalCount);

  // Una página fuera de rango (por ejemplo ?page=99) se sirve como la última,
  // para que los controles y el rango mostrado sean coherentes.
  if (window.page > totalPages) {
    const lastWindow = notificationPageWindow(totalPages);
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: NOTIFICATIONS_ORDER_BY,
      skip: lastWindow.skip,
      take: lastWindow.take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        actionUrl: true,
        readAt: true,
        createdAt: true,
      },
    });

    return {
      notifications,
      page: lastWindow.page,
      totalCount,
      totalPages,
      unreadCount,
    };
  }

  return {
    notifications: firstPage,
    page: window.page,
    totalCount,
    totalPages,
    unreadCount,
  };
}
