import { CalendarCheck2, Compass, Flag, MapPin, Quote, Sparkles, Users } from "lucide-react";

import { PromiseForm, type PromiseView } from "@/components/journey/promise-form";
import {
  MilestoneForm,
  type MilestoneView,
} from "@/components/journey/milestone-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatFullDate } from "@/lib/dates";
import {
  PROMISE_FORMULAS,
  SYMBOLIC_MOMENTS,
  type SymbolicMomentKey,
} from "@/lib/symbolic-path";

interface JourneyViewProps {
  milestones: Partial<Record<SymbolicMomentKey, MilestoneView>>;
  promise: PromiseView | null;
  targetUserId?: string;
  /** La persona dueña del camino o un AA pueden registrar hitos. */
  canEdit: boolean;
  /** Nombre visible para encabezar el recorrido. */
  displayName: string;
}

export function JourneyView({
  milestones,
  promise,
  targetUserId,
  canEdit,
  displayName,
}: JourneyViewProps) {
  return (
    <ol className="relative space-y-5">
      <span
        className="absolute bottom-12 left-[19px] top-12 w-px bg-gradient-to-b from-anil-700 via-anil-300 to-gold/70"
        aria-hidden="true"
      />

      {SYMBOLIC_MOMENTS.map((moment, index) => {
        const milestone = milestones[moment.key] ?? null;
        const isPromise = moment.key === "PROMESA";
        const Icon = isPromise ? Flag : index === 0 ? Sparkles : Compass;

        return (
          <li key={moment.key} className="relative pl-12 sm:pl-16">
            <span className="absolute left-0 top-5 z-10 flex size-10 items-center justify-center rounded-full border border-gold/50 bg-anil-900 text-gold shadow-sm">
              <Icon className="size-4" aria-hidden="true" />
            </span>

            <Card className="overflow-hidden">
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                    Momento {index + 1} · {moment.subtitle}
                  </p>
                  {milestone || (isPromise && promise?.status === "CELEBRADA") ? (
                    <Badge variant="gold">Vivido</Badge>
                  ) : isPromise && promise?.status === "SOLICITADA" ? (
                    <Badge variant="warning">Solicitada</Badge>
                  ) : (
                    <Badge variant="outline">Abierto</Badge>
                  )}
                </div>

                <h3 className="mt-1 font-display text-xl font-semibold text-ink">
                  {moment.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {moment.description}
                </p>

                {milestone ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-gold/30 bg-gold-soft/20 px-3.5 py-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-anil-800">
                      <CalendarCheck2 className="size-3.5" aria-hidden="true" />
                      {milestone.occurredAt
                        ? formatFullDate(milestone.occurredAt)
                        : "Fecha por registrar"}
                      {milestone.place ? ` · ${milestone.place}` : ""}
                    </p>
                    {milestone.accompaniedBy ? (
                      <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                        <Users className="size-3.5" aria-hidden="true" />
                        Acompañó: {milestone.accompaniedBy}
                      </p>
                    ) : null}
                    {milestone.story ? (
                      <p className="whitespace-pre-line text-sm italic leading-relaxed text-ink">
                        <Quote
                          className="mr-1 inline size-3 text-gold"
                          aria-hidden="true"
                        />
                        {milestone.story}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {isPromise ? (
                  <div className="mt-4 space-y-4">
                    {promise?.status === "CELEBRADA" && promise.formula ? (
                      <div className="rounded-xl border border-gold/30 bg-gold-soft/20 px-3.5 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                          Fórmula pronunciada
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {
                            PROMISE_FORMULAS.find(
                              (formula) => formula.key === promise.formula,
                            )?.label
                          }
                        </p>
                        {promise.celebrationPlace ? (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {promise.celebrationPlace}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {canEdit ? (
                      <div className="space-y-4 border-t border-line/70 pt-4">
                        {promise?.status !== "CELEBRADA" ? (
                          <div>
                            <p className="font-display text-sm font-semibold text-ink">
                              Preparar la ceremonia de {displayName}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                              Elige la fórmula y comparte tu reflexión. El
                              Equipo Adulto recibirá el aviso para acompañar.
                            </p>
                            <div className="mt-3">
                              <PromiseForm
                                mode="request"
                                targetUserId={targetUserId}
                                initial={promise}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <p className="font-display text-sm font-semibold text-ink">
                            {promise?.status === "CELEBRADA"
                              ? "Actualizar el registro de la Promesa"
                              : "Registrar la Promesa ya celebrada"}
                          </p>
                          <div className="mt-3">
                            <PromiseForm
                              mode="celebrate"
                              targetUserId={targetUserId}
                              initial={promise}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : canEdit ? (
                  <div className="mt-4">
                    <MilestoneForm
                      moment={moment.key as Exclude<SymbolicMomentKey, "PROMESA">}
                      targetUserId={targetUserId}
                      initial={milestone}
                      defaultOpen={!milestone && moment.key === "BIENVENIDA_INVESTIDURA"}
                    />
                  </div>
                ) : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
