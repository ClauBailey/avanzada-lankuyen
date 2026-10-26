"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { Input } from "@/components/ui/input";
import { ROLE_SHORT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LeaderOption {
  id: string;
  firstName: string;
  lastName: string;
  role: "PP" | "COORDINADOR";
  community: { name: string; color: string | null } | null;
}

interface LeaderPickerProps {
  leaders: LeaderOption[];
  initialSelected: string[];
}

export function LeaderPicker({ leaders, initialSelected }: LeaderPickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!term) return leaders;

    return leaders.filter((leader) => {
      const haystack = `${leader.firstName} ${leader.lastName} ${
        leader.community?.name ?? ""
      }`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return haystack.includes(term);
    });
  }, [leaders, query]);

  const toggle = (userId: string) => {
    setSelected((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <Users className="size-3.5" aria-hidden="true" />
          Encargados de la actividad
        </p>
        <span className="text-[11px] text-ink-soft">
          {selected.length === 0
            ? "Sin encargados asignados"
            : `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {selected.map((userId) => (
        <input key={userId} type="hidden" name="leaderIds" value={userId} />
      ))}

      <div className="rounded-xl border border-line bg-surface">
        <div className="relative border-b border-line/70 p-2.5">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o comunidad…"
            className="h-9 border-0 bg-canvas/50 pl-9 shadow-none"
            aria-label="Buscar encargados"
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-ink-soft">
              No encontramos miembros con esa búsqueda.
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((leader) => {
                const isSelected = selected.includes(leader.id);
                return (
                  <li key={leader.id}>
                    <button
                      type="button"
                      onClick={() => toggle(leader.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-anil-50 ring-1 ring-inset ring-anil-200"
                          : "hover:bg-canvas",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          isSelected
                            ? "border-anil-700 bg-anil-700 text-white"
                            : "border-line bg-surface",
                        )}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <svg viewBox="0 0 12 12" className="size-3">
                            <path
                              d="M2.5 6.5 5 9l4.5-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {leader.firstName} {leader.lastName}
                        </span>
                        <span className="block text-[11px] text-ink-soft">
                          {ROLE_SHORT_LABELS[leader.role]}
                        </span>
                      </span>

                      <CommunityTag
                        name={leader.community?.name}
                        color={leader.community?.color}
                        className="shrink-0"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-soft">
        Puedes asignar a uno o más Pioneros/as o Coordinadores. Los AA no se asignan
        como encargados.
      </p>
    </div>
  );
}
