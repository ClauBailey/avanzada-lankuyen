"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import { ratifySchema, rsvpSchema } from "@/features/attendance/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { getStorage } from "@/server/storage";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function revalidateAttendance(activityId: string, userIds: string[] = []) {
  revalidatePath("/calendario");
  revalidatePath(`/calendario/${activityId}`);
  revalidatePath("/admin/asistencia");
  revalidatePath(`/admin/asistencia/${activityId}`);
  revalidatePath("/inicio");
  revalidatePath("/perfil");
  revalidatePath("/notificaciones");
  for (const userId of userIds) {
    revalidatePath(`/admin/usuarios/${userId}`);
  }
}

function fileExtension(name: string, mimeType: string) {
  const fromName = name.includes(".")
    ? name.slice(name.lastIndexOf(".")).toLowerCase()
    : "";

  if (/^\.[a-z0-9]{1,8}$/.test(fromName)) return fromName;

  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

async function getAudience(
  tx: Prisma.TransactionClient,
  communityId: string | null,
) {
  if (communityId) {
    const communityAAs = await tx.user.findMany({
      where: {
        role: "AA",
        isActive: true,
        deletedAt: null,
        communityId,
      },
      select: { id: true },
    });

    if (communityAAs.length > 0) return communityAAs;
  }

  return tx.user.findMany({
    where: { role: "AA", isActive: true, deletedAt: null },
    select: { id: true },
  });
}

/**
 * Fase 1: confirmación previa (RSVP) del Pionero/a o Coordinador/a.
 * Se permite cambiar la respuesta mientras la actividad no haya comenzado
 * y no exista una ratificación.
 */
export async function submitRsvpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("attendance:rsvp");

  if (user.role === "AA") {
    return { error: "Las cuentas AA no registran asistencia propia." };
  }

  const parsed = rsvpSchema.safeParse({
    activityId: readField(formData, "activityId"),
    status: readField(formData, "status"),
    justificationText: readField(formData, "justificationText") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { activityId, status } = parsed.data;
  const justificationText = parsed.data.justificationText?.trim() ?? "";

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null, isPublished: true },
    select: { id: true, title: true, startsAt: true },
  });

  if (!activity) {
    return { error: "La actividad no existe o ya no está disponible." };
  }

  if (activity.startsAt.getTime() <= Date.now()) {
    return {
      error: "La actividad ya comenzó. La respuesta quedó en modo lectura.",
    };
  }

  const ratified = await prisma.attendanceRecord.count({
    where: { activityId },
  });

  if (ratified > 0) {
    return {
      error: "La asistencia ya fue ratificada. No es posible cambiar tu respuesta.",
    };
  }

  const upload = formData.get("justificationFile");
  const uploadFile =
    upload instanceof File && upload.size > 0 ? upload : null;
  const hasUpload = Boolean(uploadFile);

  if (status === "NO_ASISTE" && !justificationText && !hasUpload) {
    return {
      error:
        "Para avisar que no podrás ir, escribe el motivo o adjunta un documento.",
    };
  }

  if (uploadFile) {
    if (
      !uploadFile.type ||
      !ALLOWED_FILE_TYPES.includes(
        uploadFile.type as (typeof ALLOWED_FILE_TYPES)[number],
      )
    ) {
      return {
        error: "El adjunto debe ser PDF, JPG, PNG o WEBP.",
      };
    }

    if (uploadFile.size > MAX_FILE_BYTES) {
      return { error: "El adjunto no puede superar los 10 MB." };
    }
  }

  const existing = await prisma.attendanceResponse.findUnique({
    where: { activityId_userId: { activityId, userId: user.id } },
    select: {
      id: true,
      justificationFiles: {
        select: { fileId: true, file: { select: { objectKey: true } } },
      },
    },
  });

  let uploadedKey: string | null = null;
  let uploadedFile:
    | {
        objectKey: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
      }
    | null = null;

  try {
    if (status === "NO_ASISTE" && uploadFile) {
      const originalName = uploadFile.name.trim().slice(0, 255) || "justificacion";
      const mimeType = uploadFile.type;
      const objectKey = `justifications/${user.id}/${randomUUID()}${fileExtension(originalName, mimeType)}`;

      await getStorage().put({
        key: objectKey,
        body: new Uint8Array(await uploadFile.arrayBuffer()),
        contentType: mimeType,
      });

      uploadedKey = objectKey;
      uploadedFile = {
        objectKey,
        originalName,
        mimeType,
        sizeBytes: uploadFile.size,
      };
    }

    await prisma.$transaction(async (tx) => {
      const response = await tx.attendanceResponse.upsert({
        where: { activityId_userId: { activityId, userId: user.id } },
        create: {
          activityId,
          userId: user.id,
          status,
          justificationText:
            status === "NO_ASISTE" ? justificationText || null : null,
        },
        update: {
          status,
          justificationText:
            status === "NO_ASISTE" ? justificationText || null : null,
          respondedAt: new Date(),
        },
        select: { id: true },
      });

      const previousFiles = existing?.justificationFiles ?? [];
      // Un nuevo adjunto reemplaza al anterior. Al confirmar asistencia ya no
      // corresponde conservar la justificación ni sus archivos.
      const shouldReplaceFiles = Boolean(uploadedFile) || status === "CONFIRMADO";

      if (shouldReplaceFiles && previousFiles.length > 0) {
        await tx.justificationFile.deleteMany({
          where: { attendanceResponseId: response.id },
        });

        await tx.file.updateMany({
          where: { id: { in: previousFiles.map((item) => item.fileId) } },
          data: { deletedAt: new Date() },
        });
      }

      if (uploadedFile) {
        const file = await tx.file.create({
          data: {
            provider: "LOCAL",
            objectKey: uploadedFile.objectKey,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
            sizeBytes: uploadedFile.sizeBytes,
            isPublic: false,
            uploadedById: user.id,
          },
          select: { id: true },
        });

        await tx.justificationFile.create({
          data: {
            attendanceResponseId: response.id,
            fileId: file.id,
          },
        });
      }

      const audience = await getAudience(tx, user.communityId);
      const fullName = `${user.firstName} ${user.lastName}`;
      const isConfirmed = status === "CONFIRMADO";

      for (const recipient of audience) {
        await notifyUser(
          {
            recipientId: recipient.id,
            type: isConfirmed ? "RSVP_CONFIRMADO" : "INASISTENCIA_JUSTIFICADA",
            title: isConfirmed
              ? `Asistencia confirmada: ${fullName}`
              : `Inasistencia justificada: ${fullName}`,
            body: isConfirmed
              ? `${fullName} confirmó su asistencia a «${activity.title}».`
              : `${fullName} avisó que no podrá asistir a «${activity.title}».${
                  justificationText
                    ? ` Motivo: «${justificationText.slice(0, 220)}»`
                    : " Adjuntó un documento con el respaldo."
                }`,
            entityType: "Activity",
            entityId: activityId,
            actionUrl: `/admin/asistencia/${activityId}`,
            dedupeKey: `rsvp:${activityId}:${user.id}:${status}`,
            priority: isConfirmed ? 0 : 2,
          },
          tx,
        );
      }

      await recordAudit(
        {
          actor: user,
          action: "attendance.rsvp",
          entityType: "AttendanceResponse",
          entityId: response.id,
          after: {
            activityId,
            status,
            hasJustificationText: Boolean(justificationText),
            hasFile: Boolean(uploadedFile),
          },
        },
        tx,
      );
    });
  } catch (error) {
    if (uploadedKey) {
      await getStorage()
        .delete(uploadedKey)
        .catch(() => undefined);
    }
    throw error;
  }

  // Los adjuntos reemplazados se eliminan del almacenamiento local.
  const shouldRemovePreviousFiles =
    Boolean(uploadedFile) || status === "CONFIRMADO";

  if (shouldRemovePreviousFiles && existing?.justificationFiles.length) {
    for (const item of existing.justificationFiles) {
      await getStorage()
        .delete(item.file.objectKey)
        .catch(() => undefined);
    }
  }

  revalidateAttendance(activityId, [user.id]);

  return {
    success:
      status === "CONFIRMADO"
        ? "Asistencia confirmada. Puedes cambiar tu respuesta hasta que comience la actividad."
        : "Aviso registrado. Tus AA podrán ver el motivo y el adjunto.",
  };
}

