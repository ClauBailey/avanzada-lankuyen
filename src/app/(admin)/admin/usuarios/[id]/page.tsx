import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Compass,
  Flag,
  KeyRound,
  Mail,
  Mountain,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { BadgeAdminCard } from "@/components/admin/badge-admin-card";
import { AaAssignmentSelect } from "@/components/admin/aa-assignment-select";
import { UserIdentityForm } from "@/components/admin/user-identity-form";
import { JourneyView } from "@/components/journey/journey-view";
import type { MilestoneView } from "@/components/journey/milestone-form";
import type { PromiseView } from "@/components/journey/promise-form";
import {
  UserActiveToggle,
  UserCommunitySelect,
  UserResetButton,
  UserRoleButton,
} from "@/components/admin/user-controls";
import {
  LogbookKeeperButton,
  LogbookKeeperHint,
} from "@/components/logbook/logbook-keeper-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  aaLoadAdvisory,
  ADULT_TEAM_ROLE_LABELS,
  daysWithAssignedAa,
  earlyReassignmentMessage,
  isEarlyAaReassignment,
  type AdultTeamRole,
} from "@/lib/community-rules";
import { ROLE_LABELS } from "@/lib/constants";
import { formatFullDate, formatTimestamp } from "@/lib/dates";
import type { SymbolicMomentKey } from "@/lib/symbolic-path";
import { getDisplayInitials, getDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Ficha de usuario · Panel AA",
};

const stageMeta = {
  SENDERO: {
    title: "Sendero",
    icon: Compass,
    description: "Primera etapa del camino.",
  },
  CUMBRE: {
    title: "Cumbre",
    icon: Mountain,
    description: "Segunda etapa del camino.",
  },
} as const;

