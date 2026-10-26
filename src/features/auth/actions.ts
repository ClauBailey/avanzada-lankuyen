"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@/server/auth/password";
import { signIn, signOut } from "@/server/auth";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { changePasswordSchema, loginSchema } from "@/features/auth/schemas";
import type { ActionState } from "@/features/auth/types";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: readField(formData, "identifier"),
    password: readField(formData, "password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos ingresados." };
  }

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: "/inicio",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Usuario o contraseña incorrectos." };
      }
      return { error: "No pudimos iniciar sesión. Inténtalo nuevamente." };
    }
    // Next.js usa excepciones internas para redirigir: deben propagarse.
    throw error;
  }

  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: readField(formData, "currentPassword"),
    newPassword: readField(formData, "newPassword"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos ingresados." };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!record) {
    return { error: "No encontramos tu cuenta. Vuelve a iniciar sesión." };
  }

  const validCurrentPassword = await verifyPassword(
    record.passwordHash,
    parsed.data.currentPassword,
  );

  if (!validCurrentPassword) {
    return { error: "La contraseña actual no es correcta." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  redirect("/inicio");
}
