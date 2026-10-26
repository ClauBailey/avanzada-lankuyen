import Link from "next/link";
import {
  CalendarClock,
  Download,
  FileWarning,
  MapPin,
  Star,
  UserRound,
} from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type {
  AttendanceStatus,
  RsvpStatus,
  Role,
} from "@/generated/prisma/enums";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_STYLES,
  ATTENDANCE_LABELS,
  ATTENDANCE_STYLES,
  RSVP_LABELS,
} from "@/lib/activity-types";
import { APP_TIMEZONE } from "@/lib/constants";
import { formatShortDate, formatTime } from "@/lib/dates";
import type { ActivityType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export interface ActivityCardLeader {
  id: string;
  firstName: string;
  lastName: string;
  community: { name: string; color: string | null } | null;
}

export interface ActivityCardData {
  id: string;
  title: string;
  type: ActivityType;
  startsAt: string;
  endsAt: string;
  location: string | null;
  description?: string | null;
  isPublished: boolean;
  leaders: ActivityCardLeader[];
  approvedRouteSheet: { fileId: string; title: string | null } | null;
}

export interface ActivityCardViewer {
  id: string;
  role: Role;
  rsvp: RsvpStatus | null;
  attendance: AttendanceStatus | null;
  isRatified: boolean;
  evaluation?: "pending" | "done" | null;
}

interface ActivityCardProps {
  activity: ActivityCardData;
  viewer: ActivityCardViewer;
  admin?: boolean;
  className?: string;
}

export function ActivityCard({
  activity,
  viewer,
  admin = false,
  className,
}: ActivityCardProps) {
  const isLeader = activity.leaders.some((leader) => leader.id === viewer.id);
  const isAA = viewer.role === "AA";

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden transition-colors hover:border-anil-200",
        className,
      )}
    >
      <div className="flex items-start gap-4 p-5">
        <div className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-anil-100 bg-anil-50 px-2 py-2.5 text-anil-800">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
            {formatShortDate(activity.startsAt).split(" ")[0]}
          </span>
          <span className="font-display text-2xl font-semibold leading-tight">
            {new Intl.DateTimeFormat("es-CL", {
              day: "numeric",
              timeZone: APP_TIMEZONE,
            }).format(new Date(activity.startsAt))}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
            {new Intl.DateTimeFormat("es-CL", {
              month: "short",
              timeZone: APP_TIMEZONE,
            })
              .format(new Date(activity.startsAt))
              .replace(".", "")}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                ACTIVITY_TYPE_STYLES[activity.type],
              )}
            >
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {isLeader ? <Badge variant="gold">Eres encargado</Badge> : null}
            {admin && !activity.isPublished ? (
              <Badge variant="outline">Oculta</Badge>
            ) : null}
          </div>

          <h3 className="font-display text-lg font-semibold leading-tight text-ink">
            <Link
              href={`/calendario/${activity.id}`}
              className="hover:text-anil-800"
            >
              {activity.title}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {formatTime(activity.startsAt)} – {formatTime(activity.endsAt)}
            </span>
            {activity.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {activity.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-line/70 bg-canvas/35 px-5 py-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            <UserRound className="size-3.5" aria-hidden="true" />
            Encargados
          </p>
          {activity.leaders.length === 0 ? (
            <p className="mt-1 text-xs text-ink-soft">Aún sin encargados.</p>
          ) : (
            <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {activity.leaders.map((leader) => (
                <li
                  key={leader.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-ink"
                >
                  <span className="font-medium">
                    {leader.firstName} {leader.lastName}
                  </span>
                  {leader.community ? (
                    <CommunityTag
                      name={leader.community.name}
                      color={leader.community.color}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {activity.approvedRouteSheet ? (
            <a
              href={`/api/files/${activity.approvedRouteSheet.fileId}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800 hover:border-emerald-300"
            >
              <Download className="size-3" aria-hidden="true" />
              Hoja de ruta disponible
            </a>
          ) : (
            <Badge variant="warning">
              <FileWarning className="size-3" aria-hidden="true" />
              Hoja de ruta: Pendiente
            </Badge>
          )}

          {isAA ? (
            <Badge variant={viewer.isRatified ? "success" : "outline"}>
              {viewer.isRatified ? "Asistencia ratificada" : "Por ratificar"}
            </Badge>
          ) : viewer.attendance ? (
            <Badge variant={ATTENDANCE_STYLES[viewer.attendance]}>
              {ATTENDANCE_LABELS[viewer.attendance]}
            </Badge>
          ) : viewer.rsvp ? (
            <Badge variant={viewer.rsvp === "CONFIRMADO" ? "success" : "warning"}>
              {RSVP_LABELS[viewer.rsvp]}
            </Badge>
          ) : (
            <Badge variant="outline">Sin confirmar</Badge>
          )}

          {viewer.evaluation === "pending" ? (
            <Badge variant="warning">
              <Star className="size-3" aria-hidden="true" />
              Evaluación pendiente
            </Badge>
          ) : viewer.evaluation === "done" ? (
            <Badge variant="success">
              <Star className="size-3" aria-hidden="true" />
              Evaluada
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
              viewer.evaluation === "pending"
                ? `/calendario/${activity.id}#evaluacion`
                : `/calendario/${activity.id}`
            }
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {viewer.evaluation === "pending"
              ? "Evaluar actividad"
              : isAA || viewer.evaluation === "done"
                ? "Ver actividad"
                : "Ver y confirmar"}
          </Link>
          {isAA ? (
            <Link
              href={`/admin/asistencia/${activity.id}`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Ratificar
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
