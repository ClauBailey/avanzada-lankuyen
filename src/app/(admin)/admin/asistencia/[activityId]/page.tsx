import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardCheck, MapPin } from "lucide-react";

import { AttendanceRatifier } from "@/components/attendance/attendance-ratifier";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatTime, formatTimestamp } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Ratificar asistencia · Panel AA",
};

export default async function AdminAsistenciaDetallePage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  await requirePermission("attendance:ratify");
  const { activityId } = await params;

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
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
    },
  });

  if (!activity) notFound();

  const [members, responses, records, communities] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["PP", "COORDINADOR"] },
        deletedAt: null,
        OR: [
          { isActive: true },
          { attendanceResponses: { some: { activityId } } },
          { attendanceRecords: { some: { activityId } } },
        ],
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        community: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.attendanceResponse.findMany({
      where: { activityId },
      select: {
        userId: true,
        status: true,
        justificationText: true,
        justificationFiles: {
          select: {
            file: {
              select: { id: true, originalName: true, mimeType: true },
            },
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { activityId },
      orderBy: { ratifiedAt: "desc" },
      select: {
        userId: true,
        status: true,
        notes: true,
        ratifiedAt: true,
        ratifiedBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.community.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const responseByUser = new Map(
    responses.map((response) => [response.userId, response]),
  );
  const recordByUser = new Map(records.map((record) => [record.userId, record]));
  const lastRecord = records[0] ?? null;

  const ratifierMembers = members.map((member) => {
    const response = responseByUser.get(member.id);
    const record = recordByUser.get(member.id);

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      username: member.username,
      role:
        member.role === "COORDINADOR"
          ? ("COORDINADOR" as const)
          : ("PP" as const),
      community: member.community,
      rsvpStatus: response?.status ?? null,
      justificationText: response?.justificationText ?? null,
      files: (response?.justificationFiles ?? []).map((item) => item.file),
      recordStatus: record?.status ?? null,
      recordNotes: record?.notes ?? null,
      isActive: member.isActive,
    };
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/asistencia"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a asistencia
      </Link>

      <PageHeader
        eyebrow={`Semestre ${activity.semester.name}`}
        title={activity.title}
        description={`${formatDateTime(activity.startsAt)} · hasta las ${formatTime(
          activity.endsAt,
        )}${activity.location ? ` · ${activity.location}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {lastRecord ? (
              <Badge variant="success">Ratificada</Badge>
            ) : (
              <Badge variant="warning">Pendiente</Badge>
            )}
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
            <ClipboardCheck className="size-3.5" aria-hidden="true" />
            Ratificación definitiva de la actividad
          </span>
          {activity.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {activity.location}
            </span>
          ) : null}
          {lastRecord ? (
            <span>
              Última ratificación: {formatTimestamp(lastRecord.ratifiedAt)} por{" "}
              {lastRecord.ratifiedBy
                ? `${lastRecord.ratifiedBy.firstName} ${lastRecord.ratifiedBy.lastName}`
                : "un Adulto Acompañante"}
            </span>
          ) : (
            <span>Sin registros definitivos todavía.</span>
          )}
        </div>
        {activity.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
            {activity.description}
          </p>
        ) : null}
      </Card>

      <AttendanceRatifier
        activityId={activity.id}
        members={ratifierMembers}
        communities={communities}
        isFuture={activity.startsAt > new Date()}
        isRatified={Boolean(lastRecord)}
        lastRatifiedAt={
          lastRecord ? formatTimestamp(lastRecord.ratifiedAt) : null
        }
        lastRatifiedBy={
          lastRecord?.ratifiedBy
            ? `${lastRecord.ratifiedBy.firstName} ${lastRecord.ratifiedBy.lastName}`
            : lastRecord
              ? "un Adulto Acompañante"
              : null
        }
      />
    </div>
  );
}
