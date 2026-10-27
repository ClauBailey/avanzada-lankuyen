"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import {
  isAllowedRouteSheetMime,
  MAX_ROUTE_SHEET_BYTES,
  ROUTE_SHEET_FILE_HINT,
} from "@/lib/route-sheets";
import {
  rejectRouteSheetSchema,
  routeSheetIdSchema,
  uploadRouteSheetSchema,
} from "@/features/route-sheets/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { runRouteSheetReminder } from "@/server/cron/route-sheet-reminder";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { getAppSettings } from "@/server/settings";
import { getStorage } from "@/server/storage";
import { enqueuePushNotification } from "@/server/web-push";

function revalidateRouteSheets(activityId?: string) {
  revalidatePath("/hojas-de-ruta");
  revalidatePath("/admin/hojas-de-ruta");
  revalidatePath("/calendario");
  revalidatePath("/admin/actividades");
  revalidatePath("/inicio");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  if (activityId) {
    revalidatePath(`/calendario/${activityId}`);
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
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "application/msword") return ".doc";
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return ".docx";
  }
  return "";
}

function truncate(value: string, max = 220) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function getActiveAAIds(tx: Prisma.TransactionClient) {
  return tx.user.findMany({
    where: { role: "AA", isActive: true, deletedAt: null },
    select: { id: true },
  });
}

/**
 * Sube una nueva versión de la hoja de ruta de una actividad.
 *
 * Reglas:
 * - Puede subir un AA, un encargado de la actividad, o cualquier PP si el
 *   ajuste `route_sheet.allowAnyPpUpload` está activo.
 * - No se permite una nueva versión mientras exista una pendiente de revisión
 *   o una aprobada. Tras un rechazo se crea la versión siguiente.
 */
export async function uploadRouteSheetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("route_sheet:upload");

  const parsed = uploadRouteSheetSchema.safeParse({
    activityId: readField(formData, "activityId"),
    title: readField(formData, "title") || undefined,
    description: readField(formData, "description") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const upload = formData.get("file");
  const uploadFile = upload instanceof File && upload.size > 0 ? upload : null;

  if (!uploadFile) {
    return { error: "Selecciona el archivo de la hoja de ruta." };
  }

  if (!isAllowedRouteSheetMime(uploadFile.type)) {
    return {
      error: `El archivo debe ser ${ROUTE_SHEET_FILE_HINT.replace(" · máximo 10 MB", "")}.`,
    };
  }

  if (uploadFile.size > MAX_ROUTE_SHEET_BYTES) {
    return { error: "La hoja de ruta no puede superar los 10 MB." };
  }

  const { activityId, title, description } = parsed.data;
  const settings = await getAppSettings();

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null, isPublished: true },
    select: {
      id: true,
      title: true,
      startsAt: true,
      leaders: { select: { userId: true } },
    },
  });

  if (!activity) {
    return {
      error: "La actividad no existe, fue cancelada o no está publicada.",
    };
  }

  const isLeader = activity.leaders.some(
    (leader) => leader.userId === user.id,
  );
  const canUpload =
    user.role === "AA" ||
    isLeader ||
    (settings.allowAnyPpRouteSheetUpload &&
      (user.role === "PP" || user.role === "COORDINADOR"));

  if (!canUpload) {
    return {
      error:
        "Solo los encargados de la actividad y los AA pueden subir su hoja de ruta.",
    };
  }

  const existing = await prisma.routeSheet.findMany({
    where: { activityId, deletedAt: null },
    orderBy: { version: "desc" },
    select: { id: true, status: true, version: true },
  });

  const pending = existing.find(
    (sheet) => sheet.status === "PENDIENTE_AUTORIZACION",
  );

  if (pending) {
    return {
      error: `La versión ${pending.version} está en revisión. Espera la respuesta de un AA antes de subir otra.`,
    };
  }

  const approved = existing.find((sheet) => sheet.status === "APROBADA");

  if (approved) {
    return {
      error:
        "Esta actividad ya tiene una hoja de ruta aprobada. Si necesitas reemplazarla, contacta a un AA.",
    };
  }

  const nextVersion =
    existing.reduce((max, sheet) => Math.max(max, sheet.version), 0) + 1;

  const originalName =
    uploadFile.name.trim().slice(0, 255) ||
    `hoja-de-ruta-v${nextVersion}.pdf`;
  const mimeType = uploadFile.type;
  const objectKey = `route-sheets/${activityId}/${randomUUID()}${fileExtension(
    originalName,
    mimeType,
  )}`;

  const storage = getStorage();
  let uploaded = false;

  try {
    await storage.put({
      key: objectKey,
      body: new Uint8Array(await uploadFile.arrayBuffer()),
      contentType: mimeType,
    });
    uploaded = true;

    const created = await prisma.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          provider: storage.driver === "local" ? "LOCAL" : "R2",
          objectKey,
          originalName,
          mimeType,
          sizeBytes: uploadFile.size,
          isPublic: false,
          uploadedById: user.id,
        },
        select: { id: true },
      });

      const sheet = await tx.routeSheet.create({
        data: {
          activityId,
          uploadedById: user.id,
          fileId: file.id,
          title: title || `Hoja de ruta · ${activity.title}`.slice(0, 160),
          description: description || null,
          version: nextVersion,
          status: "PENDIENTE_AUTORIZACION",
        },
        select: { id: true, version: true },
      });

      const audience = await getActiveAAIds(tx);
      const fullName = `${user.firstName} ${user.lastName}`;

      for (const recipient of audience) {
        await notifyUser(
          {
            recipientId: recipient.id,
            type: "HOJA_ENVIADA",
            title: `Hoja de ruta enviada: ${activity.title}`,
            body: `${fullName} subió la versión ${sheet.version} de la hoja de ruta de «${activity.title}» y está pendiente de autorización.`,
            entityType: "RouteSheet",
            entityId: sheet.id,
            actionUrl: "/admin/hojas-de-ruta",
            dedupeKey: `route-sheet:upload:${sheet.id}:${recipient.id}`,
            priority: 2,
          },
          tx,
        );
      }

      await recordAudit(
        {
          actor: user,
          action: "route_sheet.upload",
          entityType: "RouteSheet",
          entityId: sheet.id,
          after: {
            activityId,
            version: sheet.version,
            fileId: file.id,
            originalName,
            mimeType,
            sizeBytes: uploadFile.size,
          },
        },
        tx,
      );

      return sheet;
    });

    revalidateRouteSheets(activityId);

    return {
      success: `Hoja de ruta v${created.version} enviada. Un AA la revisará y te avisará por notificaciones.`,
    };
  } catch (error) {
    if (uploaded) {
      await storage.delete(objectKey).catch(() => undefined);
    }
    console.error("Error al subir hoja de ruta", error);
    return {
      error: "No pudimos guardar la hoja de ruta. Inténtalo nuevamente.",
    };
  }
}

