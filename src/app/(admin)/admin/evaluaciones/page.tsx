import Link from "next/link";
import { CalendarDays, MessageSquareText, Star } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_STYLES,
} from "@/lib/activity-types";
import { formatDateTime, formatTime } from "@/lib/dates";
import { levelDistribution } from "@/lib/evaluations";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Evaluaciones · Panel AA",
};

export default async function AdminEvaluacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  await requirePermission("activity:evaluation_view");
  const { cycle: cycleParam } = await searchParams;
  const now = new Date();

  const [cycles, evaluatorCount] = await Promise.all([
    prisma.programCycle.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        deletedAt: null,
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
        where: {
          cycleId: selectedCycle.id,
          deletedAt: null,
          endsAt: { lt: now },
        },
        orderBy: { endsAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
          endsAt: true,
          location: true,
          evaluations: {
            select: {
              objectiveAchievementLevel: true,
            },
          },
        },
      })
    : [];

  const decorated = activities.map((activity) => ({
    ...activity,
    responseCount: activity.evaluations.length,
    distribution: levelDistribution(activity.evaluations),
  }));

  const totalResponses = decorated.reduce(
    (sum, activity) => sum + activity.responseCount,
    0,
  );
  const withoutResponses = decorated.filter(
    (activity) => activity.responseCount === 0,
  ).length;
  const pending = decorated.reduce(
    (sum, activity) =>
      sum + Math.max(evaluatorCount - activity.responseCount, 0),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Evaluaciones de actividades"
        description="Después de cada encuentro, los participantes dejan una observación cualitativa sobre los objetivos, las áreas de desarrollo y lo vivido. Aquí puedes leer todas las reflexiones, sin notas ni promedios."
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

      {!selectedCycle ? (
        <EmptyState
          icon={Star}
          title="Aún no hay ciclos"
          description="Crea un ciclo y publica actividades para habilitar las evaluaciones posteriores."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Actividades terminadas
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {decorated.length}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Ciclo {selectedCycle.name}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Observaciones recibidas
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {totalResponses}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Reflexiones de participantes
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Por responder
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {pending}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {evaluatorCount} cuenta{evaluatorCount === 1 ? "" : "s"}{" "}
                habilitada{evaluatorCount === 1 ? "" : "s"} para observar
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Sin respuestas
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {withoutResponses}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Actividades esperando observaciones
              </p>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Actividades del ciclo
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Solo aparecen actividades cuya hora de término ya pasó.
                </p>
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
                    defaultValue={selectedCycle.id}
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

            {decorated.length === 0 ? (
              <Card className="border-dashed bg-surface/70 p-6">
                <EmptyState
                  icon={MessageSquareText}
                  title="No hay actividades terminadas"
                  description="Cuando una actividad del ciclo llegue a su hora de término, aparecerá aquí para reunir las observaciones de participantes."
                  className="border-0 bg-transparent p-0"
                />
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {decorated.map((activity) => (
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
                      {activity.responseCount === 0 ? (
                        <Badge variant="warning">Sin respuestas</Badge>
                      ) : (
                        <Badge variant="success">
                          <MessageSquareText
                            className="size-3"
                            aria-hidden="true"
                          />
                          {activity.responseCount} respuesta
                          {activity.responseCount === 1 ? "" : "s"}
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="rounded-xl border border-anil-100 bg-anil-50/60 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-anil-800">
                          Distribución del logro
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-ink">
                          {activity.distribution
                            .map((level) => `${level.shortLabel}: ${level.count}`)
                            .join(" · ")}
                        </p>
                      </div>
                      <Link
                        href={`/admin/evaluaciones/${activity.id}`}
                        className={buttonVariants({
                          variant:
                            activity.responseCount > 0 ? "primary" : "secondary",
                          size: "sm",
                        })}
                      >
                        <Star className="size-4" aria-hidden="true" />
                        {activity.responseCount > 0
                          ? "Ver reflexiones"
                          : "Revisar observaciones"}
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
