import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

export const uploadRouteSheetSchema = z.object({
  activityId: uuid("Actividad inválida."),
  title: z
    .string()
    .trim()
    .max(160, "El título no puede superar los 160 caracteres.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1200, "La descripción no puede superar los 1200 caracteres.")
    .optional(),
});

export const routeSheetIdSchema = z.object({
  routeSheetId: uuid("Hoja de ruta inválida."),
});

export const rejectRouteSheetSchema = z.object({
  routeSheetId: uuid("Hoja de ruta inválida."),
  rejectionReason: z
    .string()
    .trim()
    .min(
      10,
      "Explica a los encargados qué deben corregir (mínimo 10 caracteres).",
    )
    .max(1200, "El motivo no puede superar los 1200 caracteres."),
});
