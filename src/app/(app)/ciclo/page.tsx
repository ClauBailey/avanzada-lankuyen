import Link from "next/link";
import {
  CalendarDays,
  CheckCheck,
  Compass,
  Megaphone,
  Sparkles,
  Vote,
} from "lucide-react";

import {
  ActivityProposalForm,
  AdvanceCyclePhaseForm,
  AssemblyVoteCabin,
  AssemblyVoteSessionForm,
  CalendarApprovalButton,
  CommunityDiagnosisForm,
  CycleSummaryForm,
  ProposalSelectionToggle,
  VoteSessionToggleButton,
} from "@/components/cycle/cycle-forms";
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
import type { ProgramCyclePhase } from "@/generated/prisma/enums";
import { ROLE_SHORT_LABELS } from "@/lib/constants";
import { formatDateOnly } from "@/lib/dates";
import { getDisplayName } from "@/lib/user-display";
import {
  ASSEMBLY_NEUTRALITY_MESSAGE,
  nextProgramCyclePhase,
  programCyclePhaseDefinition,
  tallyAssemblyVotes,
  PROGRAM_CYCLE_PHASES,
  type DemocraticVoteDynamicKey,
  type ProgramCyclePhaseKey,
} from "@/features/cycle/rules";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Ciclo de Programa",
};

const PHASE_BADGES: Record<ProgramCyclePhase, "outline" | "success" | "warning"> =
  {
    DIAGNOSTICO_Y_ENFASIS: "warning",
    PROPUESTA_Y_SELECCION: "warning",
    ORGANIZACION_Y_PREPARACION: "warning",
    DESARROLLO_Y_EVALUACION: "success",
    FINALIZADO: "outline",
  };

