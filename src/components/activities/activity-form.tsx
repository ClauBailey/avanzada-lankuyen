"use client";

import { useActionState } from "react";
import { CalendarPlus, Save } from "lucide-react";

import { LeaderPicker, type LeaderOption } from "@/components/activities/leader-picker";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createActivityAction,
  updateActivityAction,
} from "@/features/activities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/activity-types";
import {
  ACTIVITY_SCHEDULE_TYPES,
  ACTIVITY_SCHEDULE_TYPE_DESCRIPTIONS,
  ACTIVITY_SCHEDULE_TYPE_LABELS,
  ACTIVITY_SCOPES,
  ACTIVITY_SCOPE_DESCRIPTIONS,
  ACTIVITY_SCOPE_LABELS,
} from "@/lib/activity-scopes";
import type {
  ActivityScheduleType,
  ActivityScope,
  ActivityType,
} from "@/generated/prisma/enums";

interface ProgramCycleOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ActivityFormActivity {
  id: string;
  cycleId: string | null;
  title: string;
  type: ActivityType;
  scope: ActivityScope;
  scheduleType: ActivityScheduleType;
  startsAt: string;
  endsAt: string;
  location: string | null;
  description: string | null;
  isPublished: boolean;
  leaderIds: string[];
}

interface ActivityFormProps {
  mode: "create" | "edit";
  cycles: ProgramCycleOption[];
  leaders: LeaderOption[];
  defaultCycleId: string;
  /** El COORDINADOR solo programa actividades de su propia Comunidad. */
  scopeLocked?: boolean;
  activity?: ActivityFormActivity;
}

export function ActivityForm({
  mode,
  cycles,
  leaders,
  defaultCycleId,
  scopeLocked = false,
  activity,
}: ActivityFormProps) {
  const [state, formAction] = useActionState(
    mode === "create" ? createActivityAction : updateActivityAction,
    EMPTY_ACTION_STATE,
  );

  const fieldPrefix = activity ? `activity-${activity.id}` : "activity-new";
  const defaultScope = scopeLocked
    ? "COMUNIDAD"
    : (activity?.scope ?? "AVANZADA");

  return (
    <form action={formAction} className="space-y-5">
      {activity ? (
        <input type="hidden" name="activityId" value={activity.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${fieldPrefix}-title`}>Título</Label>
          <Input
            id={`${fieldPrefix}-title`}
            name="title"
            defaultValue={activity?.title ?? ""}
            placeholder="Reunión de comunidad"
            maxLength={160}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-cycle`}>Ciclo de Programa</Label>
          <Select
            id={`${fieldPrefix}-cycle`}
            name="cycleId"
            defaultValue={activity?.cycleId ?? defaultCycleId}
            required
          >
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
                {cycle.isActive ? " · activo" : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-type`}>Tipo</Label>
          <Select
            id={`${fieldPrefix}-type`}
            name="type"
            defaultValue={activity?.type ?? "REUNION"}
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACTIVITY_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-scope`}>Alcance</Label>
          {scopeLocked ? (
            <>
              <input type="hidden" name="scope" value="COMUNIDAD" />
              <p className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink-soft">
                {ACTIVITY_SCOPE_LABELS.COMUNIDAD} ·{" "}
                {ACTIVITY_SCOPE_DESCRIPTIONS.COMUNIDAD}
              </p>
            </>
          ) : (
            <Select
              id={`${fieldPrefix}-scope`}
              name="scope"
              defaultValue={defaultScope}
            >
              {ACTIVITY_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {ACTIVITY_SCOPE_LABELS[scope]} —{" "}
                  {ACTIVITY_SCOPE_DESCRIPTIONS[scope]}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-schedule`}>Carácter</Label>
          <Select
            id={`${fieldPrefix}-schedule`}
            name="scheduleType"
            defaultValue={activity?.scheduleType ?? "VARIABLE"}
          >
            {ACTIVITY_SCHEDULE_TYPES.map((scheduleType) => (
              <option key={scheduleType} value={scheduleType}>
                {ACTIVITY_SCHEDULE_TYPE_LABELS[scheduleType]} —{" "}
                {ACTIVITY_SCHEDULE_TYPE_DESCRIPTIONS[scheduleType]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-start`}>
            Inicio (hora de Chile)
          </Label>
          <Input
            id={`${fieldPrefix}-start`}
            name="startsAt"
            type="datetime-local"
            defaultValue={activity?.startsAt ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-end`}>Término (hora de Chile)</Label>
          <Input
            id={`${fieldPrefix}-end`}
            name="endsAt"
            type="datetime-local"
            defaultValue={activity?.endsAt ?? ""}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${fieldPrefix}-location`}>Ubicación</Label>
          <Input
            id={`${fieldPrefix}-location`}
            name="location"
            defaultValue={activity?.location ?? ""}
            placeholder="Parroquia, sede o punto de encuentro"
            maxLength={160}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${fieldPrefix}-description`}>Descripción</Label>
          <Textarea
            id={`${fieldPrefix}-description`}
            name="description"
            defaultValue={activity?.description ?? ""}
            placeholder="Detalles, materiales que deben llevar, indicaciones…"
            maxLength={2000}
            className="min-h-28"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}-published`}>
            Visibilidad en el calendario
          </Label>
          <Select
            id={`${fieldPrefix}-published`}
            name="isPublished"
            defaultValue={activity?.isPublished === false ? "false" : "true"}
          >
            <option value="true">Publicada</option>
            <option value="false">Oculta (borrador)</option>
          </Select>
        </div>
      </div>

      <LeaderPicker
        leaders={leaders}
        initialSelected={activity?.leaderIds ?? []}
      />

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <SubmitButton size="sm" pendingLabel="Guardando…">
        {mode === "create" ? (
          <CalendarPlus aria-hidden="true" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {mode === "create" ? "Crear actividad" : "Guardar cambios"}
      </SubmitButton>
    </form>
  );
}
