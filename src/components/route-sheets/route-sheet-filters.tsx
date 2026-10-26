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

interface SemesterOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ActivityOption {
  id: string;
  title: string;
  semesterId: string;
}

interface RouteSheetFiltersProps {
  semesters: SemesterOption[];
  activities: ActivityOption[];
  status: RouteSheetStatus | "all";
  semesterId: string;
  activityId: string;
}

export function RouteSheetFilters({
  semesters,
  activities,
  status,
  semesterId,
  activityId,
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
    Boolean(semesterId || activityId);
  const semesterNameById = new Map(
    semesters.map((semester) => [semester.id, semester.name]),
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

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
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
          <Label htmlFor="route-sheet-semester">Semestre</Label>
          <Select
            id="route-sheet-semester"
            value={semesterId}
            onChange={(event) =>
              apply({ semester: event.target.value, activity: null })
            }
          >
            <option value="">Todos</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
                {semester.isActive ? " · activo" : ""}
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
                {semesterNameById.get(activity.semesterId) ?? "—"} ·{" "}
                {activity.title}
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
