import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

export const materialResourceIdSchema = z.object({
  id: uuid("Recurso inválido."),
});

export const materialResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(160, "El título no puede superar los 160 caracteres."),
  summary: z
    .string()
    .trim()
    .max(300, "El resumen no puede superar los 300 caracteres.")
    .optional(),
  bodyMd: z
    .string()
    .trim()
    .min(1, "El contenido no puede estar vacío.")
    .max(60000, "El contenido no puede superar los 60.000 caracteres."),
  sortOrder: z.coerce
    .number()
    .int("El orden debe ser un número entero.")
    .min(0, "El orden no puede ser negativo.")
    .max(9999, "El orden no puede superar 9999."),
});

/**
 * Propuesta de material por parte de la coordinación (RF-MAT-02). No incluye
 * `sortOrder` ni `isPublished`: el AA decide el orden definitivo y publica.
 */
export const proposeMaterialResourceSchema = materialResourceSchema.omit({
  sortOrder: true,
});

export const updateSettingsSchema = z.object({
  leadDays: z.coerce
    .number()
    .int("Los días deben ser un número entero.")
    .min(1, "El aviso debe ser al menos 1 día antes.")
    .max(60, "El aviso no puede superar los 60 días."),
  allowAnyPpUpload: z.boolean(),
});
