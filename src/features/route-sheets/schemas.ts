import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuid = (message: string) =>
  z.string().trim().regex(UUID_PATTERN, message);

const optionalUuid = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || UUID_PATTERN.test(value),
      message,
    );

const section = (label: string) =>
  z
    .string()
    .trim()
    .min(3, `Completa la sección «${label}».`)
    .max(6000, `La sección «${label}» no puede superar los 6000 caracteres.`);

/**
 * Ocho secciones del formulario oficial de Hoja de Ruta (Manual p. 269–275).
 * La opción estructurada reemplaza al archivo; el adjunto sigue siendo
 * opcional para quien prefiera acompañar el formulario con material propio.
 */
export const structuredRouteSheetSchema = z.object({
  responsibleText: section("Responsable de la actividad"),
  priorMotivation: section("Motivación previa"),
  activityObjectives: section("Objetivos de la actividad"),
  locationAndPermits: section("Lugar y permisos"),
  phasesAndVariants: section("Fases y variantes"),
  externalHumanResources: section("Recursos humanos externos"),
  materialsAndBudget: section("Materiales y presupuesto"),
  riskPrevention: section("Prevención de riesgos"),
});

export const uploadRouteSheetSchema = z
  .object({
    activityId: uuid("Actividad inválida."),
    communityId: optionalUuid("Comunidad inválida."),
    projectId: optionalUuid("Proyecto inválido."),
    mode: z.enum(["STRUCTURED", "FILE"]).default("FILE"),
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
    structured: structuredRouteSheetSchema.partial().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode !== "STRUCTURED") return;

    const parsed = structuredRouteSheetSchema.safeParse(value.structured ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["structured", ...issue.path] });
      }
    }
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
