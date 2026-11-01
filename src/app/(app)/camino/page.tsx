import Link from "next/link";
import { ArrowLeft, Compass, Flag, Mountain, UsersRound } from "lucide-react";

import { JourneyView } from "@/components/journey/journey-view";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STAGE_MEANINGS, type SymbolicMomentKey } from "@/lib/symbolic-path";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Mi camino simbólico",
};

export default async function CaminoPage() {
  const user = await requirePermission("journey:register");

  if (user.role === "AA") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Camino simbólico"
          title="Acompañar el camino"
          description="Como Adulto Acompañante registras hitos y Promesas desde la ficha de cada Pionero/a o Coordinador/a."
        />
        <EmptyState
          icon={UsersRound}
          title="Tu cuenta no recorre un camino propio"
          description="Entra a Usuarios y abre la ficha de un joven para registrar su investidura, el inicio de una etapa, su Promesa o el paso al Clan."
        />
        <Link
          href="/admin/usuarios"
          className={buttonVariants({ size: "sm", className: "w-fit" })}
        >
          <UsersRound className="size-4" aria-hidden="true" />
          Ir a usuarios
        </Link>
      </div>
    );
  }

  const [milestones, promise] = await Promise.all([
    prisma.journeyMilestone.findMany({
      where: { userId: user.id },
      select: {
        moment: true,
        occurredAt: true,
        place: true,
        story: true,
        accompaniedBy: true,
      },
    }),
    prisma.userPromise.findUnique({
      where: { userId: user.id },
      select: {
        formula: true,
        status: true,
        desiredPlace: true,
        motivation: true,
        celebratedAt: true,
        celebrationPlace: true,
        story: true,
        accompaniedBy: true,
      },
    }),
  ]);

  const milestoneByMoment: Partial<
    Record<
      SymbolicMomentKey,
      {
        occurredAt: string;
        place: string | null;
        story: string | null;
        accompaniedBy: string | null;
      }
    >
  > = {};

  for (const milestone of milestones) {
    milestoneByMoment[milestone.moment] = {
      occurredAt: milestone.occurredAt.toISOString(),
      place: milestone.place,
      story: milestone.story,
      accompaniedBy: milestone.accompaniedBy,
    };
  }

  return (
    <div className="space-y-8">
      <Link
        href="/perfil"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a mi perfil
      </Link>

      <PageHeader
        eyebrow="Camino simbólico"
        title={`El camino de ${getDisplayName(user)}`}
        description="Cinco momentos para guardar la memoria de lo vivido. No hay un orden obligatorio ni requisitos: cada paso se abre cuando tiene sentido para ti."
      />

      <JourneyView
        milestones={milestoneByMoment}
        promise={
          promise
            ? {
                formula: promise.formula,
                status: promise.status,
                desiredPlace: promise.desiredPlace,
                motivation: promise.motivation,
                celebratedAt: promise.celebratedAt
                  ? promise.celebratedAt.toISOString()
                  : null,
                celebrationPlace: promise.celebrationPlace,
                story: promise.story,
                accompaniedBy: promise.accompaniedBy,
              }
            : null
        }
        canEdit
        displayName={getDisplayName(user)}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {Object.values(STAGE_MEANINGS).map((stage) => (
          <Card key={stage.title} className="p-5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              {stage.title === "Sendero" ? (
                <Compass className="size-3.5" aria-hidden="true" />
              ) : (
                <Mountain className="size-3.5" aria-hidden="true" />
              )}
              Etapa {stage.title}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">
              {stage.motto}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {stage.meaning}
            </p>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col gap-3 border-gold/40 bg-gold-soft/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Flag className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink">
            La Promesa no depende de tu etapa ni de tu antigüedad. Puedes
            prepararla y celebrarla cuando sientas que es tu momento.
          </p>
        </div>
        <Link
          href="/perfil"
          className={buttonVariants({ variant: "gold", size: "sm" })}
        >
          Ver mi perfil
        </Link>
      </Card>
    </div>
  );
}
