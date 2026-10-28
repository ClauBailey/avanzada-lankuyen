import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/server/db";

export interface MemberDirectoryFilters {
  query?: string;
  communityId?: string;
}

export interface MemberStage {
  code: "SENDERO" | "CUMBRE";
  name: string;
}

export interface MemberCardView {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  community: { id: string; name: string; color: string | null } | null;
  stage: MemberStage | null;
  badgeCount: number;
  achievementCount: number;
}

const memberCardSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  community: { select: { id: true, name: true, color: true } },
  badges: {
    where: { revokedAt: null },
    select: {
      badge: {
        select: { category: true, stageCode: true, name: true, sortOrder: true },
      },
    },
  },
  _count: { select: { achievements: true } },
} satisfies Prisma.UserSelect;

function pickStage(
  badges: Array<{
    badge: {
      category: string;
      stageCode: "SENDERO" | "CUMBRE" | null;
      name: string;
      sortOrder: number;
    };
  }>,
): MemberStage | null {
  const stages = badges
    .filter(
      (entry) =>
        entry.badge.category === "ETAPA" && entry.badge.stageCode !== null,
    )
    .sort((a, b) => b.badge.sortOrder - a.badge.sortOrder);

  const stage = stages[0]?.badge;
  if (!stage?.stageCode) return null;

  return { code: stage.stageCode, name: stage.name };
}

/** Directorio social de miembros activos, con filtro por nombre y comunidad. */
export async function getMembersDirectory(
  filters: MemberDirectoryFilters = {},
): Promise<MemberCardView[]> {
  const query = filters.query?.trim();

  const where: Prisma.UserWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
    ];
  }

  if (filters.communityId === "sin") {
    where.communityId = null;
  } else if (filters.communityId) {
    where.communityId = filters.communityId;
  }

  const members = await prisma.user.findMany({
    where,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: memberCardSelect,
  });

  return members.map((member) => ({
    id: member.id,
    username: member.username,
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    community: member.community,
    stage: pickStage(member.badges),
    badgeCount: member.badges.length,
    achievementCount: member._count.achievements,
  }));
}

export interface SocialBadgeView {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: "ETAPA" | "COMPETENCIA" | "PROMESA";
  stageCode: "SENDERO" | "CUMBRE" | null;
  grantedAt: string;
  note: string | null;
}

export interface SocialMemberProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  community: { id: string; name: string; color: string | null } | null;
  memberSince: string;
  badges: SocialBadgeView[];
}

/**
 * Perfil social de solo lectura. No selecciona correo, teléfono, fecha de
 * nacimiento ni ningún otro dato privado.
 */
export async function getSocialMemberProfile(
  username: string,
): Promise<SocialMemberProfile | null> {
  const member = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      community: { select: { id: true, name: true, color: true } },
      badges: {
        where: { revokedAt: null },
        orderBy: { grantedAt: "desc" },
        select: {
          grantedAt: true,
          note: true,
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
              imagePath: true,
              category: true,
              stageCode: true,
            },
          },
        },
      },
    },
  });

  if (!member) return null;

  return {
    id: member.id,
    username: member.username,
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    community: member.community,
    memberSince: member.createdAt.toISOString(),
    badges: member.badges.map((entry) => ({
      id: entry.badge.id,
      name: entry.badge.name,
      description: entry.badge.description,
      imagePath: entry.badge.imagePath,
      category: entry.badge.category,
      stageCode: entry.badge.stageCode,
      grantedAt: entry.grantedAt.toISOString(),
      note: entry.note,
    })),
  };
}

/** Comunidades activas para el filtro del directorio. */
export async function getDirectoryCommunities() {
  return prisma.community.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}
