import { z } from "zod";

import { COMMUNITY_INTERNAL_ROLES } from "@/lib/community-rules";

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Elige un color válido.");

export const communitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres."),
  motto: z
    .string()
    .trim()
    .max(300, "El lema o grito no puede superar los 300 caracteres.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(300, "La descripción no puede superar los 300 caracteres.")
    .optional(),
  color: colorSchema.optional(),
});

export const communityIdSchema = z.object({
  id: z.string().uuid("Comunidad inválida."),
});

export const communityMemberRoleSchema = z.object({
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

export const communityBatchAaSchema = z.object({
  communityId: z.string().uuid("Comunidad inválida."),
  assignedAaId: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        ),
      "AA inválido.",
    ),
  confirmEarlyReassignment: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional(),
});

export type CommunityInput = z.infer<typeof communitySchema>;
