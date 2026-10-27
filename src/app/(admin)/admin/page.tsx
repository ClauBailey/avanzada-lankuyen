import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarPlus,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Settings2,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatLongDate } from "@/lib/dates";
import { ROLE_LABELS } from "@/lib/constants";
import { prisma } from "@/server/db";
import { requireAA } from "@/server/auth/session";

export const metadata = {
  title: "Panel AA",
};

const adminLinks = [
  {
    href: "/admin/usuarios",
    label: "Crear y gestionar cuentas",
    description: "Pioneros/as y coordinadores",
    icon: UserPlus,
  },
  {
    href: "/admin/comunidades",
    label: "Comunidades",
    description: "Subgrupos y etiquetas",
    icon: UsersRound,
  },
  {
    href: "/admin/actividades",
    label: "Calendario semestral",
    description: "Actividades y encargados",
    icon: CalendarPlus,
  },
  {
    href: "/admin/asistencia",
    label: "Ratificar asistencia",
    description: "Cierre posterior al evento",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/evaluaciones",
    label: "Leer evaluaciones",
    description: "Áreas de desarrollo y comentarios de PP y coordinadores",
    icon: Star,
  },
  {
    href: "/admin/hojas-de-ruta",
    label: "Moderar hojas de ruta",
    description: "Aprobar o rechazar documentos",
    icon: FileCheck2,
  },
  {
    href: "/admin/bitacora",
    label: "La Bitácora",
    description: "Guardián del libro y páginas de la unidad",
    icon: BookOpen,
  },
  {
    href: "/admin/insignias",
    label: "Otorgar insignias",
    description: "Etapas, competencias y promesa",
    icon: Award,
  },
  {
    href: "/admin/material",
    label: "Editar material digital",
    description: "Grito, oración, himno, bandera y biblioteca",
    icon: BookOpen,
  },
  {
    href: "/admin/configuracion",
    label: "Configuración y auditoría",
    description: "Ajustes del cron y últimos eventos",
    icon: Settings2,
  },
];

export default async function AdminPage() {
  const user = await requireAA();

  const [
    totalMembers,
    totalCoordinators,
    totalCommunities,
    upcomingActivities,
    pendingSheets,
    recentUsers,
    activeSemester,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "PP", isActive: true, deletedAt: null },
    }),
    prisma.user.count({
      where: { role: "COORDINADOR", isActive: true, deletedAt: null },
    }),
    prisma.community.count({ where: { isActive: true, deletedAt: null } }),
    prisma.activity.count({
      where: {
        isPublished: true,
        deletedAt: null,
        startsAt: { gte: new Date() },
      },
    }),
    prisma.routeSheet.count({
      where: { status: "PENDIENTE_AUTORIZACION", deletedAt: null },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        community: { select: { name: true, color: true } },
      },
    }),
    prisma.semester.findFirst({
      where: { isActive: true },
      select: { name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 shadow-float sm:p-9">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-70" />
        <div className="relative max-w-2xl">
          <Badge variant="gold">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Acceso Adulto Acompañante
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
            Panel de administración
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-anil-100/70 sm:text-base">
            {formatLongDate()} · Hola, {user.firstName}. Desde aquí acompañas la
            progresión, las comunidades y los procesos de la Avanzada.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/admin/usuarios"
              className={buttonVariants({ variant: "gold", size: "sm" })}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Gestionar cuentas
            </Link>
            <Link
              href="/inicio"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className:
                  "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15",
              })}
            >
              Ver mi vista
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pioneros/as activos"
          value={totalMembers}
          hint={`${totalCoordinators} coordinador/a(s)`}
          icon={Users}
          href="/admin/usuarios"
        />
        <StatCard
          label="Comunidades"
          value={totalCommunities}
          hint="Subgrupos activos"
          icon={UsersRound}
          href="/admin/comunidades"
        />
        <StatCard
          label="Próximas actividades"
          value={upcomingActivities}
          hint={
            activeSemester
              ? `Semestre ${activeSemester.name}`
              : "Sin semestre activo"
          }
          icon={CalendarPlus}
          href="/admin/actividades"
        />
        <StatCard
          label="Hojas por revisar"
          value={pendingSheets}
          hint="Pendientes de autorización"
          icon={FileText}
          href="/admin/hojas-de-ruta"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-line/70">
            <div>
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                Atajos
              </CardDescription>
              <CardTitle className="mt-1">Gestión de la unidad</CardTitle>
            </div>
            <ArrowRight className="size-5 text-anil-500" aria-hidden="true" />
          </CardHeader>
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-line hover:bg-canvas"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-anil-50 text-anil-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {link.label}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {link.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-line/70">
            <div>
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                Comunidad
              </CardDescription>
              <CardTitle className="mt-1">Cuentas recientes</CardTitle>
            </div>
            <Users className="size-5 text-anil-500" aria-hidden="true" />
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <p className="p-5 text-sm text-ink-soft">Aún no hay cuentas creadas.</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {recentUsers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        @{member.username} · {ROLE_LABELS[member.role]}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {member.community ? (
                        <CommunityTag
                          name={member.community.name}
                          color={member.community.color}
                        />
                      ) : (
                        <Badge variant="outline">Sin comunidad</Badge>
                      )}
                      {!member.isActive ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                          Inactiva
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-dashed bg-surface/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-700">
              Estado del sistema
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Cuentas, comunidades, progresión, calendario, asistencia,
              evaluaciones de actividades, hojas de ruta, material digital, La
              Bitácora y auditoría ya están operativos. Los ajustes del cron y
              las hojas de ruta se editan en Configuración.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            Módulo 6 completado
          </Badge>
        </div>
      </Card>

      <Card className="border-anil-100 bg-gradient-to-r from-anil-50/70 via-surface to-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-800 text-gold">
              <Settings2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-700">
                Operación y transparencia
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Ajusta los días del recordatorio y el permiso de subida de hojas
                de ruta, y revisa la tabla de auditoría con los últimos eventos de
                la unidad.
              </p>
            </div>
          </div>
          <Link
            href="/admin/configuracion"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Abrir configuración
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
