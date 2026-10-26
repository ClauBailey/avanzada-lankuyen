import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Ingresa tu usuario o correo.")
    .max(255, "El identificador es demasiado largo."),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña.")
    .max(200, "La contraseña es demasiado larga."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    newPassword: z
      .string()
      .min(10, "La nueva contraseña debe tener al menos 10 caracteres.")
      .max(128, "La nueva contraseña es demasiado larga.")
      .regex(/[A-Za-z]/, "La nueva contraseña debe incluir al menos una letra.")
      .regex(/[0-9]/, "La nueva contraseña debe incluir al menos un número."),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser distinta de la actual.",
    path: ["newPassword"],
  });
