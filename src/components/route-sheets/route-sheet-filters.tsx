"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RouteSheetStatus } from "@/generated/prisma/enums";
import {
  ROUTE_SHEET_STATUSES,
  ROUTE_SHEET_STATUS_LABELS,
} from "@/lib/route-sheets";
import { cn } from "@/lib/utils";

interface ProgramCycleOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ActivityOption {
  id: string;
  title: string;
  cycleId: string | null;
}

interface CommunityOption {
  id: string;
  name: string;
}

interface RouteSheetFiltersProps {
  cycles: ProgramCycleOption[];
  activities: ActivityOption[];
  communities: CommunityOption[];
  status: RouteSheetStatus | "all";
  cycleId: string;
  activityId: string;
  communityId: string;
}

export function RouteSheetFilters({
  cycles,
  activities,
  communities,
  status,
  cycleId,
  activityId,
  communityId,
}: RouteSheetFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  function clearAll() {
    startTransition(() => router.replace(pathname));
  }

  const hasFilters =
    status !== "PENDIENTE_AUTORIZACION" ||
    Boolean(cycleId || activityId || communityId);
  const cycleNameById = new Map(
    cycles.map((cycle) => [cycle.id, cycle.name]),
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-card transition-opacity sm:p-5",
        pending && "opacity-60",
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
        <Filter className="size-3.5" aria-hidden="true" />
        Filtrar bandeja
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="route-sheet-status">Estado</Label>
          <Select
            id="route-sheet-status"
            value={status}
            onChange={(event) => apply({ status: event.target.value })}
          >
            <option value="all">Todos</option>
            {ROUTE_SHEET_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ROUTE_SHEET_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-sheet-cycle">Ciclo</Label>
          <Select
            id="route-sheet-cycle"
            value={cycleId}
            onChange={(event) =>
              apply({ cycle: event.target.value, activity: null })
            }
          >
            <option value="">Todos</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
                {cycle.isActive ? " · activo" : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-sheet-activity">Actividad</Label>
          <Select
            id="route-sheet-activity"
            value={activityId}
            onChange={(event) => apply({ activity: event.target.value })}
          >
            <option value="">Todas</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.cycleId
                  ? (cycleNameById.get(activity.cycleId) ?? "—")
                  : "Sin ciclo"}{" "}
                · {activity.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="route-sheet-community">Comunidad</Label>
          <Select
            id="route-sheet-community"
            value={communityId}
            onChange={(event) => apply({ community: event.target.value })}
          >
            <option value="">Todas</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="justify-start lg:justify-center"
          >
            <X aria-hidden="true" />
            Limpiar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
