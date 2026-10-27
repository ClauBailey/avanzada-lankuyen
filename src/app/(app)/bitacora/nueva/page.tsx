import Link from "next/link";
import { ArrowLeft, BookOpen, Feather } from "lucide-react";

import { LogbookEntryForm } from "@/components/logbook/logbook-entry-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/dates";
import { can } from "@/server/rbac/can";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Escribir en La Bitácora",
};

export default async function NuevaPaginaBitacoraPage() {
  const user = await requirePermission("logbook:create");

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
        eyebrow="Una nueva hoja"
        title="Escribir una página en La Bitácora"
        description="Cuenta la aventura con calma: qué vivieron, quiénes estuvieron y qué aprendió la unidad. Puedes adjuntar una fotografía para que la página quede completa."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink-soft">
            <BookOpen className="size-3.5" aria-hidden="true" />
            Libro de la unidad
          </span>
        }
      />

      <Card className="p-5 sm:p-7">
        <LogbookEntryForm
          mode="create"
          today={toDateInputValue(new Date())}
          activities={activities}
          canReview={canReview}
        />
      </Card>

      <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/70 px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <Feather className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
        Las páginas de los Pioneros/as y Coordinadores/as pasan por revisión de
        un AA o del Guardián de La Bitácora. Si tu página es rechazada, podrás
        corregirla y reenviarla desde este mismo espacio.
      </p>
    </div>
  );
}
