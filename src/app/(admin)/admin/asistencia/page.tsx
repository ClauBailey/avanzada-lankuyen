import Link from "next/link";
import {
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Clock,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_STYLES,
  RSVP_LABELS,
} from "@/lib/activity-types";
import { formatDateTime, formatTime } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Asistencia · Panel AA",
};

export default async function AdminAsistenciaPage() {
  await requirePermission("attendance:ratify");

  const [activeSemester, memberCount] = await Promise.all([
    prisma.semester.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.user.count({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
      },
    }),
  ]);

  if (!activeSemester) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Administración"
          title="Ratificación de asistencia"
          description="Después de cada actividad, corrige la asistencia real y guarda el registro definitivo para el historial de la unidad."
        />
        <EmptyState
          icon={ClipboardCheck}
          title="No hay un semestre activo"
          description="Activa un semestre y publica actividades para comenzar a ratificar asistencia."
        />
      </div>
    );
  }

  const activities = await prisma.activity.findMany({
    where: { semesterId: activeSemester.id, deletedAt: null },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      endsAt: true,
      location: true,
      responses: { select: { status: true } },
      _count: { select: { records: true } },
    },
  });

  const decorated = activities.map((activity) => {
    const confirmed = activity.responses.filter(
      (response) => response.status === "CONFIRMADO",
    ).length;
    const absent = activity.responses.filter(
      (response) => response.status === "NO_ASISTE",
    ).length;
    const pending = Math.max(
      memberCount - confirmed - absent,
      0,
    );

    return {
      ...activity,
      confirmed,
      absent,
      pending,
      isRatified: activity._count.records > 0,
    };
  });

  const toRatify = decorated.filter((activity) => !activity.isRatified);
  const ratified = decorated.filter((activity) => activity.isRatified);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Ratificación de asistencia"
        description={`Semestre ${activeSemester.name}: revisa las respuestas previas sobre ${memberCount} miembros activos y ratifica la asistencia real de cada actividad.`}
        actions={
          <Link
            href="/admin/actividades"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Gestionar actividades
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Actividades del semestre
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {decorated.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Vigentes en el calendario</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
            Por ratificar
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {toRatify.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Sin registros definitivos
          </p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Ratificadas
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {ratified.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Con asistencia guardada</p>
        </Card>
      </section>

      <ActivitySection
        title="Pendientes de ratificar"
        description="Puedes revisar el resumen en vivo antes del evento y ratificar cuando corresponda."
        activities={toRatify}
        emptyMessage="No hay actividades pendientes de ratificación en este semestre."
      />

      <ActivitySection
        title="Ratificadas"
        description="Puedes reabrir cualquiera para corregir un estado; cada cambio queda en auditoría."
        activities={ratified}
        emptyMessage="Aún no hay actividades ratificadas en este semestre."
      />
    </div>
  );
}

function ActivitySection({
  title,
  description,
  activities,
  emptyMessage,
}: {
  title: string;
  description: string;
  activities: Array<{
    id: string;
    title: string;
    type: keyof typeof ACTIVITY_TYPE_LABELS;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
    confirmed: number;
    absent: number;
    pending: number;
    isRatified: boolean;
    _count: { records: number };
  }>;
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
        <Badge variant="outline">{activities.length}</Badge>
      </div>

      {activities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-canvas/60 px-5 py-6 text-sm text-ink-soft">
          {emptyMessage}
        </p>
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
                {activity.isRatified ? (
                  <Badge variant="success">
                    <CheckCheck className="size-3" aria-hidden="true" />
                    Ratificada
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Clock className="size-3" aria-hidden="true" />
                    Pendiente
                  </Badge>
                )}
              </div>

              <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                {activity.title}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                {formatDateTime(activity.startsAt)} · hasta las{" "}
                {formatTime(activity.endsAt)}
                {activity.location ? ` · ${activity.location}` : ""}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
                    {RSVP_LABELS.CONFIRMADO}
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">
                    {activity.confirmed}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800">
                    No podrán ir
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">
                    {activity.absent}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-canvas/60 px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                    Sin respuesta
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">
                    {activity.pending}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <Users className="size-3.5" aria-hidden="true" />
                  {activity._count.records} registro
                  {activity._count.records === 1 ? "" : "s"} ratificado
                  {activity._count.records === 1 ? "" : "s"}
                </p>
                <Link
                  href={`/admin/asistencia/${activity.id}`}
                  className={buttonVariants({
                    variant: activity.isRatified ? "secondary" : "primary",
                    size: "sm",
                  })}
                >
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  {activity.isRatified ? "Revisar / corregir" : "Ratificar"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
