import { z } from "zod";

export const saveReflectionSchema = z.object({
  stageCode: z.enum(["SENDERO", "CUMBRE"]),
  content: z
    .string()
    .max(2000, "La reflexión no puede superar los 2000 caracteres."),
});

export const grantBadgeSchema = z.object({
  userId: z.string().uuid("Usuario inválido."),
  badgeId: z.string().uuid("Insignia inválida."),
  note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar los 500 caracteres.")
    .optional(),
});

export const revokeBadgeSchema = z.object({
  grantId: z.string().uuid("Concesión inválida."),
});

export const badgeCatalogSchema = z.object({
  badgeId: z.string().uuid("Insignia inválida."),
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(1000, "La descripción no puede superar los 1000 caracteres."),
});
