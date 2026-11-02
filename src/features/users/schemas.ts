import { z } from "zod";

import { ADULT_TEAM_ROLES, COMMUNITY_INTERNAL_ROLES } from "@/lib/community-rules";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const USER_ROLES = ["PP", "COORDINADOR", "AA"] as const;
export const MANAGED_ROLES = ["PP", "COORDINADOR"] as const;

export function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

const preferredNameSchema = z
  .string()
  .trim()
  .max(80, "El nombre social no puede superar los 80 caracteres.")
  .refine(
    (value) => value === "" || value.length >= 2,
    "El nombre social debe tener al menos 2 caracteres.",
  );

const birthDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isRealDate(value),
    "Ingresa una fecha de nacimiento válida.",
  );

const adultTeamRoleSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (ADULT_TEAM_ROLES as readonly string[]).includes(value),
    "Selecciona un cargo del Equipo Adulto válido.",
  );

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
    preferredName: preferredNameSchema.optional(),
    birthDate: birthDateSchema.optional(),
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
    adultTeamRole: adultTeamRoleSchema.optional(),
    passwordMode: z.enum(["auto", "manual"]),
    password: z.string().max(128, "La contraseña es demasiado larga.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.communityId && !UUID_PATTERN.test(data.communityId)) {
      ctx.addIssue({
        code: "custom",
        path: ["communityId"],
        message: "La comunidad seleccionada no es válida.",
      });
    }

    if (data.role === "AA" && data.communityId) {
      ctx.addIssue({
        code: "custom",
        path: ["communityId"],
        message:
          "Los Adultos Acompañantes no pertenecen a una comunidad juvenil.",
      });
    }

    if (data.role === "AA" && data.passwordMode === "manual") {
      // Sin regla adicional: el AA también usa contraseña temporal segura.
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
  communityId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "Comunidad inválida.",
    ),
});

export const setUserActiveSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  isActive: z.enum(["true", "false"]),
});

export const updatePreferredNameSchema = z.object({
  preferredName: preferredNameSchema,
});

export const updateUserIdentitySchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  preferredName: preferredNameSchema.optional(),
  birthDate: birthDateSchema.optional(),
  adultTeamRole: adultTeamRoleSchema.optional(),
});

export const assignAaSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  assignedAaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "AA inválido.",
    ),
  confirmEarlyReassignment: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional(),
});

export const assignCommunityAaSchema = z.object({
  communityId: z.string().uuid("Comunidad inválida."),
  assignedAaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "AA inválido.",
    ),
  confirmEarlyReassignment: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional(),
});

export const setCommunityMemberRoleSchema = z.object({
  communityId: z.string().uuid("Comunidad inválida."),
  userId: z.string().uuid("Miembro inválido."),
  role: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (COMMUNITY_INTERNAL_ROLES as readonly string[]).includes(value),
      "Selecciona un cargo válido.",
    ),
});
