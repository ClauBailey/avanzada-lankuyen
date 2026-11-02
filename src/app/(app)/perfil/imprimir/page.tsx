import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PrintButton } from "@/components/profile/print-button";
import { buttonVariants } from "@/components/ui/button";
import { loadPortableProfile } from "@/features/profile/export";
import { competencyAreaLabel } from "@/features/projects/rules";
import { requireUser } from "@/server/auth/session";

export const metadata = {
  title: "Mi recorrido · versión imprimible",
};

function formatDay(value: string | null): string {
  if (!value) return "sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}

export default async function PerfilImprimirPage() {
  const user = await requireUser();
  const profile = await loadPortableProfile(user.id);

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-white p-6 text-ink print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          body { background: #fff !important; }
          .print-hidden { display: none !important; }
          .print-card { break-inside: avoid; box-shadow: none !important; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>

      <div className="print-hidden flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/perfil"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft aria-hidden="true" />
          Volver a mi perfil
        </Link>
        <PrintButton />
      </div>

      <header className="space-y-2 border-b border-line pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-anil-700">
          Avanzada Lankuyen · Memoria personal
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          {profile.identity.displayName}
        </h1>
        <p className="text-sm text-ink-soft">
          @{profile.identity.username}
          {profile.identity.community
            ? ` · ${profile.identity.community}`
            : ""}
          {profile.identity.birthDate
            ? ` · nacimiento ${formatDay(profile.identity.birthDate)}`
            : ""}
        </p>
        <p className="text-[11px] text-ink-soft">
          Exportado el {formatDay(profile.exportedAt)} · versión{" "}
          {profile.version} del formato portable.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Mi Brújula
        </h2>
        {profile.compass.objectives.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Todavía no hay objetivos escritos en La Brújula.
          </p>
        ) : (
          <ul className="space-y-3">
            {profile.compass.objectives.map((objective) => (
              <li
                key={objective.id}
                className="print-card rounded-xl border border-line p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-anil-700">
                  {objective.area} · {objective.status}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm font-medium text-ink">
                  {objective.currentText}
                </p>
                {objective.versions.length > 0 ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-anil-700">
                      Historial de redacciones ({objective.versions.length})
                    </summary>
                    <ol className="mt-2 space-y-1.5 border-l border-line pl-3">
                      {objective.versions.map((version, index) => (
                        <li key={`${objective.id}-${index}`}>
                          <p className="text-[10px] uppercase tracking-wide text-ink-soft">
                            Versión {index + 1} ·{" "}
                            {formatDay(version.createdAt)}
                          </p>
                          <p className="whitespace-pre-line text-xs text-ink">
                            {version.text}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Reflexiones
        </h2>
        {profile.compass.reflections.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Todavía no hay reflexiones escritas.
          </p>
        ) : (
          <ul className="space-y-2">
            {profile.compass.reflections.map((reflection) => (
              <li
                key={reflection.id}
                className="print-card rounded-xl border border-line p-3"
              >
                <p className="text-[10px] uppercase tracking-wide text-ink-soft">
                  {formatDay(reflection.createdAt)}
                  {reflection.isCycleSelfEvaluation
                    ? ` · autoevaluación ${reflection.cycleLabel ?? "de ciclo"}`
                    : ""}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {reflection.content}
                </p>
                {reflection.consensusNote ? (
                  <p className="mt-1 text-xs text-ink-soft">
                    Nota de consenso: {reflection.consensusNote}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Camino simbólico y Promesa
        </h2>
        {profile.journey.milestones.length === 0 &&
        !profile.journey.promise ? (
          <p className="text-sm text-ink-soft">
            Todavía no hay hitos ni Promesa registrados.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {profile.journey.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="print-card rounded-xl border border-line p-3"
                >
                  <p className="text-sm font-semibold text-ink">
                    {milestone.moment} · {formatDay(milestone.occurredAt)}
                  </p>
                  {milestone.place ? (
                    <p className="text-[11px] text-ink-soft">
                      {milestone.place}
                    </p>
                  ) : null}
                  {milestone.story ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-ink">
                      {milestone.story}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {profile.journey.promise ? (
              <div className="print-card rounded-xl border border-line p-3">
                <p className="text-sm font-semibold text-ink">
                  Promesa · {profile.journey.promise.status}
                </p>
                {profile.journey.promise.desiredPlace ? (
                  <p className="text-[11px] text-ink-soft">
                    Lugar elegido: {profile.journey.promise.desiredPlace}
                  </p>
                ) : null}
                {profile.journey.promise.motivation ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {profile.journey.promise.motivation}
                  </p>
                ) : null}
                {profile.journey.promise.story ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">
                    {profile.journey.promise.story}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Competencias y logros
        </h2>
        {profile.competencies.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Todavía no hay competencias reconocidas.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {profile.competencies.map((competency) => (
              <li
                key={competency.id}
                className="print-card rounded-lg border border-line px-3 py-2 text-sm text-ink"
              >
                <span className="font-semibold">{competency.name}</span>
                {competency.competencyArea
                  ? ` · ${competencyAreaLabel(competency.competencyArea)}`
                  : ""}
                {competency.grantedAt
                  ? ` · ${formatDay(competency.grantedAt)}`
                  : ""}
                {competency.isActive ? "" : " · revocada"}
              </li>
            ))}
          </ul>
        )}

        {profile.achievements.length > 0 ? (
          <ul className="space-y-1.5">
            {profile.achievements.map((achievement) => (
              <li
                key={achievement.code}
                className="print-card rounded-lg border border-line px-3 py-2 text-sm text-ink"
              >
                <span className="font-semibold">{achievement.title}</span> ·{" "}
                {formatDay(achievement.unlockedAt)}
                <span className="text-[11px] text-ink-soft">
                  {" "}
                  · {achievement.description}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Páginas de bitácora
        </h2>
        {profile.logbook.pages.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Todavía no has escrito páginas en la bitácora.
          </p>
        ) : (
          <ul className="space-y-2">
            {profile.logbook.pages.map((page) => (
              <li
                key={page.id}
                className="print-card rounded-xl border border-line p-3"
              >
                <p className="text-sm font-semibold text-ink">
                  {page.title}
                  {page.pageNumber ? ` · pág. ${page.pageNumber}` : ""}
                </p>
                <p className="text-[11px] text-ink-soft">
                  {formatDay(page.adventureDate)} · {page.status}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">
                  {page.contentMd}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-line pt-4 text-[11px] leading-relaxed text-ink-soft">
        Este documento reúne tu recorrido en la Avanzada Lankuyen. La Brújula,
        sus versiones y cada reflexión te pertenecen. Si solicitas el Paso al
        Clan, el Equipo Adulto te acompañará y podrás conservar esta memoria.
      </footer>
    </div>
  );
}