export default async function CicloPage() {
  const user = await requirePermission("cycle:view");

  const cycle =
    (await prisma.programCycle.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        phase: true,
        diagnosisSummary: true,
        educationalEmphasis: true,
        isCalendarApprovedByAssembly: true,
      },
    })) ??
    (await prisma.programCycle.findFirst({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        phase: true,
        diagnosisSummary: true,
        educationalEmphasis: true,
        isCalendarApprovedByAssembly: true,
      },
    }));

  if (!cycle) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Ciclo de Programa"
          title="Ciclo y Asamblea"
          description="El ciclo de programa es el corazón democrático de la Avanzada: diagnóstico, propuestas, votación y calendario."
        />
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay un ciclo de programa"
          description="Cuando el Equipo Adulto cree y active el primer ciclo, aquí aparecerán sus fases y la Asamblea."
        />
      </div>
    );
  }

  const canManage = can(user, "cycle:manage");
  const canDiagnose = can(user, "cycle:diagnose");
  const canPropose = can(user, "cycle:propose");
  const canVote = can(user, "assembly:vote");
  const phase = cycle.phase as ProgramCyclePhaseKey;
  const phaseDefinition = programCyclePhaseDefinition(phase);

  const [diagnoses, proposals, sessions] = await Promise.all([
    prisma.communityDiagnosis.findMany({
      where: {
        cycleId: cycle.id,
        ...(canManage ? {} : { communityId: user.communityId ?? "none" }),
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        strengthsAndInterests: true,
        suggestedActivities: true,
        communityId: true,
        updatedAt: true,
        community: { select: { id: true, name: true, color: true } },
        author: {
          select: {
            firstName: true,
            lastName: true,
            preferredName: true,
          },
        },
      },
    }),
    prisma.activityProposal.findMany({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        isSocialInterventionProject: true,
        selectedForCalendar: true,
        community: { select: { name: true, color: true } },
        proposer: {
          select: {
            firstName: true,
            lastName: true,
            preferredName: true,
          },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.assemblyVoteSession.findMany({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        dynamic: true,
        isOpen: true,
        maxPointsBudget: true,
        votes: {
          select: { proposalId: true, voterId: true, value: true },
        },
      },
    }),
  ]);

  const ownDiagnosis =
    diagnoses.find((diagnosis) => diagnosis.communityId === user.communityId) ??
    null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ciclo de Programa"
        title={cycle.name}
        description={`${formatDateOnly(cycle.startDate)} — ${formatDateOnly(
          cycle.endDate,
        )} · Fase ${phaseDefinition.order}: ${phaseDefinition.label}`}
        actions={
          <Badge variant={PHASE_BADGES[cycle.phase]}>
            {phaseDefinition.shortLabel}
          </Badge>
        }
      />

      <Card className="border-anil-200 bg-anil-50/40 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
          Énfasis educativo del ciclo
        </p>
        <p className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
          {cycle.educationalEmphasis ??
            "La Reunión de Coordinadores aún no fija el énfasis educativo de este ciclo."}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {phaseDefinition.description}
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          {canManage ? phaseDefinition.adultHint : phaseDefinition.youthHint}
        </p>
      </Card>

      <nav aria-label="Fases del ciclo" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {PROGRAM_CYCLE_PHASES.map((item) => {
          const isCurrent = item.key === phase;
          return (
            <div
              key={item.key}
              className={
                isCurrent
                  ? "rounded-2xl border border-anil-300 bg-surface p-3 shadow-card"
                  : "rounded-2xl border border-line/70 bg-surface/60 p-3"
              }
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Fase {item.order}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {item.shortLabel}
              </p>
              {isCurrent ? (
                <p className="mt-1 text-[11px] font-semibold text-anil-700">
                  Fase actual
                </p>
              ) : null}
            </div>
          );
        })}
      </nav>

      {canManage ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-600">
                Reunión de Coordinadores
              </p>
              <h2 className="font-display text-lg font-semibold text-ink">
                Gestión de fases del ciclo
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                El ciclo avanza una fase a la vez. Las y los jóvenes conservan la
                palabra y el voto.
              </p>
            </div>
            <AdvanceCyclePhaseForm
              cycleId={cycle.id}
              phase={cycle.phase}
              nextPhaseLabel={nextPhaseLabel(phase)}
            />
          </div>
        </Card>
      ) : null}

      {phase === "DIAGNOSTICO_Y_ENFASIS" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico de las Comunidades</CardTitle>
              <CardDescription>
                Cada Comunidad escribe sus intereses, anhelos y evaluación
                interna. Nadie diagnostica por ella.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {canDiagnose && user.communityId ? (
                <div className="rounded-xl border border-anil-100 bg-anil-50/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-anil-700">
                    Mi Comunidad · {user.community?.name ?? "sin nombre"}
                  </p>
                  <CommunityDiagnosisForm
                    defaultStrengths={ownDiagnosis?.strengthsAndInterests}
                    defaultSuggestions={ownDiagnosis?.suggestedActivities}
                  />
                </div>
              ) : null}

              {diagnoses.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Aún no hay diagnósticos escritos para este ciclo.
                </p>
              ) : (
                <ul className="space-y-4">
                  {diagnoses.map((diagnosis) => (
                    <li
                      key={diagnosis.id}
                      className="rounded-xl border border-line bg-canvas/30 p-4"
                    >
                      <p className="text-sm font-semibold text-ink">
                        {diagnosis.community.name}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {diagnosis.author
                          ? `Escrito por ${getDisplayName(diagnosis.author)}`
                          : "Sin autor registrado"}{" "}
                        · {formatDateOnly(diagnosis.updatedAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm text-ink">
                        {diagnosis.strengthsAndInterests}
                      </p>
                      {diagnosis.suggestedActivities ? (
                        <p className="mt-2 whitespace-pre-line text-xs text-ink-soft">
                          Actividades sugeridas: {diagnosis.suggestedActivities}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Síntesis de la Avanzada</CardTitle>
              <CardDescription>
                La Reunión de Coordinadores revisa todos los diagnósticos y fija
                el énfasis formativo del período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <CycleSummaryForm
                  defaultSummary={cycle.diagnosisSummary}
                  defaultEmphasis={cycle.educationalEmphasis}
                />
              ) : (
                <div className="space-y-3 text-sm text-ink">
                  <p className="whitespace-pre-line">
                    {cycle.diagnosisSummary ??
                      "El diagnóstico general se conocerá al cerrar esta fase."}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Énfasis educativo:{" "}
                    {cycle.educationalEmphasis ?? "aún sin definir"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {phase === "PROPUESTA_Y_SELECCION" ? (
        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <Megaphone className="size-4 text-anil-700" aria-hidden="true" />
                  Muro de propuestas
                </CardTitle>
                <CardDescription>
                  Las y los jóvenes y las Comunidades proponen lo que quieren vivir.
                  Los proyectos de intervención social o ambiental se deliberan
                  con foco especial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposals.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Todavía no hay propuestas. La primera puede ser la tuya.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {proposals.map((proposal) => (
                      <li
                        key={proposal.id}
                        className="rounded-xl border border-line bg-canvas/30 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {proposal.title}
                          </p>
                          {proposal.isSocialInterventionProject ? (
                            <Badge variant="gold">
                              Intervención social
                            </Badge>
                          ) : null}
                          {proposal.selectedForCalendar ? (
                            <Badge variant="success">En calendario</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
                          {proposal.description}
                        </p>
                        <p className="mt-2 text-[11px] text-ink-soft">
                          {proposal.proposer
                            ? getDisplayName(proposal.proposer)
                            : "Propuesta de Comunidad"}
                          {proposal.community
                            ? ` · ${proposal.community.name}`
                            : ""}{" "}
                          · {proposal._count.votes} voto
                          {proposal._count.votes === 1 ? "" : "s"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {canPropose ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Proponer una actividad</CardTitle>
                    <CardDescription>
                      Tu propuesta entra a la deliberación de la Asamblea.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ActivityProposalForm />
                  </CardContent>
                </Card>
              ) : null}

              {canManage ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Abrir una sesión de votación</CardTitle>
                    <CardDescription>
                      La Reunión de Coordinadores abre y cierra la votación. El
                      voto pertenece exclusivamente a las y los jóvenes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssemblyVoteSessionForm />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Cabina de votación
            </h2>
            {sessions.length === 0 ? (
              <Card className="border-dashed p-6 text-sm text-ink-soft">
                Todavía no hay sesiones de votación para este ciclo.
              </Card>
            ) : (
              sessions.map((session) => {
                const tally = tallyAssemblyVotes(
                  proposals.map((proposal) => ({
                    id: proposal.id,
                    title: proposal.title,
                  })),
                  session.votes,
                  session.dynamic as DemocraticVoteDynamicKey,
                );
                const myVotes = new Map(
                  session.votes
                    .filter((vote) => vote.voterId === user.id)
                    .map((vote) => [vote.proposalId, vote.value]),
                );

                return (
                  <Card key={session.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
                          <Vote className="size-4 text-anil-700" aria-hidden="true" />
                          {session.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {session.dynamic === "ELECCION_DIRECTA"
                            ? "Elección directa"
                            : session.dynamic === "RANKING_ESTRELLAS"
                              ? "Ranking de estrellas"
                              : `Asignación de puntos · pozo ${session.maxPointsBudget ?? 10}`}{" "}
                          ·{" "}
                          {session.isOpen
                            ? "votación abierta"
                            : "votación cerrada"}
                        </p>
                      </div>
                      {canManage ? (
                        <VoteSessionToggleButton
                          sessionId={session.id}
                          isOpen={session.isOpen}
                        />
                      ) : null}
                    </div>

                    <div className="mt-4">
                      {session.isOpen ? (
                        proposals.length === 0 ? (
                          <p className="text-sm text-ink-soft">
                            Aún no hay propuestas para votar.
                          </p>
                        ) : (
                          <AssemblyVoteCabin
                            sessionId={session.id}
                            dynamic={
                              session.dynamic as
                                | "ELECCION_DIRECTA"
                                | "RANKING_ESTRELLAS"
                                | "ASIGNACION_PUNTOS"
                            }
                            maxPointsBudget={session.maxPointsBudget}
                            proposals={proposals.map((proposal) => ({
                              id: proposal.id,
                              title: proposal.title,
                              myVote: myVotes.get(proposal.id) ?? null,
                            }))}
                            isVoter={canVote}
                            neutralityMessage={ASSEMBLY_NEUTRALITY_MESSAGE}
                          />
                        )
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-ink-soft">
                            Resultados para la deliberación de la Asamblea:
                          </p>
                          <ul className="space-y-2">
                            {tally.map((row) => (
                              <li
                                key={row.proposalId}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-canvas/30 px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-ink">
                                  {row.title}
                                </span>
                                <span className="text-xs text-ink-soft">
                                  {session.dynamic === "RANKING_ESTRELLAS"
                                    ? `${row.average.toFixed(1)} ★ · ${row.voters} votante${row.voters === 1 ? "" : "s"}`
                                    : `${row.total} punto${row.total === 1 ? "" : "s"} · ${row.voters} voto${row.voters === 1 ? "" : "s"}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {phase === "ORGANIZACION_Y_PREPARACION" ? (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <CheckCheck className="size-4 text-anil-700" aria-hidden="true" />
                Propuestas y calendario oficial
              </CardTitle>
              <CardDescription>
                La Reunión de Coordinadores decide qué propuestas pasan al
                calendario y programa las actividades por alcance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposals.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No hay propuestas para este ciclo.
                </p>
              ) : (
                <ul className="space-y-3">
                  {proposals.map((proposal) => (
                    <li
                      key={proposal.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas/30 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {proposal.title}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {proposal._count.votes} voto
                          {proposal._count.votes === 1 ? "" : "s"} ·{" "}
                          {proposal.selectedForCalendar
                            ? "en el calendario"
                            : "pendiente de selección"}
                        </p>
                      </div>
                      {canManage ? (
                        <ProposalSelectionToggle
                          proposalId={proposal.id}
                          selected={proposal.selectedForCalendar}
                        />
                      ) : (
                        <Badge
                          variant={
                            proposal.selectedForCalendar
                              ? "success"
                              : "outline"
                          }
                        >
                          {proposal.selectedForCalendar
                            ? "Seleccionada"
                            : "En deliberación"}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <Sparkles className="size-4 text-gold" aria-hidden="true" />
                  Aprobación de la Asamblea
                </CardTitle>
                <CardDescription>
                  Deja constancia de que la Asamblea aprobó el calendario del
                  ciclo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canManage ? (
                  <CalendarApprovalButton
                    cycleId={cycle.id}
                    isApproved={cycle.isCalendarApprovedByAssembly}
                  />
                ) : (
                  <Badge
                    variant={
                      cycle.isCalendarApprovedByAssembly ? "success" : "outline"
                    }
                  >
                    {cycle.isCalendarApprovedByAssembly
                      ? "Calendario aprobado por la Asamblea"
                      : "Aprobación pendiente"}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Link
              href="/calendario"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver calendario del ciclo
            </Link>
          </div>
        </section>
      ) : null}

      {phase === "DESARROLLO_Y_EVALUACION" ? (
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold text-ink">
            Desarrollo y evaluación del ciclo
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Es tiempo de vivir las actividades y proyectos programados. Al
            cierre, la autoevaluación de ciclo vive en La Brújula de cada persona joven
            y la evaluación general se conversa en la Asamblea.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/calendario"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Actividades del ciclo
            </Link>
            {!canManage ? (
              <Link
                href="/brujula"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <Compass className="size-4" aria-hidden="true" />
                Mi autoevaluación en La Brújula
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      {phase === "FINALIZADO" ? (
        <Card className="border-dashed p-6">
          <h2 className="font-display text-xl font-semibold text-ink">
            Ciclo finalizado
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Los diagnósticos, propuestas, votaciones y actividades de este ciclo
            quedan como memoria de la Avanzada. Cuando la unidad inicie un nuevo
            período, un nuevo ciclo tomará su lugar.
          </p>
        </Card>
      ) : null}

      {user.role === "AA" ? (
        <p className="rounded-xl border border-gold/30 bg-gold-soft/30 p-4 text-xs text-[#7a5a16]">
          {ASSEMBLY_NEUTRALITY_MESSAGE} Tu rol adulto se muestra en la Asamblea
          como {ROLE_SHORT_LABELS[user.role]}.
        </p>
      ) : null}
    </div>
  );
}

/** Etiqueta de la siguiente fase, o `null` si el ciclo ya finalizó. */
function nextPhaseLabel(phase: ProgramCyclePhaseKey): string | null {
  const next = nextProgramCyclePhase(phase);
  return next ? programCyclePhaseDefinition(next).label : null;
}
