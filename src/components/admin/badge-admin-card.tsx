"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  grantBadgeAction,
  revokeBadgeAction,
} from "@/features/progression/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface BadgeAdminBadge {
  id: string;
  name: string;
  imagePath: string;
}

export interface BadgeAdminGrant {
  id: string;
  grantedAt: string;
  note: string | null;
}

interface BadgeAdminCardProps {
  userId: string;
  userName: string;
  badge: BadgeAdminBadge;
  grant: BadgeAdminGrant | null;
}

export function BadgeAdminCard({
  userId,
  userName,
  badge,
  grant,
}: BadgeAdminCardProps) {
  const [grantState, grantFormAction] = useActionState(
    grantBadgeAction,
    EMPTY_ACTION_STATE,
  );
  const [revokeState, revokeFormAction] = useActionState(
    revokeBadgeAction,
    EMPTY_ACTION_STATE,
  );

  const obtained = Boolean(grant);
  const grantId = `grant-note-${userId}-${badge.id}`;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border p-2.5 transition-colors",
        obtained
          ? "border-anil-200 bg-surface"
          : "border-dashed border-line bg-canvas/40",
      )}
    >
      <div className="flex items-start gap-2">
        <Image
          src={badge.imagePath}
          alt={badge.name}
          width={38}
          height={38}
          unoptimized
          className={cn(
            "mt-0.5 shrink-0 rounded-full",
            obtained ? "opacity-100" : "grayscale opacity-40",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold leading-tight text-ink">
            {badge.name}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-soft">
            {grant ? formatShortDate(grant.grantedAt) : "Pendiente"}
          </p>
        </div>
      </div>

      {grant ? (
        <div className="mt-2 space-y-1.5">
          {grant.note ? (
            <p
              title={grant.note}
              className="line-clamp-2 rounded-md border-l-2 border-gold/50 bg-gold-soft/25 px-1.5 py-1 text-[10px] italic leading-snug text-ink"
            >
              {grant.note}
            </p>
          ) : null}

          <form action={revokeFormAction}>
            <input type="hidden" name="grantId" value={grant.id} />
            <ConfirmSubmitButton
              variant="ghost"
              size="sm"
              message={`¿Revocar la insignia «${badge.name}» de ${userName}? La concesión quedará registrada con fecha y responsable.`}
              className="h-6 px-1.5 text-[10px] text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <RotateCcw aria-hidden="true" className="size-3" />
              Revocar
            </ConfirmSubmitButton>
          </form>
          {revokeState.error ? (
            <p className="text-[10px] text-red-700">{revokeState.error}</p>
          ) : null}
        </div>
      ) : (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wider text-anil-700 hover:text-anil-900">
            Otorgar
          </summary>
          <form action={grantFormAction} className="mt-1.5 space-y-1.5">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="badgeId" value={badge.id} />

            <label htmlFor={grantId} className="sr-only">
              Nota o dedicatoria para {badge.name}
            </label>
            <Textarea
              id={grantId}
              name="note"
              maxLength={500}
              placeholder="Nota opcional (ej. fogón de invierno)"
              className="min-h-14 px-2 py-1.5 text-[11px]"
            />

            <SubmitButton
              size="sm"
              pendingLabel="Otorgando…"
              className="h-7 px-2 text-[10px]"
            >
              Confirmar
            </SubmitButton>

            {grantState.error ? (
              <p className="text-[10px] text-red-700">{grantState.error}</p>
            ) : null}
            {grantState.success ? (
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <Check className="size-3" aria-hidden="true" />
                Otorgada
              </p>
            ) : null}
          </form>
        </details>
      )}
    </div>
  );
}
