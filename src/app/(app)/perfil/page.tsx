import Link from "next/link";
import {
  Award,
  Compass,
  Flag,
  Mountain,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { AttendanceSummaryCard } from "@/components/attendance/attendance-summary-card";
import { BadgeCard, type BadgeGrantView, type BadgeView } from "@/components/progression/badge-card";
import { StageTimeline, type StageEntry } from "@/components/progression/stage-timeline";
import { getAttendanceSummary } from "@/features/attendance/queries";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";

export const metadata = {
  title: "Mi perfil",
};

export default async function PerfilPage() {
  const user = await requireUser();
  const isAA = user.role === "AA";

  const [badges, grants, reflections, attendanceSummary] = await Promise.all([
    prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        imagePath: true,
        category: true,
        sortOrder: true,
      },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { badgeId: true, grantedAt: true, note: true },
    }),
    prisma.stageReflection.findMany({
      where: { userId: user.id },
      select: { stageCode: true, content: true, updatedAt: true },
    }),
    getAttendanceSummary(user.id),
  ]);

  const grantByBadge = new Map<string, BadgeGrantView>(
    grants.map((grant) => [
      grant.badgeId,
      { grantedAt: grant.grantedAt.toISOString(), note: grant.note },
    ]),
  );

  const reflectionByStage = new Map(
    reflections.map((reflection) => [
      reflection.stageCode,
      {
        content: reflection.content,
        updatedAt: reflection.updatedAt.toISOString(),
      },
    ]),
  );

  const toBadgeView = (badge: {
    id: string;
    code: string;
    name: string;
    description: string;
    imagePath: string;
    category: "ETAPA" | "COMPETENCIA" | "PROMESA";
  }): BadgeView => ({
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    imagePath: badge.imagePath,
    category: badge.category,
  });

  const promiseBadge = badges.find((badge) => badge.category === "PROMESA");
  const stageEntries: StageEntry[] = badges
    .filter((badge) => badge.category === "ETAPA")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((badge) => ({
      badge: toBadgeView(badge),
      grant: grantByBadge.get(badge.id) ?? null,
      reflection:
        reflectionByStage.get(badge.code === "ETAPA_CUMBRE" ? "CUMBRE" : "SENDERO") ??
        null,
    }));
  const competencyBadges = badges.filter((badge) => badge.category === "COMPETENCIA");
  const obtainedCount = grants.length;

  return (
    <div className="space-y-10">
      {/* Cabecera */}
      <section className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 text-white shadow-float sm:p-8">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-70" />
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-lavender/20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 font-display text-2xl font-semibold text-white ring-1 ring-white/20">
              {getInitials(user.firstName, user.lastName)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-200/70">
                Mi perfil
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {user.firstName} {user.lastName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                  @{user.username}
                </span>
                <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold-soft">
                  {ROLE_LABELS[user.role]}
                </span>
                {user.community ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: user.community.color ?? "#ffffff" }}
                      aria-hidden="true"
                    />
                    {user.community.name}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-anil-100/70">
                {user.email ?? "Sin correo registrado"}
              </p>
            </div>

            {!isAA ? (
              <div className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-center sm:px-5">
                <p className="font-display text-3xl font-semibold text-white">
                  {obtainedCount}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-anil-200/70">
                  insignia{obtainedCount === 1 ? "" : "s"} obtenida
                  {obtainedCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : null}
          </div>

          {isAA ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-anil-100/80">
                  Como AA acompañas a los Pioneros/as de{" "}
                  {user.community ? `la ${user.community.name}` : "tu comunidad"}:
                  revisas su progresión, otorgas insignias y sostienes el
                  calendario. Tu cuenta no recibe insignias ni reflexiones de etapa.
                </p>
              </div>
              <Link
                href="/admin"
                className={buttonVariants({ variant: "gold", size: "sm" })}
              >
                Ir al panel AA
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {isAA ? (
        <Card className="relative overflow-hidden border-dashed p-6 sm:p-8">
          <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.3]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-700">
                Vista de acompañamiento
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                La progresión se ve desde el panel
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Como AA puedes otorgar insignias, leer las reflexiones de cada
                Pionero/a y editar el catálogo. Tu cuenta no tiene bloque de
                insignias propias.
              </p>
            </div>
            <Link
              href="/admin/insignias"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Award className="size-4" aria-hidden="true" />
              Gestionar insignias
            </Link>
          </div>
        </Card>
      ) : null}

      {!isAA ? (
        <>
          <AttendanceSummaryCard summary={attendanceSummary} />

          {/* Bloque 1 — Promesa */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Bloque 1"
              title="La Promesa"
              description="El sello que marca tu compromiso personal con la Avanzada. Es la insignia que corona el camino."
              icon={Flag}
            />

            {promiseBadge ? (
              <BadgeCard
                badge={toBadgeView(promiseBadge)}
                grant={grantByBadge.get(promiseBadge.id) ?? null}
                variant="featured"
                imageSize={96}
                className="border-anil-200/80 bg-gradient-to-br from-surface via-surface to-gold-soft/20"
              />
            ) : (
              <p className="text-sm text-ink-soft">
                La insignia de la Promesa aún no está cargada en el catálogo.
              </p>
            )}
          </section>

          {/* Bloque 2 — Etapas */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Bloque 2"
              title="Etapas del camino"
              description="Del Sendero a la Cumbre. Cada etapa tiene su insignia y un espacio íntimo para escribir qué sentiste al vivirla."
              icon={Mountain}
            />

            <StageTimeline stages={stageEntries} />
          </section>

          {/* Bloque 3 — Competencias */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Bloque 3"
              title="Competencias"
              description="Las siete competencias de la rama Pioneros. Las imágenes a color son las que ya te fueron otorgadas."
              icon={Compass}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {competencyBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={toBadgeView(badge)}
                  grant={grantByBadge.get(badge.id) ?? null}
                  imageSize={80}
                />
              ))}
            </div>

            <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/70 px-4 py-3 text-xs leading-relaxed text-ink-soft">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
              Las insignias las otorgan tus Adultos Acompañantes. Si crees que falta
              una, conversa con ellos en el próximo encuentro.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

function SectionHeader({ eyebrow, title, description, icon: Icon }: SectionHeaderProps) {
  return (
    <header className="flex items-start gap-3">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-100 text-anil-800">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      </div>
    </header>
  );
}
