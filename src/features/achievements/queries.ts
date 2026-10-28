import "server-only";

import type {
  AchievementCategory,
  AchievementVisibility,
} from "@/generated/prisma/enums";
import { prisma } from "@/server/db";
import type { SessionUser } from "@/server/auth/session";
import {
  sanitizeAchievementForViewer,
  type AchievementViewerRole,
} from "@/features/achievements/visibility";

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  hint: string | null;
  icon: string;
  category: AchievementCategory;
  visibility: AchievementVisibility;
  points: number;
  isActive: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  note: string | null;
  awardedBy: string | null;
  /** Cantidad total de miembros que lo obtuvieron. Solo se usa en la vista AA. */
  memberCount: number;
}

function formatAwardedBy(
  awardedBy: { firstName: string; lastName: string } | null,
): string | null {
  if (!awardedBy) return null;
  return `${awardedBy.firstName} ${awardedBy.lastName}`;
}

/**
 * Catálogo de logros ya sanitizado para el visitante.
 *
 * Es la única vía que deben usar las páginas para obtener logros: el texto
 * real de un SECRET/HINT bloqueado nunca llega al navegador de un PP.
 */
export async function getAchievementsForViewer(
  viewer: Pick<SessionUser, "id" | "role">,
): Promise<AchievementView[]> {
  const rows = await prisma.achievement.findMany({
    orderBy: [
      { category: "asc" },
      { points: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      unlockedBy: {
        where: { userId: viewer.id },
        select: {
          unlockedAt: true,
          note: true,
          awardedBy: { select: { firstName: true, lastName: true } },
        },
      },
      _count: { select: { unlockedBy: true } },
    },
  });

  const role = viewer.role as AchievementViewerRole;

  return rows.map((row) => {
    const unlock = row.unlockedBy[0] ?? null;
    const sanitized = sanitizeAchievementForViewer(
      {
        title: row.title,
        description: row.description,
        hint: row.hint,
        icon: row.icon,
        visibility: row.visibility,
      },
      Boolean(unlock),
      role,
    );

    return {
      id: row.id,
      title: sanitized.title,
      description: sanitized.description,
      hint: sanitized.hint,
      icon: sanitized.icon,
      category: row.category,
      visibility: row.visibility,
      points: row.points,
      isActive: row.isActive,
      unlocked: Boolean(unlock),
      unlockedAt: unlock?.unlockedAt.toISOString() ?? null,
      note: unlock?.note ?? null,
      awardedBy: formatAwardedBy(unlock?.awardedBy ?? null),
      memberCount: row._count.unlockedBy,
    };
  });
}

export interface UnlockedAchievementView {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  unlockedAt: string;
  note: string | null;
  awardedBy: string | null;
}

/** Logros ya obtenidos por una persona; siempre con texto completo. */
export async function getUnlockedAchievementsForMember(
  userId: string,
): Promise<UnlockedAchievementView[]> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId, achievement: { isActive: true } },
    orderBy: [{ unlockedAt: "desc" }, { id: "desc" }],
    include: {
      achievement: true,
      awardedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.achievement.id,
    code: row.achievement.code,
    title: row.achievement.title,
    description: row.achievement.description,
    icon: row.achievement.icon,
    category: row.achievement.category,
    points: row.achievement.points,
    unlockedAt: row.unlockedAt.toISOString(),
    note: row.note,
    awardedBy: formatAwardedBy(row.awardedBy),
  }));
}

export interface AchievementProgress {
  unlockedCount: number;
  totalCount: number;
  points: number;
  maxPoints: number;
  percent: number;
}

/** Resumen de progreso para la cabecera de /logros. */
export function achievementProgress(
  achievements: AchievementView[],
): AchievementProgress {
  const active = achievements.filter((achievement) => achievement.isActive);
  const unlocked = active.filter((achievement) => achievement.unlocked);
  const points = unlocked.reduce(
    (total, achievement) => total + achievement.points,
    0,
  );
  const maxPoints = active.reduce(
    (total, achievement) => total + achievement.points,
    0,
  );

  return {
    unlockedCount: unlocked.length,
    totalCount: active.length,
    points,
    maxPoints,
    percent:
      active.length === 0
        ? 0
        : Math.round((unlocked.length / active.length) * 100),
  };
}

export interface AchievementManagerData {
  achievements: Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    visibility: AchievementVisibility;
    points: number;
    unlocked: boolean;
    unlockedAt: string | null;
    note: string | null;
  }>;
}

/**
 * Datos sin censura para el panel AA de gestión de logros de una persona.
 * Solo debe llamarse desde rutas protegidas por `achievement:manage`.
 */
export async function getAchievementManagerData(
  userId: string,
): Promise<AchievementManagerData> {
  const rows = await prisma.achievement.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { points: "asc" }, { title: "asc" }],
    include: {
      unlockedBy: {
        where: { userId },
        select: { unlockedAt: true, note: true },
      },
    },
  });

  return {
    achievements: rows.map((row) => {
      const unlock = row.unlockedBy[0] ?? null;
      return {
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        icon: row.icon,
        category: row.category,
        visibility: row.visibility,
        points: row.points,
        unlocked: Boolean(unlock),
        unlockedAt: unlock?.unlockedAt.toISOString() ?? null,
        note: unlock?.note ?? null,
      };
    }),
  };
}
