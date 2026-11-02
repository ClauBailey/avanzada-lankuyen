"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import {
  milestoneSchema,
  promiseCelebrationSchema,
  promiseRequestSchema,
} from "@/features/journey/schemas";
import { recordAudit } from "@/server/audit";
import {
  requirePermission,
  type SessionUser,
} from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";

function revalidateJourney(userId: string) {
  revalidatePath("/camino");
  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/notificaciones");
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
}

interface JourneyTarget {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  assignedAaId: string | null;
}

async function resolveTarget(
  actor: SessionUser,
  requestedUserId: string | undefined,
): Promise<{ target?: JourneyTarget; error?: string }> {
  if (!requestedUserId || requestedUserId === actor.id) {
    if (actor.role === "AA") {
      return {
        error:
          "Las cuentas AA no registran un camino simbólico propio. Elige a un Pionero/a o Coordinador/a.",
      };
    }

    return {
      target: {
        id: actor.id,
        firstName: actor.firstName,
        lastName: actor.lastName,
        preferredName: actor.preferredName,
        assignedAaId: actor.assignedAaId,
      },
    };
  }

  if (actor.role !== "AA") {
    return { error: "Solo puedes registrar tu propio camino simbólico." };
  }

  const target = await prisma.user.findFirst({
    where: {
      id: requestedUserId,
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      assignedAaId: true,
    },
  });

  if (!target) {
    return { error: "La persona ya no está disponible para registrar su camino." };
  }

  return { target };
}

/**
 * Otorga la insignia de etapa o de Promesa si todavía no existe.
 * No se exige ninguna etapa previa: el hito es el que enciende la insignia.
 */
async function ensureBadge(
  tx: Prisma.TransactionClient,
  options: {
    userId: string;
    code: string;
    actor: SessionUser;
    note?: string | null;
  },
) {
  const badge = await tx.badge.findFirst({
    where: { code: options.code, isActive: true },
    select: { id: true, name: true, code: true, category: true },
  });

  if (!badge) return null;

  const existing = await tx.userBadge.findFirst({
    where: {
      userId: options.userId,
      badgeId: badge.id,
      revokedAt: null,
    },
    select: { id: true },
  });

  if (existing) return badge;

  const grant = await tx.userBadge.create({
    data: {
      userId: options.userId,
      badgeId: badge.id,
      grantedById: options.actor.id,
      note: options.note ?? null,
    },
    select: { id: true },
  });

  await notifyUser(
    {
      recipientId: options.userId,
      type:
        badge.category === "COMPETENCIA"
          ? "COMPETENCIA_RECONOCIDA"
          : "INSIGNIA_OTORGADA",
      title: `Tu camino suma «${badge.name}»`,
      body: options.note
        ? `Una palabra para acompañar este momento: «${options.note}»`
        : "La insignia ya forma parte de tu camino simbólico.",
      actionUrl: "/camino",
      entityType: "Badge",
      entityId: badge.id,
      dedupeKey: `journey-badge:${options.userId}:${badge.code}`,
      priority: 1,
    },
    tx,
  );

  await recordAudit(
    {
      actor: options.actor,
      action: "badge.grant",
      entityType: "UserBadge",
      entityId: grant.id,
      after: {
        userId: options.userId,
        badgeId: badge.id,
        badgeCode: badge.code,
        source: "journey",
      },
    },
    tx,
  );

  return badge;
}

export async function registerMilestoneAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("journey:register");

  const parsed = milestoneSchema.safeParse({
    userId: readField(formData, "userId") || undefined,
    moment: readField(formData, "moment"),
    occurredAt: readField(formData, "occurredAt"),
    place: readField(formData, "place") || undefined,
    story: readField(formData, "story") || undefined,
    accompaniedBy: readField(formData, "accompaniedBy") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { target, error } = await resolveTarget(actor, parsed.data.userId);
  if (!target) return { error: error ?? "No pudimos identificar a la persona." };

  const { moment, occurredAt, place, story, accompaniedBy } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const milestone = await tx.journeyMilestone.upsert({
      where: {
        userId_moment: { userId: target.id, moment },
      },
      create: {
        userId: target.id,
        moment,
        occurredAt: new Date(`${occurredAt}T12:00:00.000Z`),
        place: place || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
      },
      update: {
        occurredAt: new Date(`${occurredAt}T12:00:00.000Z`),
        place: place || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
      },
      select: { id: true },
    });

    if (moment === "SENDERO" || moment === "CUMBRE") {
      await ensureBadge(tx, {
        userId: target.id,
        code: moment === "SENDERO" ? "ETAPA_SENDERO" : "ETAPA_CUMBRE",
        actor,
        note: story || null,
      });
    }

    await recordAudit(
      {
        actor,
        action: "journey.milestone_register",
        entityType: "JourneyMilestone",
        entityId: milestone.id,
        after: {
          userId: target.id,
          moment,
          occurredAt,
          place: place ?? null,
          accompaniedBy: accompaniedBy ?? null,
        },
      },
      tx,
    );
  });

  revalidateJourney(target.id);

  return {
    success: `Hito de ${target.preferredName ?? target.firstName} guardado.`,
  };
}

