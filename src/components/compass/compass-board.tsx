"use client";

import { useState } from "react";
import { Compass, History, Lock, Sparkles, UsersRound } from "lucide-react";

import { CatalogAdoptForm } from "@/components/compass/catalog-adopt-form";
import { ConsensusRequestForm } from "@/components/compass/consensus-request-form";
import { CustomObjectiveForm } from "@/components/compass/custom-objective-form";
import { ObjectiveSharingForm, ObjectiveStatusForm } from "@/components/compass/objective-status-form";
import { ObjectiveTextForm } from "@/components/compass/objective-text-form";
import { ReflectionForm } from "@/components/compass/reflection-form";
import type {
  CatalogTemplateView,
  ObjectiveView,
  SharedNoteView,
  SharedObjectiveView,
  SharedReflectionView,
} from "@/components/compass/types";
import { Badge } from "@/components/ui/badge";
import {
  COMPASS_AREAS,
  compassAreaDefinition,
  type CompassAreaKey,
} from "@/features/compass/catalog";
import { compassStatusDefinition } from "@/features/compass/rules";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface CompassBoardProps {
  userId: string;
  objectives: ObjectiveView[];
  templates: Record<string, CatalogTemplateView[]>;
  sharedObjectives: SharedObjectiveView[];
  sharedReflections: SharedReflectionView[];
  sharedNotes: SharedNoteView[];
  communityName: string | null;
  hasAssignedAa: boolean;
}