export default async function AdminUsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("user:manage");

  const { id } = await params;

  const member = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      username: true,
      email: true,
      role: true,
      birthDate: true,
      adultTeamRole: true,
      assignedAaId: true,
      assignedSince: true,
      assignedAa: {
        select: { firstName: true, lastName: true, preferredName: true },
      },
      isActive: true,
      mustChangePassword: true,
      isLogbookKeeper: true,
      createdAt: true,
      community: { select: { id: true, name: true, color: true } },
    },
  });

  if (!member) notFound();

  const isAA = member.role === "AA";
  const fullName = getDisplayName(member);

  const [
    badges,
    grants,
    reflections,
    communities,
    aaCandidates,
    aaLoadCount,
    milestones,
    promise,
  ] =
    await Promise.all([
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
    isAA
      ? Promise.resolve([])
      : prisma.userBadge.findMany({
          where: { userId: member.id, revokedAt: null },
          select: { id: true, badgeId: true, grantedAt: true, note: true },
        }),
    isAA
      ? Promise.resolve([])
      : prisma.stageReflection.findMany({
          where: { userId: member.id },
          select: { stageCode: true, content: true, updatedAt: true },
        }),
    prisma.community.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.user.findMany({
      where: { role: "AA", isActive: true, deletedAt: null },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        _count: {
          select: {
            assignedYouth: {
              where: {
                isActive: true,
                deletedAt: null,
                role: { in: ["PP", "COORDINADOR"] },
              },
            },
          },
        },
      },
    }),
    isAA
      ? prisma.user.count({
          where: {
            assignedAaId: member.id,
            isActive: true,
            deletedAt: null,
            role: { in: ["PP", "COORDINADOR"] },
          },
        })
      : Promise.resolve(0),
    isAA
      ? Promise.resolve([])
      : prisma.journeyMilestone.findMany({
          where: { userId: member.id },
          select: {
            moment: true,
            occurredAt: true,
            place: true,
            story: true,
            accompaniedBy: true,
          },
        }),
    isAA
      ? Promise.resolve(null)
      : prisma.userPromise.findUnique({
          where: { userId: member.id },
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
    Record<SymbolicMomentKey, MilestoneView>
  > = {};

  for (const milestone of milestones) {
    milestoneByMoment[milestone.moment] = {
      occurredAt: milestone.occurredAt.toISOString(),
      place: milestone.place,
      story: milestone.story,
      accompaniedBy: milestone.accompaniedBy,
    };
  }

  const promiseView: PromiseView | null = promise
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
    : null;

  const grantByBadge = new Map(
    grants.map((grant) => [
      grant.badgeId,
      {
        id: grant.id,
        grantedAt: grant.grantedAt.toISOString(),
        note: grant.note,
      },
    ]),
  );

  const reflectionByStage = new Map(
    reflections.map((reflection) => [reflection.stageCode, reflection]),
  );

  const aaOptions = aaCandidates.map((candidate) => ({
    id: candidate.id,
    name: getDisplayName(candidate),
    assignedCount: candidate._count.assignedYouth,
  }));

  const aaLoadWarning = isAA ? aaLoadAdvisory(aaLoadCount) : null;
  const assignedAaName = member.assignedAa
    ? getDisplayName(member.assignedAa)
    : null;
  const requiresEarlyConfirmation =
    !isAA &&
    Boolean(member.assignedAaId) &&
    isEarlyAaReassignment(member.assignedSince);
  const birthDateValue = member.birthDate
    ? member.birthDate.toISOString().slice(0, 10)
    : null;

  const groups = [
    {
      title: "La Promesa",
      icon: Flag,
      items: badges.filter((badge) => badge.category === "PROMESA"),
    },
    {
      title: "Etapas",
      icon: Mountain,
      items: badges.filter((badge) => badge.category === "ETAPA"),
    },
    {
      title: "Competencias",
      icon: Compass,
      items: badges.filter((badge) => badge.category === "COMPETENCIA"),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/usuarios"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a usuarios
      </Link>

      <PageHeader
        eyebrow="Ficha del miembro"
        title={fullName}
        description={`@${member.username} · ${ROLE_LABELS[member.role]}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={member.isActive ? "success" : "outline"}>
              {member.isActive ? "Cuenta activa" : "Cuenta inactiva"}
            </Badge>
            {member.mustChangePassword ? (
              <Badge variant="gold">Clave temporal pendiente</Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card className="overflow-hidden">
          <div className="relative bg-anil-950 p-5 text-white sm:p-6">
            <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-xl font-semibold ring-1 ring-white/20">
                {getDisplayInitials(member)}
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold leading-tight">
                  {fullName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-anil-100/75">
                  @{member.username}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold-soft">
                    {ROLE_LABELS[member.role]}
                  </span>
                  {member.community ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: member.community.color ?? "#ffffff",
                        }}
                        aria-hidden="true"
                      />
                      {member.community.name}
                    </span>
                  ) : isAA ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] text-anil-100/80">
                      {member.adultTeamRole
                        ? ADULT_TEAM_ROLE_LABELS[
                            member.adultTeamRole as AdultTeamRole
                          ]
                        : "Equipo Adulto"}
                    </span>
                  ) : null}
                  {member.isLogbookKeeper ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-[11px] font-semibold text-gold-soft">
                      <BookOpen className="size-3" aria-hidden="true" />
                      📖 Guardián de la Bitácora
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-xl border border-line bg-canvas/50 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <Mail className="size-3.5" aria-hidden="true" />
                Correo
              </p>
              <p className="mt-1 truncate text-sm text-ink">
                {member.email ?? "Sin correo registrado"}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/50 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <UserRound className="size-3.5" aria-hidden="true" />
                Cuenta creada
              </p>
              <p className="mt-1 text-sm text-ink">
                {formatFullDate(member.createdAt)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/50 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <Award className="size-3.5" aria-hidden="true" />
                Insignias
              </p>
              <p className="mt-1 text-sm text-ink">
                {isAA
                  ? "No aplica"
                  : `${grants.length} obtenida${grants.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/50 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Reflexiones
              </p>
              <p className="mt-1 text-sm text-ink">
                {isAA
                  ? "No aplica"
                  : `${reflections.length} de 2 etapas escritas`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-line/70">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2 rounded-xl border border-line bg-canvas/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Identidad
              </p>
              <UserIdentityForm
                userId={member.id}
                role={member.role}
                preferredName={member.preferredName}
                birthDate={birthDateValue}
                adultTeamRole={member.adultTeamRole}
              />
            </div>

            {isAA ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Equipo Adulto
                </p>
                <p className="text-sm font-semibold text-ink">
                  {member.adultTeamRole
                    ? ADULT_TEAM_ROLE_LABELS[
                        member.adultTeamRole as AdultTeamRole
                      ]
                    : "Sin cargo asignado"}
                </p>
                <p className="max-w-60 text-[11px] leading-relaxed text-ink-soft">
                  El Equipo Adulto no pertenece a una comunidad juvenil. Acompaña
                  personalmente a un grupo pequeño de Pioneros/as.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Comunidad
                </p>
                <UserCommunitySelect
                  userId={member.id}
                  communityId={member.community?.id ?? null}
                  communities={communities}
                />
                <p className="max-w-60 text-[11px] leading-relaxed text-ink-soft">
                  La comunidad define la etiqueta y el grupo de seguimiento.
                </p>
              </div>
            )}

            {!isAA ? (
              <div className="space-y-1.5 border-t border-line/70 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Acompañamiento personal 1 a 1
                </p>
                <p className="text-[11px] text-ink-soft">
                  {assignedAaName
                    ? `Hoy acompaña ${assignedAaName}.`
                    : "Sin AA asignado."}
                </p>
                <AaAssignmentSelect
                  userId={member.id}
                  assignedAaId={member.assignedAaId}
                  requiresEarlyConfirmation={requiresEarlyConfirmation}
                  aaOptions={aaOptions}
                />
                {requiresEarlyConfirmation ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                    {earlyReassignmentMessage(
                      daysWithAssignedAa(member.assignedSince),
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}

            {isAA && aaLoadWarning ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                {aaLoadWarning}
              </p>
            ) : null}

            {!isAA ? (
              <div className="space-y-1.5 border-t border-line/70 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Rol
                </p>
                <UserRoleButton
                  userId={member.id}
                  role={member.role === "COORDINADOR" ? "COORDINADOR" : "PP"}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line bg-canvas/40 p-3 text-[11px] leading-relaxed text-ink-soft">
                Las cuentas AA no cambian de rol ni reciben insignias. Puedes
                actualizar su cargo, activar/desactivar la cuenta o restablecer su
                contraseña.
              </p>
            )}

            {!isAA ? (
              <div className="space-y-1.5 border-t border-line/70 pt-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  Guardián de La Bitácora
                </p>
                <LogbookKeeperButton
                  userId={member.id}
                  fullName={fullName}
                  isKeeper={member.isLogbookKeeper}
                />
                <LogbookKeeperHint />
              </div>
            ) : null}

            <div className="space-y-1.5 border-t border-line/70 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Estado de la cuenta
              </p>
              <UserActiveToggle
                userId={member.id}
                fullName={fullName}
                isActive={member.isActive}
              />
            </div>

            <div className="space-y-1.5 border-t border-line/70 pt-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <KeyRound className="size-3.5" aria-hidden="true" />
                Contraseña
              </p>
              <UserResetButton userId={member.id} fullName={fullName} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isAA ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Camino simbólico de {getDisplayName(member).split(" ")[0]}
              </h2>
              <p className="text-xs text-ink-soft">
                Registra la investidura, el inicio de una etapa, la Promesa o el
                paso al Clan. Ningún hito exige otro: cada uno se abre cuando
                tiene sentido para la persona.
              </p>
            </div>
            <Badge variant="outline">Acompañamiento AA</Badge>
          </div>

          <JourneyView
            milestones={milestoneByMoment}
            promise={promiseView}
            targetUserId={member.id}
            canEdit
            displayName={fullName}
          />
        </section>
      ) : null}

      {!isAA ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">
              Reflexiones de etapa
            </h2>
            <Badge variant="outline">Solo lectura</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(["SENDERO", "CUMBRE"] as const).map((stageCode) => {
              const meta = stageMeta[stageCode];
              const Icon = meta.icon;
              const reflection = reflectionByStage.get(stageCode);

              return (
                <Card key={stageCode} className="overflow-hidden">
                  <CardHeader className="border-b border-line/70 bg-canvas/40">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-anil-100 text-anil-800">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle className="text-base">{meta.title}</CardTitle>
                        <p className="text-[11px] text-ink-soft">
                          ¿Qué sentiste en esta etapa?
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    {reflection ? (
                      <>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                          {reflection.content}
                        </p>
                        <p className="mt-3 border-t border-line/70 pt-2 text-[11px] text-ink-soft">
                          Última edición: {formatTimestamp(reflection.updatedAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm italic text-ink-soft">
                        Aún no ha escrito su reflexión de {meta.title.toLowerCase()}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {!isAA ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Insignias de {getDisplayName(member).split(" ")[0]}
              </h2>
              <p className="text-xs text-ink-soft">
                Otorga con una nota o revoca si se marcó por error. Cada acción
                queda auditada.
              </p>
            </div>
            <Link
              href="/admin/insignias"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Ver matriz completa
            </Link>
          </div>

          <div className="space-y-4">
            {groups.map((group) => {
              const Icon = group.icon;

              return (
                <Card key={group.title} className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-line/70 bg-canvas/40 px-4 py-3">
                    <Icon className="size-4 text-anil-700" aria-hidden="true" />
                    <h3 className="font-display text-base font-semibold text-ink">
                      {group.title}
                    </h3>
                    <span className="ml-auto text-[11px] text-ink-soft">
                      {
                        group.items.filter((badge) => grantByBadge.has(badge.id))
                          .length
                      }{" "}
                      / {group.items.length}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
                    )}
                  >
                    {group.items.map((badge) => (
                      <BadgeAdminCard
                        key={badge.id}
                        userId={member.id}
                        userName={fullName}
                        badge={{
                          id: badge.id,
                          name: badge.name,
                          imagePath: badge.imagePath,
                        }}
                        grant={grantByBadge.get(badge.id) ?? null}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
