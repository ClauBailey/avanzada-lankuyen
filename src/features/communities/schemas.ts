import { z } from "zod";

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

export type CommunityInput = z.infer<typeof communitySchema>;
