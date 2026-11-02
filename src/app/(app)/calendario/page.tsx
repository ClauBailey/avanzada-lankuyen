import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";

import { ActivityCard } from "@/components/activities/activity-card";
import { ActivityForm } from "@/components/activities/activity-form";
import { CalendarFilters } from "@/components/activities/calendar-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ActivityScheduleType,
  ActivityScope,
  ActivityType,
} from "@/generated/prisma/enums";
import {
  ACTIVITY_SCHEDULE_TYPES,
  ACTIVITY_SCOPES,
} from "@/lib/activity-scopes";
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

type When = "proximas" | "pasadas" | "todas";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    type?: string;
    when?: string;
    scope?: string;
    schedule?: string;
  }>;
}) {
  const user = await requirePermission("calendar:view");
  const params = await searchParams;

  const activeCycle = await prisma.programCycle.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, startDate: true, endDate: true, phase: true },
  });

  if (!activeCycle) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Calendario del ciclo"
          title="Actividades de la Avanzada"
          description="Consulta los encuentros del ciclo, confirma tu asistencia y revisa el estado de la hoja de ruta de cada actividad."
        />
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay un ciclo activo"
          description="Cuando los AA activen el ciclo de programa, las actividades aparecerán aquí."
        />
      </div>
    );
  }

  const months = listMonthsBetween(
    activeCycle.startDate,
    activeCycle.endDate,
  ).map((value) => ({ value, label: formatMonthLabel(value) }));

  const monthFilter = months.some((month) => month.value === params.month)
    ? (params.month ?? "")
    : "";
  const typeFilter = ACTIVITY_TYPES.includes(params.type as ActivityType)
    ? (params.type as ActivityType)
    : "";
  const scopeFilter = ACTIVITY_SCOPES.includes(params.scope as ActivityScope)
    ? (params.scope as ActivityScope)
    : "";
  const scheduleFilter = ACTIVITY_SCHEDULE_TYPES.includes(
    params.schedule as ActivityScheduleType,
  )
    ? (params.schedule as ActivityScheduleType)
    : "";
  const when: When =
    params.when === "pasadas" || params.when === "todas"
      ? params.when
      : "proximas";

  const where: Prisma.ActivityWhereInput = {
    cycleId: activeCycle.id,
    deletedAt: null,
    isPublished: true,
  };

  if (typeFilter) {
    where.type = typeFilter;
  }

  if (scopeFilter) {
    where.scope = scopeFilter;
  }

  if (scheduleFilter) {
    where.scheduleType = scheduleFilter;
  }

  const now = new Date();
  const range = monthFilter ? getMonthRange(monthFilter) : null;
  const startsAtFilter: Prisma.DateTimeFilter = {};

  if (range) {
    startsAtFilter.gte = range.start;
    startsAtFilter.lt = range.end;
  }

  if (when === "proximas") {
    const lowerBound = range ? range.start : now;
    startsAtFilter.gte = lowerBound > now ? lowerBound : now;
  } else if (when === "pasadas") {
    const upperBound = range ? range.end : now;
    startsAtFilter.lt = upperBound < now ? upperBound : now;
  }

  if (Object.keys(startsAtFilter).length > 0) {
    where.startsAt = startsAtFilter;
  }

  const canProgramCommunity = can(user, "activity:manage_community");

  const [activities, cycles, communityMembers] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { startsAt: when === "pasadas" ? "desc" : "asc" },
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
                preferredName: true,
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
    }),
    canProgramCommunity
      ? prisma.programCycle.findMany({
          orderBy: { startDate: "desc" },
          select: { id: true, name: true, isActive: true },
        })
      : Promise.resolve([]),
    canProgramCommunity && user.communityId
      ? prisma.user.findMany({
          where: {
            communityId: user.communityId,
            role: { in: ["PP", "COORDINADOR"] },
            isActive: true,
            deletedAt: null,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferredName: true,
            role: true,
            community: { select: { name: true, color: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const canEvaluate = can(user, "activity:evaluate");

  const isFiltered =
    Boolean(monthFilter || typeFilter || scopeFilter || scheduleFilter) ||
    when !== "proximas";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendario del ciclo"
        title={`Ciclo ${activeCycle.name}`}
        description="Consulta los encuentros por alcance y carácter, revisa a sus encargados y confirma tu asistencia antes del evento."
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

      {canProgramCommunity && user.communityId ? (
        <details className="group rounded-2xl border border-line bg-surface shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display text-sm font-semibold text-ink">
                Proponer una actividad de mi Comunidad
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Como coordinación solo programas actividades de alcance
                Comunidad para tu propia Comunidad.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-anil-700">
              <CalendarPlus className="size-3.5" aria-hidden="true" />
              Crear
            </span>
          </summary>
          <div className="border-t border-line/70 bg-canvas/30 p-4">
            <ActivityForm
              mode="create"
              cycles={cycles}
              leaders={communityMembers.map((member) => ({
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
                preferredName: member.preferredName,
                role:
                  member.role === "COORDINADOR"
                    ? ("COORDINADOR" as const)
                    : ("PP" as const),
                community: member.community,
              }))}
              defaultCycleId={activeCycle.id}
              scopeLocked
            />
          </div>
        </details>
      ) : null}

      <CalendarFilters
        months={months}
        month={monthFilter}
        type={typeFilter}
        when={when}
        activityScope={scopeFilter}
        scheduleType={scheduleFilter}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">
          {activities.length} actividad{activities.length === 1 ? "" : "es"}
          {when === "proximas"
            ? " por venir"
            : when === "pasadas"
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
              when === "pasadas"
                ? "No hay actividades pasadas con estos filtros"
                : "No hay actividades para mostrar"
            }
            description={
              when === "proximas" && !isFiltered
                ? "Cuando el Equipo Adulto publique nuevas actividades del ciclo, aparecerán aquí."
                : "Prueba con otro mes, tipo, alcance o carácter de actividad, o cambia el filtro de próximas/pasadas."
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
                    preferredName: leader.user.preferredName,
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
