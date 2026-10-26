import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

export const rsvpSchema = z.object({
  activityId: uuid("Actividad inválida."),
  status: z.enum(["CONFIRMADO", "NO_ASISTE"], {
    message: "Selecciona una respuesta válida.",
  }),
  justificationText: z
    .string()
    .trim()
    .max(1200, "La justificación no puede superar los 1200 caracteres.")
    .optional(),
});

export const justificationFileSchema = z.object({
  activityId: uuid("Actividad inválida."),
});

export const ratifyEntrySchema = z.object({
  userId: uuid("Miembro inválido."),
  status: z.enum(["PRESENTE", "AUSENTE", "JUSTIFICADO"]),
  notes: z
    .string()
    .trim()
    .max(500, "La nota no puede superar los 500 caracteres.")
    .optional(),
});

export const ratifySchema = z.object({
  activityId: uuid("Actividad inválida."),
  entries: z
    .array(ratifyEntrySchema)
    .min(1, "Incluye al menos un registro de asistencia."),
});
