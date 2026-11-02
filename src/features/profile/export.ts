/**
 * Exportación portable del recorrido de un joven (RF-AUT-08).
 *
 * El constructor `buildPortableProfile` es puro: recibe los datos ya cargados y
 * produce el documento JSON que se descarga desde `/api/perfil/exportar` y que
 * alimenta la vista imprimible. `loadPortableProfile` hace la consulta completa
 * y se mantiene separada para poder probar la estructura sin base de datos.
 *
 * Principio Art. IX: el historial pertenece al joven. La exportación incluye
 * todas las versiones de cada objetivo de La Brújula, no solo la redacción
 * vigente, para que ningún proceso de reformulación borre su memoria.
 */

export const PORTABLE_PROFILE_FORMAT = "avanzada-lankuyen/perfil-portable";
export const PORTABLE_PROFILE_VERSION = 1;

type DateLike = Date | string | null | undefined;

export interface PortableCompassVersionInput {
  text: string;
  createdAt: DateLike;
}

export interface PortableCompassObjectiveInput {
  id: string;
  area: string;
  terminalObjectiveRef: string | null;
  currentText: string;
  status: string;
  sharedWithCommunity: boolean;
  createdAt: DateLike;
  updatedAt: DateLike;
  versions: PortableCompassVersionInput[];
}

export interface PortableCompassReflectionInput {
  id: string;
  objectiveId: string | null;
  activityId: string | null;
  isCycleSelfEvaluation: boolean;
  cycleLabel: string | null;
  content: string;
  sharedWithAa: boolean;
  sharedWithCommunity: boolean;
  consensusNote: string | null;
  createdAt: DateLike;
}

export interface PortableMilestoneInput {
  id: string;
  moment: string;
  occurredAt: DateLike;
  place: string | null;
  story: string | null;
  accompaniedBy: string | null;
}

export interface PortablePromiseInput {
  formula: string | null;
  status: string;
  desiredPlace: string | null;
  motivation: string | null;
  requestedAt: DateLike;
  celebratedAt: DateLike;
  celebrationPlace: string | null;
  story: string | null;
  accompaniedBy: string | null;
}

export interface PortableStageReflectionInput {
  stageCode: string;
  content: string;
  createdAt: DateLike;
  updatedAt: DateLike;
}

export interface PortableBadgeInput {
  id: string;
  code: string;
  name: string;
  category: string;
  competencyArea: string | null;
  stageCode: string | null;
  grantedAt: DateLike;
  note: string | null;
  revokedAt: DateLike;
}

export interface PortableAchievementInput {
  code: string;
  title: string;
  description: string;
  category: string;
  unlockedAt: DateLike;
  note: string | null;
}

export interface PortableLogbookInput {
  id: string;
  title: string;
  pageNumber: number | null;
  adventureDate: DateLike;
  contentMd: string;
  status: string;
  publishedAt: DateLike;
  createdAt: DateLike;
}

export interface PortableProfileInput {
  user: {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    role: string;
    birthDate: DateLike;
    communityRole: string | null;
    createdAt: DateLike;
    community: { name: string } | null;
  };
  compassObjectives: PortableCompassObjectiveInput[];
  compassReflections: PortableCompassReflectionInput[];
  milestones: PortableMilestoneInput[];
  promise: PortablePromiseInput | null;
  stageReflections: PortableStageReflectionInput[];
  badges: PortableBadgeInput[];
  achievements: PortableAchievementInput[];
  logbookEntries: PortableLogbookInput[];
}

