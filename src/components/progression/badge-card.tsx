"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarCheck2, Lock, MessageSquareQuote, Quote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatFullDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface BadgeView {
  id: string;
  code: string;
  name: string;
  description: string;
  imagePath: string;
  category: "ETAPA" | "COMPETENCIA" | "PROMESA";
}

export interface BadgeGrantView {
  grantedAt: string;
  note: string | null;
}

interface BadgeCardProps {
  badge: BadgeView;
  grant?: BadgeGrantView | null;
  imageSize?: number;
  variant?: "default" | "featured";
  className?: string;
}

export function BadgeCard({
  badge,
  grant,
  imageSize = 88,
  variant = "default",
  className,
}: BadgeCardProps) {
  const obtained = Boolean(grant);
  const [noteOpen, setNoteOpen] = useState(false);
  const featured = variant === "featured";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 transition-colors",
        obtained
          ? "border-anil-200 bg-surface shadow-card"
          : "border-dashed border-line bg-canvas/50",
        featured && "sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        className,
      )}
    >
      {obtained ? (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-anil-700 via-anil-400 to-gold"
          aria-hidden="true"
        />
      ) : null}

      <div
        className={cn(
          "relative shrink-0 self-start",
          featured && "sm:self-center",
        )}
      >
        <Image
          src={badge.imagePath}
          alt={badge.name}
          width={featured ? imageSize * 1.25 : imageSize}
          height={featured ? imageSize * 1.25 : imageSize}
          unoptimized
          className={cn(
            "rounded-full transition-[filter,opacity]",
            obtained ? "opacity-100" : "grayscale opacity-40",
          )}
        />
        {!obtained ? (
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-sm">
            <Lock className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Pendiente</span>
          </span>
        ) : null}
      </div>

      <div className={cn("mt-3 min-w-0 flex-1", featured && "sm:mt-0")}>
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "font-display font-semibold text-ink",
              featured ? "text-xl" : "text-base",
            )}
          >
            {badge.name}
          </h3>
          {obtained ? (
            <Badge variant="gold">Obtenida</Badge>
          ) : (
            <Badge variant="outline">Pendiente</Badge>
          )}
        </div>

        <p
          className={cn(
            "mt-1 text-xs leading-relaxed text-ink-soft",
            featured ? "text-sm" : "line-clamp-3",
          )}
        >
          {badge.description}
        </p>

        {obtained && grant ? (
          <div className="mt-3 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-anil-800">
              <CalendarCheck2 className="size-3.5" aria-hidden="true" />
              Otorgada el {formatFullDate(grant.grantedAt)}
            </p>

            {grant.note ? (
              <div>
                <button
                  type="button"
                  onClick={() => setNoteOpen((current) => !current)}
                  aria-expanded={noteOpen}
                  title={grant.note}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold-soft/40 px-2 py-1 text-[11px] font-semibold text-[#7a5a16] transition-colors hover:bg-gold-soft/70"
                >
                  <MessageSquareQuote className="size-3.5" aria-hidden="true" />
                  {noteOpen ? "Ocultar dedicatoria" : "Leer dedicatoria"}
                </button>

                <p
                  className={cn(
                    "mt-2 rounded-lg border-l-2 border-gold/50 bg-gold-soft/25 px-3 py-2 text-xs italic leading-relaxed text-ink",
                    !noteOpen && "hidden",
                  )}
                >
                  <Quote className="mr-1 inline size-3 text-gold" aria-hidden="true" />
                  {grant.note}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-ink-soft/70">
            Tu Adulto Acompañante puede otorgarla cuando estés preparado/a.
          </p>
        )}
      </div>
    </article>
  );
}
