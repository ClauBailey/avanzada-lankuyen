"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Plus,
  Save,
  Trash2,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  addProjectActivityAction,
  addWorkGroupMemberAction,
  createProjectAction,
  dissolveWorkGroupAction,
  joinWorkGroupAction,
  removeWorkGroupMemberAction,
  saveFinalReportAction,
  setProjectStepAction,
  toggleProjectActivityAction,
  updateProjectAction,
} from "@/features/projects/actions";
import {
  COMPETENCY_AREA_OPTIONS,
  PROJECT_ACTIVITY_KINDS,
  PROJECT_LOCALITIES,
  PROJECT_STEPS,
} from "@/features/projects/rules";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export interface PersonOption {
  id: string;
  name: string;
}

export interface CycleOption {
  id: string;
  name: string;
}

export interface ProjectFormValues {
  id: string;
  title: string;
  cycleId: string | null;
  responsibleUserId: string | null;
  accompanyingAaId: string | null;
  beneficiaries: string;
  locality: string;
  durationText: string;
  isSocialEnvironmentalIntervention: boolean;
  problemDiagnosis: string;
  generalObjective: string;
  specificObjectives: string;
  observableIndicators: string | null;
  budgetSummary: string | null;
  requiredCompetencies: string[];
  step: string;
}

