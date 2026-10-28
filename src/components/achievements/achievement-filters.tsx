import Link from "next/link";

import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { value: "", label: "Todos" },
  { value: "AVANZADA", label: "Avanzada" },
  { value: "COMUNIDAD", label: "Comunidad" },
  { value: "ESPECIAL", label: "Especiales" },
  { value: "SECRETO", label: "Secretos" },
] as const;

const STATE_TABS = [
  { value: "", label: "Todos" },
  { value: "unlocked", label: "Desbloqueados" },
  { value: "locked", label: "Por descubrir" },
] as const;

interface AchievementFiltersProps {
  category: string;
  state: string;
}

function buildHref(category: string, state: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (state) params.set("state", state);
  const query = params.toString();
  return query ? `/logros?${query}` : "/logros";
}

export function AchievementFilters({
  category,
  state,
}: AchievementFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Categoría">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Categoría
        </span>
        {CATEGORY_TABS.map((tab) => {
          const active = category === tab.value;
          return (
            <Link
              key={tab.value || "all"}
              href={buildHref(tab.value, state)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-anil-800 bg-anil-800 text-white"
                  : "border-line bg-surface text-ink-soft hover:border-anil-300 hover:text-anil-800",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" aria-label="Estado">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Estado
        </span>
        {STATE_TABS.map((tab) => {
          const active = state === tab.value;
          return (
            <Link
              key={tab.value || "all"}
              href={buildHref(category, tab.value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-gold bg-gold-soft text-[#7a5a16]"
                  : "border-line bg-surface text-ink-soft hover:border-gold/50 hover:text-[#7a5a16]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
