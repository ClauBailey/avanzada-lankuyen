import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_STYLES,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_STYLES,
  RSVP_LABELS,
} from "@/lib/activity-types";
import { formatDateTime, formatLongDate, formatTime, getGreeting } from "@/lib/dates";
import { ROLE_LABELS } from "@/lib/constants";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";

export const metadata = {
  title: "Inicio",
};

export default async function InicioPage() {
  const user = await requireUser();
  const isAA = user.role === "AA";

  const [
    earnedBadges,
    activeAccounts,
    nextActivity,
    pendingSheets,
    unreadNotifications,
    publishedMaterials,
    pendingEvaluations,
  ] = await Promise.all([
    prisma.userBadge.count({
      where: { userId: user.id, revokedAt: null },
    }),
    isAA
      ? prisma.user.count({ where: { isActive: true, deletedAt: null } })
      : Promise.resolve(0),
    prisma.activity.findFirst({
      where: {
        isPublished: true,
        deletedAt: null,
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        startsAt: true,
        endsAt: true,
        location: true,
        routeSheets: {
          where: { status: "APROBADA", deletedAt: null },
          select: { id: true, fileId: true },
          take: 1,
        },
        responses: {
          where: { userId: user.id },
          take: 1,
          select: { status: true },
        },
        records: {
          where: { userId: user.id },
          take: 1,
          select: { status: true },
        },
        _count: { select: { records: true } },
      },
    }),
    prisma.routeSheet.count({
      where: {
        deletedAt: null,
        status: "PENDIENTE_AUTORIZACION",
        ...(user.role === "AA" ? {} : { uploadedById: user.id }),
      },
    }),
    prisma.notification.count({
      where: { recipientId: user.id, readAt: null },
    }),
    prisma.unitResource.count({ where: { isPublished: true } }),
    isAA
      ? Promise.resolve(0)
      : prisma.activity.count({
          where: {
            isPublished: true,
            deletedAt: null,
            endsAt: { lt: new Date() },
            semester: { isActive: true },
            evaluations: { none: { userId: user.id } },
          },
        }),
  ]);

  const quickLinks = [
    {
      href: "/perfil",
      label: "Mi perfil",
      description: "Etapas, competencias y promesa",
      icon: Award,
    },
    {
      href: "/calendario",
      label: "Calendario",
      description: "Actividades y asistencia",
      icon: CalendarDays,
    },
    {
      href: "/hojas-de-ruta",
      label: "Hojas de ruta",
      description: "Subir y descargar documentos",
      icon: FileText,
    },
    {
      href: "/material",
      label: "Material digital",
      description: `${publishedMaterials} recurso${
        publishedMaterials === 1 ? "" : "s"
      } publicado${publishedMaterials === 1 ? "" : "s"} · identidad de la unidad`,
      icon: BookOpen,
    },
  ];

  const nextRsvp = nextActivity?.responses[0]?.status ?? null;
  const nextRecord = nextActivity?.records[0]?.status ?? null;
  const nextIsRatified = (nextActivity?._count.records ?? 0) > 0;
  const nextCanRespond =
    !isAA &&
    Boolean(nextActivity) &&
    nextActivity!.startsAt > new Date() &&
    !nextIsRatified;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-anil-900 p-6 shadow-float sm:p-9">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-80" />
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-lavender/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">{ROLE_LABELS[user.role]}</Badge>
            <CommunityTag
              name={user.community?.name}
              color={user.community?.color}
              className="border-white/20 bg-white/10 text-white"
            />
            {unreadNotifications > 0 ? (
              <Link
                href="/notificaciones"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white"
              >
                <Bell className="size-3" aria-hidden="true" />
                {unreadNotifications} sin leer
              </Link>
            ) : null}
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-anil-200/70">
            {formatLongDate()}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {getGreeting()}, {user.firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-anil-100/75 sm:text-base">
            {isAA
              ? "Tienes la vista completa de la unidad. Acompaña los procesos, revisa las hojas de ruta y mantén el calendario al día."
              : "Este es tu espacio para avanzar por el Sendero y alcanzar la Cumbre. Revisa tus próximas actividades y registra tu asistencia."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {isAA ? (
              <Link href="/admin" className={buttonVariants({ variant: "gold", size: "sm" })}>
                <ShieldCheck className="size-4" aria-hidden="true" />
                Ir al panel AA
              </Link>
            ) : (
              <Link href="/perfil" className={buttonVariants({ variant: "gold", size: "sm" })}>
                <Sparkles className="size-4" aria-hidden="true" />
                Ver mi progresión
              </Link>
            )}
            <Link
              href="/calendario"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15",
              })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver calendario
            </Link>
          </div>
        </div>
      </section>

      {!isAA && pendingEvaluations > 0 ? (
        <Link
          href="/calendario?scope=pasadas"
          className="group flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold-soft/50 p-4 shadow-card transition-colors hover:border-gold/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-[#7a5a16]">
              <Star className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">
                {pendingEvaluations} evaluación
                {pendingEvaluations === 1 ? "" : "es"} pendiente
                {pendingEvaluations === 1 ? "" : "s"}
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                Las actividades terminadas esperan tu mirada sobre las seis
                áreas de desarrollo scout.
              </span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-anil-800 transition-transform group-hover:translate-x-0.5">
            Evaluar ahora
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </Link>
      ) : null}

      {/* Estadísticas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isAA ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Cuentas de la unidad
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink">
                  {activeAccounts}
                </p>
                <p className="mt-1 text-xs text-ink-soft">cuentas activas</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-anil-50 text-anil-700">
                <Users className="size-5" aria-hidden="true" />
              </span>
            </div>
            <Link
              href="/admin/usuarios"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-anil-700"
            >
              Gestionar cuentas
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Tus insignias
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink">
                  {earnedBadges}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  insignia{earnedBadges === 1 ? "" : "s"} obtenida
                  {earnedBadges === 1 ? "" : "s"} hasta hoy
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-[#7a5a16]">
                <Award className="size-5" aria-hidden="true" />
              </span>
            </div>
            <Link
              href="/perfil"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-anil-700"
            >
              Ver mi progresión
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Card>
        )}

        <StatCard
          label="Próxima actividad"
          value={nextActivity ? formatDateTime(nextActivity.startsAt) : "Sin agendar"}
          hint={nextActivity?.title ?? "El calendario semestral se cargará próximamente"}
          icon={CalendarDays}
          href="/calendario"
        />

        <StatCard
          label={isAA ? "Hojas por revisar" : "Hojas en revisión"}
          value={pendingSheets}
          hint={
            user.role === "AA"
              ? "Documentos esperando autorización"
              : "Tus documentos esperando autorización"
          }
          icon={FileText}
          href={isAA ? "/admin/hojas-de-ruta" : "/hojas-de-ruta"}
        />
      </section>

      {/* Próximo encuentro + accesos */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-line/70 bg-canvas/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                  Calendario semestral
                </CardDescription>
                <CardTitle className="mt-1">Próximo encuentro</CardTitle>
              </div>
              <CalendarDays className="size-5 text-anil-600" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {nextActivity ? (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${ACTIVITY_TYPE_STYLES[nextActivity.type]}`}
                    >
                      {ACTIVITY_TYPE_LABELS[nextActivity.type]}
                    </span>
                    {!isAA ? (
                      nextRecord ? (
                        <Badge variant={ATTENDANCE_STYLES[nextRecord]}>
                          {ATTENDANCE_LABELS[nextRecord]}
                        </Badge>
                      ) : nextRsvp ? (
                        <Badge
                          variant={
                            nextRsvp === "CONFIRMADO" ? "success" : "warning"
                          }
                        >
                          {RSVP_LABELS[nextRsvp]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin confirmar</Badge>
                      )
                    ) : (
                      <Badge variant={nextIsRatified ? "success" : "warning"}>
                        {nextIsRatified ? "Ratificada" : "Por ratificar"}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    {formatDateTime(nextActivity.startsAt)} · hasta las{" "}
                    {formatTime(nextActivity.endsAt)}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
                    {nextActivity.title}
                  </h3>
                  {nextActivity.location ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                      <MapPin className="size-4" aria-hidden="true" />
                      {nextActivity.location}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      nextActivity.routeSheets.length > 0 ? "success" : "warning"
                    }
                  >
                    Hoja de ruta:{" "}
                    {nextActivity.routeSheets.length > 0 ? "Disponible" : "Pendiente"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/calendario/${nextActivity.id}#asistencia`}
                    className={buttonVariants({
                      variant: nextCanRespond ? "primary" : "secondary",
                      size: "sm",
                    })}
                  >
                    {isAA
                      ? "Ver actividad"
                      : nextCanRespond
                        ? "Confirmar asistencia"
                        : "Ver mi respuesta"}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  {isAA ? (
                    <Link
                      href={`/admin/asistencia/${nextActivity.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Ratificar asistencia
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-canvas/60 p-6 text-center">
                <CalendarDays className="mx-auto size-8 text-anil-400" aria-hidden="true" />
                <p className="mt-3 font-display text-lg font-semibold text-ink">
                  Aún no hay actividades publicadas
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Cuando los AA carguen el calendario semestral, la próxima
                  actividad aparecerá aquí.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-anil-200"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-anil-50 text-anil-700 transition-colors group-hover:bg-anil-100">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{link.label}</span>
                  <span className="block truncate text-xs text-ink-soft">
                    {link.description}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-anil-700"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
