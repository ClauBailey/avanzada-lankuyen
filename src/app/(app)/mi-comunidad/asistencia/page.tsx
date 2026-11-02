import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardCheck, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_STYLES } from "@/lib/activity-types";
import { formatDateTime, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Asistencia de mi comunidad",
};

export default async function CommunityAttendancePage() {
  const user = await requirePermission("attendance:ratify");

  if (!user.communityId) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Sin comunidad asignada"
        description="Cuando el Equipo Adulto te asigne una comunidad podrás ratificar la asistencia de sus integrantes."
      />
    );
  }

  const cycle = await prisma.programCycle.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const activities = cycle
    ? await prisma.activity.findMany({
        where: {
          cycleId: cycle.id,
          deletedAt: null,
          isPublished: true,
        },
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
          endsAt: true,
          location: true,
          _count: { select: { records: true } },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/mi-comunidad"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a mi comunidad
      </Link>

      <PageHeader
        eyebrow="Coordinación"
        title="Asistencia de mi comunidad"
        description="Ratifica la lista real de tu comunidad para cuidar la seguridad en terreno. No hay porcentajes ni rankings: solo presencia, aviso previo y ausencia."
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No hay actividades este ciclo"
          description="Cuando el Equipo Adulto publique actividades aparecerán aquí para ratificar la asistencia."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                    ACTIVITY_TYPE_STYLES[activity.type],
                  )}
                >
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                {activity._count.records > 0 ? (
                  <Badge variant="success">
                    <ClipboardCheck className="size-3" aria-hidden="true" />
                    Ratificada
                  </Badge>
                ) : (
                  <Badge variant="warning">Por ratificar</Badge>
                )}
              </div>

              <h2 className="mt-2 font-display text-lg font-semibold text-ink">
                {activity.title}
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                {formatDateTime(activity.startsAt)} · hasta las{" "}
                {formatTime(activity.endsAt)}
                {activity.location ? ` · ${activity.location}` : ""}
              </p>

              <Link
                href={`/mi-comunidad/asistencia/${activity.id}`}
                className={buttonVariants({
                  size: "sm",
                  variant: activity._count.records > 0 ? "secondary" : "primary",
                  className: "mt-4",
                })}
              >
                <ClipboardCheck className="size-4" aria-hidden="true" />
                {activity._count.records > 0
                  ? "Revisar ratificación"
                  : "Ratificar asistencia"}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
