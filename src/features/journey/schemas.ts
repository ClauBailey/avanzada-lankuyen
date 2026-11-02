import { z } from "zod";

const optionalUserId = z.string().uuid("Usuario inválido.").optional();

const optionalText = (label: string, max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres.`)
    .optional();

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.");

export const milestoneSchema = z.object({
  userId: optionalUserId,
  moment: z.enum([
    "BIENVENIDA_INVESTIDURA",
    "SENDERO",
    "CUMBRE",
    "PASO_AL_CLAN",
  ]),
  occurredAt: dateField,
  place: optionalText("El lugar", 180),
  story: optionalText("El relato", 3000),
  accompaniedBy: optionalText("Quién acompañó", 180),
});

export const promiseRequestSchema = z.object({
  userId: optionalUserId,
  formula: z.enum(["LEY_GUIA", "LEY_SCOUT", "LEY"], {
    message: "Elige la fórmula que deseas pronunciar.",
  }),
  desiredPlace: optionalText("El lugar deseado", 180),
  motivation: optionalText("Tu reflexión", 3000),
});

export const promiseCelebrationSchema = z.object({
  userId: optionalUserId,
  formula: z.enum(["LEY_GUIA", "LEY_SCOUT", "LEY"], {
    message: "Registra la fórmula que se pronunció.",
  }),
  celebratedAt: dateField,
  celebrationPlace: optionalText("El lugar de la ceremonia", 180),
  story: optionalText("El relato", 3000),
  accompaniedBy: optionalText("Quién acompañó", 180),
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type PromiseRequestInput = z.infer<typeof promiseRequestSchema>;
export type PromiseCelebrationInput = z.infer<typeof promiseCelebrationSchema>;
