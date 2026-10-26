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
import type { ActivityType } from "@/generated/prisma/enums";

interface SemesterOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ActivityFormActivity {
  id: string;
  semesterId: string;
  title: string;
  type: ActivityType;
  startsAt: string;
  endsAt: string;
  location: string | null;
  description: string | null;
  isPublished: boolean;
  leaderIds: string[];
}

interface ActivityFormProps {
  mode: "create" | "edit";
  semesters: SemesterOption[];
  leaders: LeaderOption[];
  defaultSemesterId: string;
  activity?: ActivityFormActivity;
}

export function ActivityForm({
  mode,
  semesters,
  leaders,
  defaultSemesterId,
  activity,
}: ActivityFormProps) {
  const [state, formAction] = useActionState(
    mode === "create" ? createActivityAction : updateActivityAction,
    EMPTY_ACTION_STATE,
  );

  const fieldPrefix = activity ? `activity-${activity.id}` : "activity-new";

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
          <Label htmlFor={`${fieldPrefix}-semester`}>Semestre</Label>
          <Select
            id={`${fieldPrefix}-semester`}
            name="semesterId"
            defaultValue={activity?.semesterId ?? defaultSemesterId}
            required
          >
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
                {semester.isActive ? " · activo" : ""}
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
