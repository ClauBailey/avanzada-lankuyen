import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3, PencilLine } from "lucide-react";

import { LogbookEntryForm } from "@/components/logbook/logbook-entry-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { can } from "@/server/rbac/can";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Corregir página de La Bitácora",
};

export default async function EditarPaginaBitacoraPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const user = await requirePermission("logbook:create");
  const { entryId } = await params;

  const entry = await prisma.logbookEntry.findFirst({
    where: { id: entryId, authorId: user.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      adventureDate: true,
      contentMd: true,
      activityId: true,
      photoFileId: true,
      rejectionReason: true,
      status: true,
    },
  });

  if (!entry) notFound();

  const activities = await prisma.activity.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      endsAt: { lte: new Date() },
    },
    orderBy: { startsAt: "desc" },
    take: 40,
    select: { id: true, title: true },
  });

  const canReview = can(user, "logbook:review");

  if (entry.status !== "RECHAZADA") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/bitacora"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft aria-hidden="true" />
          Volver a La Bitácora
        </Link>
        <Card className="p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-anil-50 text-anil-700">
            {entry.status === "PUBLICADA" ? (
              <BookOpen className="size-5" aria-hidden="true" />
            ) : (
              <Clock3 className="size-5" aria-hidden="true" />
            )}
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
            {entry.status === "PUBLICADA"
              ? "Esta página ya está en el libro"
              : "Esta página sigue en revisión"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {entry.status === "PUBLICADA"
              ? "Las páginas publicadas no se editan desde aquí. Si necesitas un ajuste, conversa con el Guardián de La Bitácora o con un AA."
              : "Un AA o el Guardián de La Bitácora revisará tu relato. Si necesita cambios, recibirás el motivo y podrás corregirla."}
          </p>
          <Link
            href="/bitacora"
            className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-5" })}
          >
            Ir a La Bitácora
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/bitacora"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden="true" />
        Volver a La Bitácora
      </Link>

      <PageHeader
        eyebrow="Reenviar una página"
        title="Corregir tu página de La Bitácora"
        description="Ajusta lo que pidió la moderación y vuelve a enviar tu relato. La página conservará su lugar cuando sea aprobada."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-800">
            <PencilLine className="size-3.5" aria-hidden="true" />
            Requiere correcciones
          </span>
        }
      />

      <Card className="p-5 sm:p-7">
        <LogbookEntryForm
          mode="edit"
          today={entry.adventureDate.toISOString().slice(0, 10)}
          activities={activities}
          canReview={canReview}
          entry={{
            id: entry.id,
            title: entry.title,
            adventureDate: entry.adventureDate.toISOString().slice(0, 10),
            contentMd: entry.contentMd,
            activityId: entry.activityId,
            photoFileId: entry.photoFileId,
            rejectionReason: entry.rejectionReason,
          }}
        />
      </Card>
    </div>
  );
}
