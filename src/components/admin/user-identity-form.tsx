"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateUserIdentityAction } from "@/features/users/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  ADULT_TEAM_ROLES,
  ADULT_TEAM_ROLE_LABELS,
} from "@/lib/community-rules";

interface UserIdentityFormProps {
  userId: string;
  role: string;
  preferredName: string | null;
  birthDate: string | null;
  adultTeamRole: string | null;
}

export function UserIdentityForm({
  userId,
  role,
  preferredName,
  birthDate,
  adultTeamRole,
}: UserIdentityFormProps) {
  const [state, formAction] = useActionState(
    updateUserIdentityAction,
    EMPTY_ACTION_STATE,
  );
  const isAA = role === "AA";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor={`preferred-${userId}`}>Nombre social</Label>
        <Input
          id={`preferred-${userId}`}
          name="preferredName"
          defaultValue={preferredName ?? ""}
          maxLength={80}
          placeholder="Cómo quiere ser llamado/a"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`birth-${userId}`}>Fecha de nacimiento</Label>
        <Input
          id={`birth-${userId}`}
          name="birthDate"
          type="date"
          defaultValue={birthDate ?? ""}
        />
      </div>

      {isAA ? (
        <div className="space-y-1.5">
          <Label htmlFor={`adult-role-${userId}`}>Cargo en el Equipo Adulto</Label>
          <Select
            id={`adult-role-${userId}`}
            name="adultTeamRole"
            defaultValue={adultTeamRole ?? "RESPONSABLE_AVANZADA"}
          >
            {ADULT_TEAM_ROLES.map((item) => (
              <option key={item} value={item}>
                {ADULT_TEAM_ROLE_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <SubmitButton size="sm" pendingLabel="Guardando…">
        <Save aria-hidden="true" />
        Guardar identidad
      </SubmitButton>
    </form>
  );
}
