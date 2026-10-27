import { z } from "zod";

import {
  LOGBOOK_CONTENT_MAX,
  LOGBOOK_REJECTION_MAX,
  LOGBOOK_TITLE_MAX,
} from "@/lib/logbook";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalUuid = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || UUID_PATTERN.test(value),
    "El identificador seleccionado no es válido.",
  );

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export const logbookEntryIdSchema = z.object({
  entryId: z
    .string()
    .trim()
    .refine((value) => UUID_PATTERN.test(value), "Página inválida."),
});

const logbookEntryFields = {
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(LOGBOOK_TITLE_MAX, `El título no puede superar ${LOGBOOK_TITLE_MAX} caracteres.`),
  adventureDate: z
    .string()
    .trim()
    .refine(isRealDate, "Selecciona una fecha válida."),
  contentMd: z
    .string()
    .trim()
    .min(30, "El relato debe tener al menos 30 caracteres.")
    .max(
      LOGBOOK_CONTENT_MAX,
      `El relato no puede superar ${LOGBOOK_CONTENT_MAX.toLocaleString("es-CL")} caracteres.`,
    ),
  activityId: optionalUuid.optional(),
};

export const createLogbookEntrySchema = z.object({
  ...logbookEntryFields,
  publishNow: z.enum(["on", "off"]).optional(),
});

export const updateLogbookEntrySchema = z.object({
  ...logbookEntryFields,
  entryId: z
    .string()
    .trim()
    .refine((value) => UUID_PATTERN.test(value), "Página inválida."),
  publishNow: z.enum(["on", "off"]).optional(),
});

export const reviewLogbookEntrySchema = z
  .object({
    entryId: z
      .string()
      .trim()
      .refine((value) => UUID_PATTERN.test(value), "Página inválida."),
    decision: z.enum(["approve", "reject"]),
    rejectionReason: z
      .string()
      .trim()
      .max(
        LOGBOOK_REJECTION_MAX,
        `El motivo no puede superar ${LOGBOOK_REJECTION_MAX} caracteres.`,
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "reject" && (data.rejectionReason ?? "").length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Escribe un motivo de al menos 5 caracteres para el autor.",
      });
    }
  });

export const setLogbookKeeperSchema = z.object({
  userId: z
    .string()
    .trim()
    .refine((value) => UUID_PATTERN.test(value), "Usuario inválido."),
  isKeeper: z.enum(["true", "false"]),
});

export type CreateLogbookEntryInput = z.infer<typeof createLogbookEntrySchema>;
export type ReviewLogbookEntryInput = z.infer<typeof reviewLogbookEntrySchema>;
