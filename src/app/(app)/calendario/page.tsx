import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";

import { ActivityCard } from "@/components/activities/activity-card";
import { CalendarFilters } from "@/components/activities/calendar-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import type { ActivityType } from "@/generated/prisma/enums";
import { ACTIVITY_TYPES } from "@/lib/activity-types";
import {
  formatMonthLabel,
  getMonthRange,
  listMonthsBetween,
} from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Calendario",
};

type Scope = "proximas" | "pasadas" | "todas";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; scope?: string }>;
}) {
  const user = await requirePermission("calendar:view");
  const params = await searchParams;

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, startsOn: true, endsOn: true },
  });

  if (!activeSemester) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Calendario semestral"
          title="Actividades de la Avanzada"
          description="Consulta los encuentros del semestre, confirma tu asistencia y revisa el estado de la hoja de ruta de cada actividad."
        />
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay un semestre activo"
          description="Cuando los AA activen el semestre, las actividades aparecerán aquí."
        />
      </div>
    );
  }

  const months = listMonthsBetween(
    activeSemester.startsOn,
    activeSemester.endsOn,
  ).map((value) => ({ value, label: formatMonthLabel(value) }));

  const monthFilter = months.some((month) => month.value === params.month)
    ? (params.month ?? "")
    : "";
  const typeFilter = ACTIVITY_TYPES.includes(params.type as ActivityType)
    ? (params.type as ActivityType)
    : "";
  const scope: Scope =
    params.scope === "pasadas" || params.scope === "todas"
      ? params.scope
      : "proximas";

  const where: Prisma.ActivityWhereInput = {
    semesterId: activeSemester.id,
    deletedAt: null,
    isPublished: true,
  };

  if (typeFilter) {
    where.type = typeFilter;
  }

  const now = new Date();
  const range = monthFilter ? getMonthRange(monthFilter) : null;
  const startsAtFilter: Prisma.DateTimeFilter = {};

  if (range) {
    startsAtFilter.gte = range.start;
    startsAtFilter.lt = range.end;
  }

  if (scope === "proximas") {
    const lowerBound = range ? range.start : now;
    startsAtFilter.gte = lowerBound > now ? lowerBound : now;
  } else if (scope === "pasadas") {
    const upperBound = range ? range.end : now;
    startsAtFilter.lt = upperBound < now ? upperBound : now;
  }

  if (Object.keys(startsAtFilter).length > 0) {
    where.startsAt = startsAtFilter;
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { startsAt: scope === "pasadas" ? "desc" : "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      endsAt: true,
      location: true,
      description: true,
      isPublished: true,
      leaders: {
        orderBy: { assignedAt: "asc" },
        select: {
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              community: { select: { name: true, color: true } },
            },
          },
        },
      },
      routeSheets: {
        where: { status: "APROBADA", deletedAt: null },
        orderBy: { version: "desc" },
        take: 1,
        select: { fileId: true, title: true },
      },
      responses: {
        where: { userId: user.id },
        take: 1,
        select: { status: true },
      },
      records: {
        where: { userId: user.id },
        take: 1,
        select: { status: true },
      },
      evaluations: {
        where: { userId: user.id },
        take: 1,
        select: { id: true },
      },
      _count: { select: { records: true } },
    },
  });

  const canEvaluate = can(user, "activity:evaluate");

  const isFiltered = Boolean(monthFilter || typeFilter) || scope !== "proximas";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendario semestral"
        title={`Semestre ${activeSemester.name}`}
        description="Consulta los encuentros, revisa a sus encargados y confirma tu asistencia antes del evento."
        actions={
          user.role === "AA" ? (
            <Link
              href="/admin/actividades"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Gestionar actividades
            </Link>
          ) : null
        }
      />

      <CalendarFilters
        months={months}
        month={monthFilter}
        type={typeFilter}
        scope={scope}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">
          {activities.length} actividad{activities.length === 1 ? "" : "es"}
          {scope === "proximas"
            ? " por venir"
            : scope === "pasadas"
              ? " pasada" + (activities.length === 1 ? "" : "s")
              : ""}
        </p>
        {isFiltered ? (
          <Link
            href="/calendario"
            className="text-xs font-semibold text-anil-700 hover:text-anil-900"
          >
            Ver próximas sin filtros
          </Link>
        ) : null}
      </div>

      {activities.length === 0 ? (
        <Card className="border-dashed bg-surface/70 p-6">
          <EmptyState
            icon={CalendarDays}
            title={
              scope === "pasadas"
                ? "No hay actividades pasadas con estos filtros"
                : "No hay actividades para mostrar"
            }
            description={
              scope === "proximas" && !isFiltered
                ? "Cuando los AA publiquen nuevas actividades del semestre, aparecerán aquí."
                : "Prueba con otro mes, otro tipo de actividad o cambia el filtro de próximas/pasadas."
            }
            className="border-0 bg-transparent p-0"
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => {
            const response = activity.responses[0] ?? null;
            const record = activity.records[0] ?? null;
            const approved = activity.routeSheets[0] ?? null;

            return (
              <ActivityCard
                key={activity.id}
                activity={{
                  id: activity.id,
                  title: activity.title,
                  type: activity.type,
                  startsAt: activity.startsAt.toISOString(),
                  endsAt: activity.endsAt.toISOString(),
                  location: activity.location,
                  description: activity.description,
                  isPublished: activity.isPublished,
                  leaders: activity.leaders.map((leader) => ({
                    id: leader.userId,
                    firstName: leader.user.firstName,
                    lastName: leader.user.lastName,
                    community: leader.user.community,
                  })),
                  approvedRouteSheet: approved
                    ? { fileId: approved.fileId, title: approved.title }
                    : null,
                }}
                viewer={{
                  id: user.id,
                  role: user.role,
                  rsvp: response?.status ?? null,
                  attendance: record?.status ?? null,
                  isRatified: activity._count.records > 0,
                  evaluation:
                    canEvaluate && activity.endsAt <= now
                      ? activity.evaluations.length > 0
                        ? "done"
                        : "pending"
                      : null,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
