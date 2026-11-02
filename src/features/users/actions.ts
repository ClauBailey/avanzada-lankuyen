"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { AdultTeamRole } from "@/generated/prisma/enums";
import { firstIssue, readField } from "@/lib/form-data";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import {
  AccountDeletionError,
  assertCanDeleteAccount,
} from "@/features/users/delete-account";
import {
  assignAaSchema,
  assignCommunityAaSchema,
  createUserSchema,
  setUserActiveSchema,
  setUserCommunitySchema,
  setUserRoleSchema,
  updatePreferredNameSchema,
  updateUserIdentitySchema,
  userIdSchema,
} from "@/features/users/schemas";
import type { UserActionState } from "@/features/users/types";
import {
  daysWithAssignedAa,
  earlyReassignmentMessage,
  isAdultTeamRole,
  isEarlyAaReassignment,
  isYouthRole,
} from "@/lib/community-rules";
import { getDisplayName } from "@/lib/user-display";
import { recordAudit } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import { requirePermission, requireReadyUser, requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateUsers(userId?: string) {
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/insignias");
  revalidatePath("/admin");
  revalidatePath("/miembros");
  revalidatePath("/perfil");
  revalidatePath("/mi-comunidad");
  if (userId) {
    revalidatePath(`/admin/usuarios/${userId}`);
  }
}

function toDateOnly(value: string | undefined) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = createUserSchema.safeParse({
    firstName: readField(formData, "firstName"),
    lastName: readField(formData, "lastName"),
    preferredName: readField(formData, "preferredName"),
    birthDate: readField(formData, "birthDate"),
    username: readField(formData, "username"),
    email: readField(formData, "email"),
    role: readField(formData, "role"),
    communityId: readField(formData, "communityId") || undefined,
    adultTeamRole: readField(formData, "adultTeamRole") || undefined,
    passwordMode: readField(formData, "passwordMode") || "auto",
    password: readField(formData, "password") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const data = parsed.data;
  const email = data.email || null;

  const [usernameTaken, emailTaken] = await Promise.all([
    prisma.user.findFirst({
      where: { username: { equals: data.username, mode: "insensitive" } },
      select: { id: true },
    }),
    email
      ? prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (usernameTaken) {
    return { error: `El nombre de usuario «${data.username}» ya está en uso.` };
  }

  if (emailTaken) {
    return { error: "Ese correo ya está registrado en otra cuenta." };
  }

  const communityId = data.role === "AA" ? null : (data.communityId ?? null);
  const community = communityId
    ? await prisma.community.findFirst({
        where: { id: communityId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
      })
    : null;

  if (communityId && !community) {
    return { error: "La comunidad seleccionada no está activa." };
  }

  const temporaryPassword =
    data.passwordMode === "manual" && data.password
      ? data.password
      : generateTemporaryPassword();

  const passwordHash = await hashPassword(temporaryPassword);
  const fullName = getDisplayName({
    firstName: data.firstName,
    lastName: data.lastName,
    preferredName: data.preferredName,
  });
  const preferredName = data.preferredName?.trim() || null;
  const birthDate = toDateOnly(data.birthDate);
  const adultTeamRole: AdultTeamRole | null =
    data.role === "AA"
      ? isAdultTeamRole(data.adultTeamRole ?? "")
        ? (data.adultTeamRole as AdultTeamRole)
        : "RESPONSABLE_AVANZADA"
      : null;

  let createdUserId: string;

  try {
    createdUserId = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: data.username,
          email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          preferredName,
          birthDate,
          role: data.role,
          communityId,
          communityRole: null,
          adultTeamRole,
          mustChangePassword: true,
          isActive: true,
          createdById: actor.id,
        },
        select: { id: true, username: true, role: true },
      });

      await recordAudit(
        {
          actor,
          action: "user.create",
          entityType: "User",
          entityId: created.id,
          after: {
            username: created.username,
            role: created.role,
            preferredName,
            birthDate: data.birthDate ?? null,
            communityId,
            adultTeamRole,
            email,
            mustChangePassword: true,
          },
        },
        tx,
      );

      return created.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error:
          "No pudimos crear la cuenta: el usuario o el correo ya existen. Recarga la página e inténtalo de nuevo.",
      };
    }
    throw error;
  }

  revalidateUsers();

  return {
    success: "Cuenta creada. Comparte las credenciales temporales con la persona.",
    createdId: createdUserId,
    credentials: {
      username: data.username,
      password: temporaryPassword,
      fullName,
      role: data.role,
    },
  };
}

