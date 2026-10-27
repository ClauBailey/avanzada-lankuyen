import Link from "next/link";
import { BookOpen, Clock3, Feather, PencilLine, ShieldCheck } from "lucide-react";

import {
  LogbookBook,
  type LogbookPageView,
} from "@/components/logbook/logbook-book";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/dates";
import { logbookStatusLabel } from "@/lib/logbook";
import { can } from "@/server/rbac/can";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "La Bitácora",
};

export default async function BitacoraPage() {
  const user = await requirePermission("logbook:view");

  const [entries, keeper, ownEntries] = await Promise.all([
    prisma.logbookEntry.findMany({
      where: { status: "PUBLICADA", deletedAt: null },
      orderBy: [{ pageNumber: "asc" }, { adventureDate: "asc" }],
      select: {
        id: true,
        pageNumber: true,
        title: true,
        adventureDate: true,
        contentMd: true,
        photoFileId: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            community: { select: { name: true } },
          },
        },
      },
    }),
    prisma.user.findFirst({
      where: { isLogbookKeeper: true, isActive: true, deletedAt: null },
      select: { firstName: true, lastName: true },
    }),
    prisma.logbookEntry.findMany({
      where: {
        authorId: user.id,
        deletedAt: null,
        status: { in: ["PENDIENTE_APROBACION", "RECHAZADA"] },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        adventureDate: true,
        rejectionReason: true,
      },
    }),
  ]);

  const pages: LogbookPageView[] = entries.map((entry) => ({
    id: entry.id,
    pageNumber: entry.pageNumber ?? 0,
    title: entry.title,
    adventureDate: entry.adventureDate.toISOString(),
    contentMd: entry.contentMd,
    authorName: `${entry.author.firstName} ${entry.author.lastName}`,
    communityName: entry.author.community?.name ?? null,
    photoFileId: entry.photoFileId,
  }));

  const canReview = can(user, "logbook:review");
  const canWrite = can(user, "logbook:create");

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-anil-950 px-5 py-6 text-white shadow-float sm:px-8 sm:py-7">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-70" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/15 text-gold">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-anil-200/70">
                El libro de la unidad
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
                La Bitácora de la Avanzada Lankuyen
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-anil-100/75 sm:text-sm">
                Un cuaderno vivo que guarda las aventuras, los desafíos y las
                huellas que vamos dejando juntos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canReview ? (
              <Link
                href="/bitacora/revision"
                className={buttonVariants({ variant: "gold", size: "sm" })}
              >
                <ShieldCheck aria-hidden="true" />
                Revisar páginas
              </Link>
            ) : null}
            {canWrite ? (
              <Link
                href="/bitacora/nueva"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className:
                    "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15",
                })}
              >
                <Feather aria-hidden="true" />
                Escribir una página
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <LogbookBook
        entries={pages}
        keeperName={
          keeper ? `${keeper.firstName} ${keeper.lastName}` : null
        }
        canReview={canReview}
        canWrite={canWrite}
        reviewHref="/bitacora/revision"
      />

      {ownEntries.length > 0 ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                Tus páginas en camino
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                Propuestas que aún no están en el libro
              </h2>
            </div>
            <Badge variant="outline">
              {ownEntries.length} página{ownEntries.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <ul className="mt-4 divide-y divide-line/70">
            {ownEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{entry.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                    <span>{formatDateOnly(entry.adventureDate)}</span>
                    <Badge
                      variant={
                        entry.status === "RECHAZADA" ? "danger" : "warning"
                      }
                    >
                      {entry.status === "RECHAZADA" ? (
                        <PencilLine className="size-3" aria-hidden="true" />
                      ) : (
                        <Clock3 className="size-3" aria-hidden="true" />
                      )}
                      {logbookStatusLabel(entry.status)}
                    </Badge>
                  </p>
                  {entry.rejectionReason ? (
                    <p className="mt-2 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-900">
                      <strong className="font-semibold">Motivo:</strong>{" "}
                      {entry.rejectionReason}
                    </p>
                  ) : null}
                </div>

                {entry.status === "RECHAZADA" ? (
                  <Link
                    href={`/bitacora/${entry.id}/editar`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    <PencilLine aria-hidden="true" />
                    Corregir y reenviar
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
