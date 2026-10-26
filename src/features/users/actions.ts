"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import {
  createUserSchema,
  setUserActiveSchema,
  setUserCommunitySchema,
  setUserRoleSchema,
  userIdSchema,
} from "@/features/users/schemas";
import type { UserActionState } from "@/features/users/types";
import { recordAudit } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";

function revalidateUsers(userId?: string) {
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/insignias");
  revalidatePath("/admin");
  if (userId) {
    revalidatePath(`/admin/usuarios/${userId}`);
  }
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
    username: readField(formData, "username"),
    email: readField(formData, "email"),
    role: readField(formData, "role"),
    communityId: readField(formData, "communityId") || undefined,
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

  const communityId = data.communityId ?? null;
  const community = await prisma.community.findFirst({
    where: { id: communityId ?? "", isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!community) {
    return { error: "La comunidad seleccionada no está activa." };
  }

  const temporaryPassword =
    data.passwordMode === "manual" && data.password
      ? data.password
      : generateTemporaryPassword();

  const passwordHash = await hashPassword(temporaryPassword);
  const fullName = `${data.firstName} ${data.lastName}`;

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
          role: data.role,
          communityId,
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
            communityId,
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

  const { userId, communityId } = parsed.data;

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, communityId: true },
  });

  if (!target) {
    return { error: "La cuenta ya no existe." };
  }

  const community = await prisma.community.findFirst({
    where: { id: communityId, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!community) {
    return { error: "La comunidad seleccionada no está activa." };
  }

  if (target.communityId === communityId) {
    return { success: "La comunidad ya está asignada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { communityId },
    });

    await recordAudit(
      {
        actor,
        action: "user.community_change",
        entityType: "User",
        entityId: userId,
        before: { communityId: target.communityId },
        after: { communityId, communityName: community.name },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  return { success: `Comunidad actualizada a «${community.name}».` };
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
    select: { id: true, role: true, communityId: true },
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

  if (!target.communityId) {
    return {
      error: "Asigna una comunidad antes de cambiar el rol de esta cuenta.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role },
    });

    await recordAudit(
      {
        actor,
        action: "user.role_change",
        entityType: "User",
        entityId: userId,
        before: { role: target.role },
        after: { role },
      },
      tx,
    );
  });

  revalidateUsers(userId);
  return {
    success:
      role === "COORDINADOR"
        ? "Ahora la cuenta tiene rol Coordinador/a."
        : "Ahora la cuenta tiene rol Pionero/a.",
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
      fullName: `${target.firstName} ${target.lastName}`,
      role: target.role,
    },
  };
}
