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
import {
  formatEvaluationScore,
  overallEvaluationAverage,
} from "@/lib/evaluations";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Evaluaciones · Panel AA",
};

export default async function AdminEvaluacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  await requirePermission("activity:evaluation_view");
  const { semester: semesterParam } = await searchParams;
  const now = new Date();

  const [semesters, evaluatorCount] = await Promise.all([
    prisma.semester.findMany({
      orderBy: { startsOn: "desc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.user.count({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
      },
    }),
  ]);

  const selectedSemester =
    semesters.find((item) => item.id === semesterParam) ??
    semesters.find((item) => item.isActive) ??
    semesters[0] ??
    null;

  const activities = selectedSemester
    ? await prisma.activity.findMany({
        where: {
          semesterId: selectedSemester.id,
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
              affectivityScore: true,
              corporalityScore: true,
              spiritualityScore: true,
              characterScore: true,
              creativityScore: true,
              sociabilityScore: true,
            },
          },
        },
      })
    : [];

  const decorated = activities.map((activity) => ({
    ...activity,
    responseCount: activity.evaluations.length,
    average: overallEvaluationAverage(activity.evaluations),
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
        description="Después de cada encuentro, los PP y coordinadores evalúan las seis áreas de desarrollo scout y pueden dejar un comentario. Aquí puedes leer todas las respuestas."
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

      {!selectedSemester ? (
        <EmptyState
          icon={Star}
          title="Aún no hay semestres"
          description="Crea un semestre y publica actividades para habilitar las evaluaciones posteriores."
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
                Semestre {selectedSemester.name}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Respuestas recibidas
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {totalResponses}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Evaluaciones de PP y coordinadores
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
                habilitada{evaluatorCount === 1 ? "" : "s"} para evaluar
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
                Actividades esperando evaluación
              </p>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Actividades del semestre
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Solo aparecen actividades cuya hora de término ya pasó.
                </p>
              </div>

              {semesters.length > 1 ? (
                <form method="get" className="flex items-center gap-2">
                  <label
                    htmlFor="semester-select"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
                  >
                    Semestre
                  </label>
                  <select
                    id="semester-select"
                    name="semester"
                    defaultValue={selectedSemester.id}
                    className="h-9 rounded-xl border border-line bg-surface px-3 text-xs text-ink shadow-sm"
                  >
                    {semesters.map((item) => (
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
                  description="Cuando una actividad del semestre llegue a su hora de término, aparecerá aquí para reunir las evaluaciones de PP y coordinadores."
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
                          Promedio general
                        </p>
                        <p className="mt-0.5 font-display text-xl font-semibold text-ink">
                          {formatEvaluationScore(activity.average)}
                          <span className="ml-1 text-[10px] font-medium text-ink-soft">
                            / 7
                          </span>
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
                          ? "Ver respuestas"
                          : "Revisar evaluación"}
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
