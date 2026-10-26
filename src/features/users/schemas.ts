import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const USER_ROLES = ["PP", "COORDINADOR", "AA"] as const;
export const MANAGED_ROLES = ["PP", "COORDINADOR"] as const;

export const userIdSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
});

export const createUserSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(80, "El nombre no puede superar los 80 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(1, "Ingresa el apellido.")
      .max(80, "El apellido no puede superar los 80 caracteres."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (value) => USERNAME_PATTERN.test(value),
        "Usa entre 3 y 40 caracteres: letras minúsculas, números, puntos, guiones o guiones bajos.",
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(255, "El correo es demasiado largo.")
      .refine(
        (value) => value === "" || EMAIL_PATTERN.test(value),
        "Ingresa un correo válido o déjalo vacío.",
      ),
    role: z.enum(USER_ROLES),
    communityId: z.string().trim().optional(),
    passwordMode: z.enum(["auto", "manual"]),
    password: z.string().max(128, "La contraseña es demasiado larga.").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.communityId) {
      ctx.addIssue({
        code: "custom",
        path: ["communityId"],
        message: "Selecciona la comunidad que acompaña o integra esta cuenta.",
      });
    } else if (!UUID_PATTERN.test(data.communityId)) {
      ctx.addIssue({
        code: "custom",
        path: ["communityId"],
        message: "La comunidad seleccionada no es válida.",
      });
    }

    if (data.passwordMode === "manual") {
      const password = data.password ?? "";
      if (password.length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "La contraseña temporal debe tener al menos 10 caracteres.",
        });
      } else if (!/[A-Za-z]/.test(password)) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "La contraseña temporal debe incluir al menos una letra.",
        });
      } else if (!/[0-9]/.test(password)) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "La contraseña temporal debe incluir al menos un número.",
        });
      }
    }
  });

export const setUserRoleSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  role: z.enum(MANAGED_ROLES),
});

export const setUserCommunitySchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  communityId: z.string().uuid("Comunidad inválida."),
});

export const setUserActiveSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  isActive: z.enum(["true", "false"]),
});
