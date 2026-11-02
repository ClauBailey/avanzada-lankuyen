import Link from "next/link";
import {
  CalendarDays,
  FolderKanban,
  Handshake,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ProjectCreateForm } from "@/components/projects/project-forms";
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
import {
  PROJECT_STEPS,
  PROJECT_LOCALITIES,
  competencyAreaLabel,
  projectLocalityDefinition,
  projectStepDefinition,
  projectStepProgress,
  type ProjectStepKey,
} from "@/features/projects/rules";
import { formatDateOnly } from "@/lib/dates";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Proyectos y Grupos de Trabajo",
};

const STEP_BADGES: Record<
  ProjectStepKey,
  "outline" | "warning" | "success"
> = {
  SONAR: "warning",
  ELEGIR: "warning",
  ORGANIZAR: "warning",
  REALIZAR: "success",
  EVALUAR: "warning",
  CELEBRAR: "outline",
};

export default async function ProyectosPage() {
  const user = await requirePermission("project:view");
  const canManage = can(user, "project:manage");

  const [cycle, projects, cycles, youths, aas] = await Promise.all([
      prisma.programCycle.findFirst({
        where: { isActive: true },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      prisma.project.findMany({
        orderBy: [{ workGroupStatus: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          step: true,
          locality: true,
          workGroupStatus: true,
          beneficiaries: true,
          durationText: true,
          requiredCompetencies: true,
          updatedAt: true,
          responsibleUser: {
            select: {
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          },
          accompanyingAa: {
            select: {
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          },
          cycle: { select: { id: true, name: true } },
          _count: {
            select: {
              members: true,
              activities: true,
              routeSheets: true,
            },
          },
        },
      }),
      prisma.programCycle.findMany({
        orderBy: { startDate: "desc" },
        take: 6,
        select: { id: true, name: true },
      }),
      canManage
        ? prisma.user.findMany({
            where: {
              role: { in: ["PP", "COORDINADOR"] },
              isActive: true,
              deletedAt: null,
            },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          })
        : Promise.resolve([]),
      canManage
        ? prisma.user.findMany({
            where: { role: "AA", isActive: true, deletedAt: null },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const activeProjects = projects.filter(
    (project) => project.workGroupStatus === "ACTIVO",
  );
  const historicProjects = projects.filter(
    (project) => project.workGroupStatus === "HISTORICO_DISUELTO",
  );

  const youthOptions = youths.map((youth) => ({
    id: youth.id,
    name: getDisplayName(youth),
  }));
  const aaOptions = aas.map((aa) => ({ id: aa.id, name: getDisplayName(aa) }));
  const cycleOptions = cycles.map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ciclo de Proyecto"
        title="Proyectos y Grupos de Trabajo"
        description="Un proyecto nace de un sueño compartido y avanza por seis pasos: Soñar, Elegir, Organizar, Realizar, Evaluar y Celebrar ¡La Peña!. El Grupo de Trabajo es abierto: cualquier joven de la Avanzada se suma según su interés en la tarea."
        actions={
          can(user, "support_network:view") ? (
            <Link
              href="/admin/red-de-apoyo"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Handshake aria-hidden="true" />
              Red de Apoyo
            </Link>
          ) : null
        }
      />

      <Card className="border-anil-200 bg-anil-50/40 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles className="size-4 text-anil-700" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">
            {cycle
              ? `Ciclo vigente: ${cycle.name}`
              : "Todavía no hay un ciclo activo: el proyecto puede abrirse igual."}
          </p>
          {cycle ? (
            <Badge variant="outline">
              {formatDateOnly(cycle.startDate)} — {formatDateOnly(cycle.endDate)}
            </Badge>
          ) : null}
        </div>
      </Card>

      <section aria-label="Los seis pasos del proyecto" className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Los seis pasos del Ciclo de Proyecto
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {PROJECT_STEPS.map((step) => (
            <li
              key={step.key}
              className="rounded-2xl border border-line/70 bg-surface/70 p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Paso {step.order}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {step.label}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-5 text-anil-700" aria-hidden="true" />
              Abrir un proyecto
            </CardTitle>
            <CardDescription>
              Completa la Pauta de Identificación del Proyecto (Manual p. 268).
              Al abrirlo, toda la Avanzada recibe la convocatoria para sumarse al
              Grupo de Trabajo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectCreateForm
              cycles={cycleOptions}
              youths={youthOptions}
              aas={aaOptions}
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Proyectos en curso
          </h2>
          <Badge variant="outline">{activeProjects.length} activos</Badge>
        </div>

        {activeProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aún no hay proyectos abiertos"
            description="Cuando alguien de la Avanzada abra el primer proyecto, aparecerá aquí con su Grupo de Trabajo y sus seis pasos."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeProjects.map((project) => {
              const step = project.step as ProjectStepKey;
              const stepDefinition = projectStepDefinition(step);
              const locality = projectLocalityDefinition(
                project.locality as (typeof PROJECT_LOCALITIES)[number]["key"],
              );
              return (
                <Card key={project.id} className="flex flex-col">
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STEP_BADGES[step]}>
                        {projectStepProgress(step)}
                      </Badge>
                      <Badge variant="outline">{locality.label}</Badge>
                    </div>
                    <CardTitle>
                      <Link
                        href={`/proyectos/${project.id}`}
                        className="hover:text-anil-700"
                      >
                        {project.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {stepDefinition.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <p className="text-xs text-ink-soft">
                      <span className="font-semibold text-ink">
                        Destinatarios:
                      </span>{" "}
                      <span className="line-clamp-2">
                        {project.beneficiaries}
                      </span>
                    </p>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-line/70 bg-canvas/40 px-2 py-1.5">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-soft">
                          Integrantes
                        </dt>
                        <dd className="text-sm font-semibold text-ink">
                          {project._count.members}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-canvas/40 px-2 py-1.5">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-soft">
                          Actividades
                        </dt>
                        <dd className="text-sm font-semibold text-ink">
                          {project._count.activities}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-canvas/40 px-2 py-1.5">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-soft">
                          Hojas
                        </dt>
                        <dd className="text-sm font-semibold text-ink">
                          {project._count.routeSheets}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                      {project.responsibleUser ? (
                        <span className="inline-flex items-center gap-1">
                          <UsersRound className="size-3.5" aria-hidden="true" />
                          Responsable: {getDisplayName(project.responsibleUser)}
                        </span>
                      ) : null}
                      {project.accompanyingAa ? (
                        <span className="inline-flex items-center gap-1">
                          <Handshake className="size-3.5" aria-hidden="true" />
                          AA: {getDisplayName(project.accompanyingAa)}
                        </span>
                      ) : null}
                      {project.cycle ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          {project.cycle.name}
                        </span>
                      ) : null}
                    </div>
                    {project.requiredCompetencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.requiredCompetencies.map((area) => (
                          <Badge key={area} variant="outline">
                            {competencyAreaLabel(area)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <Link
                      href={`/proyectos/${project.id}`}
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Ver proyecto
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {historicProjects.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Memoria histórica
          </h2>
          <p className="text-sm text-ink-soft">
            Grupos de Trabajo disueltos tras su Informe Final. Su memoria queda
            intacta y ya no reciben inscripciones.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {historicProjects.map((project) => (
              <Card key={project.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Histórico · disuelto</Badge>
                  <Link
                    href={`/proyectos/${project.id}`}
                    className="text-sm font-semibold text-ink hover:text-anil-700"
                  >
                    {project.title}
                  </Link>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  {project._count.members} integrantes ·{" "}
                  {project._count.activities} actividades
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-[11px] leading-relaxed text-ink-soft">
        Los monitores de la{" "}
        {can(user, "support_network:view") ? (
          <Link href="/admin/red-de-apoyo" className="underline">
            Red de Apoyo
          </Link>
        ) : (
          "Red de Apoyo"
        )}{" "}
        pueden sumarse a un Grupo de Trabajo sin ser parte de la Avanzada. Los
        participantes externos invitados se registran sin cuenta.
      </p>
    </div>
  );
}
