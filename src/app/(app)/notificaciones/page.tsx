import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck2,
  CheckCheck,
  FileText,
  KeyRound,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NotificationType } from "@/generated/prisma/enums";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requireReadyUser } from "@/server/auth/session";

export const metadata = {
  title: "Notificaciones",
};

const typeStyles: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  INSIGNIA_OTORGADA: {
    icon: Award,
    className: "bg-gold-soft text-[#7a5a16]",
  },
  RSVP_CONFIRMADO: {
    icon: CalendarCheck2,
    className: "bg-emerald-50 text-emerald-700",
  },
  INASISTENCIA_JUSTIFICADA: {
    icon: CalendarCheck2,
    className: "bg-amber-50 text-amber-700",
  },
  HOJA_ENVIADA: {
    icon: FileText,
    className: "bg-anil-50 text-anil-700",
  },
  HOJA_APROBADA: {
    icon: FileText,
    className: "bg-emerald-50 text-emerald-700",
  },
  HOJA_RECHAZADA: {
    icon: FileText,
    className: "bg-red-50 text-red-700",
  },
  RECORDATORIO_HOJA_FALTANTE: {
    icon: FileText,
    className: "bg-amber-50 text-amber-700",
  },
  CUENTA_CREADA: {
    icon: UserPlus,
    className: "bg-anil-50 text-anil-700",
  },
  PASSWORD_RESETEADA: {
    icon: KeyRound,
    className: "bg-amber-50 text-amber-700",
  },
  BITACORA_ENVIADA: {
    icon: BookOpen,
    className: "bg-anil-50 text-anil-700",
  },
  BITACORA_APROBADA: {
    icon: BookOpen,
    className: "bg-emerald-50 text-emerald-700",
  },
  BITACORA_RECHAZADA: {
    icon: BookOpen,
    className: "bg-red-50 text-red-700",
  },
};

export default async function NotificacionesPage() {
  const user = await requireReadyUser();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 60,
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
    prisma.notification.count({
      where: { recipientId: user.id, readAt: null },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bandeja personal"
        title="Notificaciones"
        description="Avisos de insignias, hojas de ruta, asistencia y recordatorios de la unidad. Todo queda dentro de la plataforma."
        actions={
          unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <CheckCheck className="size-4" aria-hidden="true" />
                Marcar todas como leídas
              </button>
            </form>
          ) : (
            <Badge variant="success">Todo al día</Badge>
          )
        }
      />

      {unreadCount > 0 ? (
        <p className="inline-flex items-center gap-2 rounded-full border border-anil-200 bg-anil-50 px-3 py-1.5 text-xs font-semibold text-anil-800">
          <Bell className="size-3.5" aria-hidden="true" />
          {unreadCount} notificación{unreadCount === 1 ? "" : "es"} sin leer
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <Card className="border-dashed bg-surface/70 p-10 text-center">
          <Bell className="mx-auto size-9 text-anil-400" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-ink">
            Tu bandeja está vacía
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
            Cuando recibas una insignia o se actualice una hoja de ruta, el aviso
            aparecerá aquí y la campana mostrará el contador.
          </p>
          <Link
            href="/inicio"
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "mt-5",
            })}
          >
            Volver al inicio
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const style = typeStyles[notification.type];
            const Icon = style.icon;
            const unread = !notification.readAt;

            return (
              <li key={notification.id}>
                <Card
                  className={cn(
                    "overflow-hidden transition-colors",
                    unread
                      ? "border-anil-200 bg-gradient-to-r from-anil-50/70 to-surface"
                      : "bg-surface/80",
                  )}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        style.className,
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-base font-semibold text-ink">
                          {notification.title}
                        </h2>
                        {unread ? <Badge variant="default">Nueva</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {notification.body}
                      </p>
                      <p className="mt-2 text-[11px] text-ink-soft/80">
                        {formatDateTime(notification.createdAt)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {notification.actionUrl ? (
                          <Link
                            href={notification.actionUrl}
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            Ver detalle
                          </Link>
                        ) : null}

                        {unread ? (
                          <form action={markNotificationReadAction}>
                            <input
                              type="hidden"
                              name="id"
                              value={notification.id}
                            />
                            <button
                              type="submit"
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              <CheckCheck className="size-4" aria-hidden="true" />
                              Marcar como leída
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        Las notificaciones se guardan en la plataforma. Más adelante se podrán
        sumar envíos por correo o notificaciones push sin cambiar este historial.
      </p>
    </div>
  );
}
