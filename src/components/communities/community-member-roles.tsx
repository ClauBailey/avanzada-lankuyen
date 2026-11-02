"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { setCommunityMemberRoleAction } from "@/features/communities/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  COMMUNITY_INTERNAL_ROLES,
  COMMUNITY_INTERNAL_ROLE_LABELS,
} from "@/lib/community-rules";

export interface CommunityMemberRow {
  id: string;
  name: string;
  username: string;
  role: string;
  communityRole: string | null;
}

interface CommunityMemberRolesProps {
  communityId: string;
  members: CommunityMemberRow[];
  canManage: boolean;
}

export function CommunityMemberRoles({
  communityId,
  members,
  canManage,
}: CommunityMemberRolesProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-canvas/40 p-3 text-xs text-ink-soft">
        La comunidad aún no tiene personas jóvenes activas.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => (
        <li key={member.id}>
          <CommunityMemberRoleRow
            communityId={communityId}
            member={member}
            canManage={canManage}
          />
        </li>
      ))}
    </ul>
  );
}

function CommunityMemberRoleRow({
  communityId,
  member,
  canManage,
}: {
  communityId: string;
  member: CommunityMemberRow;
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(
    setCommunityMemberRoleAction,
    EMPTY_ACTION_STATE,
  );

  if (!canManage) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2 text-xs">
        <span className="min-w-0 truncate font-semibold text-ink">
          {member.name}{" "}
          <span className="font-normal text-ink-soft">@{member.username}</span>
        </span>
        <span className="shrink-0 text-ink-soft">
          {member.communityRole
            ? COMMUNITY_INTERNAL_ROLE_LABELS[
                member.communityRole as keyof typeof COMMUNITY_INTERNAL_ROLE_LABELS
              ]
            : "Sin cargo"}
        </span>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-line bg-canvas/40 px-3 py-2"
    >
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="userId" value={member.id} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
          {member.name}{" "}
          <span className="font-normal text-ink-soft">@{member.username}</span>
        </span>
        <Select
          name="role"
          defaultValue={member.communityRole ?? ""}
          aria-label={`Cargo interno de ${member.name}`}
          className="h-8 w-40 py-0 text-xs"
        >
          <option value="">Sin cargo</option>
          {COMMUNITY_INTERNAL_ROLES.map((role) => (
            <option key={role} value={role}>
              {COMMUNITY_INTERNAL_ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        <SubmitButton size="sm" variant="secondary" pendingLabel="Guardando…">
          <Save aria-hidden="true" />
          Guardar
        </SubmitButton>
      </div>
      {state.error ? (
        <p className="mt-1 text-[11px] text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-1 text-[11px] text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}
