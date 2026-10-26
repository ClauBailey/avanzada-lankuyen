import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileClock,
  FileText,
  FileX2,
  History,
  Upload,
  UserRound,
} from "lucide-react";

import { RouteSheetFilters } from "@/components/route-sheets/route-sheet-filters";
import { RouteSheetReviewActions } from "@/components/route-sheets/route-sheet-review-actions";
import { RouteSheetStatusBadge } from "@/components/route-sheets/route-sheet-status-badge";
import { RunReminderButton } from "@/components/route-sheets/run-reminder-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RouteSheetStatus } from "@/generated/prisma/enums";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_STYLES } from "@/lib/activity-types";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime, formatTimestamp } from "@/lib/dates";
import {
  formatFileSize,
  routeSheetVersionLabel,
  ROUTE_SHEET_STATUSES,
} from "@/lib/route-sheets";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { ROUTE_SHEET_REMINDER_JOB } from "@/server/cron/route-sheet-reminder";

export const metadata = {
  title: "Hojas de ruta · Panel AA",
};

function isRouteSheetStatus(value: string): value is RouteSheetStatus {
  return (ROUTE_SHEET_STATUSES as string[]).includes(value);
}

function readStats(stats: unknown) {
  if (!stats || typeof stats !== "object") return null;
  const record = stats as Record<string, unknown>;

  return {
    activities:
      typeof record.activities === "number" ? record.activities : null,
    notifications:
      typeof record.notifications === "number" ? record.notifications : null,
  };
}

