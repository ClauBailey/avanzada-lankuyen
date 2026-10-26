import Image from "next/image";
import { CalendarCheck2, Compass, Lock, Mountain, Quote } from "lucide-react";

import { ReflectionEditor } from "@/components/progression/reflection-editor";
import type { BadgeGrantView, BadgeView } from "@/components/progression/badge-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatFullDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface StageEntry {
  badge: BadgeView;
  grant: BadgeGrantView | null;
  reflection: {
    content: string;
    updatedAt: string;
  } | null;
}

interface StageTimelineProps {
  stages: StageEntry[];
}

export function StageTimeline({ stages }: StageTimelineProps) {
  return (
    <ol className="relative space-y-5">
      <span
        className="absolute bottom-12 left-[19px] top-12 w-px bg-gradient-to-b from-anil-700 via-anil-300 to-gold/70"
        aria-hidden="true"
      />

      {stages.map((stage, index) => {
        const obtained = Boolean(stage.grant);
        const StageIcon = index === 0 ? Compass : Mountain;

        return (
          <li key={stage.badge.id} className="relative pl-12 sm:pl-16">
            <span
              className={cn(
                "absolute left-0 top-5 z-10 flex size-10 items-center justify-center rounded-full border shadow-sm",
                obtained
                  ? "border-gold/50 bg-anil-900 text-gold"
                  : "border-line bg-surface text-ink-soft",
              )}
            >
              <StageIcon className="size-4" aria-hidden="true" />
            </span>

            <Card className={cn(obtained ? "border-anil-200" : "bg-surface/80")}>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="relative shrink-0 self-start">
                  <Image
                    src={stage.badge.imagePath}
                    alt={stage.badge.name}
                    width={84}
                    height={84}
                    unoptimized
                    className={cn(
                      "rounded-full",
                      obtained ? "opacity-100" : "grayscale opacity-40",
                    )}
                  />
                  {!obtained ? (
                    <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-soft">
                      <Lock className="size-3" aria-hidden="true" />
                      <span className="sr-only">Pendiente</span>
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                    Etapa {index + 1}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {stage.badge.name}
                    </h3>
                    {obtained ? (
                      <Badge variant="gold">Obtenida</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {stage.badge.description}
                  </p>

                  {obtained && stage.grant ? (
                    <div className="mt-3 space-y-2">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-anil-800">
                        <CalendarCheck2 className="size-3.5" aria-hidden="true" />
                        Otorgada el {formatFullDate(stage.grant.grantedAt)}
                      </p>
                      {stage.grant.note ? (
                        <p className="rounded-lg border-l-2 border-gold/50 bg-gold-soft/25 px-3 py-2 text-xs italic leading-relaxed text-ink">
                          <Quote
                            className="mr-1 inline size-3 text-gold"
                            aria-hidden="true"
                          />
                          {stage.grant.note}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-ink-soft/70">
                      Cuando tu AA la otorgue, la imagen se activará a todo color.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-line/70 bg-canvas/40 p-5">
                <ReflectionEditor
                  stageCode={stage.badge.code === "ETAPA_CUMBRE" ? "CUMBRE" : "SENDERO"}
                  stageName={stage.badge.name}
                  initialContent={stage.reflection?.content ?? ""}
                  initialSavedAt={stage.reflection?.updatedAt ?? null}
                />
              </div>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