/**
 * Aprueba una versión pendiente. La hoja queda visible en el calendario para
 * toda la unidad. Si existiera otra versión aprobada, se desmarca antes para
 * respetar el índice único parcial de la base de datos.
 */
export async function approveRouteSheetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("route_sheet:review");

  const parsed = routeSheetIdSchema.safeParse({
    routeSheetId: readField(formData, "routeSheetId"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const sheet = await prisma.routeSheet.findFirst({
    where: { id: parsed.data.routeSheetId, deletedAt: null },
    select: {
      id: true,
      activityId: true,
      version: true,
      status: true,
      title: true,
      uploadedById: true,
      activity: {
        select: {
          title: true,
          leaders: { select: { userId: true } },
        },
      },
    },
  });

  if (!sheet) {
    return { error: "La hoja de ruta ya no existe." };
  }

  if (sheet.status === "APROBADA") {
    return { error: "Esta versión ya está aprobada." };
  }

  if (sheet.status !== "PENDIENTE_AUTORIZACION") {
    return {
      error:
        "Solo se pueden aprobar hojas pendientes. Pide al encargado que suba una nueva versión.",
    };
  }

  await prisma.$transaction(async (tx) => {
    // Defensivo: si por algún motivo existía otra versión aprobada, se retira
    // antes de aprobar la nueva para respetar el índice único parcial.
    await tx.routeSheet.updateMany({
      where: {
        activityId: sheet.activityId,
        status: "APROBADA",
        deletedAt: null,
        id: { not: sheet.id },
      },
      data: { deletedAt: new Date() },
    });

    await tx.routeSheet.update({
      where: { id: sheet.id },
      data: {
        status: "APROBADA",
        reviewedById: actor.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    const recipientIds = new Set([
      sheet.uploadedById,
      ...sheet.activity.leaders.map((leader) => leader.userId),
    ]);

    for (const recipientId of recipientIds) {
      await notifyUser(
        {
          recipientId,
          type: "HOJA_APROBADA",
          title: `Hoja de ruta aprobada: ${sheet.activity.title}`,
          body: `La versión ${sheet.version} de la hoja de ruta de «${sheet.activity.title}» fue aprobada. Ya está disponible para toda la unidad en el calendario.`,
          entityType: "RouteSheet",
          entityId: sheet.id,
          actionUrl: `/calendario/${sheet.activityId}`,
          dedupeKey: `route-sheet:approved:${sheet.id}:${recipientId}`,
          priority: 1,
        },
        tx,
      );
    }

    await recordAudit(
      {
        actor,
        action: "route_sheet.approve",
        entityType: "RouteSheet",
        entityId: sheet.id,
        before: { status: sheet.status, version: sheet.version },
        after: {
          status: "APROBADA",
          version: sheet.version,
          activityId: sheet.activityId,
          reviewedById: actor.id,
        },
      },
      tx,
    );
  });

  // Post-commit: el push no debe retrasar ni revertir la aprobación.
  enqueuePushNotification(sheet.uploadedById, {
    title: "Actualización de Hoja de Ruta",
    body: `Tu AA ha aprobado tu ruta: ${sheet.title}.`,
    url: "/hojas-de-ruta",
    tag: `route-sheet-${sheet.id}`,
  });

  revalidateRouteSheets(sheet.activityId);

  return {
    success: `Hoja de ruta v${sheet.version} aprobada. Ya es visible en el calendario.`,
  };
}

/** Rechaza una versión pendiente exigiendo un motivo para los encargados. */
export async function rejectRouteSheetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("route_sheet:review");

  const parsed = rejectRouteSheetSchema.safeParse({
    routeSheetId: readField(formData, "routeSheetId"),
    rejectionReason: readField(formData, "rejectionReason"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const sheet = await prisma.routeSheet.findFirst({
    where: { id: parsed.data.routeSheetId, deletedAt: null },
    select: {
      id: true,
      activityId: true,
      version: true,
      status: true,
      title: true,
      uploadedById: true,
      activity: {
        select: {
          title: true,
          leaders: { select: { userId: true } },
        },
      },
    },
  });

  if (!sheet) {
    return { error: "La hoja de ruta ya no existe." };
  }

  if (sheet.status !== "PENDIENTE_AUTORIZACION") {
    return {
      error:
        "Solo se pueden rechazar hojas pendientes de autorización.",
    };
  }

  const reason = parsed.data.rejectionReason;

  await prisma.$transaction(async (tx) => {
    await tx.routeSheet.update({
      where: { id: sheet.id },
      data: {
        status: "RECHAZADA",
        reviewedById: actor.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    const recipientIds = new Set([
      sheet.uploadedById,
      ...sheet.activity.leaders.map((leader) => leader.userId),
    ]);

    for (const recipientId of recipientIds) {
      await notifyUser(
        {
          recipientId,
          type: "HOJA_RECHAZADA",
          title: `Hoja de ruta rechazada: ${sheet.activity.title}`,
          body: `La versión ${sheet.version} de la hoja de ruta de «${sheet.activity.title}» fue rechazada. Motivo: «${truncate(reason, 260)}». Corrige el documento y sube una nueva versión.`,
          entityType: "RouteSheet",
          entityId: sheet.id,
          actionUrl: "/hojas-de-ruta",
          dedupeKey: `route-sheet:rejected:${sheet.id}:${recipientId}`,
          priority: 3,
        },
        tx,
      );
    }

    await recordAudit(
      {
        actor,
        action: "route_sheet.reject",
        entityType: "RouteSheet",
        entityId: sheet.id,
        before: { status: sheet.status, version: sheet.version },
        after: {
          status: "RECHAZADA",
          version: sheet.version,
          activityId: sheet.activityId,
          reviewedById: actor.id,
          rejectionReason: reason,
        },
      },
      tx,
    );
  });

  // Post-commit: el push no debe retrasar ni revertir el rechazo.
  enqueuePushNotification(sheet.uploadedById, {
    title: "Actualización de Hoja de Ruta",
    body: `Tu AA ha devuelto con observaciones tu ruta: ${sheet.title}.`,
    url: "/hojas-de-ruta",
    tag: `route-sheet-${sheet.id}`,
  });

  revalidateRouteSheets(sheet.activityId);

  return {
    success: `Hoja de ruta v${sheet.version} rechazada. Los encargados recibieron el motivo.`,
  };
}

/**
 * Ejecución manual del recordatorio desde el panel AA.
 * Omite la ventana de miércoles 11:00 sin alterar el reloj ni el run semanal.
 */
export async function runRouteSheetReminderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // El botón no envía campos; se recibe el formulario por la firma de useActionState.
  void formData;

  await requirePermission("route_sheet:review");

  const result = await runRouteSheetReminder({ bypassScheduleCheck: true });

  if (result.error) {
    return { error: result.error };
  }

  if (result.executed) {
    revalidatePath("/notificaciones");
    revalidatePath("/hojas-de-ruta");
    revalidatePath("/admin/hojas-de-ruta");
    revalidatePath("/", "layout");
  }

  return {
    success: result.message,
  };
}
