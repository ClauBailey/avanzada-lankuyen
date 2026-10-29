import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Compass,
  Flag,
  Mountain,
  Trophy,
} from "lucide-react";

import { AchievementCard } from "@/components/achievements/achievement-card";
import { ManageAchievementsDialog } from "@/components/achievements/manage-achievements-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAchievementManagerData,
  getUnlockedAchievementsForMember,
} from "@/features/achievements/queries";
import { getSocialMemberProfile } from "@/features/members/queries";
import { ROLE_LABELS } from "@/lib/constants";
import { formatFullDate } from "@/lib/dates";
import { getInitials } from "@/lib/utils";
import { requirePermission } from "@/server/auth/session";

export default async function MiembroPerfilPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const actor = await requirePermission("member:view");
  const { username } = await params;

  const profile = await getSocialMemberProfile(username);
  if (!profile) notFound();

  // Los AA no tienen perfil social: no participan de insignias ni logros.
  if (profile.role === "AA") notFound();

  const [achievements, managerData] = await Promise.all([
    getUnlockedAchievementsForMember(profile.id),
    actor.role === "AA"
      ? getAchievementManagerData(profile.id)
      : Promise.resolve(null),
  ]);

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const stageBadges = profile.badges.filter(
    (badge) => badge.category === "ETAPA",
  );
  const competencyBadges = profile.badges.filter(
    (badge) => badge.category === "COMPETENCIA",
  );
  const promiseBadges = profile.badges.filter(
    (badge) => badge.category === "PROMESA",
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/miembros"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-anil-700 transition-colors hover:text-anil-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Volver al directorio
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 text-white shadow-float sm:p-8">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-25" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60" />
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-lavender/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 font-display text-2xl font-semibold text-white ring-1 ring-white/20">
            {getInitials(profile.firstName, profile.lastName)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-200/70">
              Perfil de miembro
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {fullName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                @{profile.username}
              </span>
              <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold-soft">
                {ROLE_LABELS[profile.role]}
              </span>
              {profile.community ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: profile.community.color ?? "#ffffff" }}
                    aria-hidden="true"
                  />
                  {profile.community.name}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-anil-100/60">
              En la Avanzada desde {formatFullDate(profile.memberSince)}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-center">
              <Trophy className="mx-auto size-4 text-gold" aria-hidden="true" />
              <p className="mt-1 font-display text-2xl font-semibold text-white">
                {achievements.length}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-anil-200/70">
                logros
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-center">
              <Award className="mx-auto size-4 text-gold" aria-hidden="true" />
              <p className="mt-1 font-display text-2xl font-semibold text-white">
                {profile.badges.length}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-anil-200/70">
                insignias
              </p>
            </div>
          </div>
        </div>
      </section>

      {actor.role === "AA" ? (
        <Card className="flex flex-col gap-3 border-gold/40 bg-gold-soft/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">
              Panel AA
            </p>
            <p className="text-sm font-semibold text-ink">
              Gestiona los logros de {profile.firstName}
            </p>
            <p className="text-xs text-ink-soft">
              Otorga un logro con una nota o revoca uno asignado por error.
            </p>
          </div>

          {managerData ? (
            <ManageAchievementsDialog
              targetUserId={profile.id}
              targetName={profile.firstName}
              data={managerData}
            />
          ) : (
            <span className="text-xs text-ink-soft">
              Los AA no reciben logros.
            </span>
          )}
        </Card>
      ) : null}

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Insignias de progresión"
          title="Su vitrina"
          icon={Award}
        />

        {profile.badges.length === 0 ? (
          <EmptySection text="Todavía no tiene insignias otorgadas." />
        ) : (
          <div className="space-y-5">
            {stageBadges.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Etapas
                </p>
                <BadgeShelf badges={stageBadges} />
              </div>
            ) : null}

            {competencyBadges.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Competencias
                </p>
                <BadgeShelf badges={competencyBadges} />
              </div>
            ) : null}

            {promiseBadges.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  Promesa
                </p>
                <BadgeShelf badges={promiseBadges} />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Competencias adquiridas"
          title="Lo que ha desarrollado"
          icon={Compass}
        />

        {competencyBadges.length === 0 ? (
          <EmptySection text="Aún no registra competencias otorgadas." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {competencyBadges.map((badge) => (
              <Card key={badge.id} className="p-4">
                <p className="font-display text-base font-semibold text-ink">
                  {badge.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {badge.description}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-anil-700">
                  Otorgada el {formatFullDate(badge.grantedAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Vitrina de logros"
          title="Logros desbloqueados"
          icon={Trophy}
        />

        {achievements.length === 0 ? (
          <Card className="border-dashed bg-surface/70 p-8 text-center">
            <Trophy className="mx-auto size-8 text-gold" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">
              Su vitrina aún está esperando
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
              Cuando {profile.firstName} desbloquee su primer logro, aparecerá
              aquí con su historia y la nota de su AA.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={{
                  ...achievement,
                  unlocked: true,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/logros"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <Trophy aria-hidden="true" />
          Ver mis logros
        </Link>
        <Link
          href="/miembros"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft aria-hidden="true" />
          Directorio de miembros
        </Link>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Award;
}) {
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
      </div>
    </header>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <Card className="border-dashed bg-surface/70 px-4 py-6 text-center text-sm text-ink-soft">
      {text}
    </Card>
  );
}

function BadgeShelf({
  badges,
}: {
  badges: Array<{
    id: string;
    name: string;
    imagePath: string;
    grantedAt: string;
    stageCode: "SENDERO" | "CUMBRE" | null;
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {badges.map((badge) => {
        const Icon =
          badge.stageCode === "CUMBRE"
            ? Mountain
            : badge.stageCode === "SENDERO"
              ? Compass
              : badge.name.toLowerCase().includes("promesa")
                ? Flag
                : Award;

        return (
          <Card key={badge.id} className="flex items-center gap-3 p-3">
            <Image
              src={badge.imagePath}
              alt={badge.name}
              width={56}
              height={56}
              unoptimized
              className="rounded-full"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{badge.name}</p>
              <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-anil-700">
                <Icon className="size-3" aria-hidden="true" />
                {formatFullDate(badge.grantedAt)}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
