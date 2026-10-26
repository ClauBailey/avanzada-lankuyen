"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Select } from "@/components/ui/select";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/activity-types";
import { cn } from "@/lib/utils";

interface MonthOption {
  value: string;
  label: string;
}

interface CalendarFiltersProps {
  months: MonthOption[];
  month: string;
  type: string;
  scope: string;
}

const SCOPES = [
  { value: "proximas", label: "Próximas" },
  { value: "pasadas", label: "Pasadas" },
  { value: "todas", label: "Todas" },
] as const;

export function CalendarFilters({
  months,
  month,
  type,
  scope,
}: CalendarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/calendario?${params.toString()}`);
    });
  };

  const hasFilters = Boolean(month || type) || scope !== "proximas";

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-card transition-opacity",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <Filter className="size-3.5" aria-hidden="true" />
          Filtrar
        </span>

        <div className="flex rounded-xl border border-line bg-canvas p-0.5">
          {SCOPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("scope", option.value)}
              aria-pressed={scope === option.value}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                scope === option.value
                  ? "bg-surface text-anil-800 shadow-sm"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="w-40">
          <Select
            value={month}
            onChange={(event) => update("month", event.target.value)}
            aria-label="Filtrar por mes"
            className="h-9"
          >
            <option value="">Todos los meses</option>
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={type}
            onChange={(event) => update("type", event.target.value)}
            aria-label="Filtrar por tipo"
            className="h-9"
          >
            <option value="">Todos los tipos</option>
            {ACTIVITY_TYPES.map((item) => (
              <option key={item} value={item}>
                {ACTIVITY_TYPE_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                router.push("/calendario");
              });
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-anil-700 hover:text-anil-900"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}
