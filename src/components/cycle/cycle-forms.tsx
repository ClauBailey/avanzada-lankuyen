"use client";

import { useActionState } from "react";
import {
  Check,
  Lock,
  Plus,
  Power,
  Save,
  Star,
  Vote,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  advanceProgramCyclePhaseAction,
  approveCycleCalendarAction,
  castAssemblyVoteAction,
  createActivityProposalAction,
  createAssemblyVoteSessionAction,
  saveCommunityDiagnosisAction,
  saveCycleSummaryAction,
  selectProposalForCalendarAction,
  setAssemblyVoteSessionOpenAction,
} from "@/features/cycle/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

// ------------------------------------------------------------
// Fase 1 · Diagnóstico y Énfasis Educativo
// ------------------------------------------------------------

export function CommunityDiagnosisForm({
  defaultStrengths,
  defaultSuggestions,
}: {
  defaultStrengths?: string | null;
  defaultSuggestions?: string | null;
}) {
  const [state, formAction] = useActionState(
    saveCommunityDiagnosisAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="diagnosis-strengths">
          Intereses, anhelos y evaluación interna de tu Comunidad
        </Label>
        <Textarea
          id="diagnosis-strengths"
          name="strengthsAndInterests"
          defaultValue={defaultStrengths ?? ""}
          placeholder="Qué les mueve, qué necesitan, qué les gustaría vivir como Comunidad…"
          maxLength={6000}
          className="min-h-32"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagnosis-suggestions">
          Actividades sugeridas (opcional)
        </Label>
        <Textarea
          id="diagnosis-suggestions"
          name="suggestedActivities"
          defaultValue={defaultSuggestions ?? ""}
          placeholder="Ideas de actividades, salidas, servicios o proyectos…"
          maxLength={3000}
          className="min-h-24"
        />
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Guardando…">
        <Save aria-hidden="true" />
        Guardar diagnóstico de Comunidad
      </SubmitButton>
    </form>
  );
}

export function CycleSummaryForm({
  defaultSummary,
  defaultEmphasis,
}: {
  defaultSummary?: string | null;
  defaultEmphasis?: string | null;
}) {
  const [state, formAction] = useActionState(
    saveCycleSummaryAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cycle-summary">
          Diagnóstico general de la Avanzada
        </Label>
        <Textarea
          id="cycle-summary"
          name="diagnosisSummary"
          defaultValue={defaultSummary ?? ""}
          placeholder="Síntesis acordada en la Reunión de Coordinadores a partir de los diagnósticos de las Comunidades…"
          maxLength={8000}
          className="min-h-32"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cycle-emphasis">Énfasis educativo del ciclo</Label>
        <Textarea
          id="cycle-emphasis"
          name="educationalEmphasis"
          defaultValue={defaultEmphasis ?? ""}
          placeholder="El foco formativo que guiará los próximos meses…"
          maxLength={4000}
          className="min-h-20"
          required
        />
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Guardando…">
        <Save aria-hidden="true" />
        Guardar síntesis y énfasis
      </SubmitButton>
    </form>
  );
}

// ------------------------------------------------------------
// Fase 2 · Propuestas
// ------------------------------------------------------------

export function ActivityProposalForm() {
  const [state, formAction] = useActionState(
    createActivityProposalAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="proposal-title">Título de la propuesta</Label>
        <Input
          id="proposal-title"
          name="title"
          placeholder="Peña de talentos, salida al cerro, proyecto de huerto…"
          maxLength={160}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="proposal-description">Descripción</Label>
        <Textarea
          id="proposal-description"
          name="description"
          placeholder="Qué quieres hacer, por qué y qué necesitaría la Avanzada…"
          maxLength={4000}
          className="min-h-28"
          required
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          name="isSocialInterventionProject"
          className="mt-0.5 size-4 rounded border-line"
        />
        <span>
          Es un proyecto de intervención comunitaria o ambiental: la Asamblea lo
          delibera con foco especial.
        </span>
      </label>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Publicando…">
        <Plus aria-hidden="true" />
        Publicar propuesta
      </SubmitButton>
    </form>
  );
}