export async function requestPromiseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("promise:manage");

  const parsed = promiseRequestSchema.safeParse({
    userId: readField(formData, "userId") || undefined,
    formula: readField(formData, "formula"),
    desiredPlace: readField(formData, "desiredPlace") || undefined,
    motivation: readField(formData, "motivation") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { target, error } = await resolveTarget(actor, parsed.data.userId);
  if (!target) return { error: error ?? "No pudimos identificar a la persona." };

  const { formula, desiredPlace, motivation } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const promise = await tx.userPromise.upsert({
      where: { userId: target.id },
      create: {
        userId: target.id,
        formula,
        status: "SOLICITADA",
        desiredPlace: desiredPlace || null,
        motivation: motivation || null,
        requestedAt: new Date(),
        registeredById: actor.id,
      },
      update: {
        formula,
        status: "SOLICITADA",
        desiredPlace: desiredPlace || null,
        motivation: motivation || null,
        requestedAt: new Date(),
        registeredById: actor.id,
      },
      select: { id: true },
    });

    // Aviso al Equipo Adulto: el AA asignado o, si no está disponible,
    // todo el equipo activo.
    const activeAas = await tx.user.findMany({
      where: { role: "AA", isActive: true, deletedAt: null },
      select: { id: true },
    });
    const assignedAudience = target.assignedAaId
      ? activeAas.filter((adult) => adult.id === target.assignedAaId)
      : [];
    const audience =
      assignedAudience.length > 0 ? assignedAudience : activeAas;

    for (const recipient of audience) {
      await notifyUser(
        {
          recipientId: recipient.id,
          type: "PROMESA_SOLICITADA",
          title: `Promesa solicitada: ${getDisplayName(target)}`,
          body: `${getDisplayName(target)} quiere preparar su Promesa con la fórmula ${formula}. ${
            motivation ? `Compartió: «${motivation.slice(0, 220)}»` : ""
          }`,
          entityType: "UserPromise",
          entityId: promise.id,
          actionUrl: `/admin/usuarios/${target.id}`,
          dedupeKey: `promise-request:${target.id}:${Date.now()}`,
          priority: 2,
        },
        tx,
      );
    }

    await recordAudit(
      {
        actor,
        action: "promise.request",
        entityType: "UserPromise",
        entityId: promise.id,
        after: {
          userId: target.id,
          formula,
          desiredPlace: desiredPlace ?? null,
          status: "SOLICITADA",
        },
      },
      tx,
    );
  });

  revalidateJourney(target.id);

  return {
    success:
      "Tu solicitud quedó registrada. El Equipo Adulto acompañará la preparación.",
  };
}

export async function celebratePromiseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("promise:manage");

  const parsed = promiseCelebrationSchema.safeParse({
    userId: readField(formData, "userId") || undefined,
    formula: readField(formData, "formula"),
    celebratedAt: readField(formData, "celebratedAt"),
    celebrationPlace: readField(formData, "celebrationPlace") || undefined,
    story: readField(formData, "story") || undefined,
    accompaniedBy: readField(formData, "accompaniedBy") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { target, error } = await resolveTarget(actor, parsed.data.userId);
  if (!target) return { error: error ?? "No pudimos identificar a la persona." };

  const {
    formula,
    celebratedAt,
    celebrationPlace,
    story,
    accompaniedBy,
  } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const promise = await tx.userPromise.upsert({
      where: { userId: target.id },
      create: {
        userId: target.id,
        formula,
        status: "CELEBRADA",
        celebratedAt: new Date(`${celebratedAt}T12:00:00.000Z`),
        celebrationPlace: celebrationPlace || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
        requestedAt: new Date(),
      },
      update: {
        formula,
        status: "CELEBRADA",
        celebratedAt: new Date(`${celebratedAt}T12:00:00.000Z`),
        celebrationPlace: celebrationPlace || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
      },
      select: { id: true },
    });

    await tx.journeyMilestone.upsert({
      where: { userId_moment: { userId: target.id, moment: "PROMESA" } },
      create: {
        userId: target.id,
        moment: "PROMESA",
        occurredAt: new Date(`${celebratedAt}T12:00:00.000Z`),
        place: celebrationPlace || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
      },
      update: {
        occurredAt: new Date(`${celebratedAt}T12:00:00.000Z`),
        place: celebrationPlace || null,
        story: story || null,
        accompaniedBy: accompaniedBy || null,
        accompaniedById:
          actor.role === "AA" && actor.id !== target.id ? actor.id : null,
        registeredById: actor.id,
      },
    });

    await ensureBadge(tx, {
      userId: target.id,
      code: "PROMESA",
      actor,
      note: story || null,
    });

    await recordAudit(
      {
        actor,
        action: "promise.celebrate",
        entityType: "UserPromise",
        entityId: promise.id,
        after: {
          userId: target.id,
          formula,
          celebratedAt,
          celebrationPlace: celebrationPlace ?? null,
        },
      },
      tx,
    );
  });

  revalidateJourney(target.id);

  return {
    success: "La Promesa quedó registrada en el camino simbólico.",
  };
}
