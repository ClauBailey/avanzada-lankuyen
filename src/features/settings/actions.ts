"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { updateSettingsSchema } from "@/features/material/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getAppSettings } from "@/server/settings";

/**
 * Actualiza los ajustes operativos editables desde el panel AA.
 *
 * Se escriben claves concretas de `app_settings` (no un objeto completo) para
 * que el resto de la configuración permanezca intacta y para que el cron lea
 * los cambios en su siguiente ejecución.
 */
export async function updateAdminSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("audit:view");

  const parsed = updateSettingsSchema.safeParse({
    leadDays: readField(formData, "leadDays"),
    allowAnyPpUpload: readField(formData, "allowAnyPpUpload") === "on",
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { leadDays, allowAnyPpUpload } = parsed.data;
  const before = await getAppSettings();

  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: "reminder.leadDays" },
      create: {
        key: "reminder.leadDays",
        value: leadDays,
        updatedById: actor.id,
      },
      update: { value: leadDays, updatedById: actor.id },
    });

    await tx.appSetting.upsert({
      where: { key: "route_sheet.allowAnyPpUpload" },
      create: {
        key: "route_sheet.allowAnyPpUpload",
        value: allowAnyPpUpload,
        updatedById: actor.id,
      },
      update: { value: allowAnyPpUpload, updatedById: actor.id },
    });

    await recordAudit(
      {
        actor,
        action: "settings.update",
        entityType: "AppSetting",
        before: {
          reminderLeadDays: before.reminderLeadDays,
          allowAnyPpRouteSheetUpload: before.allowAnyPpRouteSheetUpload,
        },
        after: {
          reminderLeadDays: leadDays,
          allowAnyPpRouteSheetUpload: allowAnyPpUpload,
        },
      },
      tx,
    );
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  revalidatePath("/admin/hojas-de-ruta");
  revalidatePath("/admin/actividades");
  revalidatePath("/calendario");
  revalidatePath("/", "layout");

  return {
    success: "Ajustes guardados. El cron y las hojas de ruta usarán los nuevos valores.",
  };
}
