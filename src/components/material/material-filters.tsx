"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface MaterialFilterSection {
  key: string;
  label: string;
}

interface MaterialFiltersProps {
  sections: MaterialFilterSection[];
  section: string;
  query: string;
  resultCount: number;
  totalCount: number;
}

export function MaterialFilters({
  sections,
  section,
  query,
  resultCount,
  totalCount,
}: MaterialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const hasFilters = Boolean(query || section);

  function apply(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }

    params.delete("scroll");
    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-card transition-opacity sm:p-5",
        pending && "opacity-60",
      )}
      aria-label="Buscar en el material"
    >
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_auto] lg:items-end">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q");
            apply({ q: typeof value === "string" ? value.trim() : "" });
          }}
          className="space-y-2"
        >
          <Label htmlFor="material-search">Buscar en el material</Label>
          <div className="flex gap-2">
            <Input
              id="material-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Grito, oración, bandera, historia…"
              autoComplete="off"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
              <Search aria-hidden="true" />
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <Label htmlFor="material-section">Sección</Label>
          <Select
            id="material-section"
            value={section}
            onChange={(event) => apply({ seccion: event.target.value })}
          >
            <option value="">Todo el material</option>
            {sections.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => router.replace(pathname))}
            >
              <X aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/70 pt-3">
        <SlidersHorizontal className="size-3.5 text-anil-500" aria-hidden="true" />
        <p className="text-xs text-ink-soft">
          {hasFilters ? (
            <>
              {resultCount} de {totalCount} recurso
              {totalCount === 1 ? "" : "s"} coincide
              {resultCount === 1 ? "" : "n"} con el filtro.
            </>
          ) : (
            <>
              {totalCount} recurso{totalCount === 1 ? "" : "s"} publicado
              {totalCount === 1 ? "" : "s"} para toda la unidad.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
