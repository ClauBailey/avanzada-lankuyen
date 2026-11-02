"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import { recordAudit } from "@/server/audit";
import { requireReadyUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";

const accountDeletionRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(2000, "El motivo no puede superar los 2000 caracteres.")
    .optional(),
});

/**
 * Solicitud de baja / Paso al Clan (RF-AUT-09).
 *
 * No borra la cuenta: registra la voluntad del joven, deja rastro en auditoría
 * y avisa al Equipo Adulto para acompañar el proceso. El borrado efectivo y la
 * anonimización se resuelven después, con la persona.
 */
export async function requestAccountDeletionOrClanStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireReadyUser();

  const confirmed = readField(formData, "confirm") === "on";
  if (!confirmed) {
    return {
      error:
        "Confirma que quieres solicitar el Paso al Clan para que el Equipo Adulto te acompañe.",
    };
  }

  const parsed = accountDeletionRequestSchema.safeParse({
    reason: readField(formData, "reason") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { accountDeletionRequestedAt: true },
  });

  if (current?.accountDeletionRequestedAt) {
    return {
      success:
        "Tu solicitud de Paso al Clan ya está registrada. Un adulto de la Avanzada te acompañará en el proceso.",
    };
  }

  const requestedAt = new Date();
  const reason = parsed.data.reason ?? null;
  const displayName = getDisplayName(user);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        accountDeletionRequestedAt: requestedAt,
        accountDeletionReason: reason,
      },
    });

    const adults = await tx.user.findMany({
      where: { role: "AA", isActive: true, deletedAt: null },
      select: { id: true },
    });

    for (const adult of adults) {
      await notifyUser(
        {
          recipientId: adult.id,
          type: "SOLICITUD_BAJA",
          title: "Solicitud de Paso al Clan",
          body: `${displayName} solicitó el Paso al Clan y la baja de su cuenta de la Avanzada.${
            reason ? ` Motivo declarado: ${reason}` : ""
          }`,
          entityType: "User",
          entityId: user.id,
          actionUrl: "/admin/usuarios",
          dedupeKey: `account-deletion-request:${user.id}:${adult.id}`,
          priority: 2,
        },
        tx,
      );
    }

    await recordAudit(
      {
        actor: user,
        action: "account.deletion_request",
        entityType: "User",
        entityId: user.id,
        after: {
          accountDeletionRequestedAt: requestedAt.toISOString(),
          accountDeletionReason: reason,
        },
      },
      tx,
    );
  });

  revalidatePath("/perfil");
  revalidatePath("/admin/usuarios");
  revalidatePath("/notificaciones");

  return {
    success:
      "Solicitud registrada. El Equipo Adulto recibió el aviso y te acompañará en el Paso al Clan; tus datos siguen disponibles para exportar.",
  };
}