export async function setUserCommunityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = setUserCommunitySchema.safeParse({
    userId: readField(formData, "userId"),
    communityId: readField(formData, "communityId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId, communityId: rawCommunityId } = parsed.data;
  const communityId = rawCommunityId || null;

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, communityId: true, communityRole: true },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  if (target.role === "AA") {
    return {
      error:
        "Los Adultos Acompañantes no pertenecen a comunidades juveniles. Usa el Equipo Adulto para asignar su cargo.",
    };
  }

  const community = communityId
    ? await prisma.community.findFirst({
        where: { id: communityId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
      })
    : null;

  if (communityId && !community) {
    return { error: "La comunidad seleccionada no está activa." };
  }

  if (target.communityId === communityId) {
    return { success: "La comunidad ya está asignada." };
  }

  await prisma.$transaction(async (tx) => {
    if (target.communityId) {
      await tx.communityRoleHistory.updateMany({
        where: {
          userId,
          communityId: target.communityId,
          endedAt: null,
        },
        data: { endedAt: new Date() },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { communityId, communityRole: null },
    });

    await recordAudit(
      {
        actor,
        action: "user.community_change",
        entityType: "User",
        entityId: userId,
        before: {
          communityId: target.communityId,
          communityRole: target.communityRole,
        },
        after: {
          communityId,
          communityName: community?.name ?? null,
          communityRole: null,
        },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  return {
    success: community
      ? `Comunidad actualizada a «${community.name}».`
      : "La o el joven quedó sin comunidad durante su período introductorio.",
  };
}

export async function setUserRoleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = setUserRoleSchema.safeParse({
    userId: readField(formData, "userId"),
    role: readField(formData, "role"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId, role } = parsed.data;

  if (userId === actor.id) {
    return { error: "No puedes cambiar tu propio rol." };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      role: true,
      communityId: true,
      communityRole: true,
    },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  if (target.role === "AA") {
    return { error: "El rol de un Adulto Acompañante no se cambia desde aquí." };
  }

  if (target.role === role) {
    return { success: "El rol ya está asignado." };
  }

  const communityId = target.communityId;
  if (!communityId) {
    return {
      error: "Asigna una comunidad antes de cambiar el rol de esta cuenta.",
    };
  }

  const nextCommunityRole =
    role === "COORDINADOR"
      ? target.communityRole ?? "COORDINADOR"
      : target.communityRole === "COORDINADOR"
        ? null
        : target.communityRole;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role, communityRole: nextCommunityRole },
    });

    if (target.communityRole !== nextCommunityRole) {
      await tx.communityRoleHistory.updateMany({
        where: { userId, communityId, endedAt: null },
        data: { endedAt: new Date() },
      });

      if (nextCommunityRole) {
        await tx.communityRoleHistory.create({
          data: {
            communityId,
            userId,
            role: nextCommunityRole,
          },
        });
      }
    }

    await recordAudit(
      {
        actor,
        action: "user.role_change",
        entityType: "User",
        entityId: userId,
        before: {
          role: target.role,
          communityRole: target.communityRole,
        },
        after: { role, communityRole: nextCommunityRole },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  return {
    success:
      role === "COORDINADOR"
        ? "Ahora la cuenta tiene rol de coordinador o coordinadora."
        : "Ahora la cuenta tiene rol de pionero o pionera.",
  };
}

export async function setUserActiveAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = setUserActiveSchema.safeParse({
    userId: readField(formData, "userId"),
    isActive: readField(formData, "isActive"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId } = parsed.data;
  const isActive = parsed.data.isActive === "true";

  if (userId === actor.id && !isActive) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, isActive: true, username: true },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  if (target.isActive === isActive) {
    return { success: "La cuenta ya tiene ese estado." };
  }

  if (!isActive && target.role === "AA") {
    const activeAAs = await prisma.user.count({
      where: { role: "AA", isActive: true, deletedAt: null },
    });

    if (activeAAs <= 1) {
      return {
        error: "Debe existir al menos un Adulto Acompañante activo en la unidad.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await recordAudit(
      {
        actor,
        action: isActive ? "user.activate" : "user.deactivate",
        entityType: "User",
        entityId: userId,
        before: { isActive: target.isActive },
        after: { isActive },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  return {
    success: isActive
      ? "Cuenta activada. Ya puede iniciar sesión."
      : "Cuenta desactivada. Su sesión se cerrará en la siguiente petición.",
  };
}

export async function resetUserPasswordAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = userIdSchema.safeParse({
    userId: readField(formData, "userId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId } = parsed.data;

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      role: true,
    },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });

    await recordAudit(
      {
        actor,
        action: "user.password_reset",
        entityType: "User",
        entityId: userId,
        before: { mustChangePassword: false },
        after: { mustChangePassword: true },
      },
      tx,
    );
  });

  revalidateUsers(userId);

  return {
    success: "Contraseña restablecida. Deberá cambiarla al ingresar.",
    credentials: {
      username: target.username,
      password: temporaryPassword,
      fullName: getDisplayName(target),
      role: target.role,
    },
  };
}

/**
 * Elimina definitivamente una cuenta y su progreso asociado.
 *
 * Solo un AA puede ejecutarla. La sesión se revalida contra PostgreSQL para
 * que un cambio de rol no quede cubierto por un JWT antiguo.
 */
export async function deleteUserAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();

  const parsed = userIdSchema.safeParse({
    userId: readField(formData, "userId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId } = parsed.data;

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, username: true, role: true, isActive: true },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  const activeAaCount =
    target.role === "AA"
      ? await prisma.user.count({
          where: { role: "AA", isActive: true, deletedAt: null },
        })
      : 0;

  try {
    assertCanDeleteAccount(actor, target, activeAaCount);
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return { error: error.message };
    }
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await recordAudit(
      {
        actor,
        action: "user.delete",
        entityType: "User",
        entityId: target.id,
        before: { username: target.username, role: target.role },
      },
      tx,
    );

    await tx.user.delete({ where: { id: target.id } });
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/miembros");
  revalidatePath(`/miembros/${target.username}`);
  revalidatePath("/", "layout");

  return {
    success: `La cuenta @${target.username} y su progreso fueron eliminados permanentemente.`,
  };
}

/**
 * Nombre social editable por la propia persona.
 * Tiene prioridad visual absoluta en toda la interfaz y en los PNG compartibles.
 */
export async function updatePreferredNameAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireReadyUser();

  const parsed = updatePreferredNameSchema.safeParse({
    preferredName: readField(formData, "preferredName"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const preferredName = parsed.data.preferredName.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { preferredName },
    });

    await recordAudit(
      {
        actor: user,
        action: "user.preferred_name",
        entityType: "User",
        entityId: user.id,
        before: { preferredName: user.preferredName ?? null },
        after: { preferredName },
      },
      tx,
    );
  });

  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/miembros");
  revalidatePath("/", "layout");

  return {
    success: preferredName
      ? `Tu nombre social ahora es «${preferredName}».`
      : "Se restauró tu nombre registral.",
  };
}

/** Edición administrativa de identidad: nombre social, nacimiento y cargo adulto. */
export async function updateUserIdentityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = updateUserIdentitySchema.safeParse({
    userId: readField(formData, "userId"),
    preferredName: readField(formData, "preferredName"),
    birthDate: readField(formData, "birthDate"),
    adultTeamRole: readField(formData, "adultTeamRole"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId } = parsed.data;
  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      role: true,
      preferredName: true,
      birthDate: true,
      adultTeamRole: true,
    },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  const preferredName = parsed.data.preferredName?.trim() || null;
  const birthDate = toDateOnly(parsed.data.birthDate);
  const adultTeamRole: AdultTeamRole | null =
    target.role === "AA"
      ? isAdultTeamRole(parsed.data.adultTeamRole ?? "")
        ? (parsed.data.adultTeamRole as AdultTeamRole)
        : target.adultTeamRole ?? "RESPONSABLE_AVANZADA"
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { preferredName, birthDate, adultTeamRole },
    });

    await recordAudit(
      {
        actor,
        action: "user.identity_update",
        entityType: "User",
        entityId: userId,
        before: {
          preferredName: target.preferredName,
          birthDate: target.birthDate?.toISOString().slice(0, 10) ?? null,
          adultTeamRole: target.adultTeamRole,
        },
        after: {
          preferredName,
          birthDate: parsed.data.birthDate || null,
          adultTeamRole,
        },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  revalidatePath("/", "layout");

  return { success: "Identidad actualizada." };
}

/** Asigna o cambia el AA de acompañamiento personal 1 a 1 de un joven. */
export async function assignAaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = assignAaSchema.safeParse({
    userId: readField(formData, "userId"),
    assignedAaId: readField(formData, "assignedAaId"),
    confirmEarlyReassignment: readField(formData, "confirmEarlyReassignment"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { userId } = parsed.data;
  const assignedAaId = parsed.data.assignedAaId || null;

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      role: true,
      assignedAaId: true,
      assignedSince: true,
    },
  });

  if (!target) return { error: "La cuenta ya no existe." };
  if (!isYouthRole(target.role)) {
    return {
      error:
        "Solo los pioneros y pioneras, y los coordinadores y coordinadoras, reciben acompañamiento 1 a 1.",
    };
  }

  if (target.assignedAaId === assignedAaId) {
    return { success: "El acompañamiento ya está asignado." };
  }

  const aa = assignedAaId
    ? await prisma.user.findFirst({
        where: {
          id: assignedAaId,
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
    : null;

  if (assignedAaId && !aa) {
    return { error: "Selecciona un Adulto Acompañante activo." };
  }

  const confirmed =
    parsed.data.confirmEarlyReassignment === "on" ||
    parsed.data.confirmEarlyReassignment === "true";

  if (
    target.assignedAaId &&
    assignedAaId &&
    isEarlyAaReassignment(target.assignedSince) &&
    !confirmed
  ) {
    return {
      error: earlyReassignmentMessage(
        daysWithAssignedAa(target.assignedSince),
      ),
    };
  }

  const previousAa = target.assignedAaId
    ? await prisma.user.findUnique({
        where: { id: target.assignedAaId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
        },
      })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        assignedAaId,
        assignedSince: assignedAaId ? new Date() : null,
      },
    });

    await recordAudit(
      {
        actor,
        action: "user.aa_assignment",
        entityType: "User",
        entityId: userId,
        before: {
          assignedAaId: target.assignedAaId,
          assignedAaName: previousAa ? getDisplayName(previousAa) : null,
          assignedSince: target.assignedSince?.toISOString() ?? null,
        },
        after: {
          assignedAaId,
          assignedAaName: aa ? getDisplayName(aa) : null,
          assignedSince: assignedAaId ? new Date().toISOString() : null,
        },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  revalidatePath("/admin/comunidades");

  return {
    success: aa
      ? `Acompañamiento asignado a ${getDisplayName(aa)}.`
      : "Acompañamiento retirado.",
  };
}

/** Asigna el mismo AA a todos los jóvenes activos de una comunidad. */
export async function assignCommunityAaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("user:manage");

  const parsed = assignCommunityAaSchema.safeParse({
    communityId: readField(formData, "communityId"),
    assignedAaId: readField(formData, "assignedAaId"),
    confirmEarlyReassignment: readField(formData, "confirmEarlyReassignment"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { communityId } = parsed.data;
  const assignedAaId = parsed.data.assignedAaId || null;

  const community = await prisma.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!community) return { error: "La comunidad ya no existe." };

  const aa = assignedAaId
    ? await prisma.user.findFirst({
        where: {
          id: assignedAaId,
          role: "AA",
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, firstName: true, lastName: true, preferredName: true },
      })
    : null;

  if (assignedAaId && !aa) {
    return { error: "Selecciona un Adulto Acompañante activo." };
  }

  const youth = await prisma.user.findMany({
    where: {
      communityId,
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, assignedAaId: true, assignedSince: true },
  });

  if (youth.length === 0) {
    return {
      error: "La comunidad no tiene personas jóvenes activas para asignar.",
    };
  }

  const changes = youth.filter(
    (member) => member.assignedAaId !== assignedAaId,
  );

  if (changes.length === 0) {
    return {
      success: "Todas las personas jóvenes ya tienen ese acompañamiento.",
    };
  }

  const confirmed =
    parsed.data.confirmEarlyReassignment === "on" ||
    parsed.data.confirmEarlyReassignment === "true";

  const early = changes.filter(
    (member) =>
      member.assignedAaId &&
      assignedAaId &&
      isEarlyAaReassignment(member.assignedSince),
  );

  if (early.length > 0 && !confirmed) {
    return {
      error: `${early.length} ${
        early.length === 1 ? "persona joven lleva" : "personas jóvenes llevan"
      } menos de un año con su AA actual. Confirma el cambio para continuar.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { id: { in: changes.map((member) => member.id) } },
      data: {
        assignedAaId,
        assignedSince: assignedAaId ? new Date() : null,
      },
    });

    await recordAudit(
      {
        actor,
        action: "community.aa_batch_assignment",
        entityType: "Community",
        entityId: communityId,
        before: {
          assignedAaId: "multiple",
          previousAaIds: [
            ...new Set(
              changes
                .map((member) => member.assignedAaId)
                .filter((id): id is string => Boolean(id)),
            ),
          ],
          youthIds: changes.map((member) => member.id),
        },
        after: {
          assignedAaId,
          assignedAaName: aa ? getDisplayName(aa) : null,
          count: changes.length,
          communityName: community.name,
        },
      },
      tx,
    );
  });

  revalidateUsers();
  revalidatePath("/admin/comunidades");

  return {
    success: aa
      ? `${changes.length} ${
          changes.length === 1
            ? "persona joven quedó"
            : "personas jóvenes quedaron"
        } con ${getDisplayName(aa)} como acompañamiento.`
      : "Se retiró el acompañamiento a las personas jóvenes de la comunidad.",
  };
}
