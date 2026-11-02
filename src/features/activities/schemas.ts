import { z } from "zod";

import { ACTIVITY_TYPES } from "@/lib/activity-types";
import {
  ACTIVITY_SCHEDULE_TYPES,
  ACTIVITY_SCOPES,
} from "@/lib/activity-scopes";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

/**
 * Ciclo de Programa (RF-CIC-01).
 *
 * El nombre es libre porque los ciclos se nombran por estación
 * («Ciclo Otoño–Invierno 2026») y no por un código interno.
 */
export const programCycleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Escribe un nombre para el ciclo.")
      .max(120, "El nombre no puede superar los 120 caracteres."),
    startDate: z
      .string()
      .trim()
      .regex(DATE_PATTERN, "Ingresa la fecha de inicio."),
    endDate: z
      .string()
      .trim()
      .regex(DATE_PATTERN, "Ingresa la fecha de término."),
    isActive: z.enum(["true", "false"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La fecha de término debe ser posterior a la de inicio.",
      });
    }
  });

export const programCycleIdSchema = z.object({
  cycleId: uuid("Ciclo inválido."),
});

export const activitySchema = z
  .object({
    cycleId: uuid("Selecciona un ciclo válido."),
    title: z
      .string()
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres.")
      .max(160, "El título no puede superar los 160 caracteres."),
    type: z.enum(ACTIVITY_TYPES),
    scope: z.enum(ACTIVITY_SCOPES),
    scheduleType: z.enum(ACTIVITY_SCHEDULE_TYPES),
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
