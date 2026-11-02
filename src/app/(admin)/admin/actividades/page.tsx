import Link from "next/link";
import {
  CalendarPlus,
  CheckCheck,
  ClipboardCheck,
  PencilLine,
  Power,
} from "lucide-react";

import { ActivityCancelButton, ActivityPublishToggle } from "@/components/activities/activity-admin-actions";
import { ActivityCard } from "@/components/activities/activity-card";
import { ActivityForm } from "@/components/activities/activity-form";
import { ProgramCycleActivateButton } from "@/components/activities/program-cycle-activate-button";
import { ProgramCycleForm } from "@/components/activities/program-cycle-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateOnly, toDateTimeInputValue } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Actividades · Panel AA",
};

export default async function AdminActividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const actor = await requirePermission("activity:manage");
  const { cycle: cycleParam } = await searchParams;

  const [cycles, activeCycle, leaderOptions] = await Promise.all([
    prisma.programCycle.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        phase: true,
        _count: {
          select: {
            activities: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.programCycle.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: {
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
    }),
  ]);

  const selectedCycle =
    cycles.find((item) => item.id === cycleParam) ??
    cycles.find((item) => item.isActive) ??
    cycles[0] ??
    null;

  const activities = selectedCycle
    ? await prisma.activity.findMany({
        where: { cycleId: selectedCycle.id, deletedAt: null },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          scope: true,
          scheduleType: true,
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
          _count: { select: { records: true, responses: true } },
        },
      })
    : [];

  const leaderOptionsForForm = leaderOptions.map((leader) => ({
    id: leader.id,
    firstName: leader.firstName,
    lastName: leader.lastName,
    preferredName: leader.preferredName,
    role: leader.role === "COORDINADOR" ? ("COORDINADOR" as const) : ("PP" as const),
    community: leader.community,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Calendario del ciclo"
        description="Crea los ciclos de programa, publica actividades y asigna encargados. Las fechas se ingresan y muestran siempre en hora de Chile."
        actions={
          <Link
            href="/admin/asistencia"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Ir a asistencia
          </Link>
        }
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              Ciclos de Programa
            </p>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Períodos de la unidad
            </h2>
          </div>
          <p className="text-xs text-ink-soft">
            {cycles.length} ciclo{cycles.length === 1 ? "" : "s"}{" "}
            registrado{cycles.length === 1 ? "" : "s"}
          </p>
        </div>

        <ProgramCycleForm hasActiveCycle={Boolean(activeCycle)} />

        {cycles.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Aún no hay ciclos de programa"
            description="Crea el primer ciclo para empezar a cargar actividades en el calendario."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cycles.map((item) => (
              <Card
                key={item.id}
                className={
                  item.isActive
                    ? "border-anil-300 bg-anil-50/40 p-5"
                    : "p-5"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold text-ink">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {formatDateOnly(item.startDate)} —{" "}
                      {formatDateOnly(item.endDate)}
                    </p>
                  </div>
                  {item.isActive ? (
                    <Badge variant="success">
                      <CheckCheck className="size-3" aria-hidden="true" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </div>

                <p className="mt-3 text-xs text-ink-soft">
                  {item._count.activities} actividad
                  {item._count.activities === 1 ? "" : "es"} vigente
                  {item._count.activities === 1 ? "" : "s"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ProgramCycleActivateButton
                    cycleId={item.id}
                    isActive={item.isActive}
                  />
                  <Link
                    href={`/admin/actividades?cycle=${item.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Ver actividades
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              Actividades
            </p>
            <h2 className="font-display text-2xl font-semibold text-ink">
              {selectedCycle
                ? `Ciclo ${selectedCycle.name}`
                : "Sin ciclo seleccionado"}
            </h2>
          </div>

          {cycles.length > 1 ? (
            <form method="get" className="flex items-center gap-2">
              <label
                htmlFor="cycle-select"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
              >
                Ciclo
              </label>
              <select
                id="cycle-select"
                name="cycle"
                defaultValue={selectedCycle?.id ?? ""}
                className="h-9 rounded-xl border border-line bg-surface px-3 text-xs text-ink shadow-sm"
              >
                {cycles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Ver
              </button>
            </form>
          ) : null}
        </div>

        {selectedCycle ? (
          <>
            <details className="group rounded-2xl border border-line bg-surface shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    Nueva actividad
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Título, tipo, alcance, carácter, fechas, lugar y encargados.
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
                  cycles={cycles.map((item) => ({
                    id: item.id,
                    name: item.name,
                    isActive: item.isActive,
                  }))}
                  leaders={leaderOptionsForForm}
                  defaultCycleId={selectedCycle.id}
                />
              </div>
            </details>

            {activities.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No hay actividades en este ciclo"
                description="Crea la primera actividad del período y asigna a sus encargados."
              />
            ) : (
              <div className="space-y-6">
                {activities.map((activity) => {
                  const approved = activity.routeSheets[0] ?? null;

                  return (
                    <div key={activity.id} className="space-y-2">
                      <ActivityCard
                        admin
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
                            ? {
                                fileId: approved.fileId,
                                title: approved.title,
                              }
                            : null,
                        }}
                        viewer={{
                          id: actor.id,
                          role: actor.role,
                          rsvp: null,
                          attendance: null,
                          isRatified: activity._count.records > 0,
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-2 px-1">
                        <Link
                          href={`/admin/asistencia/${activity.id}`}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                          })}
                        >
                          <ClipboardCheck className="size-4" aria-hidden="true" />
                          Ratificar asistencia
                        </Link>
                        <ActivityPublishToggle
                          activityId={activity.id}
                          isPublished={activity.isPublished}
                        />
                        <ActivityCancelButton
                          activityId={activity.id}
                          title={activity.title}
                        />
                        <span className="ml-auto text-[11px] text-ink-soft">
                          {activity._count.responses} respuesta
                          {activity._count.responses === 1 ? "" : "s"} ·{" "}
                          {activity._count.records} registro
                          {activity._count.records === 1 ? "" : "s"}
                        </span>
                      </div>

                      <details className="group rounded-2xl border border-line bg-surface shadow-card">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-anil-700">
                            <PencilLine className="size-3.5" aria-hidden="true" />
                            Editar actividad
                          </span>
                          <span className="text-[11px] text-ink-soft">
                            {activity.leaders.length} encargado
                            {activity.leaders.length === 1 ? "" : "s"}
                          </span>
                        </summary>
                        <div className="border-t border-line/70 bg-canvas/30 p-4">
                          <ActivityForm
                            mode="edit"
                            cycles={cycles.map((item) => ({
                              id: item.id,
                              name: item.name,
                              isActive: item.isActive,
                            }))}
                            leaders={leaderOptionsForForm}
                            defaultCycleId={selectedCycle.id}
                            activity={{
                              id: activity.id,
                              cycleId: selectedCycle.id,
                              title: activity.title,
                              type: activity.type,
                              scope: activity.scope,
                              scheduleType: activity.scheduleType,
                              startsAt: toDateTimeInputValue(activity.startsAt),
                              endsAt: toDateTimeInputValue(activity.endsAt),
                              location: activity.location,
                              description: activity.description,
                              isPublished: activity.isPublished,
                              leaderIds: activity.leaders.map(
                                (leader) => leader.userId,
                              ),
                            }}
                          />
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed p-6 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <Power className="size-4 text-anil-600" aria-hidden="true" />
              Crea y activa un ciclo para comenzar a cargar actividades.
            </span>
          </Card>
        )}
      </section>
    </div>
  );
}
