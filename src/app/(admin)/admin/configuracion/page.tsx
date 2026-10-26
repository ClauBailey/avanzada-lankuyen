import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  FileCheck2,
  History,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { SettingsForm } from "@/components/admin/settings-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { getAppSettings } from "@/server/settings";

export const metadata = {
  title: "Configuración y auditoría · Panel AA",
};

const ACTION_LABELS: Record<string, string> = {
  "activity.cancel": "Actividad cancelada",
  "activity.create": "Actividad creada",
  "activity.update": "Actividad actualizada",
  "attendance.ratify": "Asistencia ratificada",
  "attendance.rsvp": "RSVP registrado",
  "badge.catalog_update": "Catálogo de insignias actualizado",
  "badge.grant": "Insignia otorgada",
  "badge.revoke": "Insignia revocada",
  "community.activate": "Comunidad reactivada",
  "community.create": "Comunidad creada",
  "community.deactivate": "Comunidad desactivada",
  "community.update": "Comunidad actualizada",
  "material.create": "Recurso de material creado",
  "material.toggle_publish": "Publicación de material modificada",
  "material.update": "Recurso de material actualizado",
  "route_sheet.approve": "Hoja de ruta aprobada",
  "route_sheet.reject": "Hoja de ruta rechazada",
  "route_sheet.upload": "Hoja de ruta subida",
  "semester.activate": "Semestre activado",
  "semester.create": "Semestre creado",
  "settings.update": "Ajustes de la aplicación actualizados",
  "user.activate": "Cuenta reactivada",
  "user.community_change": "Comunidad de cuenta cambiada",
  "user.create": "Cuenta creada",
  "user.deactivate": "Cuenta desactivada",
  "user.password_reset": "Contraseña restablecida",
  "user.role_change": "Rol de cuenta cambiado",
};

type AuditBadgeVariant =
  | "default"
  | "solid"
  | "outline"
  | "gold"
  | "success"
  | "warning"
  | "danger";

function actionBadgeVariant(action: string): AuditBadgeVariant {
  if (
    action.includes("reject") ||
    action.includes("cancel") ||
    action.includes("deactivate") ||
    action.includes("password_reset")
  ) {
    return "danger";
  }

  if (
    action.includes("approve") ||
    action.includes("activate") ||
    action.includes("grant") ||
    action.includes("create")
  ) {
    return "success";
  }

  if (action.includes("toggle") || action.includes("update")) return "default";
  return "outline";
}

function auditJson(label: string, value: unknown) {
  if (value === null || value === undefined) return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <pre className="scrollbar-thin mt-1 max-h-48 overflow-auto rounded-lg border border-line bg-canvas/70 p-2.5 text-[10px] leading-relaxed text-ink">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default async function AdminConfiguracionPage() {
  await requirePermission("audit:view");

  const [settings, logs] = await Promise.all([
    getAppSettings(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        createdAt: true,
        actorRole: true,
        actor: {
          select: { firstName: true, lastName: true, username: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Configuración y auditoría"
        description="Ajusta en caliente los parámetros que usan el recordatorio semanal y las hojas de ruta, y revisa el rastro de las acciones sensibles de la unidad."
        actions={
          <Link
            href="/admin"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al tablero
          </Link>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader className="border-b border-line/70">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-anil-50 text-anil-700">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                  Parámetros operativos
                </CardDescription>
                <CardTitle className="mt-0.5">Ajustes rápidos</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <SettingsForm
              leadDays={settings.reminderLeadDays}
              allowAnyPpUpload={settings.allowAnyPpRouteSheetUpload}
            />
          </CardContent>
        </Card>

        <Card className="bg-anil-950 text-white">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-gold">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Lectura y contexto
                </CardDescription>
                <CardTitle className="mt-0.5 text-white">Cómo se aplican</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm text-anil-100/75 sm:p-6">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <p>
                <strong className="text-white">Recordatorio:</strong> el cron corre
                cada <strong className="text-white">{settings.cronHour}:00</strong>{" "}
                ({settings.timezone}) y avisa a los encargados de las actividades
                publicadas dentro de los próximos{" "}
                <strong className="text-white">{settings.reminderLeadDays} días</strong>{" "}
                que no tengan hoja aprobada ni pendiente.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <p>
                <strong className="text-white">Hojas de ruta:</strong>{" "}
                {settings.allowAnyPpRouteSheetUpload
                  ? "cualquier PP o COORDINADOR puede subir documentos, además de los encargados y los AA."
                  : "solo los encargados de la actividad y los AA pueden subir documentos."}{" "}
                La moderación y el versionado no cambian.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3 text-[11px]">
              <Badge variant="gold">Cron {settings.cronEnabled ? "activo" : "pausado"}</Badge>
              <Badge variant="outline" className="border-white/20 bg-white/5 text-anil-100">
                Zona {settings.timezone}
              </Badge>
              <Badge variant="outline" className="border-white/20 bg-white/5 text-anil-100">
                Hora {settings.cronHour}:00
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-anil-200/55">
              La zona horaria, la hora del cron y el interruptor general se
              administran por variables de entorno / base de datos para evitar
              cambios accidentales. Esta pantalla edita solo los dos parámetros
              operativos del Módulo 5.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              <History className="size-3.5" aria-hidden="true" />
              Transparencia administrativa
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Últimos eventos de auditoría
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Solo lectura. Cada otorgamiento, publicación o cambio sensible deja
              aquí su actor, fecha y valores anteriores y nuevos.
            </p>
          </div>
          <Badge variant="outline">
            <ScrollText className="size-3.5" aria-hidden="true" />
            {logs.length} evento{logs.length === 1 ? "" : "s"}
          </Badge>
        </div>

        <Card className="overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={History}
                title="Aún no hay eventos de auditoría"
                description="Cuando se cree una cuenta, se modere una hoja de ruta o se edite el material, el registro aparecerá aquí."
                className="border-0 bg-transparent p-0"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line/80 bg-canvas/50 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    <th scope="col" className="px-4 py-3">Fecha</th>
                    <th scope="col" className="px-4 py-3">Actor</th>
                    <th scope="col" className="px-4 py-3">Acción</th>
                    <th scope="col" className="px-4 py-3">Entidad</th>
                    <th scope="col" className="px-4 py-3">Antes / después</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {logs.map((log) => {
                    const label = ACTION_LABELS[log.action] ?? log.action;
                    const actor = log.actor
                      ? `${log.actor.firstName} ${log.actor.lastName}`
                      : "Sistema";

                    return (
                      <tr key={log.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-ink">{actor}</p>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            {log.actor
                              ? `@${log.actor.username}`
                              : "Automático"}
                            {log.actorRole ? ` · ${ROLE_LABELS[log.actorRole]}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={actionBadgeVariant(log.action)}>
                            {label}
                          </Badge>
                          <p className="mt-1 font-mono text-[10px] text-ink-soft">
                            {log.action}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-ink">
                            {log.entityType}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-ink-soft">
                            {log.entityId ? log.entityId.slice(0, 8) : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {log.before === null && log.after === null ? (
                            <span className="text-[11px] text-ink-soft">
                              Sin detalle
                            </span>
                          ) : (
                            <details className="group">
                              <summary className="cursor-pointer list-none text-[11px] font-semibold text-anil-700 hover:text-anil-900">
                                Ver cambios
                              </summary>
                              <div className="mt-2 grid gap-2">
                                {auditJson("Antes", log.before)}
                                {auditJson("Después", log.after)}
                              </div>
                            </details>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
