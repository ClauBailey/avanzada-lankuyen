import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Compass,
  Eye,
  History,
  Lock,
  MessageSquare,
  NotebookPen,
  UsersRound,
} from "lucide-react";

import { MentoringNoteForm } from "@/components/compass/mentoring-note-form";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { compassAreaDefinition, type CompassAreaKey } from "@/features/compass/catalog";
import { compassStatusDefinition } from "@/features/compass/rules";
import { canReadCommunityLogEntry } from "@/lib/community-log-rules";
import { formatTimestamp } from "@/lib/dates";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Brújula acompañada",
};

export default async function AcompanamientoDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requirePermission("mentoring:note");
  const { userId } = await params;

  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { in: ["PP", "COORDINADOR"] },
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      username: true,
      role: true,
      isActive: true,
      assignedAaId: true,
      community: { select: { id: true, name: true, color: true } },
    },
  });

  // Un AA no asignado recibe 404: ninguna vista expone Brújulas ajenas.
  if (!student || student.assignedAaId !== user.id) {
    notFound();
  }

  const [objectives, notes, communityEntries] = await Promise.all([
    prisma.userCompassObjective.findMany({
      where: { userId: student.id },
      orderBy: [{ area: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        area: true,
        currentText: true,
        status: true,
        sharedWithCommunity: true,
        terminalObjectiveRef: true,
        template: { select: { code: true, intermediateObjective: true } },
        versions: {
          orderBy: { createdAt: "asc" },
          select: { id: true, text: true, createdAt: true },
        },
        reflections: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            cycleLabel: true,
            isCycleSelfEvaluation: true,
            sharedWithAa: true,
            sharedWithCommunity: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.mentoringNote.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        sharedWithStudent: true,
        createdAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            preferredName: true,
          },
        },
      },
    }),
    student.community
      ? prisma.communityLogEntry.findMany({
          where: { communityId: student.community.id, sharedWithAa: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            content: true,
            authorNameSnapshot: true,
            communityId: true,
            authorId: true,
            sharedWithAa: true,
            sharedWithCoordinators: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const visibleEntries = communityEntries.filter((entry) =>
    canReadCommunityLogEntry(
      { id: user.id, role: user.role, communityId: null },
      entry,
      { aaAccompaniesCommunity: true },
    ),
  );

  const achievements = objectives.filter(
    (objective) => objective.status === "LOGRADO_EN_VIDA_COTIDIANA",
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href="/acompanamiento"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jóvenes que acompaño
      </Link>

      <PageHeader
        eyebrow="Acompañamiento privado 1 a 1"
        title={`La Brújula de ${getDisplayName(student)}`}
        description="Lectura en modo solo lectura. La Brújula y su autoevaluación pertenecen exclusivamente a la o el joven; tu rol es acompañar, nunca aprobar ni corregir objetivos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Eye className="size-3.5" aria-hidden="true" />
              Solo lectura
            </Badge>
            <Badge variant="gold">
              <Compass className="size-3.5" aria-hidden="true" />
              {achievements} logrado{achievements === 1 ? "" : "s"}
            </Badge>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <span>@{student.username}</span>
        {student.community ? (
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="size-3.5" aria-hidden="true" />
            {student.community.name}
          </span>
        ) : (
          <span>Sin comunidad asignada</span>
        )}
        {!student.isActive ? <Badge variant="warning">Cuenta inactiva</Badge> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Objetivos y autoevaluación
          </h2>

          {objectives.length === 0 ? (
            <Card className="border-dashed bg-surface/70 p-6 text-center">
              <Compass className="mx-auto size-7 text-anil-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-ink">
                Aún no ha adoptado objetivos
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                La Brújula se abre desde su propio ingreso, sin esperar a nadie.
              </p>
            </Card>
          ) : (
            <ul className="space-y-4">
              {objectives.map((objective) => (
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
                      {compassStatusDefinition(objective.status).label}
                    </Badge>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                      {compassAreaDefinition(objective.area as CompassAreaKey).label}
                      {objective.template ? ` · ${objective.template.code}` : " · Propio"}
                    </span>
                    {objective.sharedWithCommunity ? (
                      <span className="text-[10px] font-semibold text-anil-700">
                        Compartido con su comunidad
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
                  {objective.template &&
                  objective.template.intermediateObjective !==
                    objective.currentText ? (
                    <p className="mt-1.5 rounded-lg border border-anil-200 bg-anil-50/60 px-2.5 py-2 text-[11px] leading-relaxed text-anil-900">
                      <span className="font-semibold">
                        Propuesta referencial del Manual:{" "}
                      </span>
                      {objective.template.intermediateObjective}
                    </p>
                  ) : null}

                  <details className="mt-3 rounded-xl border border-line bg-canvas/40 px-3 py-2.5">
                    <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-anil-800 marker:text-anil-500">
                      <History className="size-3.5" aria-hidden="true" />
                      Historial de versiones ({objective.versions.length})
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

                  {objective.reflections.length > 0 ? (
                    <div className="mt-3 border-t border-line/70 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                        Reflexiones
                      </p>
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
                              {reflection.sharedWithAa ? "" : " · Privada"}
                            </p>
                            <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-ink">
                              {reflection.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {visibleEntries.length > 0 ? (
            <section className="rounded-2xl border border-anil-200 bg-anil-50/40 p-5">
              <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <BookOpenCheck className="size-4 text-anil-700" aria-hidden="true" />
                Bitácora de comunidad compartida
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                Solo las entradas que la comunidad decidió compartir con su AA.
                Las demás siguen siendo privadas del grupo.
              </p>
              <ul className="mt-3 space-y-2">
                {visibleEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-line bg-surface px-3 py-2.5"
                  >
                    <p className="text-[10px] text-ink-soft">
                      {entry.authorNameSnapshot} · {formatTimestamp(entry.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-ink-soft">
                      {entry.content}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>

        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <NotebookPen className="size-4 text-anil-700" aria-hidden="true" />
              Nueva nota de acompañamiento
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              Escribe una observación positiva. Decide si queda privada o si se
              comparte con la o el joven. Nunca es una evaluación ni una nota.
            </p>
            <div className="mt-3">
              <MentoringNoteForm studentId={student.id} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <MessageSquare className="size-4 text-anil-700" aria-hidden="true" />
              Historial de notas ({notes.length})
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              Solo tú puedes leer este historial completo. La o el joven ve únicamente
              las notas que compartas con él.
            </p>

            {notes.length === 0 ? (
              <p className="mt-3 text-[11px] text-ink-soft">
                Todavía no has escrito notas para esta persona joven.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-line bg-canvas/40 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] text-ink-soft">
                        {formatTimestamp(note.createdAt)}
                        {note.author
                          ? ` · ${getDisplayName(note.author)}`
                          : ""}
                      </p>
                      <Badge variant={note.sharedWithStudent ? "success" : "outline"}>
                        {note.sharedWithStudent ? "Compartida" : "Privada"}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-ink">
                      {note.content}
                    </p>
                    <div className="mt-2">
                      <MentoringNoteForm
                        studentId={student.id}
                        noteId={note.id}
                        initialContent={note.content}
                        initialShared={note.sharedWithStudent}
                        compact
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-dashed bg-canvas/50 p-4">
            <p className="text-[11px] leading-relaxed text-ink-soft">
              Si la o el joven cambia de AA encargado, este historial se transfiere
              limpiamente al nuevo encargado porque las notas se consultan por
              y se validan contra el <code>assignedAaId</code> vigente.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
