import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardCheck, MapPin } from "lucide-react";

import { AttendanceRatifier } from "@/components/attendance/attendance-ratifier";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatTime, formatTimestamp } from "@/lib/dates";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Ratificar asistencia de mi comunidad",
};

export default async function CommunityAttendanceDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const user = await requirePermission("attendance:ratify");

  if (!user.communityId) notFound();

  const { activityId } = await params;

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      location: true,
      cycle: { select: { name: true } },
    },
  });

  if (!activity) notFound();

  const members = await prisma.user.findMany({
    where: {
      communityId: user.communityId,
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
      preferredName: true,
      username: true,
      role: true,
      community: { select: { id: true, name: true, color: true } },
    },
  });

  const memberIds = members.map((member) => member.id);

  const [responses, records] = await Promise.all([
    prisma.attendanceResponse.findMany({
      where: { activityId, userId: { in: memberIds } },
      select: {
        userId: true,
        status: true,
        justificationText: true,
        justificationFiles: {
          select: {
            file: { select: { id: true, originalName: true, mimeType: true } },
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { activityId, userId: { in: memberIds } },
      orderBy: { ratifiedAt: "desc" },
      select: {
        userId: true,
        status: true,
        notes: true,
        ratifiedAt: true,
        ratifiedBy: {
          select: { firstName: true, lastName: true, preferredName: true },
        },
      },
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
    const isSelf = member.id === user.id;
    // RF-ASI-04: el motivo y los adjuntos solo los lee su autor y el AA.
    const hideJustification = !isSelf && user.role !== "AA";

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      preferredName: member.preferredName,
      username: member.username,
      role:
        member.role === "COORDINADOR"
          ? ("COORDINADOR" as const)
          : ("PP" as const),
      community: member.community,
      rsvpStatus: response?.status ?? null,
      justificationText: hideJustification
        ? null
        : (response?.justificationText ?? null),
      justificationHidden: hideJustification && response?.status === "NO_ASISTE",
      files: hideJustification
        ? []
        : (response?.justificationFiles ?? []).map((item) => item.file),
      recordStatus: record?.status ?? null,
      recordNotes: record?.notes ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <Link
        href="/mi-comunidad/asistencia"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a asistencia
      </Link>

      <PageHeader
        eyebrow={
          activity.cycle ? `Ciclo ${activity.cycle.name}` : "Actividad sin ciclo"
        }
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
            Solo integrantes de {user.community?.name ?? "tu comunidad"}
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
                ? getDisplayName(lastRecord.ratifiedBy)
                : "un Adulto Acompañante"}
            </span>
          ) : (
            <span>Sin registros definitivos todavía.</span>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Los motivos y documentos de inasistencia de otras personas quedan
          reservados para su autor y el Equipo Adulto.
        </p>
      </Card>

      {members.length === 0 ? (
        <Card className="border-dashed p-6 text-sm text-ink-soft">
          Tu comunidad aún no tiene integrantes activos para ratificar.
        </Card>
      ) : (
        <AttendanceRatifier
          activityId={activity.id}
          members={ratifierMembers}
          communities={
            user.community
              ? [{ id: user.community.id, name: user.community.name }]
              : []
          }
          isFuture={activity.startsAt > new Date()}
          isRatified={Boolean(lastRecord)}
          lastRatifiedAt={
            lastRecord ? formatTimestamp(lastRecord.ratifiedAt) : null
          }
          lastRatifiedBy={
            lastRecord?.ratifiedBy
              ? getDisplayName(lastRecord.ratifiedBy)
              : lastRecord
                ? "un Adulto Acompañante"
                : null
          }
        />
      )}
    </div>
  );
}