export function CompassBoard({
  userId,
  objectives,
  templates,
  sharedObjectives,
  sharedReflections,
  sharedNotes,
  communityName,
  hasAssignedAa,
}: CompassBoardProps) {
  const [area, setArea] = useState<CompassAreaKey>("CORPORALIDAD");
  const areaDefinition = compassAreaDefinition(area);
  const areaObjectives = objectives.filter(
    (objective) => objective.area === area,
  );
  const areaTemplates = templates[area] ?? [];

  return (
    <div className="space-y-8">
      <section aria-label="Áreas de Desarrollo">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          {COMPASS_AREAS.map((item) => {
            const count = objectives.filter(
              (objective) => objective.area === item.key,
            ).length;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setArea(item.key)}
                aria-pressed={area === item.key}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                  area === item.key
                    ? "border-anil-800 bg-anil-800 text-white"
                    : "border-line bg-surface text-ink-soft hover:border-anil-300 hover:text-anil-800",
                )}
              >
                {item.label}
                {count > 0 ? (
                  <span className="ml-1.5 text-[10px] opacity-80">({count})</span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {areaDefinition.description}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">
              Mi Brújula · {areaDefinition.label}
            </h2>
            <Badge variant="default">
              {areaObjectives.length} objetivo
              {areaObjectives.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {areaObjectives.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-6 text-center">
              <Compass
                className="mx-auto size-7 text-anil-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-semibold text-ink">
                Aún no tienes objetivos en esta área
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-ink-soft">
                Adopta uno del catálogo o crea el tuyo. Toda la malla está
                disponible desde hoy, sin esperar etapas ni cumplir requisitos.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {areaObjectives.map((objective) => {
                const status = compassStatusDefinition(objective.status);

                return (
                  <li
                    key={objective.id}
                    className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          objective.status === "LOGRADO_EN_VIDA_COTIDIANA"
                            ? "success"
                            : "default"
                        }
                      >
                        {status.label}
                      </Badge>
                      {objective.templateCode ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                          Catálogo · {objective.templateCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                          <Sparkles className="size-3" aria-hidden="true" />
                          Objetivo propio
                        </span>
                      )}
                      {objective.sharedWithCommunity ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-anil-700">
                          <UsersRound className="size-3" aria-hidden="true" />
                          Compartido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-soft">
                          <Lock className="size-3" aria-hidden="true" />
                          Privado
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-relaxed text-ink">
                      {objective.currentText}
                    </p>
                    {objective.terminalObjectiveRef ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                        <span className="font-semibold">Línea terminal: </span>
                        {objective.terminalObjectiveRef}
                      </p>
                    ) : null}

                    <details className="mt-3 rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                      <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-anil-800 marker:text-anil-500">
                        <History className="size-3.5" aria-hidden="true" />
                        Ver historial de versiones ({objective.versions.length})
                      </summary>
                      <ol className="mt-2 space-y-2 border-l border-line pl-3">
                        {objective.versions.map((version, index) => (
                          <li key={version.id} className="text-[11px]">
                            <p className="font-semibold text-ink-soft">
                              {index === 0 ? "Versión inicial" : `Versión ${index + 1}`}
                              <span className="ml-1.5 font-normal">
                                · {formatTimestamp(version.createdAt)}
                              </span>
                            </p>
                            <p className="mt-0.5 leading-relaxed text-ink">
                              {version.text}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </details>

                    <div className="mt-3">
                      <ObjectiveStatusForm
                        objectiveId={objective.id}
                        status={objective.status}
                      />
                    </div>

                    <div className="mt-3">
                      <ObjectiveSharingForm
                        objectiveId={objective.id}
                        sharedWithCommunity={objective.sharedWithCommunity}
                      />
                    </div>

                    <div className="mt-3">
                      <ObjectiveTextForm
                        objectiveId={objective.id}
                        currentText={objective.currentText}
                        userId={userId}
                      />
                    </div>

                    <div className="mt-3">
                      <ConsensusRequestForm
                        objectiveId={objective.id}
                        hasAssignedAa={hasAssignedAa}
                      />
                    </div>

                    <div className="mt-4 border-t border-line/70 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                        Mis reflexiones ({objective.reflections.length})
                      </p>
                      {objective.reflections.length === 0 ? (
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Todavía no has escrito reflexiones sobre este objetivo.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {objective.reflections.map((reflection) => (
                            <li
                              key={reflection.id}
                              className="rounded-xl border border-line bg-canvas/40 px-3 py-2"
                            >
                              <p className="text-[10px] text-ink-soft">
                                {formatTimestamp(reflection.createdAt)}
                                {reflection.isCycleSelfEvaluation
                                  ? ` · Autoevaluación de ciclo${
                                      reflection.cycleLabel
                                        ? `: ${reflection.cycleLabel}`
                                        : ""
                                    }`
                                  : ""}
                              </p>
                              <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-ink">
                                {reflection.content}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3">
                        <ReflectionForm objectiveId={objective.id} compact />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <CustomObjectiveForm area={area} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Catálogo referencial · {areaDefinition.label}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              Objetivos intermedios para 15 a 17 años y su horizonte terminal.
              Todo el catálogo está disponible desde el ingreso (RF-BRU-02).
            </p>
          </div>

          <ul className="space-y-3">
            {areaTemplates.map((template) => (
              <li key={template.id}>
                <CatalogAdoptForm template={template} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Reflexión libre de mi Brújula
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          Un espacio para lo que no cabe en un objetivo. Puedes escribir una
          autoevaluación de ciclo y elegir con quién compartirla.
        </p>
        <div className="mt-3">
          <ReflectionForm allowCycle />
        </div>
      </section>

      {sharedObjectives.length > 0 ? (
        <section className="rounded-2xl border border-anil-200 bg-anil-50/40 p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <UsersRound className="size-4 text-anil-700" aria-hidden="true" />
            Objetivos que comparte mi comunidad
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            {communityName
              ? `Compañeros y compañeras de ${communityName} que decidieron compartir su Brújula.`
              : "Compañeros y compañeras que decidieron compartir su Brújula."}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {sharedObjectives.map((objective) => (
              <li
                key={objective.id}
                className="rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-anil-700">
                  {objective.ownerName} ·{" "}
                  {compassAreaDefinition(objective.area as CompassAreaKey).label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  {objective.currentText}
                </p>
                <p className="mt-1 text-[10px] text-ink-soft">
                  {compassStatusDefinition(objective.status).label}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sharedReflections.length > 0 ? (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Reflexiones compartidas por mi comunidad
          </h2>
          <ul className="mt-3 space-y-2">
            {sharedReflections.map((reflection) => (
              <li
                key={reflection.id}
                className="rounded-xl border border-line bg-canvas/40 px-3 py-2"
              >
                <p className="text-[10px] font-semibold text-anil-700">
                  {reflection.ownerName} ·{" "}
                  {formatTimestamp(reflection.createdAt)}
                  {reflection.isCycleSelfEvaluation ? " · Autoevaluación de ciclo" : ""}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-ink">
                  {reflection.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sharedNotes.length > 0 ? (
        <section className="rounded-2xl border border-gold/40 bg-gold-soft/20 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Notas de acompañamiento que mi AA compartió conmigo
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            Son observaciones de acompañamiento, nunca una evaluación ni una
            nota.
          </p>
          <ul className="mt-3 space-y-2">
            {sharedNotes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-gold/30 bg-surface px-3 py-2.5"
              >
                <p className="text-[10px] text-ink-soft">
                  {note.authorName} · {formatTimestamp(note.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
