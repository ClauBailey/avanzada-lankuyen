import Link from "next/link";
import { ArrowLeft, BookOpen, Inbox, ShieldCheck } from "lucide-react";

import {
  LogbookReviewCard,
  ReviewedLogbookCard,
  type ReviewEntryView,
} from "@/components/logbook/logbook-review-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Revisión de La Bitácora",
};

export default async function RevisionBitacoraPage() {
  const user = await requirePermission("logbook:review");

  const [pending, reviewed] = await Promise.all([
    prisma.logbookEntry.findMany({
      where: { status: "PENDIENTE_APROBACION", deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        adventureDate: true,
        contentMd: true,
        photoFileId: true,
        createdAt: true,
        status: true,
        pageNumber: true,
        rejectionReason: true,
        reviewedAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            community: { select: { name: true } },
          },
        },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.logbookEntry.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PUBLICADA", "RECHAZADA"] },
        reviewedById: { not: null },
      },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        adventureDate: true,
        contentMd: true,
        photoFileId: true,
        createdAt: true,
        status: true,
        pageNumber: true,
        rejectionReason: true,
        reviewedAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            community: { select: { name: true } },
          },
        },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const toView = (entry: (typeof pending)[number]): ReviewEntryView => ({
    id: entry.id,
    title: entry.title,
    adventureDate: entry.adventureDate.toISOString(),
    contentMd: entry.contentMd,
    photoFileId: entry.photoFileId,
    submittedAt: entry.createdAt.toISOString(),
    authorName: `${entry.author.firstName} ${entry.author.lastName}`,
    authorUsername: entry.author.username,
    communityName: entry.author.community?.name ?? null,
    status: entry.status,
    pageNumber: entry.pageNumber,
    rejectionReason: entry.rejectionReason,
    reviewedByName: entry.reviewedBy
      ? `${entry.reviewedBy.firstName} ${entry.reviewedBy.lastName}`
      : null,
    reviewedAt: entry.reviewedAt?.toISOString() ?? null,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/bitacora"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden="true" />
        Volver al libro
      </Link>

      <PageHeader
        eyebrow="Moderación"
        title="Revisión de La Bitácora"
        description="Lee cada página propuesta y decide si ya está lista para sumarse al libro de la unidad. Al aprobar, recibe su número correlativo. Al rechazar, el autor recibe tu motivo para corregirla."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink-soft">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {user.isLogbookKeeper ? "Guardián de La Bitácora" : "Adulto Acompañante"}
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="font-display text-3xl font-semibold text-ink">{pending.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Pendiente{pending.length === 1 ? "" : "s"} de revisión
          </p>
        </Card>
        <Card className="p-4 sm:col-span-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink">
            <BookOpen className="size-4 text-gold" aria-hidden="true" />
            Aprobar una página la suma al libro con el siguiente número
            correlativo disponible.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            La foto de una página pendiente solo es visible para su autor, los
            AA y el Guardián. Una vez publicada, toda la unidad puede verla.
          </p>
        </Card>
      </div>

      {pending.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Inbox className="mx-auto size-8 text-anil-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">
            No hay páginas esperando revisión
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            Cuando un Pionero/a o Coordinador/a envíe una página, aparecerá aquí
            junto a su fotografía y su relato completo.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {pending.map((entry) => (
            <LogbookReviewCard key={entry.id} entry={toView(entry)} />
          ))}
        </div>
      )}

      {reviewed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Decisiones recientes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewed.map((entry) => (
              <ReviewedLogbookCard key={entry.id} entry={toView(entry)} />
            ))}
          </div>
        </section>
      ) : null}

      {user.role === "AA" ? (
        <p className="text-xs leading-relaxed text-ink-soft">
          Como AA también puedes administrar el libro y asignar el cargo de
          Guardián desde{" "}
          <Link href="/admin/bitacora" className="font-semibold text-anil-700 underline">
            el panel de La Bitácora
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
