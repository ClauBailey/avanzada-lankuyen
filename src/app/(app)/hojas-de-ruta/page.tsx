import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  FileWarning,
  History,
  MapPin,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RouteSheetStatusBadge } from "@/components/route-sheets/route-sheet-status-badge";
import { RouteSheetUploadForm } from "@/components/route-sheets/route-sheet-upload-form";
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
import type { RouteSheetStatus } from "@/generated/prisma/enums";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_STYLES } from "@/lib/activity-types";
import { formatDateTime, formatShortDate, formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  routeSheetVersionLabel,
  ROUTE_SHEET_STATUS_DESCRIPTIONS,
} from "@/lib/route-sheets";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Hojas de ruta",
};

function latestByStatus<T extends { status: RouteSheetStatus }>(
  sheets: T[],
  status: RouteSheetStatus,
) {
  return sheets.find((sheet) => sheet.status === status) ?? null;
}

export default async function HojasDeRutaPage() {
  const user = await requirePermission("calendar:view");
  const now = new Date();

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const [assignments, repository] = await Promise.all([
    prisma.activity.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        startsAt: { gte: now },
        leaders: { some: { userId: user.id } },
      },
      orderBy: { startsAt: "asc" },
      take: 12,
      select: {
        id: true,
        title: true,
        type: true,
        startsAt: true,
        endsAt: true,
        location: true,
        description: true,
        leaders: {
          orderBy: { assignedAt: "asc" },
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        routeSheets: {
          where: { deletedAt: null },
          orderBy: { version: "desc" },
          select: {
            id: true,
            status: true,
            version: true,
            title: true,
            description: true,
            rejectionReason: true,
            createdAt: true,
            reviewedAt: true,
            fileId: true,
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
              },
            },
            reviewedBy: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.routeSheet.findMany({
      where: {
        status: "APROBADA",
        deletedAt: null,
        activity: {
          deletedAt: null,
          isPublished: true,
          ...(activeSemester ? { semesterId: activeSemester.id } : {}),
        },
      },
      orderBy: { activity: { startsAt: "desc" } },
      select: {
        id: true,
        version: true,
        title: true,
        description: true,
        reviewedAt: true,
        createdAt: true,
        fileId: true,
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            type: true,
            startsAt: true,
            location: true,
            semester: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const totalPendingAssignments = assignments.filter((activity) =>
    activity.routeSheets.some(
      (sheet) => sheet.status === "PENDIENTE_AUTORIZACION",
    ),
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Documentos de la unidad"
        title="Hojas de ruta"
        description="Sube la hoja de ruta de las actividades que encabezas, revisa el feedback de los AA y descarga los documentos aprobados del semestre."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user.role === "AA" ? (
              <Link
                href="/admin/hojas-de-ruta"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Moderar hojas
              </Link>
            ) : null}
            <Link
              href="/calendario"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver calendario
            </Link>
          </div>
        }
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              <Upload className="size-3.5" aria-hidden="true" />
              Mis asignaciones
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Actividades donde eres encargado
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Las actividades sin hoja aprobada se destacan para que no se te
              pase la fecha.
            </p>
          </div>
          {totalPendingAssignments > 0 ? (
            <Badge variant="warning">
              <Clock3 className="size-3" aria-hidden="true" />
              {totalPendingAssignments} en revisión
            </Badge>
          ) : null}
        </div>

        {assignments.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-6">
            <EmptyState
              icon={FileText}
              title={
                user.role === "AA"
                  ? "Las cuentas AA no reciben asignaciones de actividad"
                  : "No tienes actividades próximas como encargado"
              }
              description={
                user.role === "AA"
                  ? "Puedes revisar y moderar todos los documentos desde el panel de hojas de ruta."
                  : "Cuando un AA te asigne como encargado de una actividad futura, aparecerá aquí con su estado de hoja de ruta."
              }
              className="border-0 bg-transparent p-0"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((activity) => {
              const approved = latestByStatus(activity.routeSheets, "APROBADA");
              const pending = latestByStatus(
                activity.routeSheets,
                "PENDIENTE_AUTORIZACION",
              );
              const rejected = latestByStatus(activity.routeSheets, "RECHAZADA");
              const latest = approved ?? pending ?? rejected ?? null;
              const maxVersion = activity.routeSheets.reduce(
                (max, sheet) => Math.max(max, sheet.version),
                0,
              );
              const nextVersion = maxVersion + 1;
              const state: RouteSheetStatus | null = latest?.status ?? null;
              const needsUpload = !approved && !pending;
              const highlight = needsUpload;

              return (
                <Card
                  key={activity.id}
                  className={cn(
                    "overflow-hidden",
                    highlight
                      ? "border-gold/50 bg-gradient-to-br from-gold-soft/40 via-surface to-surface"
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
                              ACTIVITY_TYPE_STYLES[activity.type],
                            )}
                          >
                            {ACTIVITY_TYPE_LABELS[activity.type]}
                          </span>
                          <Badge variant="gold">Eres encargado</Badge>
                          {state ? (
                            <RouteSheetStatusBadge status={state} />
                          ) : (
                            <Badge variant="warning">
                              <FileWarning className="size-3" aria-hidden="true" />
                              Falta subirla
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="mt-2">
                          <Link
                            href={`/calendario/${activity.id}`}
                            className="hover:text-anil-800"
                          >
                            {activity.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {formatDateTime(activity.startsAt)}
                          {activity.location ? (
                            <span className="inline-flex items-center gap-1">
                              {" "}
                              · <MapPin className="size-3" aria-hidden="true" />
                              {activity.location}
                            </span>
                          ) : null}
                        </CardDescription>
                      </div>

                      <Link
                        href={`/calendario/${activity.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Ver actividad
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-5">
                    {approved ? (
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                        <CheckCircle2
                          className="size-5 shrink-0 text-emerald-700"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-emerald-900">
                            Hoja de ruta aprobada ·{" "}
                            {routeSheetVersionLabel(approved.version)}
                          </p>
                          <p className="text-xs text-emerald-800/80">
                            {approved.reviewedBy
                              ? `Revisada por ${approved.reviewedBy.firstName} ${approved.reviewedBy.lastName}`
                              : "Aprobada por un AA"}
                            {approved.reviewedAt
                              ? ` el ${formatTimestamp(approved.reviewedAt)}`
                              : ""}
                            .
                          </p>
                        </div>
                        <a
                          href={`/api/files/${approved.fileId}`}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                          })}
                        >
                          <Download className="size-4" aria-hidden="true" />
                          Descargar
                        </a>
                      </div>
                    ) : pending ? (
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                        <Clock3
                          className="size-5 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-amber-900">
                            Versión {pending.version} en revisión
                          </p>
                          <p className="text-xs text-amber-800/80">
                            Enviada el {formatTimestamp(pending.createdAt)}. Un
                            AA la revisará y recibirás una notificación.
                          </p>
                        </div>
                        <a
                          href={`/api/files/${pending.fileId}`}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                          })}
                        >
                          <FileText className="size-4" aria-hidden="true" />
                          Ver documento
                        </a>
                      </div>
                    ) : rejected ? (
                      <Alert variant="error">
                        <p className="font-semibold">
                          Versión {rejected.version} rechazada
                        </p>
                        <p className="mt-1 text-sm">
                          {rejected.rejectionReason ??
                            "Los AA pidieron correcciones."}
                        </p>
                        <p className="mt-2 text-xs text-red-800/80">
                          Corrige el documento y sube la versión {nextVersion}{" "}
                          para una nueva revisión.
                        </p>
                      </Alert>
                    ) : (
                      <div className="rounded-xl border border-gold/40 bg-gold-soft/40 px-4 py-3 text-sm text-[#6f5213]">
                        Todavía no hay una hoja de ruta para esta actividad.
                        Súbela para que los AA puedan autorizarla.
                      </div>
                    )}

                    {needsUpload ? (
                      <div className="rounded-xl border border-line bg-canvas/40 p-4">
                        <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                          <Upload className="size-3.5" aria-hidden="true" />
                          {rejected
                            ? `Subir versión corregida (${routeSheetVersionLabel(nextVersion)})`
                            : "Subir hoja de ruta"}
                        </p>
                        <RouteSheetUploadForm
                          activityId={activity.id}
                          activityTitle={activity.title}
                          nextVersion={nextVersion}
                          isResubmission={Boolean(rejected)}
                        />
                      </div>
                    ) : null}

                    {activity.routeSheets.length > 0 ? (
                      <details className="rounded-xl border border-line bg-canvas/30">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-anil-700">
                          <span className="inline-flex items-center gap-1.5">
                            <History className="size-3.5" aria-hidden="true" />
                            Historial de versiones
                          </span>
                          <span className="text-[11px] font-normal text-ink-soft">
                            {activity.routeSheets.length} versión
                            {activity.routeSheets.length === 1 ? "" : "es"}
                          </span>
                        </summary>

                        <ul className="space-y-2 border-t border-line/70 px-3.5 py-3">
                          {activity.routeSheets.map((sheet) => (
                            <li
                              key={sheet.id}
                              className="rounded-lg border border-line/70 bg-surface px-3 py-2"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-ink">
                                  {routeSheetVersionLabel(sheet.version)}
                                </span>
                                <RouteSheetStatusBadge status={sheet.status} />
                                <span className="text-[11px] text-ink-soft">
                                  {formatTimestamp(sheet.createdAt)}
                                </span>
                                <a
                                  href={`/api/files/${sheet.fileId}`}
                                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-anil-700 hover:text-anil-900"
                                >
                                  <FileText
                                    className="size-3"
                                    aria-hidden="true"
                                  />
                                  Ver archivo
                                </a>
                              </div>

                              {sheet.status === "RECHAZADA" &&
                              sheet.rejectionReason ? (
                                <p className="mt-1.5 text-xs leading-relaxed text-red-800">
                                  Motivo: {sheet.rejectionReason}
                                </p>
                              ) : null}

                              {sheet.status === "APROBADA" &&
                              sheet.reviewedAt ? (
                                <p className="mt-1 text-[11px] text-ink-soft">
                                  Aprobada el{" "}
                                  {formatTimestamp(sheet.reviewedAt)}
                                  {sheet.reviewedBy
                                    ? ` por ${sheet.reviewedBy.firstName} ${sheet.reviewedBy.lastName}`
                                    : ""}
                                  .
                                </p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              <FileCheck2 className="size-3.5" aria-hidden="true" />
              Repositorio de la Avanzada
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Hojas de ruta aprobadas
              {activeSemester ? ` · ${activeSemester.name}` : ""}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Documentos autorizados por los AA, disponibles para lectura y
              descarga de toda la unidad.
            </p>
          </div>
          <Badge variant="outline">
            {repository.length} documento{repository.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {repository.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aún no hay hojas de ruta aprobadas"
            description="Cuando un AA autorice el primer documento del semestre, aparecerá en este repositorio y junto a su actividad en el calendario."
          />
        ) : (
          <ul className="space-y-3">
            {repository.map((sheet) => (
              <li key={sheet.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-anil-100 bg-anil-50 text-anil-800">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                        {formatShortDate(sheet.activity.startsAt).split(" ")[0]}
                      </span>
                      <span className="font-display text-lg font-semibold leading-tight">
                        {new Intl.DateTimeFormat("es-CL", {
                          day: "numeric",
                          timeZone: "America/Santiago",
                        }).format(sheet.activity.startsAt)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                        {routeSheetVersionLabel(sheet.version)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                            ACTIVITY_TYPE_STYLES[sheet.activity.type],
                          )}
                        >
                          {ACTIVITY_TYPE_LABELS[sheet.activity.type]}
                        </span>
                        <Badge variant="success">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Aprobada
                        </Badge>
                        <span className="text-[11px] text-ink-soft">
                          Semestre {sheet.activity.semester.name}
                        </span>
                      </div>

                      <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">
                        <Link
                          href={`/calendario/${sheet.activity.id}`}
                          className="hover:text-anil-800"
                        >
                          {sheet.activity.title}
                        </Link>
                      </h3>

                      <p className="mt-1 text-xs text-ink-soft">
                        {sheet.title ?? "Hoja de ruta oficial"} ·{" "}
                        {formatDateTime(sheet.activity.startsAt)}
                        {sheet.activity.location
                          ? ` · ${sheet.activity.location}`
                          : ""}
                        {sheet.reviewedAt
                          ? ` · aprobada el ${formatTimestamp(sheet.reviewedAt)}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <a
                        href={`/api/files/${sheet.fileId}`}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Descargar
                      </a>
                      <Link
                        href={`/calendario/${sheet.activity.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Ver actividad
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="border-dashed bg-canvas/40 p-5">
        <div className="flex flex-wrap items-start gap-3">
          <FileWarning className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-ink">
              ¿Cómo funciona la moderación?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {ROUTE_SHEET_STATUS_DESCRIPTIONS.PENDIENTE_AUTORIZACION} Si la
              rechazan, verás el motivo aquí y podrás subir una versión
              corregida sin perder el historial. Los recordatorios automáticos
              avisan a los encargados cuando una actividad se acerca sin hoja
              aprobada.
            </p>
            <Link
              href="/notificaciones"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-anil-700 hover:text-anil-900"
            >
              Revisar mis notificaciones
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
