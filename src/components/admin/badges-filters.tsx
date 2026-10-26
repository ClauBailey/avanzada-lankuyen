"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CommunityOption {
  id: string;
  name: string;
}

interface BadgesFiltersProps {
  communities: CommunityOption[];
}

export function BadgesFilters({ communities }: BadgesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const community = searchParams.get("community") ?? "";

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

  const hasFilters = Boolean(query || community);

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-card transition-opacity sm:p-5",
        pending && "opacity-60",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-end">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q");
            apply({ q: typeof value === "string" ? value.trim() : "" });
          }}
          className="space-y-2"
        >
          <Label htmlFor="badges-search">Buscar pionero/a</Label>
          <div className="flex gap-2">
            <Input
              id="badges-search"
              name="q"
              defaultValue={query}
              placeholder="Nombre, apellido o @usuario"
              autoComplete="off"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
              <Search aria-hidden="true" />
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <Label htmlFor="badges-community">Comunidad</Label>
          <Select
            id="badges-community"
            value={community}
            onChange={(event) => apply({ community: event.target.value })}
          >
            <option value="">Todas</option>
            {communities.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => router.replace(pathname))}
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
