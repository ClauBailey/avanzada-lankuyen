import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Circle,
  FileText,
  FolderKanban,
  Handshake,
  MapPin,
  Sparkles,
  Target,
  UsersRound,
  XCircle,
} from "lucide-react";

import {
  DissolveWorkGroupButton,
  FinalReportForm,
  JoinWorkGroupForm,
  ProjectActivityForm,
  ProjectActivityToggle,
  ProjectEditForm,
  ProjectStepForm,
  RemoveWorkGroupMemberButton,
  WorkGroupMemberForm,
} from "@/components/projects/project-forms";
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
  COMPETENCY_AREA_OPTIONS,
  PROJECT_ACTIVITY_KINDS,
  PROJECT_STEPS,
  canDissolveWorkGroup,
  canEditProject,
  canJoinWorkGroup,
  canManageWorkGroup,
  canSubmitFinalReport,
  competencyAreaLabel,
  projectLocalityDefinition,
  projectStepDefinition,
  projectStepProgress,
  workGroupMemberKindLabel,
  type ProjectStepKey,
  type WorkGroupStatusKey,
} from "@/features/projects/rules";
import { formatShortDate, formatTimestamp } from "@/lib/dates";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Proyecto",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProyectoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requirePermission("project:view");
  const canManageProjects = can(user, "project:manage");

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      step: true,
      workGroupStatus: true,
      responsibleUserId: true,
      accompanyingAaId: true,
      cycleId: true,
      beneficiaries: true,
      locality: true,
      durationText: true,
      isSocialEnvironmentalIntervention: true,
      problemDiagnosis: true,
      generalObjective: true,
      specificObjectives: true,
      observableIndicators: true,
      budgetSummary: true,
      requiredCompetencies: true,
      finalReportPreparation: true,
      finalReportConclusions: true,
      celebrationNotes: true,
      createdAt: true,
      updatedAt: true,
      cycle: { select: { id: true, name: true } },
      responsibleUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
        },
      },
      accompanyingAa: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
        },
      },
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          taskRole: true,
          userId: true,
          supportContactId: true,
          externalName: true,
          externalOrganization: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          },
          supportContact: {
            select: { id: true, fullName: true, relationshipOrRole: true },
          },
        },
      },
      activities: {
        orderBy: [{ kind: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          kind: true,
          isCompleted: true,
          activityId: true,
          activity: {
            select: { id: true, title: true, startsAt: true },
          },
        },
      },
      routeSheets: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          version: true,
          status: true,
          createdAt: true,
          structuredData: true,
          activity: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const step = project.step as ProjectStepKey;
  const workGroupStatus = project.workGroupStatus as WorkGroupStatusKey;
  const locality = projectLocalityDefinition(project.locality);
  const stepDefinition = projectStepDefinition(step);
  const currentOrder = stepDefinition.order;

  const memberUserIds = project.members
    .map((member) => member.userId)
    .filter((value): value is string => Boolean(value));

  const permissionContext = {
    responsibleUserId: project.responsibleUserId,
    workGroupStatus,
    memberUserIds,
  };

  const canEdit = canManageProjects && canEditProject(user, permissionContext);
  const canManageGroup = canManageProjects && canManageWorkGroup(user, permissionContext);
  const canJoin = canJoinWorkGroup(user, permissionContext);
  const isMember = memberUserIds.includes(user.id);
  const canReport = canSubmitFinalReport(user, { ...permissionContext, step });
  const canDissolve = canDissolveWorkGroup(user, { ...permissionContext, step });

  const [cycles, youths, aas, monitorContacts, calendarActivities] =
    await Promise.all([
      canManageProjects
        ? prisma.programCycle.findMany({
            orderBy: { startDate: "desc" },
            take: 6,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      canManageProjects
        ? prisma.user.findMany({
            where: {
              role: { in: ["PP", "COORDINADOR"] },
              isActive: true,
              deletedAt: null,
            },
            orderBy: [{ firstName: "asc" }],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          })
        : Promise.resolve([]),
      canManageProjects
        ? prisma.user.findMany({
            where: { role: "AA", isActive: true, deletedAt: null },
            orderBy: [{ firstName: "asc" }],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          })
        : Promise.resolve([]),
      canManageGroup
        ? prisma.supportNetworkContact.findMany({
            where: { isActive: true },
            orderBy: { fullName: "asc" },
            select: { id: true, fullName: true },
          })
        : Promise.resolve([]),
      canManageProjects
        ? prisma.activity.findMany({
            where: { deletedAt: null },
            orderBy: { startsAt: "asc" },
            take: 40,
            select: { id: true, title: true, startsAt: true },
          })
        : Promise.resolve([]),
    ]);

  const members = project.members.map((member) => {
    const kind = workGroupMemberKindLabel({
      userId: member.userId,
      supportContactId: member.supportContactId,
      externalName: member.externalName,
    });
    const name =
      (member.user ? getDisplayName(member.user) : null) ??
      member.supportContact?.fullName ??
      member.externalName ??
      "Integrante sin identificar";
    return { ...member, kind, name };
  });

  const centralActivities = project.activities.filter(
    (item) => item.kind === "CENTRAL",
  );
  const connectionActivities = project.activities.filter(
    (item) => item.kind === "CONEXA",
  );

  return (
    <div className="space-y-8">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-anil-700 hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Todos los proyectos
      </Link>

      <PageHeader
        eyebrow={`Ciclo de Proyecto · ${locality.label}`}
        title={project.title}
        description={`${projectStepProgress(step)} · ${stepDefinition.description}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {workGroupStatus === "ACTIVO" ? (
              <Badge variant="success">Grupo de Trabajo activo</Badge>
            ) : (
              <Badge variant="outline">Histórico · disuelto</Badge>
            )}
            {project.cycle ? (
              <Badge variant="outline">{project.cycle.name}</Badge>
            ) : null}
          </div>
        }
      />

      <nav aria-label="Pasos del proyecto" className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {PROJECT_STEPS.map((item) => {
          const isCurrent = item.key === step;
          const isPast = item.order < currentOrder;
          return (
            <div
              key={item.key}
              className={
                isCurrent
                  ? "rounded-2xl border border-anil-300 bg-surface p-3 shadow-card"
                  : isPast
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3"
                    : "rounded-2xl border border-line/70 bg-surface/60 p-3"
              }
            >
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                {isPast ? (
                  <Check className="size-3 text-emerald-700" aria-hidden="true" />
                ) : (
                  <Circle className="size-3" aria-hidden="true" />
                )}
                Paso {item.order}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {item.shortLabel}
              </p>
              {isCurrent ? (
                <p className="mt-1 text-[11px] font-semibold text-anil-700">
                  Paso actual
                </p>
              ) : null}
            </div>
          );
        })}
      </nav>

      {canEdit ? (
        <Card className="p-4">
          <ProjectStepForm projectId={project.id} step={step} />
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-anil-700" aria-hidden="true" />
              Pauta de Identificación del Proyecto
            </CardTitle>
            <CardDescription>
              Manual p. 268. La pauta se mantiene viva mientras el proyecto
              avanza por sus seis pasos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Destinatarios
                </dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.beneficiaries}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Duración
                </dt>
                <dd className="mt-1 text-sm text-ink">{project.durationText}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Alcance territorial
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <MapPin className="size-3.5 text-anil-600" aria-hidden="true" />
                  {locality.label}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Responsable del Grupo de Trabajo
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {project.responsibleUser
                    ? getDisplayName(project.responsibleUser)
                    : "Sin responsable asignado"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  AA que acompaña
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {project.accompanyingAa
                    ? getDisplayName(project.accompanyingAa)
                    : "Sin AA asignado"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Intervención social o ambiental
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {project.isSocialEnvironmentalIntervention ? "Sí" : "No"}
                </dd>
              </div>
            </dl>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Diagnóstico del problema o sueño
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.problemDiagnosis}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Objetivo general
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.generalObjective}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Objetivos específicos
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.specificObjectives}
                </p>
              </div>
              {project.observableIndicators ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Indicadores observables
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {project.observableIndicators}
                  </p>
                </div>
              ) : null}
              {project.budgetSummary ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Financiamiento y presupuesto
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {project.budgetSummary}
                  </p>
                </div>
              ) : null}
            </div>

            {project.requiredCompetencies.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Competencias vinculadas
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {project.requiredCompetencies.map((area) => (
                    <Badge key={area} variant="outline">
                      {competencyAreaLabel(area)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="size-5 text-anil-700" aria-hidden="true" />
                Grupo de Trabajo
              </CardTitle>
              <CardDescription>
                Abierto y transversal: cualquier joven de cualquier Comunidad
                puede sumarse según su interés en la tarea.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="rounded-xl border border-line/70 bg-canvas/30 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {member.name}
                      </p>
                      <Badge variant="outline">{member.kind}</Badge>
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      {member.taskRole}
                      {member.externalOrganization
                        ? ` · ${member.externalOrganization}`
                        : ""}
                      {member.supportContact
                        ? ` · ${member.supportContact.relationshipOrRole}`
                        : ""}
                    </p>
                    {canManageGroup ? (
                      <div className="mt-1">
                        <RemoveWorkGroupMemberButton memberId={member.id} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>

              <JoinWorkGroupForm
                projectId={project.id}
                canJoin={canJoin}
                isMember={isMember}
                isActive={workGroupStatus === "ACTIVO"}
              />
            </CardContent>
          </Card>

          {canManageGroup ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Sumar participantes externos o monitores
                </CardTitle>
                <CardDescription>
                  El Grupo de Trabajo también puede integrar monitores de la Red
                  de Apoyo e invitados externos sin cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkGroupMemberForm
                  projectId={project.id}
                  youths={youths.map((youth) => ({
                    id: youth.id,
                    name: getDisplayName(youth),
                  }))}
                  contacts={monitorContacts.map((contact) => ({
                    id: contact.id,
                    name: contact.fullName,
                  }))}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {canEdit ? (
        <ProjectEditForm
          project={{
            id: project.id,
            title: project.title,
            cycleId: project.cycleId,
            responsibleUserId: project.responsibleUserId,
            accompanyingAaId: project.accompanyingAaId,
            beneficiaries: project.beneficiaries,
            locality: project.locality,
            durationText: project.durationText,
            isSocialEnvironmentalIntervention:
              project.isSocialEnvironmentalIntervention,
            problemDiagnosis: project.problemDiagnosis,
            generalObjective: project.generalObjective,
            specificObjectives: project.specificObjectives,
            observableIndicators: project.observableIndicators,
            budgetSummary: project.budgetSummary,
            requiredCompetencies: project.requiredCompetencies,
            step,
          }}
          cycles={cycles.map((cycle) => ({ id: cycle.id, name: cycle.name }))}
          youths={youths.map((youth) => ({
            id: youth.id,
            name: getDisplayName(youth),
          }))}
          aas={aas.map((aa) => ({ id: aa.id, name: getDisplayName(aa) }))}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-anil-700" aria-hidden="true" />
              Actividades centrales
            </CardTitle>
            <CardDescription>
              Sin ellas el proyecto no cumple su objetivo (Manual p. 259).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {centralActivities.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Aún no hay actividades centrales. Se definen al Organizar.
              </p>
            ) : (
              <ul className="space-y-2">
                {centralActivities.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-canvas/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {item.activity
                          ? `Calendario: ${item.activity.title} · ${formatShortDate(item.activity.startsAt)}`
                          : "Sin vínculo al calendario"}
                      </p>
                    </div>
                    {canEdit ? (
                      <ProjectActivityToggle
                        itemId={item.id}
                        isCompleted={item.isCompleted}
                      />
                    ) : (
                      <Badge
                        variant={item.isCompleted ? "success" : "outline"}
                      >
                        {item.isCompleted ? "Realizada" : "Pendiente"}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-anil-700" aria-hidden="true" />
              Actividades conexas
            </CardTitle>
            <CardDescription>
              Amplían el alcance del proyecto y suman participación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectionActivities.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Aún no hay actividades conexas.
              </p>
            ) : (
              <ul className="space-y-2">
                {connectionActivities.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-canvas/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {item.activity
                          ? `Calendario: ${item.activity.title} · ${formatShortDate(item.activity.startsAt)}`
                          : "Sin vínculo al calendario"}
                      </p>
                    </div>
                    {canEdit ? (
                      <ProjectActivityToggle
                        itemId={item.id}
                        isCompleted={item.isCompleted}
                      />
                    ) : (
                      <Badge
                        variant={item.isCompleted ? "success" : "outline"}
                      >
                        {item.isCompleted ? "Realizada" : "Pendiente"}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Organizar actividades centrales y conexas</CardTitle>
            <CardDescription>
              {PROJECT_ACTIVITY_KINDS.map((kind) => kind.description).join(" ")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectActivityForm
              projectId={project.id}
              activities={calendarActivities.map((activity) => ({
                id: activity.id,
                title: `${activity.title} · ${formatShortDate(activity.startsAt)}`,
              }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-anil-700" aria-hidden="true" />
              Hojas de ruta del proyecto
            </CardTitle>
            <CardDescription>
              Las hojas de ruta pueden vincularse a este proyecto al presentarse
              de forma estructurada o como archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.routeSheets.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Aún no hay hojas de ruta vinculadas.{" "}
                <Link
                  href="/hojas-de-ruta"
                  className="font-semibold text-anil-700 underline"
                >
                  Ir a Hojas de ruta
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {project.routeSheets.map((sheet) => (
                  <li
                    key={sheet.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-canvas/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {sheet.title ?? `Hoja de ruta v${sheet.version}`}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {sheet.activity.title} · v{sheet.version} ·{" "}
                        {formatTimestamp(sheet.createdAt)}
                        {sheet.structuredData ? " · formulario oficial" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/hojas-de-ruta`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      Ver
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competencias del proyecto</CardTitle>
            <CardDescription>
              Las siete áreas de competencia del Manual (p. 278–279).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {COMPETENCY_AREA_OPTIONS.map((area) => {
                const active = project.requiredCompetencies.includes(area.key);
                return (
                  <Badge
                    key={area.key}
                    variant={active ? "success" : "outline"}
                  >
                    {area.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="size-5 text-anil-700" aria-hidden="true" />
            Informe Final y ¡La Peña!
          </CardTitle>
          <CardDescription>
            Se consolida en el paso Evaluar. Tras el Informe Final, el Grupo de
            Trabajo se disuelve y queda como memoria histórica (Manual p. 104).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.finalReportPreparation ||
          project.finalReportConclusions ? (
            <div className="space-y-3 rounded-xl border border-line/70 bg-canvas/30 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Preparación y ejecución
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.finalReportPreparation ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Conclusiones
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {project.finalReportConclusions ?? "—"}
                </p>
              </div>
              {project.celebrationNotes ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    ¡La Peña!
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {project.celebrationNotes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {canReport ? (
            <FinalReportForm
              projectId={project.id}
              preparation={project.finalReportPreparation}
              conclusions={project.finalReportConclusions}
              celebrationNotes={project.celebrationNotes}
            />
          ) : (
            <p className="text-sm text-ink-soft">
              El Informe Final se habilita en el paso Evaluar o Celebrar para el
              Responsable, sus participantes activos, la coordinación y los AA.
            </p>
          )}

          {canDissolve ? (
            <DissolveWorkGroupButton
              projectId={project.id}
              status={workGroupStatus}
            />
          ) : workGroupStatus === "HISTORICO_DISUELTO" ? (
            <p className="inline-flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2 text-xs text-ink-soft">
              <XCircle className="size-4" aria-hidden="true" />
              Este Grupo de Trabajo se disolvió tras su Informe Final. Su
              memoria permanece.
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2 text-xs text-ink-soft">
              <Handshake className="size-4" aria-hidden="true" />
              La disolución se habilita tras el Informe Final, en el paso
              Evaluar o Celebrar.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-ink-soft">
        Creado el {formatTimestamp(project.createdAt)} · Actualizado el{" "}
        {formatTimestamp(project.updatedAt)}. Los participantes externos se
        identifican por su nombre y procedencia; los monitores provienen de la
        Red de Apoyo.
      </p>
    </div>
  );
}