export interface PortableProfile {
  format: typeof PORTABLE_PROFILE_FORMAT;
  version: typeof PORTABLE_PROFILE_VERSION;
  exportedAt: string;
  identity: {
    id: string;
    username: string;
    email: string | null;
    displayName: string;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    role: string;
    birthDate: string | null;
    community: string | null;
    communityRole: string | null;
    memberSince: string | null;
  };
  compass: {
    objectives: Array<{
      id: string;
      area: string;
      terminalObjectiveRef: string | null;
      currentText: string;
      status: string;
      sharedWithCommunity: boolean;
      createdAt: string | null;
      updatedAt: string | null;
      versions: Array<{ text: string; createdAt: string | null }>;
    }>;
    reflections: Array<{
      id: string;
      objectiveId: string | null;
      activityId: string | null;
      isCycleSelfEvaluation: boolean;
      cycleLabel: string | null;
      content: string;
      sharedWithAa: boolean;
      sharedWithCommunity: boolean;
      consensusNote: string | null;
      createdAt: string | null;
    }>;
  };
  journey: {
    milestones: Array<{
      id: string;
      moment: string;
      occurredAt: string | null;
      place: string | null;
      story: string | null;
      accompaniedBy: string | null;
    }>;
    promise: {
      formula: string | null;
      status: string;
      desiredPlace: string | null;
      motivation: string | null;
      requestedAt: string | null;
      celebratedAt: string | null;
      celebrationPlace: string | null;
      story: string | null;
      accompaniedBy: string | null;
    } | null;
    stageReflections: Array<{
      stageCode: string;
      content: string;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
  };
  competencies: Array<{
    id: string;
    code: string;
    name: string;
    competencyArea: string | null;
    grantedAt: string | null;
    note: string | null;
    isActive: boolean;
  }>;
  badges: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    stageCode: string | null;
    grantedAt: string | null;
    note: string | null;
    isActive: boolean;
  }>;
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    category: string;
    unlockedAt: string | null;
    note: string | null;
  }>;
  logbook: {
    pages: Array<{
      id: string;
      title: string;
      pageNumber: number | null;
      adventureDate: string | null;
      contentMd: string;
      status: string;
      publishedAt: string | null;
      createdAt: string | null;
    }>;
  };
}

function iso(value: DateLike): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function portableProfileDisplayName(user: {
  firstName: string;
  lastName: string;
  preferredName: string | null;
}): string {
  const first = (user.preferredName ?? "").trim() || user.firstName.trim();
  return `${first} ${user.lastName.trim()}`.trim();
}

/** Construye el documento portable completo. Función pura y determinista. */
export function buildPortableProfile(
  input: PortableProfileInput,
  exportedAt: Date = new Date(),
): PortableProfile {
  const { user } = input;
  const competencyBadges = input.badges.filter(
    (badge) => badge.category === "COMPETENCIA",
  );

  return {
    format: PORTABLE_PROFILE_FORMAT,
    version: PORTABLE_PROFILE_VERSION,
    exportedAt: exportedAt.toISOString(),
    identity: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: portableProfileDisplayName(user),
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: user.preferredName,
      role: user.role,
      birthDate: iso(user.birthDate),
      community: user.community?.name ?? null,
      communityRole: user.communityRole,
      memberSince: iso(user.createdAt),
    },
    compass: {
      objectives: input.compassObjectives.map((objective) => ({
        id: objective.id,
        area: objective.area,
        terminalObjectiveRef: objective.terminalObjectiveRef,
        currentText: objective.currentText,
        status: objective.status,
        sharedWithCommunity: objective.sharedWithCommunity,
        createdAt: iso(objective.createdAt),
        updatedAt: iso(objective.updatedAt),
        versions: [...objective.versions]
          .sort(
            (a, b) =>
              new Date(a.createdAt ?? 0).getTime() -
              new Date(b.createdAt ?? 0).getTime(),
          )
          .map((version) => ({
            text: version.text,
            createdAt: iso(version.createdAt),
          })),
      })),
      reflections: input.compassReflections.map((reflection) => ({
        id: reflection.id,
        objectiveId: reflection.objectiveId,
        activityId: reflection.activityId,
        isCycleSelfEvaluation: reflection.isCycleSelfEvaluation,
        cycleLabel: reflection.cycleLabel,
        content: reflection.content,
        sharedWithAa: reflection.sharedWithAa,
        sharedWithCommunity: reflection.sharedWithCommunity,
        consensusNote: reflection.consensusNote,
        createdAt: iso(reflection.createdAt),
      })),
    },
    journey: {
      milestones: input.milestones.map((milestone) => ({
        id: milestone.id,
        moment: milestone.moment,
        occurredAt: iso(milestone.occurredAt),
        place: milestone.place,
        story: milestone.story,
        accompaniedBy: milestone.accompaniedBy,
      })),
      promise: input.promise
        ? {
            formula: input.promise.formula,
            status: input.promise.status,
            desiredPlace: input.promise.desiredPlace,
            motivation: input.promise.motivation,
            requestedAt: iso(input.promise.requestedAt),
            celebratedAt: iso(input.promise.celebratedAt),
            celebrationPlace: input.promise.celebrationPlace,
            story: input.promise.story,
            accompaniedBy: input.promise.accompaniedBy,
          }
        : null,
      stageReflections: input.stageReflections.map((reflection) => ({
        stageCode: reflection.stageCode,
        content: reflection.content,
        createdAt: iso(reflection.createdAt),
        updatedAt: iso(reflection.updatedAt),
      })),
    },
    competencies: competencyBadges.map((badge) => ({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      competencyArea: badge.competencyArea,
      grantedAt: iso(badge.grantedAt),
      note: badge.note,
      isActive: !badge.revokedAt,
    })),
    badges: input.badges.map((badge) => ({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      category: badge.category,
      stageCode: badge.stageCode,
      grantedAt: iso(badge.grantedAt),
      note: badge.note,
      isActive: !badge.revokedAt,
    })),
    achievements: input.achievements.map((achievement) => ({
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      unlockedAt: iso(achievement.unlockedAt),
      note: achievement.note,
    })),
    logbook: {
      pages: input.logbookEntries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        pageNumber: entry.pageNumber,
        adventureDate: iso(entry.adventureDate),
        contentMd: entry.contentMd,
        status: entry.status,
        publishedAt: iso(entry.publishedAt),
        createdAt: iso(entry.createdAt),
      })),
    },
  };
}

