import { MessageSquareText } from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import {
  areaAverages,
  EVALUATION_AREAS,
  formatEvaluationScore,
  overallEvaluationAverage,
  type EvaluationScores,
} from "@/lib/evaluations";
import { cn } from "@/lib/utils";

export interface EvaluationResultItem {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  community: { name: string; color: string | null } | null;
  scores: EvaluationScores;
  comment: string | null;
  updatedAt: Date;
}

interface EvaluationResultsProps {
  evaluations: EvaluationResultItem[];
  expectedCount: number;
}

export function EvaluationResults({
  evaluations,
  expectedCount,
}: EvaluationResultsProps) {
  const averages = areaAverages(evaluations.map((item) => item.scores));
  const overall = overallEvaluationAverage(
    evaluations.map((item) => item.scores),
  );
  const pending = Math.max(expectedCount - evaluations.length, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Evaluadores esperados
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {expectedCount}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            PP y coordinadores activos
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Respuestas recibidas
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {evaluations.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Evaluaciones guardadas</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Por responder
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {pending}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Sin evaluación</p>
        </Card>
        <Card className="border-anil-200 bg-anil-50/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-800">
            Promedio general
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {formatEvaluationScore(overall)}
            <span className="ml-1 text-sm font-medium text-ink-soft">/ 7</span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Sobre las seis áreas de desarrollo
          </p>
        </Card>
      </section>

      <Card className="p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Promedios por área
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            Cómo se vivió la actividad
          </h2>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EVALUATION_AREAS.map((area) => (
            <div
              key={area.key}
              className="rounded-xl border border-line bg-canvas/40 px-4 py-3"
            >
              <dt className="text-xs font-semibold text-ink">{area.label}</dt>
              <dd className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-2xl font-semibold text-anil-800">
                  {formatEvaluationScore(averages[area.key])}
                </span>
                <span className="text-[11px] text-ink-soft">/ 7</span>
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Respuestas de PP y coordinadores
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Cada evaluación muestra las seis áreas y el comentario escrito.
            </p>
          </div>
          <span className="text-xs text-ink-soft">
            {evaluations.length} respuesta
            {evaluations.length === 1 ? "" : "s"}
          </span>
        </div>

        {evaluations.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-6">
            <EmptyState
              icon={MessageSquareText}
              title="Aún no hay evaluaciones"
              description="Cuando los PP o coordinadores respondan después del término de la actividad, sus respuestas aparecerán aquí."
              className="border-0 bg-transparent p-0"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {evaluation.firstName} {evaluation.lastName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                      <span>@{evaluation.username}</span>
                      {evaluation.community ? (
                        <CommunityTag
                          name={evaluation.community.name}
                          color={evaluation.community.color}
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    Actualizada el {formatTimestamp(evaluation.updatedAt)}
                  </p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                  {EVALUATION_AREAS.map((area) => (
                    <div
                      key={area.key}
                      className={cn(
                        "rounded-xl border border-line bg-canvas/40 px-3 py-2",
                      )}
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                        {area.label}
                      </dt>
                      <dd className="mt-0.5 font-display text-xl font-semibold text-ink">
                        {evaluation.scores[area.key]}
                        <span className="ml-0.5 text-[10px] font-medium text-ink-soft">
                          /7
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Evaluación escrita
                  </p>
                  {evaluation.comment ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                      {evaluation.comment}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-ink-soft">
                      Sin comentario escrito.
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