/** Fase 2: el AA guarda y ratifica la asistencia real de la actividad. */
export async function ratifyAttendanceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("attendance:ratify");

  const payloadRaw = readField(formData, "payload");
  let payload: unknown;

  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { error: "No pudimos leer los registros de asistencia." };
  }

  const parsed = ratifySchema.safeParse({
    activityId: readField(formData, "activityId"),
    entries: payload,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { activityId, entries } = parsed.data;
  const uniqueUserIds = [...new Set(entries.map((entry) => entry.userId))];

  if (uniqueUserIds.length !== entries.length) {
    return { error: "Hay miembros repetidos en la ratificación." };
  }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
    select: { id: true, title: true, startsAt: true },
  });

  if (!activity) {
    return { error: "La actividad ya no existe." };
  }

  const members = await prisma.user.findMany({
    where: {
      id: { in: uniqueUserIds },
      role: { in: ["PP", "COORDINADOR"] },
      deletedAt: null,
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (members.length !== uniqueUserIds.length) {
    return { error: "Uno de los miembros ya no puede ser ratificado." };
  }

  const previous = await prisma.attendanceRecord.findMany({
    where: { activityId, userId: { in: uniqueUserIds } },
    select: { userId: true, status: true, notes: true, ratifiedAt: true },
  });
  const previousByUser = new Map(previous.map((record) => [record.userId, record]));
  const memberById = new Map(members.map((member) => [member.id, member]));

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      await tx.attendanceRecord.upsert({
        where: {
          activityId_userId: { activityId, userId: entry.userId },
        },
        create: {
          activityId,
          userId: entry.userId,
          status: entry.status,
          notes: entry.notes || null,
          ratifiedById: actor.id,
          ratifiedAt: new Date(),
        },
        update: {
          status: entry.status,
          notes: entry.notes || null,
          ratifiedById: actor.id,
          ratifiedAt: new Date(),
        },
      });
    }

    const beforeRecords = entries.map((entry) => ({
      userId: entry.userId,
      name: memberById.get(entry.userId)?.firstName ?? null,
      status: previousByUser.get(entry.userId)?.status ?? null,
      notes: previousByUser.get(entry.userId)?.notes ?? null,
    }));

    const afterRecords = entries.map((entry) => ({
      userId: entry.userId,
      name: memberById.get(entry.userId)?.firstName ?? null,
      status: entry.status,
      notes: entry.notes || null,
    }));

    await recordAudit(
      {
        actor,
        action: "attendance.ratify",
        entityType: "Activity",
        entityId: activityId,
        before: { records: beforeRecords },
        after: { records: afterRecords, isUpdate: previous.length > 0 },
      },
      tx,
    );
  });

  revalidateAttendance(activityId, uniqueUserIds);

  return {
    success: previous.length
      ? "Asistencia actualizada y ratificada nuevamente."
      : "Asistencia guardada y ratificada.",
  };
}