/**
 * Consulta completa del recorrido. Mantiene el import de Prisma dentro de la
 * función para que el constructor puro se pueda probar sin base de datos.
 */
export async function loadPortableProfile(
  userId: string,
): Promise<PortableProfile | null> {
  const { prisma } = await import("@/server/db");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      role: true,
      birthDate: true,
      communityRole: true,
      createdAt: true,
      community: { select: { name: true } },
    },
  });

  if (!user) return null;

  const [
    compassObjectives,
    compassReflections,
    milestones,
    promise,
    stageReflections,
    badges,
    achievements,
    logbookEntries,
  ] = await Promise.all([
    prisma.userCompassObjective.findMany({
      where: { userId },
      orderBy: [{ area: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        area: true,
        terminalObjectiveRef: true,
        currentText: true,
        status: true,
        sharedWithCommunity: true,
        createdAt: true,
        updatedAt: true,
        versions: {
          orderBy: { createdAt: "asc" },
          select: { text: true, createdAt: true },
        },
      },
    }),
    prisma.userCompassReflection.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        objectiveId: true,
        activityId: true,
        isCycleSelfEvaluation: true,
        cycleLabel: true,
        content: true,
        sharedWithAa: true,
        sharedWithCommunity: true,
        consensusNote: true,
        createdAt: true,
      },
    }),
    prisma.journeyMilestone.findMany({
      where: { userId },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true,
        moment: true,
        occurredAt: true,
        place: true,
        story: true,
        accompaniedBy: true,
      },
    }),
    prisma.userPromise.findUnique({
      where: { userId },
      select: {
        formula: true,
        status: true,
        desiredPlace: true,
        motivation: true,
        requestedAt: true,
        celebratedAt: true,
        celebrationPlace: true,
        story: true,
        accompaniedBy: true,
      },
    }),
    prisma.stageReflection.findMany({
      where: { userId },
      orderBy: { stageCode: "asc" },
      select: {
        stageCode: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { grantedAt: "asc" },
      select: {
        id: true,
        grantedAt: true,
        note: true,
        revokedAt: true,
        badge: {
          select: {
            code: true,
            name: true,
            category: true,
            stageCode: true,
            competencyArea: true,
          },
        },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "asc" },
      select: {
        unlockedAt: true,
        note: true,
        achievement: {
          select: {
            code: true,
            title: true,
            description: true,
            category: true,
          },
        },
      },
    }),
    prisma.logbookEntry.findMany({
      where: { authorId: userId, deletedAt: null },
      orderBy: [{ adventureDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        pageNumber: true,
        adventureDate: true,
        contentMd: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return buildPortableProfile({
    user,
    compassObjectives,
    compassReflections,
    milestones,
    promise,
    stageReflections,
    badges: badges.map((grant) => ({
      id: grant.id,
      code: grant.badge.code,
      name: grant.badge.name,
      category: grant.badge.category,
      competencyArea: grant.badge.competencyArea,
      stageCode: grant.badge.stageCode,
      grantedAt: grant.grantedAt,
      note: grant.note,
      revokedAt: grant.revokedAt,
    })),
    achievements: achievements.map((unlock) => ({
      code: unlock.achievement.code,
      title: unlock.achievement.title,
      description: unlock.achievement.description,
      category: unlock.achievement.category,
      unlockedAt: unlock.unlockedAt,
      note: unlock.note,
    })),
    logbookEntries,
  });
}
