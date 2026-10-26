import { z } from "zod";

import { ACTIVITY_TYPES } from "@/lib/activity-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

export const semesterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^\d{4}-S[12]$/,
        "Usa el formato del semestre: 2026-S1 o 2026-S2.",
      ),
    startsOn: z
      .string()
      .trim()
      .regex(DATE_PATTERN, "Ingresa la fecha de inicio."),
    endsOn: z.string().trim().regex(DATE_PATTERN, "Ingresa la fecha de término."),
    isActive: z.enum(["true", "false"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endsOn <= data.startsOn) {
      ctx.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "La fecha de término debe ser posterior a la de inicio.",
      });
    }
  });

export const semesterIdSchema = z.object({
  semesterId: uuid("Semestre inválido."),
});

export const activitySchema = z
  .object({
    semesterId: uuid("Selecciona un semestre válido."),
    title: z
      .string()
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres.")
      .max(160, "El título no puede superar los 160 caracteres."),
    type: z.enum(ACTIVITY_TYPES),
    startsAt: z
      .string()
      .trim()
      .regex(DATE_TIME_PATTERN, "Ingresa la fecha y hora de inicio."),
    endsAt: z
      .string()
      .trim()
      .regex(DATE_TIME_PATTERN, "Ingresa la fecha y hora de término."),
    location: z
      .string()
      .trim()
      .max(160, "La ubicación no puede superar los 160 caracteres.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "La descripción no puede superar los 2000 caracteres.")
      .optional(),
    isPublished: z.enum(["true", "false"]).optional(),
    leaderIds: z.array(uuid("Encargado inválido.")).max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "La actividad debe terminar después de comenzar.",
      });
    }
  });

export const activityIdSchema = z.object({
  activityId: uuid("Actividad inválida."),
});
