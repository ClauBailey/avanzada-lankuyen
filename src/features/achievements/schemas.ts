import { z } from "zod";

const ACHIEVEMENT_CATEGORIES = [
  "AVANZADA",
  "COMUNIDAD",
  "ESPECIAL",
  "SECRETO",
] as const;

const ACHIEVEMENT_VISIBILITIES = ["PUBLIC", "HINT", "SECRET"] as const;

/** Iconos Lucide ofrecidos en el formulario de creación. */
export const ACHIEVEMENT_ICON_OPTIONS = [
  "Trophy",
  "Award",
  "Flame",
  "Compass",
  "Mountain",
  "Sparkles",
  "Tent",
  "Leaf",
  "HeartHandshake",
  "Star",
  "Shield",
  "Wind",
  "Footprints",
  "Map",
] as const;

export const grantAchievementSchema = z.object({
  targetUserId: z.string().uuid("Usuario inválido."),
  achievementId: z.string().trim().uuid("Logro inválido."),
  note: z
    .string()
    .trim()
    .max(280, "La nota no puede superar los 280 caracteres.")
    .optional(),
});

export const revokeAchievementSchema = z.object({
  targetUserId: z.string().uuid("Usuario inválido."),
  achievementId: z.string().trim().uuid("Logro inválido."),
});

export const deleteAchievementSchema = z.object({
  achievementId: z.string().trim().uuid("Logro inválido."),
});

export const createAchievementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(2000, "La descripción es demasiado larga."),
  hint: z
    .string()
    .trim()
    .max(500, "La pista no puede superar los 500 caracteres.")
    .optional(),
  icon: z.enum(ACHIEVEMENT_ICON_OPTIONS),
  category: z.enum(ACHIEVEMENT_CATEGORIES),
  visibility: z.enum(ACHIEVEMENT_VISIBILITIES),
  points: z.coerce
    .number()
    .int("Los puntos deben ser un número entero.")
    .min(0, "Los puntos no pueden ser negativos.")
    .max(1000, "Los puntos no pueden superar 1000."),
});

export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