function CompetencyChecks({
  selected = [],
  idPrefix,
}: {
  selected?: string[];
  idPrefix: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-ink">
        Competencias vinculadas al proyecto
      </legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {COMPETENCY_AREA_OPTIONS.map((area) => (
          <label
            key={area.key}
            className="flex items-center gap-2 rounded-lg border border-line bg-canvas/30 px-2.5 py-1.5 text-xs text-ink"
          >
            <input
              type="checkbox"
              name="requiredCompetencies"
              value={area.key}
              defaultChecked={selected.includes(area.key)}
              id={`${idPrefix}-${area.key}`}
              className="size-4 rounded border-line"
            />
            {area.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProjectFields({
  values,
  cycles,
  youths,
  aas,
  idPrefix,
}: {
  values?: Partial<ProjectFormValues>;
  cycles: CycleOption[];
  youths: PersonOption[];
  aas: PersonOption[];
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Título del proyecto</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          defaultValue={values?.title ?? ""}
          placeholder="Ej.: Huerto comunitario del cerro"
          maxLength={160}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cycle`}>Ciclo de Programa</Label>
          <Select
            id={`${idPrefix}-cycle`}
            name="cycleId"
            defaultValue={values?.cycleId ?? ""}
          >
            <option value="">Ciclo activo</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-locality`}>Alcance territorial</Label>
          <Select
            id={`${idPrefix}-locality`}
            name="locality"
            defaultValue={values?.locality ?? "LOCAL"}
          >
            {PROJECT_LOCALITIES.map((locality) => (
              <option key={locality.key} value={locality.key}>
                {locality.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-responsible`}>
            Responsable del Grupo de Trabajo
          </Label>
          <Select
            id={`${idPrefix}-responsible`}
            name="responsibleUserId"
            defaultValue={values?.responsibleUserId ?? ""}
          >
            <option value="">Yo asumo como Responsable</option>
            {youths.map((youth) => (
              <option key={youth.id} value={youth.id}>
                {youth.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-aa`}>AA que acompaña (opcional)</Label>
          <Select
            id={`${idPrefix}-aa`}
            name="accompanyingAaId"
            defaultValue={values?.accompanyingAaId ?? ""}
          >
            <option value="">Sin AA asignado</option>
            {aas.map((aa) => (
              <option key={aa.id} value={aa.id}>
                {aa.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-beneficiaries`}>Destinatarios</Label>
          <Input
            id={`${idPrefix}-beneficiaries`}
            name="beneficiaries"
            defaultValue={values?.beneficiaries ?? ""}
            placeholder="Niños del sector, vecinos, la propia Avanzada…"
            maxLength={4000}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-duration`}>Duración</Label>
          <Input
            id={`${idPrefix}-duration`}
            name="durationText"
            defaultValue={values?.durationText ?? ""}
            placeholder="Ej.: 4 encuentros entre abril y junio"
            maxLength={120}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-diagnosis`}>
          Diagnóstico del problema o sueño
        </Label>
        <Textarea
          id={`${idPrefix}-diagnosis`}
          name="problemDiagnosis"
          defaultValue={values?.problemDiagnosis ?? ""}
          placeholder="Qué observamos, qué soñamos y por qué este proyecto tiene sentido…"
          maxLength={8000}
          className="min-h-24"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-general`}>Objetivo general</Label>
        <Textarea
          id={`${idPrefix}-general`}
          name="generalObjective"
          defaultValue={values?.generalObjective ?? ""}
          maxLength={4000}
          className="min-h-16"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-specific`}>Objetivos específicos</Label>
        <Textarea
          id={`${idPrefix}-specific`}
          name="specificObjectives"
          defaultValue={values?.specificObjectives ?? ""}
          maxLength={6000}
          className="min-h-20"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-indicators`}>
            Indicadores observables (opcional)
          </Label>
          <Textarea
            id={`${idPrefix}-indicators`}
            name="observableIndicators"
            defaultValue={values?.observableIndicators ?? ""}
            placeholder="Solo para intervención social o ambiental (Manual p. 267)."
            maxLength={4000}
            className="min-h-16"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-budget`}>
            Financiamiento y presupuesto (opcional)
          </Label>
          <Textarea
            id={`${idPrefix}-budget`}
            name="budgetSummary"
            defaultValue={values?.budgetSummary ?? ""}
            maxLength={4000}
            className="min-h-16"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          name="isSocialEnvironmentalIntervention"
          defaultChecked={values?.isSocialEnvironmentalIntervention ?? false}
          className="mt-0.5 size-4 rounded border-line"
        />
        <span>
          Es una intervención social o ambiental: el proyecto se delibera con
          foco especial y declara indicadores observables.
        </span>
      </label>

      <CompetencyChecks
        selected={values?.requiredCompetencies}
        idPrefix={idPrefix}
      />
    </>
  );
}

export function ProjectCreateForm({
  cycles,
  youths,
  aas,
}: {
  cycles: CycleOption[];
  youths: PersonOption[];
  aas: PersonOption[];
}) {
  const [state, formAction] = useActionState(
    createProjectAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <ProjectFields
        cycles={cycles}
        youths={youths}
        aas={aas}
        idPrefix="new-project"
      />
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Abriendo proyecto…">
        <Plus aria-hidden="true" />
        Abrir proyecto y convocar al Grupo de Trabajo
      </SubmitButton>
    </form>
  );
}

export function ProjectEditForm({
  project,
  cycles,
  youths,
  aas,
}: {
  project: ProjectFormValues;
  cycles: CycleOption[];
  youths: PersonOption[];
  aas: PersonOption[];
}) {
  const [state, formAction] = useActionState(
    updateProjectAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <details className="rounded-2xl border border-line bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-anil-800 marker:text-anil-500">
        Editar la Pauta de Identificación del Proyecto
      </summary>
      <form
        action={formAction}
        className="space-y-4 border-t border-line/70 bg-canvas/25 p-4 sm:p-5"
      >
        <input type="hidden" name="projectId" value={project.id} />
        <ProjectFields
          values={project}
          cycles={cycles}
          youths={youths}
          aas={aas}
          idPrefix={`edit-project-${project.id}`}
        />
        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.success ? <Alert variant="success">{state.success}</Alert> : null}
        <SubmitButton size="sm" pendingLabel="Guardando…">
          <Save aria-hidden="true" />
          Guardar pauta del proyecto
        </SubmitButton>
      </form>
    </details>
  );
}

export function ProjectStepForm({
  projectId,
  step,
}: {
  projectId: string;
  step: string;
}) {
  const [state, formAction] = useActionState(
    setProjectStepAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="space-y-1">
        <Label htmlFor={`step-${projectId}`} className="text-[11px]">
          Paso del proyecto
        </Label>
        <Select
          id={`step-${projectId}`}
          name="step"
          defaultValue={step}
          className="h-9 w-52"
        >
          {PROJECT_STEPS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.manualLabel}
            </option>
          ))}
        </Select>
      </div>
      <SubmitButton size="sm" variant="secondary" pendingLabel="Moviendo…">
        <ArrowRight aria-hidden="true" />
        Actualizar paso
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}

export function ProjectActivityForm({
  projectId,
  activities,
}: {
  projectId: string;
  activities: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(
    addProjectActivityAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor={`item-title-${projectId}`}>Actividad</Label>
          <Input
            id={`item-title-${projectId}`}
            name="title"
            maxLength={160}
            placeholder="Ej.: Jornada de limpieza del estero"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`item-kind-${projectId}`}>Tipo</Label>
          <Select id={`item-kind-${projectId}`} name="kind" defaultValue="CENTRAL">
            {PROJECT_ACTIVITY_KINDS.map((kind) => (
              <option key={kind.key} value={kind.key}>
                {kind.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`item-calendar-${projectId}`}>
            Vincular al calendario (opcional)
          </Label>
          <Select id={`item-calendar-${projectId}`} name="activityId" defaultValue="">
            <option value="">Sin actividad del calendario</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" variant="secondary" pendingLabel="Agregando…">
        <Plus aria-hidden="true" />
        Agregar actividad
      </SubmitButton>
    </form>
  );
}

export function ProjectActivityToggle({
  itemId,
  isCompleted,
}: {
  itemId: string;
  isCompleted: boolean;
}) {
  const [state, formAction] = useActionState(
    toggleProjectActivityAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input
        type="hidden"
        name="isCompleted"
        value={isCompleted ? "false" : "true"}
      />
      <SubmitButton
        size="sm"
        variant={isCompleted ? "ghost" : "secondary"}
        pendingLabel="Actualizando…"
      >
        {isCompleted ? (
          <Check aria-hidden="true" />
        ) : (
          <Circle aria-hidden="true" />
        )}
        {isCompleted ? "Realizada" : "Marcar realizada"}
      </SubmitButton>
      {state.error ? (
        <span className="text-[11px] font-semibold text-red-700">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

export function JoinWorkGroupForm({
  projectId,
  canJoin,
  isMember,
  isActive,
}: {
  projectId: string;
  canJoin: boolean;
  isMember: boolean;
  isActive: boolean;
}) {
  const [state, formAction] = useActionState(
    joinWorkGroupAction,
    EMPTY_ACTION_STATE,
  );

  if (isMember) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-800">
        <Check className="size-4" aria-hidden="true" />
        Ya formas parte de este Grupo de Trabajo
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-canvas/50 px-3 py-2 text-xs text-ink-soft">
        <XCircle className="size-4" aria-hidden="true" />
        Grupo de Trabajo disuelto: el proyecto concluyó.
      </div>
    );
  }

  if (!canJoin) {
    return (
      <p className="text-xs text-ink-soft">
        Solo los jóvenes activos de la Avanzada pueden inscribirse en un Grupo
        de Trabajo.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="space-y-1.5">
        <Label htmlFor={`join-role-${projectId}`}>
          ¿Qué tarea quieres asumir? (opcional)
        </Label>
        <Input
          id={`join-role-${projectId}`}
          name="taskRole"
          maxLength={160}
          placeholder="Ej.: Comunicaciones, logística, cocina…"
        />
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Inscribiendo…">
        <UserPlus aria-hidden="true" />
        Inscribirme en el Grupo de Trabajo
      </SubmitButton>
    </form>
  );
}

export function WorkGroupMemberForm({
  projectId,
  youths,
  contacts,
}: {
  projectId: string;
  youths: PersonOption[];
  contacts: PersonOption[];
}) {
  const [state, formAction] = useActionState(
    addWorkGroupMemberAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`member-user-${projectId}`}>
            Joven con cuenta (opcional)
          </Label>
          <Select id={`member-user-${projectId}`} name="userId" defaultValue="">
            <option value="">Sin miembro con cuenta</option>
            {youths.map((youth) => (
              <option key={youth.id} value={youth.id}>
                {youth.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`member-monitor-${projectId}`}>
            Monitor de la Red de Apoyo (opcional)
          </Label>
          <Select
            id={`member-monitor-${projectId}`}
            name="supportContactId"
            defaultValue=""
          >
            <option value="">Sin monitor</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`member-external-${projectId}`}>
            Participante externo sin cuenta
          </Label>
          <Input
            id={`member-external-${projectId}`}
            name="externalName"
            maxLength={160}
            placeholder="Ej.: Camila, amiga invitada"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`member-org-${projectId}`}>
            Procedencia del externo (opcional)
          </Label>
          <Input
            id={`member-org-${projectId}`}
            name="externalOrganization"
            maxLength={160}
            placeholder="Avanzada Peñihuén, vecino del sector…"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`member-task-${projectId}`}>
          Rol o responsabilidad en la tarea
        </Label>
        <Input
          id={`member-task-${projectId}`}
          name="taskRole"
          maxLength={160}
          placeholder="Ej.: Apoyo logístico, relatoría, transporte…"
          required
        />
      </div>
      <p className="text-[11px] leading-relaxed text-ink-soft">
        Elige una sola identidad por integrante: cuenta de la Avanzada, monitor
        de la Red de Apoyo o invitado externo sin cuenta.
      </p>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" variant="secondary" pendingLabel="Sumando…">
        <UsersRound aria-hidden="true" />
        Sumar integrante
      </SubmitButton>
    </form>
  );
}

export function RemoveWorkGroupMemberButton({
  memberId,
}: {
  memberId: string;
}) {
  const [state, formAction] = useActionState(
    removeWorkGroupMemberAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton
        size="sm"
        variant="ghost"
        pendingLabel="Retirando…"
        aria-label="Retirar integrante"
      >
        <Trash2 aria-hidden="true" />
        Retirar
      </SubmitButton>
      {state.error ? (
        <span className="text-[11px] text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}

export function FinalReportForm({
  projectId,
  preparation,
  conclusions,
  celebrationNotes,
}: {
  projectId: string;
  preparation: string | null;
  conclusions: string | null;
  celebrationNotes: string | null;
}) {
  const [state, formAction] = useActionState(
    saveFinalReportAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="space-y-1.5">
        <Label htmlFor={`report-preparation-${projectId}`}>
          Preparación y ejecución
        </Label>
        <Textarea
          id={`report-preparation-${projectId}`}
          name="finalReportPreparation"
          defaultValue={preparation ?? ""}
          maxLength={8000}
          className="min-h-24"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`report-conclusions-${projectId}`}>
          Conclusiones de la evaluación
        </Label>
        <Textarea
          id={`report-conclusions-${projectId}`}
          name="finalReportConclusions"
          defaultValue={conclusions ?? ""}
          maxLength={8000}
          className="min-h-24"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`report-celebration-${projectId}`}>
          Registro de ¡La Peña! (opcional)
        </Label>
        <Textarea
          id={`report-celebration-${projectId}`}
          name="celebrationNotes"
          defaultValue={celebrationNotes ?? ""}
          maxLength={4000}
          className="min-h-16"
        />
      </div>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      <SubmitButton size="sm" pendingLabel="Guardando informe…">
        <Save aria-hidden="true" />
        Guardar Informe Final
      </SubmitButton>
    </form>
  );
}

export function DissolveWorkGroupButton({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const [state, formAction] = useActionState(
    dissolveWorkGroupAction,
    EMPTY_ACTION_STATE,
  );

  if (status !== "ACTIVO") {
    return (
      <Badge variant="outline">
        Grupo de Trabajo histórico · disuelto
      </Badge>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton
        size="sm"
        variant="secondary"
        pendingLabel="Disolviendo…"
      >
        <XCircle aria-hidden="true" />
        Disolver Grupo de Trabajo tras el Informe Final
      </SubmitButton>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </form>
  );
}
