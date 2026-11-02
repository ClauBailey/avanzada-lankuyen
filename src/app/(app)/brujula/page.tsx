import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Compass, Eye, Lock } from "lucide-react";

import { CompassBoard } from "@/components/compass/compass-board";
import { CompassOfflineSync } from "@/components/compass/compass-offline-sync";
import type {
  CatalogTemplateView,
  ObjectiveView,
  SharedNoteView,
  SharedObjectiveView,
  SharedReflectionView,
} from "@/components/compass/types";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COMPASS_AREAS } from "@/features/compass/catalog";
import { compassTransparencyBanner } from "@/features/compass/rules";
import { templateReferenceForObjective } from "@/features/compass/templates";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Mi Brújula",
};

export default async function BrujulaPage() {
  const user = await requirePermission("compass:view");

  if (user.role === "AA") {
    redirect("/acompanamiento");
  }

  const [assignedAa, objectives, templates, sharedObjectives, sharedReflections, sharedNotes] =
    await Promise.all([
      user.assignedAaId
        ? prisma.user.findFirst({
            where: {
              id: user.assignedAaId,
              role: "AA",
              isActive: true,
              deletedAt: null,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              preferredName: true,
            },
          })
        : null,
      prisma.userCompassObjective.findMany({
        where: { userId: user.id },
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
              createdAt: true,
            },
          },
        },
      }),
      prisma.compassObjectiveTemplate.findMany({
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          area: true,
          terminalObjective: true,
          intermediateObjective: true,
        },
      }),
      user.communityId
        ? prisma.userCompassObjective.findMany({
            where: {
              sharedWithCommunity: true,
              userId: { not: user.id },
              user: {
                communityId: user.communityId,
                role: { in: ["PP", "COORDINADOR"] },
                isActive: true,
                deletedAt: null,
              },
            },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              area: true,
              currentText: true,
              status: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  preferredName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      user.communityId
        ? prisma.userCompassReflection.findMany({
            where: {
              sharedWithCommunity: true,
              userId: { not: user.id },
              user: {
                communityId: user.communityId,
                role: { in: ["PP", "COORDINADOR"] },
                isActive: true,
                deletedAt: null,
              },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
            select: {
              id: true,
              content: true,
              cycleLabel: true,
              isCycleSelfEvaluation: true,
              createdAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  preferredName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.mentoringNote.findMany({
        where: { studentId: user.id, sharedWithStudent: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
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
    ]);

  const templatesByArea: Record<string, CatalogTemplateView[]> = {};
  for (const area of COMPASS_AREAS) {
    templatesByArea[area.key] = [];
  }
  for (const template of templates) {
    templatesByArea[template.area]?.push({
      id: template.id,
      code: template.code,
      area: template.area,
      terminalObjective: template.terminalObjective,
      intermediateObjective: template.intermediateObjective,
    });
  }

  const objectiveViews: ObjectiveView[] = objectives.map((objective) => ({
    id: objective.id,
    area: objective.area,
    currentText: objective.currentText,
    status: objective.status,
    sharedWithCommunity: objective.sharedWithCommunity,
    templateCode: objective.template?.code ?? null,
    templateIntermediateObjective: templateReferenceForObjective(
      objective.template,
      {
        templateId: null,
        currentText: objective.currentText,
        versions: objective.versions,
      },
    ).referenceText,
    terminalObjectiveRef: objective.terminalObjectiveRef,
    versions: objective.versions.map((version) => ({
      id: version.id,
      text: version.text,
      createdAt: version.createdAt.toISOString(),
    })),
    reflections: objective.reflections.map((reflection) => ({
      id: reflection.id,
      content: reflection.content,
      cycleLabel: reflection.cycleLabel,
      isCycleSelfEvaluation: reflection.isCycleSelfEvaluation,
      createdAt: reflection.createdAt.toISOString(),
    })),
  }));

  const sharedObjectiveViews: SharedObjectiveView[] = sharedObjectives.map(
    (objective) => ({
      id: objective.id,
      area: objective.area,
      currentText: objective.currentText,
      status: objective.status,
      ownerName: getDisplayName(objective.user),
    }),
  );

  const sharedReflectionViews: SharedReflectionView[] =
    sharedReflections.map((reflection) => ({
      id: reflection.id,
      content: reflection.content,
      cycleLabel: reflection.cycleLabel,
      isCycleSelfEvaluation: reflection.isCycleSelfEvaluation,
      createdAt: reflection.createdAt.toISOString(),
      ownerName: getDisplayName(reflection.user),
    }));

  const sharedNoteViews: SharedNoteView[] = sharedNotes.map((note) => ({
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    authorName: note.author
      ? getDisplayName(note.author)
      : "Un Adulto Acompañante",
  }));

  const banner = compassTransparencyBanner({
    aaDisplayName: assignedAa ? getDisplayName(assignedAa) : null,
    communityName: user.community?.name ?? null,
  });

  const achieved = objectiveViews.filter(
    (objective) => objective.status === "LOGRADO_EN_VIDA_COTIDIANA",
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
        eyebrow="La Brújula"
        title="Mi Brújula"
        description="El mapa personal de tus objetivos y reflexiones. Toda la malla de las seis áreas está disponible desde hoy: no hay etapas ni requisitos que esperar."
        actions={
          <Badge variant="gold">
            <Compass className="size-3.5" aria-hidden="true" />
            {achieved} logrado{achieved === 1 ? "" : "s"} en mi vida cotidiana
          </Badge>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-anil-200 bg-anil-50/60 px-4 py-3.5">
        <Eye
          className="mt-0.5 size-4 shrink-0 text-anil-700"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Transparencia de privacidad
          </p>
          <p className="text-sm leading-relaxed text-anil-900">{banner}</p>
          <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <Lock className="size-3.5" aria-hidden="true" />
            Solo tú escribes aquí. Tu AA no aprueba ni rechaza objetivos.
          </p>
        </div>
      </div>

      {!user.assignedAaId ? (
        <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-xs leading-relaxed text-ink-soft">
          Todavía no tienes un AA encargado asignado. Puedes explorar y escribir
          toda tu Brújula desde ahora; más adelante podrás solicitar un Encuentro
          de Consenso.
        </div>
      ) : null}

      <CompassOfflineSync userId={user.id} snapshot={objectiveViews} />

      <CompassBoard
        userId={user.id}
        objectives={objectiveViews}
        templates={templatesByArea}
        sharedObjectives={sharedObjectiveViews}
        sharedReflections={sharedReflectionViews}
        sharedNotes={sharedNoteViews}
        communityName={user.community?.name ?? null}
        hasAssignedAa={Boolean(user.assignedAaId)}
      />

      <Card className="border-dashed bg-canvas/50 p-4">
        <p className="text-[11px] leading-relaxed text-ink-soft">
          {user.community
            ? `Tu comunidad ${user.community.name} solo ve los objetivos y reflexiones que marcas explícitamente. La lectura de tu AA encargado es privada y 1 a 1: ningún otro adulto ni otra comunidad accede a tu Brújula.`
            : "Tu Brújula es privada y 1 a 1. Cuando tengas una comunidad, solo sus miembros activos verán lo que decidas compartir."}
        </p>
      </Card>
    </div>
  );
}