export default async function AdminHojasDeRutaPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    semester?: string;
    activity?: string;
  }>;
}) {
  await requirePermission("route_sheet:review");
  const params = await searchParams;

  const [semesters, activities] = await Promise.all([
    prisma.semester.findMany({
      orderBy: { startsOn: "desc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.activity.findMany({
      where: { deletedAt: null },
      orderBy: { startsAt: "desc" },
      select: { id: true, title: true, semesterId: true },
    }),
  ]);

  const semesterId = semesters.some((item) => item.id === params.semester)
    ? (params.semester ?? "")
    : "";
  const activityId = activities.some((item) => item.id === params.activity)
    ? (params.activity ?? "")
    : "";

  const statusParam = params.status ?? "";
  const showAll = statusParam === "all";
  const status: RouteSheetStatus | "" = showAll
    ? ""
    : isRouteSheetStatus(statusParam)
      ? statusParam
      : "PENDIENTE_AUTORIZACION";
  const selectStatus: RouteSheetStatus | "all" = showAll
    ? "all"
    : status === ""
      ? "PENDIENTE_AUTORIZACION"
      : status;

  const scopeWhere: Prisma.RouteSheetWhereInput = {
    deletedAt: null,
    activity: {
      deletedAt: null,
      ...(semesterId ? { semesterId } : {}),
      ...(activityId ? { id: activityId } : {}),
    },
  };

  const [countRows, sheets, lastRun] = await Promise.all([
    prisma.routeSheet.groupBy({
      by: ["status"],
      where: scopeWhere,
      _count: { _all: true },
    }),
    prisma.routeSheet.findMany({
      where: {
        ...scopeWhere,
        ...(status ? { status } : {}),
      },
      orderBy: {
        createdAt: status === "PENDIENTE_AUTORIZACION" ? "asc" : "desc",
      },
      select: {
        id: true,
        status: true,
        version: true,
        title: true,
        description: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            community: { select: { name: true, color: true } },
          },
        },
        reviewedBy: {
          select: { firstName: true, lastName: true },
        },
        activity: {
          select: {
            id: true,
            title: true,
            type: true,
            startsAt: true,
            endsAt: true,
            location: true,
            semester: { select: { name: true } },
            leaders: {
              orderBy: { assignedAt: "asc" },
              select: {
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.jobRun.findFirst({
      where: { jobName: ROUTE_SHEET_REMINDER_JOB },
      orderBy: { startedAt: "desc" },
      select: {
        status: true,
        runKey: true,
        startedAt: true,
        finishedAt: true,
        stats: true,
        error: true,
      },
    }),
  ]);

  const counts: Record<RouteSheetStatus, number> = {
    PENDIENTE_AUTORIZACION: 0,
    APROBADA: 0,
    RECHAZADA: 0,
  };

  for (const row of countRows) {
    counts[row.status] = row._count._all;
  }

  const lastRunStats = readStats(lastRun?.stats);
  const lastRunLabel = lastRun
    ? `Última ejecución: ${formatTimestamp(lastRun.startedAt)} · ${
        lastRun.status === "OK"
          ? "completada"
          : lastRun.status === "ERROR"
            ? "con error"
            : "en curso"
      }${
        lastRunStats?.activities !== null &&
        lastRunStats?.activities !== undefined
          ? ` · ${lastRunStats.activities} actividad${
              lastRunStats.activities === 1 ? "" : "es"
            }`
          : ""
      }${
        lastRunStats?.notifications !== null &&
        lastRunStats?.notifications !== undefined
          ? ` · ${lastRunStats.notifications} aviso${
              lastRunStats.notifications === 1 ? "" : "s"
            }`
          : ""
      } (${lastRun.runKey})`
    : "El recordatorio todavía no se ha ejecutado.";

  const statusTitle =
    status === ""
      ? "Todas las hojas de ruta"
      : status === "PENDIENTE_AUTORIZACION"
        ? "Hojas en revisión"
        : status === "APROBADA"
          ? "Hojas aprobadas"
          : "Hojas rechazadas";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Moderación de hojas de ruta"
        description="Revisa los documentos enviados por los encargados, autorízalos para que toda la unidad pueda descargarlos o recházalos con un motivo claro."
        actions={
          <Link
            href="/hojas-de-ruta"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <FileText className="size-4" aria-hidden="true" />
            Ver repositorio
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pendientes"
          value={counts.PENDIENTE_AUTORIZACION}
          hint="Requieren revisión de un AA"
          icon={FileClock}
          className={
            counts.PENDIENTE_AUTORIZACION > 0
              ? "border-amber-200 bg-amber-50/40"
              : undefined
          }
        />
        <StatCard
          label="Aprobadas"
          value={counts.APROBADA}
          hint="Visibles en el calendario"
          icon={FileCheck2}
        />
        <StatCard
          label="Rechazadas"
          value={counts.RECHAZADA}
          hint="Los encargados recibieron el motivo"
          icon={FileX2}
        />
      </div>

      <RunReminderButton lastRunLabel={lastRunLabel} />

      <RouteSheetFilters
        semesters={semesters}
        activities={activities}
        status={selectStatus}
        semesterId={semesterId}
        activityId={activityId}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              <History className="size-3.5" aria-hidden="true" />
              Bandeja de moderación
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {statusTitle}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {semesterId
                ? `Filtradas por semestre y actividad.`
                : "Todas las actividades con documentos enviados."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status === "PENDIENTE_AUTORIZACION" &&
            counts.PENDIENTE_AUTORIZACION > 0 ? (
              <Badge variant="warning">
                <Clock3 className="size-3" aria-hidden="true" />
                {counts.PENDIENTE_AUTORIZACION} por revisar
              </Badge>
            ) : null}
            <Badge variant="outline">
              {sheets.length} resultado{sheets.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {sheets.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-6">
            <EmptyState
              icon={FileCheck2}
              title={
                status === "PENDIENTE_AUTORIZACION"
                  ? "No hay hojas pendientes de autorización"
                  : "No hay documentos con estos filtros"
              }
              description={
                status === "PENDIENTE_AUTORIZACION"
                  ? "Cuando un encargado suba una hoja de ruta, aparecerá aquí para que la revises."
                  : "Prueba con otro estado, semestre o actividad."
              }
              className="border-0 bg-transparent p-0"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {sheets.map((sheet) => {
              const isPending = sheet.status === "PENDIENTE_AUTORIZACION";
              const leaders = sheet.activity.leaders
                .map(
                  (leader) =>
                    `${leader.user.firstName} ${leader.user.lastName}`,
                )
                .join(", ");

              return (
                <Card
                  key={sheet.id}
                  className={cn(
                    "overflow-hidden",
                    isPending
                      ? "border-amber-300 bg-gradient-to-br from-amber-50/50 via-surface to-surface shadow-float"
                      : "bg-surface",
                  )}
                >
                  <CardHeader className="border-b border-line/70">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                              ACTIVITY_TYPE_STYLES[sheet.activity.type],
                            )}
                          >
                            {ACTIVITY_TYPE_LABELS[sheet.activity.type]}
                          </span>
                          <RouteSheetStatusBadge status={sheet.status} />
                          <Badge variant="outline">
                            {routeSheetVersionLabel(sheet.version)}
                          </Badge>
                          {isPending ? (
                            <Badge variant="warning">Requiere revisión</Badge>
                          ) : null}
                        </div>

                        <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                          <Link
                            href={`/calendario/${sheet.activity.id}`}
                            className="hover:text-anil-800"
                          >
                            {sheet.activity.title}
                          </Link>
                        </h3>

                        <p className="mt-1 text-xs text-ink-soft">
                          {formatDateTime(sheet.activity.startsAt)} ·{" "}
                          {sheet.activity.semester.name}
                          {sheet.activity.location
                            ? ` · ${sheet.activity.location}`
                            : ""}
                        </p>

                        {leaders ? (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-soft">
                            <UserRound className="size-3" aria-hidden="true" />
                            Encargados: {leaders}
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-amber-800">
                            Actividad sin encargados asignados.
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/calendario/${sheet.activity.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Ver actividad
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
                        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                          <FileText className="size-3.5" aria-hidden="true" />
                          Documento
                        </p>
                        <p className="mt-1.5 break-all text-sm font-medium text-ink">
                          {sheet.file.originalName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {sheet.file.mimeType} ·{" "}
                          {formatFileSize(sheet.file.sizeBytes)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={`/api/files/${sheet.file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            <ExternalLink
                              className="size-4"
                              aria-hidden="true"
                            />
                            Vista previa
                          </a>
                          <a
                            href={`/api/files/${sheet.file.id}`}
                            download
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            <Download className="size-4" aria-hidden="true" />
                            Descargar
                          </a>
                        </div>
                      </div>

                      <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
                        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                          <UserRound className="size-3.5" aria-hidden="true" />
                          Envío
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-ink">
                          {sheet.uploadedBy.firstName}{" "}
                          {sheet.uploadedBy.lastName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-soft">
                          {ROLE_LABELS[sheet.uploadedBy.role]}
                          {sheet.uploadedBy.community
                            ? ` · ${sheet.uploadedBy.community.name}`
                            : ""}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Versión {sheet.version} ·{" "}
                          {formatTimestamp(sheet.createdAt)}
                        </p>
                        {sheet.title ? (
                          <p className="mt-1 text-[11px] text-ink-soft">
                            Título: {sheet.title}
                          </p>
                        ) : null}
                        {sheet.description ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                            Nota: {sheet.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {sheet.status === "RECHAZADA" ? (
                      <Alert variant="error">
                        <p className="font-semibold">
                          Rechazada
                          {sheet.reviewedBy
                            ? ` por ${sheet.reviewedBy.firstName} ${sheet.reviewedBy.lastName}`
                            : ""}
                          {sheet.reviewedAt
                            ? ` el ${formatTimestamp(sheet.reviewedAt)}`
                            : ""}
                          .
                        </p>
                        <p className="mt-1 text-sm">
                          Motivo:{" "}
                          {sheet.rejectionReason ??
                            "No se registró un motivo."}
                        </p>
                      </Alert>
                    ) : null}

                    {sheet.status === "APROBADA" ? (
                      <Alert variant="success">
                        <p className="inline-flex items-center gap-1.5 font-semibold">
                          <CheckCircle2
                            className="size-4"
                            aria-hidden="true"
                          />
                          Documento aprobado y visible en el calendario
                        </p>
                        <p className="mt-1 text-sm">
                          {sheet.reviewedBy
                            ? `Autorizada por ${sheet.reviewedBy.firstName} ${sheet.reviewedBy.lastName}`
                            : "Autorizada por un AA"}
                          {sheet.reviewedAt
                            ? ` el ${formatTimestamp(sheet.reviewedAt)}`
                            : ""}
                          .
                        </p>
                      </Alert>
                    ) : null}

                    {isPending ? (
                      <RouteSheetReviewActions
                        routeSheetId={sheet.id}
                        activityTitle={sheet.activity.title}
                        version={sheet.version}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                        <Upload className="size-3.5" aria-hidden="true" />
                        Si se necesita una corrección, el encargado debe subir
                        una nueva versión desde Hojas de ruta.
                        <Link
                          href={`/calendario/${sheet.activity.id}`}
                          className="font-semibold text-anil-700 hover:text-anil-900"
                        >
                          Revisar actividad
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Card className="border-dashed bg-canvas/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Recordatorio automático
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              El cron revisa cada miércoles a las 11:00 (hora de Chile) las
              actividades publicadas dentro de los próximos 7 días que no
              tengan hoja aprobada ni pendiente, y avisa a sus encargados. Si
              una actividad no tiene encargados, el aviso llega a los AA.
            </p>
          </div>
          <Link
            href="/admin/actividades"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Revisar calendario
          </Link>
        </div>
      </Card>
    </div>
  );
}
