import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  FileWarning,
  MapPin,
  Star,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

import { RsvpPanel } from "@/components/attendance/rsvp-panel";
import { EvaluationForm } from "@/components/evaluations/evaluation-form";
import { CommunityTag } from "@/components/brand/community-tag";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_STYLES,
  ATTENDANCE_LABELS,
  ATTENDANCE_STYLES,
  RSVP_LABELS,
} from "@/lib/activity-types";
import {
  formatDateTime,
  formatTime,
  formatTimestamp,
} from "@/lib/dates";
import {
  average,
  formatEvaluationScore,
  type EvaluationScores,
} from "@/lib/evaluations";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Actividad",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const user = await requirePermission("calendar:view");
  const { activityId } = await params;

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      deletedAt: null,
      ...(user.role === "AA" ? {} : { isPublished: true }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      startsAt: true,
      endsAt: true,
      location: true,
      isPublished: true,
      semester: { select: { name: true } },
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
        where: { deletedAt: null },
        orderBy: { version: "desc" },
        select: {
          id: true,
          fileId: true,
          title: true,
          version: true,
          status: true,
          rejectionReason: true,
          createdAt: true,
          reviewedAt: true,
          reviewedBy: { select: { firstName: true, lastName: true } },
        },
      },
      responses: {
        where: { userId: user.id },
        take: 1,
        select: {
          status: true,
          justificationText: true,
          respondedAt: true,
          justificationFiles: {
            select: {
              file: { select: { id: true, originalName: true } },
            },
          },
        },
      },
      records: {
        where: { userId: user.id },
        take: 1,
        select: {
          status: true,
          notes: true,
          ratifiedAt: true,
          ratifiedBy: { select: { firstName: true, lastName: true } },
        },
      },
      evaluations: {
        where: { userId: user.id },
        take: 1,
        select: {
          affectivityScore: true,
          corporalityScore: true,
          spiritualityScore: true,
          characterScore: true,
          creativityScore: true,
          sociabilityScore: true,
          comment: true,
          updatedAt: true,
        },
      },
      _count: { select: { records: true, responses: true, evaluations: true } },
    },
  });

  if (!activity) notFound();

  const now = new Date();
  const isAA = user.role === "AA";
  const canEvaluate = can(user, "activity:evaluate");
  const canViewEvaluations = can(user, "activity:evaluation_view");
  const hasEnded = activity.endsAt <= now;
  const response = activity.responses[0] ?? null;
  const record = activity.records[0] ?? null;
  const ownEvaluation = activity.evaluations[0] ?? null;
  const ownScores: EvaluationScores | null = ownEvaluation
    ? {
        affectivityScore: ownEvaluation.affectivityScore,
        corporalityScore: ownEvaluation.corporalityScore,
        spiritualityScore: ownEvaluation.spiritualityScore,
        characterScore: ownEvaluation.characterScore,
        creativityScore: ownEvaluation.creativityScore,
        sociabilityScore: ownEvaluation.sociabilityScore,
      }
    : null;
  const isLeader = activity.leaders.some((leader) => leader.userId === user.id);
  const approvedSheet =
    activity.routeSheets.find((sheet) => sheet.status === "APROBADA") ?? null;
  const latestSheet = activity.routeSheets[0] ?? null;
  const canSeeRouteSheetStatus = isAA || isLeader;
  const routeSheetHref = isAA ? "/admin/hojas-de-ruta" : "/hojas-de-ruta";
  const isRatified = activity._count.records > 0;
  const isFuture = activity.startsAt > now;
  const canRespond = !isAA && isFuture && !isRatified;
  const initialFile = response?.justificationFiles[0]?.file ?? null;

  const evaluationSummary =
    canViewEvaluations && hasEnded
      ? await prisma.activityEvaluation.aggregate({
          where: { activityId },
          _avg: {
            affectivityScore: true,
            corporalityScore: true,
            spiritualityScore: true,
            characterScore: true,
            creativityScore: true,
            sociabilityScore: true,
          },
          _count: true,
        })
      : null;

  const evaluationAverage = evaluationSummary
    ? average(
        [
          evaluationSummary._avg.affectivityScore,
          evaluationSummary._avg.corporalityScore,
          evaluationSummary._avg.spiritualityScore,
          evaluationSummary._avg.characterScore,
          evaluationSummary._avg.creativityScore,
          evaluationSummary._avg.sociabilityScore,
        ].filter((value): value is number => value !== null),
      )
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/calendario"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al calendario
      </Link>

      <PageHeader
        eyebrow={`Semestre ${activity.semester.name}`}
        title={activity.title}
        description={activity.description ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                ACTIVITY_TYPE_STYLES[activity.type],
              )}
            >
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {isLeader ? <Badge variant="gold">Eres encargado</Badge> : null}
            {isAA && !activity.isPublished ? (
              <Badge variant="outline">Oculta</Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-line/70 bg-canvas/40">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                Cuándo y dónde
              </CardDescription>
              <CardTitle className="mt-1 text-xl">
                {formatDateTime(activity.startsAt)}
              </CardTitle>
              <p className="text-sm text-ink-soft">
                Hasta las {formatTime(activity.endsAt)} · hora de Chile
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  {formatTime(activity.startsAt)} –{" "}
                  {formatTime(activity.endsAt)}
                </span>
                {activity.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {activity.location}
                  </span>
                ) : null}
              </div>

              {activity.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                  {activity.description}
                </p>
              ) : (
                <p className="text-sm text-ink-soft">
                  Los encargados aún no agregaron una descripción.
                </p>
              )}

              <div className="border-t border-line/70 pt-4">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  Encargados de la actividad
                </p>
                {activity.leaders.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-soft">
                    Aún no hay encargados asignados.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {activity.leaders.map((leader) => (
                      <li
                        key={leader.userId}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm",
                          leader.userId === user.id &&
                            "border-gold/40 bg-gold-soft/40",
                        )}
                      >
                        <span className="font-medium text-ink">
                          {leader.user.firstName} {leader.user.lastName}
                        </span>
                        <CommunityTag
                          name={leader.user.community?.name}
                          color={leader.user.community?.color}
                        />
                        {leader.userId === user.id ? (
                          <Badge variant="gold">Eres encargado</Badge>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-line/70 pt-4">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  <FileText className="size-3.5" aria-hidden="true" />
                  Hoja de ruta
                </p>
                <div className="mt-2">
                  {approvedSheet ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/files/${approvedSheet.fileId}`}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Hoja de ruta disponible
                        {approvedSheet.version
                          ? ` · v${approvedSheet.version}`
                          : ""}
                      </a>
                      {approvedSheet.reviewedBy ? (
                        <span className="text-[11px] text-ink-soft">
                          Aprobada por {approvedSheet.reviewedBy.firstName}{" "}
                          {approvedSheet.reviewedBy.lastName}
                        </span>
                      ) : null}
                    </div>
                  ) : canSeeRouteSheetStatus &&
                    latestSheet?.status === "PENDIENTE_AUTORIZACION" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning">
                          <Clock3 className="size-3" aria-hidden="true" />
                          Hoja de ruta: En revisión · v{latestSheet.version}
                        </Badge>
                        <a
                          href={`/api/files/${latestSheet.fileId}`}
                          className="text-[11px] font-semibold text-anil-700 hover:text-anil-900"
                        >
                          Ver documento enviado
                        </a>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Los AA están revisando esta versión. No se puede subir
                        otra hasta que respondan.
                      </p>
                      <Link
                        href={routeSheetHref}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Gestionar hoja de ruta
                      </Link>
                    </div>
                  ) : canSeeRouteSheetStatus &&
                    latestSheet?.status === "RECHAZADA" ? (
                    <div className="space-y-2">
                      <Alert variant="error">
                        <p className="font-semibold">
                          Hoja de ruta rechazada · v{latestSheet.version}
                        </p>
                        <p className="mt-1 text-sm">
                          {latestSheet.rejectionReason ??
                            "Los AA pidieron correcciones."}
                        </p>
                      </Alert>
                      <Link
                        href={routeSheetHref}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        <Upload className="size-4" aria-hidden="true" />
                        Subir versión corregida
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">
                        <FileWarning className="size-3" aria-hidden="true" />
                        Hoja de ruta: Pendiente
                      </Badge>
                      {canSeeRouteSheetStatus ? (
                        <Link
                          href={routeSheetHref}
                          className="text-[11px] font-semibold text-anil-700 hover:text-anil-900"
                        >
                          {isAA ? "Moderar hojas de ruta" : "Subir hoja de ruta"}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!isAA ? (
            <Card className="p-5">
              <RsvpPanel
                activityId={activity.id}
                canRespond={canRespond}
                isRatified={isRatified}
                initialStatus={response?.status ?? null}
                initialText={response?.justificationText ?? null}
                initialFile={
                  initialFile
                    ? {
                        id: initialFile.id,
                        originalName: initialFile.originalName,
                      }
                    : null
                }
              />
            </Card>
          ) : null}

          {canEvaluate && hasEnded ? (
            <Card id="evaluacion" className="scroll-mt-24 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                    <Star className="size-3.5" aria-hidden="true" />
                    Evaluación posterior
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                    Cómo se vivió la actividad
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                    Evaluación de las seis áreas de desarrollo scout. Es
                    obligatoria la nota de cada área; el comentario escrito es
                    opcional.
                  </p>
                </div>
                {ownEvaluation ? (
                  <Badge variant="success">Evaluación enviada</Badge>
                ) : (
                  <Badge variant="warning">Pendiente</Badge>
                )}
              </div>

              <div className="mt-5">
                <EvaluationForm
                  activityId={activity.id}
                  initialScores={ownScores}
                  initialComment={ownEvaluation?.comment ?? null}
                />
              </div>

              {ownEvaluation ? (
                <p className="mt-3 text-[11px] text-ink-soft">
                  Última actualización:{" "}
                  {formatTimestamp(ownEvaluation.updatedAt)}.
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              Tu estado
            </p>

            {isAA ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isRatified ? "success" : "outline"}>
                    {isRatified ? "Asistencia ratificada" : "Por ratificar"}
                  </Badge>
                  <span className="text-xs text-ink-soft">
                    {activity._count.responses} respuesta
                    {activity._count.responses === 1 ? "" : "s"} previas
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Revisa las confirmaciones, justificaciones y luego ratifica la
                  asistencia real del grupo.
                </p>
                <Link
                  href={`/admin/asistencia/${activity.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  Abrir panel de asistencia
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {record ? (
                    <Badge variant={ATTENDANCE_STYLES[record.status]}>
                      {ATTENDANCE_LABELS[record.status]}
                    </Badge>
                  ) : response ? (
                    <Badge
                      variant={
                        response.status === "CONFIRMADO" ? "success" : "warning"
                      }
                    >
                      {RSVP_LABELS[response.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Sin respuesta</Badge>
                  )}
                  {isRatified ? (
                    <Badge variant="success">Ratificada</Badge>
                  ) : null}
                </div>

                {record ? (
                  <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2 text-xs text-ink-soft">
                    <p>
                      Ratificada por{" "}
                      {record.ratifiedBy
                        ? `${record.ratifiedBy.firstName} ${record.ratifiedBy.lastName}`
                        : "un Adulto Acompañante"}{" "}
                      el {formatTimestamp(record.ratifiedAt)}.
                    </p>
                    {record.notes ? (
                      <p className="mt-1 text-ink">Nota: {record.notes}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {canRespond
                      ? "Confirma tu asistencia o avisa si no podrás ir. Puedes cambiar tu respuesta hasta que comience la actividad."
                      : response
                        ? "Tu respuesta quedó registrada y ya no puede modificarse."
                        : "No registraste una respuesta antes del cierre. Un AA ratificará tu asistencia real."}
                  </p>
                )}

                {response?.respondedAt ? (
                  <p className="text-[11px] text-ink-soft">
                    Respondiste el {formatTimestamp(response.respondedAt)}.
                  </p>
                ) : null}
              </div>
            )}
          </Card>

          {canViewEvaluations && hasEnded && evaluationSummary ? (
            <Card className="border-anil-200 bg-anil-50/40 p-5">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                <Star className="size-3.5" aria-hidden="true" />
                Evaluaciones
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surface px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Respuestas
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">
                    {evaluationSummary._count}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Promedio
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">
                    {formatEvaluationScore(evaluationAverage)}
                    <span className="ml-0.5 text-[10px] font-medium text-ink-soft">
                      /7
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                {evaluationSummary._count === 0
                  ? "Los PP y coordinadores aún no han respondido esta evaluación."
                  : "Revisa las seis áreas y los comentarios de cada evaluador."}
              </p>
              <Link
                href={`/admin/evaluaciones/${activity.id}`}
                className={buttonVariants({ size: "sm", className: "mt-3" })}
              >
                <Star className="size-4" aria-hidden="true" />
                Ver todas las respuestas
              </Link>
            </Card>
          ) : null}

          <Card className="p-5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              <Users className="size-3.5" aria-hidden="true" />
              Resumen
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Respuestas
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-ink">
                  {activity._count.responses}
                </dd>
              </div>
              <div className="rounded-xl border border-line bg-canvas/50 px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Ratificados
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-ink">
                  {activity._count.records}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
