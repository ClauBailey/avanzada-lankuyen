import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";

import { EvaluationResults } from "@/components/evaluations/evaluation-results";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatTime } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Respuestas de evaluación · Panel AA",
};

export default async function AdminEvaluacionDetallePage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  await requirePermission("activity:evaluation_view");
  const { activityId } = await params;

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      location: true,
      semester: { select: { name: true } },
    },
  });

  if (!activity) notFound();

  const [evaluations, evaluatorCount] = await Promise.all([
    prisma.activityEvaluation.findMany({
      where: { activityId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        affectivityScore: true,
        corporalityScore: true,
        spiritualityScore: true,
        characterScore: true,
        creativityScore: true,
        sociabilityScore: true,
        comment: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            community: { select: { name: true, color: true } },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        isActive: true,
        deletedAt: null,
      },
    }),
  ]);

  const results = evaluations.map((evaluation) => ({
    id: evaluation.id,
    firstName: evaluation.user.firstName,
    lastName: evaluation.user.lastName,
    username: evaluation.user.username,
    community: evaluation.user.community,
    scores: {
      affectivityScore: evaluation.affectivityScore,
      corporalityScore: evaluation.corporalityScore,
      spiritualityScore: evaluation.spiritualityScore,
      characterScore: evaluation.characterScore,
      creativityScore: evaluation.creativityScore,
      sociabilityScore: evaluation.sociabilityScore,
    },
    comment: evaluation.comment,
    updatedAt: evaluation.updatedAt,
  }));

  const hasEnded = activity.endsAt <= new Date();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/evaluaciones"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a evaluaciones
      </Link>

      <PageHeader
        eyebrow={`Semestre ${activity.semester.name}`}
        title={activity.title}
        description={`${formatDateTime(activity.startsAt)} · hasta las ${formatTime(
          activity.endsAt,
        )}${activity.location ? ` · ${activity.location}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasEnded ? "success" : "warning"}>
              {hasEnded ? "Actividad terminada" : "Aún no termina"}
            </Badge>
            <Link
              href={`/calendario/${activity.id}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver en calendario
            </Link>
          </div>
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Respuestas posteriores al término de la actividad
          </span>
          {activity.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {activity.location}
            </span>
          ) : null}
        </div>
        {activity.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
            {activity.description}
          </p>
        ) : null}
      </Card>

      {!hasEnded ? (
        <Alert variant="info">
          La actividad todavía no termina. Las evaluaciones de PP y
          coordinadores se habilitarán automáticamente después de la hora de
          término.
        </Alert>
      ) : null}

      <EvaluationResults evaluations={results} expectedCount={evaluatorCount} />
    </div>
  );
}