// ------------------------------------------------------------
// Fase 2 · Sesión de votación
// ------------------------------------------------------------

export function AssemblyVoteSessionForm() {
  const [state, formAction] = useActionState(
    createAssemblyVoteSessionAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="session-title">Título de la sesión</Label>
        <Input
          id="session-title"
          name="title"
          placeholder="Asamblea de selección del ciclo"
          maxLength={160}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="session-dynamic">Dinámica</Label>
          <Select id="session-dynamic" name="dynamic" defaultValue="ELECCION_DIRECTA">
            <option value="ELECCION_DIRECTA">Elección directa</option>
            <option value="RANKING_ESTRELLAS">Ranking de estrellas</option>
            <option value="ASIGNACION_PUNTOS">Asignación de puntos</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-budget">Pozo de puntos</Label>
          <Input
            id="session-budget"
            name="maxPointsBudget"
            type="number"
            min={1}
            max={100}
            defaultValue={10}
          />
        </div>
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Creando…">
        <Plus aria-hidden="true" />
        Crear sesión de votación
      </SubmitButton>
    </form>
  );
}

export function VoteSessionToggleButton({
  sessionId,
  isOpen,
}: {
  sessionId: string;
  isOpen: boolean;
}) {
  const [state, formAction] = useActionState(
    setAssemblyVoteSessionOpenAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="isOpen" value={isOpen ? "false" : "true"} />
      <SubmitButton
        size="sm"
        variant={isOpen ? "secondary" : "primary"}
        pendingLabel={isOpen ? "Cerrando…" : "Abriendo…"}
      >
        <Power aria-hidden="true" />
        {isOpen ? "Cerrar votación" : "Abrir votación"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}

interface VoteProposal {
  id: string;
  title: string;
  myVote: number | null;
}

export function AssemblyVoteCabin({
  sessionId,
  dynamic,
  maxPointsBudget,
  proposals,
  isVoter,
  neutralityMessage,
}: {
  sessionId: string;
  dynamic: "ELECCION_DIRECTA" | "RANKING_ESTRELLAS" | "ASIGNACION_PUNTOS";
  maxPointsBudget: number | null;
  proposals: VoteProposal[];
  isVoter: boolean;
  neutralityMessage: string;
}) {
  if (!isVoter) {
    return (
      <div className="rounded-xl border border-gold/40 bg-gold-soft/40 p-4 text-sm text-[#7a5a16]">
        <p className="inline-flex items-center gap-2 font-semibold">
          <Lock className="size-4" aria-hidden="true" />
          Participación sin voto
        </p>
        <p className="mt-1 text-xs">{neutralityMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <VoteProposalForm
          key={proposal.id}
          sessionId={sessionId}
          dynamic={dynamic}
          maxPointsBudget={maxPointsBudget}
          proposal={proposal}
        />
      ))}
    </div>
  );
}

function VoteProposalForm({
  sessionId,
  dynamic,
  maxPointsBudget,
  proposal,
}: {
  sessionId: string;
  dynamic: "ELECCION_DIRECTA" | "RANKING_ESTRELLAS" | "ASIGNACION_PUNTOS";
  maxPointsBudget: number | null;
  proposal: VoteProposal;
}) {
  const [state, formAction] = useActionState(
    castAssemblyVoteAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-line bg-canvas/40 p-3"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="proposalId" value={proposal.id} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{proposal.title}</p>
        <div className="flex items-center gap-2">
          {dynamic === "ELECCION_DIRECTA" ? (
            <input type="hidden" name="value" value={1} />
          ) : dynamic === "RANKING_ESTRELLAS" ? (
            <>
              <Label
                htmlFor={`vote-${proposal.id}`}
                className="text-[11px] text-ink-soft"
              >
                Estrellas
              </Label>
              <Select
                id={`vote-${proposal.id}`}
                name="value"
                defaultValue={String(proposal.myVote ?? 1)}
                className="h-9 w-24"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} ★
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <>
              <Label
                htmlFor={`vote-${proposal.id}`}
                className="text-[11px] text-ink-soft"
              >
                Puntos (pozo {maxPointsBudget ?? 10})
              </Label>
              <Input
                id={`vote-${proposal.id}`}
                name="value"
                type="number"
                min={0}
                max={maxPointsBudget ?? 10}
                defaultValue={proposal.myVote ?? 0}
                className="h-9 w-24"
              />
            </>
          )}
          <SubmitButton size="sm" variant="secondary" pendingLabel="Votando…">
            {dynamic === "RANKING_ESTRELLAS" ? (
              <Star aria-hidden="true" />
            ) : (
              <Vote aria-hidden="true" />
            )}
            Votar
          </SubmitButton>
        </div>
      </div>
      {state.error ? (
        <p className="mt-2 text-xs font-semibold text-red-700">
          {state.status === 403 ? "403 · " : ""}
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-2 text-xs font-semibold text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

// ------------------------------------------------------------
// Fase 3 · Calendario y aprobación de la Asamblea
// ------------------------------------------------------------

export function ProposalSelectionToggle({
  proposalId,
  selected,
}: {
  proposalId: string;
  selected: boolean;
}) {
  const [state, formAction] = useActionState(
    selectProposalForCalendarAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="selected" value={selected ? "false" : "true"} />
      <SubmitButton
        size="sm"
        variant={selected ? "secondary" : "primary"}
        pendingLabel="Actualizando…"
      >
        <Check aria-hidden="true" />
        {selected ? "Quitar del calendario" : "Pasar al calendario"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
    </form>
  );
}

export function CalendarApprovalButton({
  cycleId,
  isApproved,
}: {
  cycleId: string;
  isApproved: boolean;
}) {
  const [state, formAction] = useActionState(
    approveCycleCalendarAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="cycleId" value={cycleId} />
      <SubmitButton
        size="sm"
        variant={isApproved ? "secondary" : "primary"}
        disabled={isApproved}
        pendingLabel="Registrando…"
      >
        <Check aria-hidden="true" />
        {isApproved
          ? "Calendario aprobado por la Asamblea"
          : "Registrar aprobación de la Asamblea"}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}

// ------------------------------------------------------------
// Fases
// ------------------------------------------------------------

export function AdvanceCyclePhaseForm({
  cycleId,
  phase,
  nextPhaseLabel,
}: {
  cycleId: string;
  phase: string;
  nextPhaseLabel: string | null;
}) {
  const [state, formAction] = useActionState(
    advanceProgramCyclePhaseAction,
    EMPTY_ACTION_STATE,
  );

  if (!nextPhaseLabel) {
    return (
      <p className="text-xs text-ink-soft">
        El ciclo está finalizado. Activa un nuevo ciclo para comenzar otro
        período.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="cycleId" value={cycleId} />
      <input type="hidden" name="phase" value={getNextPhaseValue(phase)} />
      <SubmitButton size="sm" pendingLabel="Avanzando…">
        <Check aria-hidden="true" />
        Avanzar a {nextPhaseLabel}
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}

function getNextPhaseValue(phase: string) {
  switch (phase) {
    case "DIAGNOSTICO_Y_ENFASIS":
      return "PROPUESTA_Y_SELECCION";
    case "PROPUESTA_Y_SELECCION":
      return "ORGANIZACION_Y_PREPARACION";
    case "ORGANIZACION_Y_PREPARACION":
      return "DESARROLLO_Y_EVALUACION";
    case "DESARROLLO_Y_EVALUACION":
      return "FINALIZADO";
    default:
      return "FINALIZADO";
  }
}
