import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  Lock,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { CommunityLogEntryForm } from "@/components/communities/community-log-entry-form";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { canAccessCommunityLog } from "@/lib/community-log-rules";
import { formatTimestamp } from "@/lib/dates";
import { prisma } from "@/server/db";
import { requireReadyUser } from "@/server/auth/session";

export const metadata = {
  title: "Bitácora de mi comunidad",
};

export default async function BitacoraComunidadPage() {
  const user = await requireReadyUser();

  // Solo miembros activos de la comunidad. AA y otras comunidades reciben 404.
  if (!canAccessCommunityLog(user, user.communityId)) {
    notFound();
  }

  const community = await prisma.community.findFirst({
    where: { id: user.communityId ?? "", deletedAt: null },
    select: { id: true, name: true, color: true, motto: true },
  });

  if (!community) notFound();

  const entries = await prisma.communityLogEntry.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      authorNameSnapshot: true,
      sharedWithAa: true,
      sharedWithCoordinators: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const sharedWithAa = entries.filter((entry) => entry.sharedWithAa).length;
  const sharedWithCoordinators = entries.filter(
    (entry) => entry.sharedWithCoordinators,
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href="/inicio"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al inicio
      </Link>

      <PageHeader
        eyebrow="Bitácora privada de comunidad"
        title={community.name}
        description="Un espacio libre para los acuerdos, anécdotas, tradiciones y reflexiones de la comunidad. No hay moderación previa de adultos ni del Guardián general."
        actions={
          <Badge variant="default">
            <BookOpenCheck className="size-3.5" aria-hidden="true" />
            {entries.length} entrada{entries.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-anil-200 bg-anil-50/60 px-4 py-3.5">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-anil-700"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Privacidad de la comunidad
          </p>
          <p className="text-sm leading-relaxed text-anil-900">
            Esta bitácora pertenece solo a {community.name}. Ningún AA ni otra
            comunidad puede leerla completa: solo verán las entradas que ustedes
            marquen explícitamente.
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {sharedWithAa} compartida{sharedWithAa === 1 ? "" : "s"} con el AA
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="size-3.5" aria-hidden="true" />
              {sharedWithCoordinators} compartida
              {sharedWithCoordinators === 1 ? "" : "s"} con Coordinadores
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" aria-hidden="true" />
              El resto es privado del grupo
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <BookOpenCheck className="size-4 text-anil-700" aria-hidden="true" />
            Nueva entrada
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            Cualquier miembro activo puede escribir. Los interruptores de
            privacidad son decisiones de la comunidad.
          </p>
          <div className="mt-4">
            <CommunityLogEntryForm />
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Nuestra bitácora
          </h2>

          {entries.length === 0 ? (
            <Card className="border-dashed bg-surface/70 p-8 text-center">
              <BookOpenCheck
                className="mx-auto size-8 text-anil-400"
                aria-hidden="true"
              />
              <p className="mt-3 font-display text-lg font-semibold text-ink">
                La bitácora está en blanco
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
                Escriban el primer acuerdo, anécdota o tradición del grupo. No
                hay nada que esperar ni nadie que deba aprobarlo.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => {
                const isAuthor = entry.authorId === user.id;

                return (
                  <li key={entry.id}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-semibold text-ink">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-soft">
                            {entry.authorNameSnapshot} ·{" "}
                            {formatTimestamp(entry.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {entry.sharedWithAa ? (
                            <Badge variant="default">AA</Badge>
                          ) : null}
                          {entry.sharedWithCoordinators ? (
                            <Badge variant="gold">Coordinadores</Badge>
                          ) : null}
                          {!entry.sharedWithAa && !entry.sharedWithCoordinators ? (
                            <Badge variant="outline">Privada del grupo</Badge>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
                        {entry.content}
                      </p>

                      {isAuthor ? (
                        <CommunityLogEntryForm
                          entryId={entry.id}
                          initialTitle={entry.title}
                          initialContent={entry.content}
                          initialSharedWithAa={entry.sharedWithAa}
                          initialSharedWithCoordinators={
                            entry.sharedWithCoordinators
                          }
                          compact
                        />
                      ) : (
                        <p className="mt-2 text-[10px] text-ink-soft">
                          Escrita por {entry.authorNameSnapshot}. Solo su autor
                          puede editarla.
                        </p>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
