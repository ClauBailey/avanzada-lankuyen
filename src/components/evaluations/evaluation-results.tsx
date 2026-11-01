import { Compass, MessageSquareText } from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import {
  areaFrequency,
  DEVELOPMENT_AREAS,
  levelDefinition,
  levelDistribution,
  type DevelopmentAreaKey,
  type ObjectiveAchievementLevel,
} from "@/lib/evaluations";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/user-display";

export interface EvaluationResultItem {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  username: string;
  community: { name: string; color: string | null } | null;
  objectiveAchievementLevel: ObjectiveAchievementLevel;
  experiencedAreas: DevelopmentAreaKey[];
  organizationFeedback: string | null;
  emotionalResonance: string | null;
  learningsForNextTime: string | null;
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
  const distribution = levelDistribution(evaluations);
  const areas = areaFrequency(evaluations);
  const pending = Math.max(expectedCount - evaluations.length, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Evaluadores esperados
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {expectedCount}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Participantes habilitados para observar
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Observaciones recibidas
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {evaluations.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Voces guardadas</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Por responder
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {pending}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Sin observación todavía</p>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Distribución del logro
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            ¿Cómo se alcanzaron los objetivos?
          </h2>

          <ul className="mt-4 space-y-2.5">
            {distribution.map((level) => (
              <li
                key={level.key}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5",
                  level.className,
                )}
              >
                <span className="text-xs font-semibold">{level.label}</span>
                <span className="font-display text-xl font-semibold">
                  {level.count}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
            Son conteos de observaciones, no promedios ni notas.
          </p>
        </Card>

        <Card className="p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            <Compass className="size-3.5" aria-hidden="true" />
            Áreas presentes
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            Lo que se hizo presente en el grupo
          </h2>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            {areas.map((area) => (
              <div
                key={area.key}
                className="rounded-xl border border-line bg-canvas/40 px-3 py-2"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  {area.label}
                </dt>
                <dd className="mt-0.5 font-display text-xl font-semibold text-ink">
                  {area.count}
                  <span className="ml-1 text-[10px] font-medium text-ink-soft">
                    {area.count === 1 ? "vez" : "veces"}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Muro de reflexiones
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Las palabras de quienes participaron, sin notas ni comparaciones.
            </p>
          </div>
          <span className="text-xs text-ink-soft">
            {evaluations.length} reflexión
            {evaluations.length === 1 ? "" : "es"}
          </span>
        </div>

        {evaluations.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-6">
            <EmptyState
              icon={MessageSquareText}
              title="Aún no hay observaciones"
              description="Cuando los participantes respondan después del término de la actividad, sus reflexiones aparecerán aquí."
              className="border-0 bg-transparent p-0"
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {evaluations.map((evaluation) => {
              const level = levelDefinition(
                evaluation.objectiveAchievementLevel,
              );

              return (
                <Card key={evaluation.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-ink">
                        {getDisplayName(evaluation)}
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
                      {formatTimestamp(evaluation.updatedAt)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        level.className,
                      )}
                    >
                      {level.label}
                    </span>
                    {evaluation.experiencedAreas.length > 0 ? (
                      evaluation.experiencedAreas.map((areaKey) => {
                        const area = DEVELOPMENT_AREAS.find(
                          (item) => item.key === areaKey,
                        );
                        return (
                          <span
                            key={areaKey}
                            className="rounded-full border border-line bg-canvas/60 px-2.5 py-0.5 text-[10px] font-semibold text-ink-soft"
                          >
                            {area?.label ?? areaKey}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-ink-soft">
                        Sin áreas marcadas
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <ReflectionBlock
                      label="Organización y logística"
                      text={evaluation.organizationFeedback}
                    />
                    <ReflectionBlock
                      label="Clima y resonancia emocional"
                      text={evaluation.emotionalResonance}
                    />
                    <ReflectionBlock
                      label="Aprendizajes para la próxima vez"
                      text={evaluation.learningsForNextTime}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReflectionBlock({
  label,
  text,
}: {
  label: string;
  text: string | null;
}) {
  if (!text) return null;

  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
        {text}
      </p>
    </div>
  );
}
