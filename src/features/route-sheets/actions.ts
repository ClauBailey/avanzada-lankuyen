"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import { getDisplayName } from "@/lib/user-display";
import {
  isAllowedRouteSheetMime,
  MAX_ROUTE_SHEET_BYTES,
  ROUTE_SHEET_FILE_HINT,
  ROUTE_SHEET_STRUCTURED_SECTIONS,
} from "@/lib/route-sheets";
import {
  rejectRouteSheetSchema,
  routeSheetIdSchema,
  uploadRouteSheetSchema,
} from "@/features/route-sheets/schemas";
import {
  canUploadRouteSheet,
  resolveRouteSheetCommunityId,
} from "@/features/route-sheets/rules";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { runRouteSheetReminder } from "@/server/cron/route-sheet-reminder";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { getAppSettings } from "@/server/settings";
import { getStorage } from "@/server/storage";

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

  const structured = Object.fromEntries(
    ROUTE_SHEET_STRUCTURED_SECTIONS.map((section) => [
      section.key,
      readField(formData, section.key) || undefined,
    ]),
  );

  const parsed = uploadRouteSheetSchema.safeParse({
    activityId: readField(formData, "activityId"),
    communityId: readField(formData, "communityId") || undefined,
    projectId: readField(formData, "projectId") || undefined,
    mode: readField(formData, "mode") || "FILE",
    title: readField(formData, "title") || undefined,
    description: readField(formData, "description") || undefined,
    structured,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const mode = parsed.data.mode;
  const upload = formData.get("file");
  const uploadFile = upload instanceof File && upload.size > 0 ? upload : null;

  if (mode === "FILE" && !uploadFile) {
    return { error: "Selecciona el archivo de la hoja de ruta." };
  }

  if (uploadFile && !isAllowedRouteSheetMime(uploadFile.type)) {
    return {
      error: `El archivo debe ser ${ROUTE_SHEET_FILE_HINT.replace(" · máximo 10 MB", "")}.`,
    };
  }

  if (uploadFile && uploadFile.size > MAX_ROUTE_SHEET_BYTES) {
    return { error: "La hoja de ruta no puede superar los 10 MB." };
  }

  const { activityId, title, description, projectId } = parsed.data;
  const settings = await getAppSettings();

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null, isPublished: true },
    select: {
      id: true,
      title: true,
      scope: true,
      startsAt: true,
      leaders: {
        select: {
          userId: true,
          user: { select: { communityId: true } },
        },
      },
    },
  });

  if (!activity) {
    return {
      error: "La actividad no existe, fue cancelada o no está publicada.",
    };
  }

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return { error: "El proyecto indicado ya no existe." };
    }
  }

  const communityResolution = resolveRouteSheetCommunityId({
    activityScope: activity.scope,
    actorRole: user.role,
    actorCommunityId: user.communityId,
    requestedCommunityId: parsed.data.communityId ?? null,
  });

  if ("error" in communityResolution) {
    return { error: communityResolution.error };
  }

  const targetCommunityId = communityResolution.communityId;
  let targetCommunityName: string | null = null;

  if (targetCommunityId) {
    const community = await prisma.community.findFirst({
      where: { id: targetCommunityId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!community) {
      return { error: "La Comunidad seleccionada no está activa." };
    }

    targetCommunityName = community.name;
  }

  const isLeader = activity.leaders.some(
    (leader) => leader.userId === user.id,
  );

  // El COORDINADOR de la comunidad organizadora también puede presentar la
  // hoja en actividades de Avanzada.
  const leaderCommunityIds = new Set(
    activity.leaders
      .map((leader) => leader.user.communityId)
      .filter((value): value is string => Boolean(value)),
  );
  const isOrganizingCoordinator =
    user.role === "COORDINADOR" &&
    Boolean(user.communityId) &&
    leaderCommunityIds.has(user.communityId as string);

  // El joven Responsable de un proyecto vinculado a esta actividad también
  // puede presentarla.
  const isProjectResponsible = Boolean(
    await prisma.projectActivityItem.findFirst({
      where: {
        activityId,
        project: {
          responsibleUserId: user.id,
          workGroupStatus: "ACTIVO",
        },
      },
      select: { id: true },
    }),
  );

  const canUpload = canUploadRouteSheet({
    actorRole: user.role,
    actorCommunityId: user.communityId,
    targetCommunityId,
    activityScope: activity.scope,
    isLeader,
    isOrganizingCoordinator,
    isProjectResponsible,
    allowAnyPpUpload: settings.allowAnyPpRouteSheetUpload,
  });

  if (!canUpload) {
    return {
      error:
        activity.scope === "COMUNIDAD"
          ? "Solo la coordinación, los encargados y los miembros activos de esa Comunidad pueden presentar su hoja de ruta. El Equipo Adulto puede hacerlo seleccionando la Comunidad."
          : "Solo el Equipo Adulto, los encargados de la actividad, la coordinación de la comunidad organizadora y el Responsable de un proyecto vinculado pueden presentar su hoja de ruta.",
    };
  }

  const existing = await prisma.routeSheet.findMany({
    where: { activityId, communityId: targetCommunityId, deletedAt: null },
    orderBy: { version: "desc" },
    select: { id: true, status: true, version: true },
  });

  const pending = existing.find(
    (sheet) => sheet.status === "PENDIENTE_AUTORIZACION",
  );

  if (pending) {
    return {
      error: `La versión ${pending.version}${
        targetCommunityName ? ` de ${targetCommunityName}` : ""
      } está en revisión. Espera la respuesta de un AA antes de subir otra.`,
    };
  }

  const approved = existing.find((sheet) => sheet.status === "APROBADA");

  if (approved) {
    return {
      error: targetCommunityName
        ? `La Comunidad ${targetCommunityName} ya tiene una hoja de ruta aprobada para esta actividad. Si necesitas reemplazarla, contacta a un AA.`
        : "Esta actividad ya tiene una hoja de ruta aprobada. Si necesitas reemplazarla, contacta a un AA.",
    };
  }

  const nextVersion =
    existing.reduce((max, sheet) => Math.max(max, sheet.version), 0) + 1;

  const originalName =
    uploadFile?.name.trim().slice(0, 255) ||
    `hoja-de-ruta-v${nextVersion}.pdf`;
  const mimeType = uploadFile?.type ?? "application/json";
  const objectKey = uploadFile
    ? `route-sheets/${activityId}/${randomUUID()}${fileExtension(
        originalName,
        mimeType,
      )}`
    : null;

  const storage = getStorage();
  let uploaded = false;

  try {
    if (uploadFile && objectKey) {
      await storage.put({
        key: objectKey,
        body: new Uint8Array(await uploadFile.arrayBuffer()),
        contentType: mimeType,
      });
      uploaded = true;
    }

    const structuredData =
      mode === "STRUCTURED" && parsed.data.structured
        ? (parsed.data.structured as Prisma.InputJsonValue)
        : undefined;

    const created = await prisma.$transaction(async (tx) => {
      let fileId: string | null = null;

      if (uploadFile && objectKey) {
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
        fileId = file.id;
      }

      const sheet = await tx.routeSheet.create({
        data: {
          activityId,
          communityId: targetCommunityId,
          projectId: projectId ?? null,
          uploadedById: user.id,
          fileId,
          title: title || `Hoja de ruta · ${activity.title}`.slice(0, 160),
          description: description || null,
          structuredData,
          version: nextVersion,
          status: "PENDIENTE_AUTORIZACION",
        },
        select: { id: true, version: true },
      });

      const audience = await getActiveAAIds(tx);
      const fullName = getDisplayName(user);

      for (const recipient of audience) {
        await notifyUser(
          {
            recipientId: recipient.id,
            type: "HOJA_ENVIADA",
            title: targetCommunityName
              ? `Hoja de ruta enviada: ${activity.title} · ${targetCommunityName}`
              : `Hoja de ruta enviada: ${activity.title}`,
            body: `${fullName} subió la versión ${sheet.version} de la hoja de ruta${
              targetCommunityName
                ? ` de la Comunidad ${targetCommunityName}`
                : ""
            } de «${activity.title}» y está pendiente de autorización.`,
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
            communityId: targetCommunityId,
            projectId: projectId ?? null,
            mode,
            version: sheet.version,
            fileId,
            originalName: uploadFile ? originalName : null,
            mimeType: uploadFile ? mimeType : null,
            sizeBytes: uploadFile?.size ?? null,
            structuredSections: structuredData
              ? Object.keys(parsed.data.structured ?? {}).length
              : 0,
          },
        },
        tx,
      );

      return sheet;
    });

    revalidateRouteSheets(activityId);

    return {
      success: `Hoja de ruta v${created.version}${
        targetCommunityName ? ` de ${targetCommunityName}` : ""
      } enviada. Un AA la revisará y te avisará por notificaciones.`,
    };
  } catch (error) {
    if (uploaded && objectKey) {
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
      communityId: true,
      version: true,
      status: true,
      uploadedById: true,
      community: { select: { id: true, name: true } },
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
        communityId: sheet.communityId,
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

    const communityMembers = sheet.communityId
      ? await tx.user.findMany({
          where: {
            communityId: sheet.communityId,
            role: { in: ["PP", "COORDINADOR"] },
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        })
      : [];

    const recipientIds = new Set([
      sheet.uploadedById,
      ...sheet.activity.leaders.map((leader) => leader.userId),
      ...communityMembers.map((member) => member.id),
    ]);

    for (const recipientId of recipientIds) {
      await notifyUser(
        {
          recipientId,
          type: "HOJA_APROBADA",
          title: sheet.community
            ? `Hoja de ruta aprobada: ${sheet.activity.title} · ${sheet.community.name}`
            : `Hoja de ruta aprobada: ${sheet.activity.title}`,
          body: `La versión ${sheet.version} de la hoja de ruta${
            sheet.community ? ` de la Comunidad ${sheet.community.name}` : ""
          } de «${sheet.activity.title}» fue aprobada. Ya está disponible en el calendario.`,
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
          communityId: sheet.communityId,
          reviewedById: actor.id,
        },
      },
      tx,
    );
  });

  revalidateRouteSheets(sheet.activityId);

  return {
    success: `Hoja de ruta v${sheet.version}${
      sheet.community ? ` de ${sheet.community.name}` : ""
    } aprobada. Ya es visible en el calendario.`,
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
      communityId: true,
      version: true,
      status: true,
      uploadedById: true,
      community: { select: { id: true, name: true } },
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

    const communityMembers = sheet.communityId
      ? await tx.user.findMany({
          where: {
            communityId: sheet.communityId,
            role: { in: ["PP", "COORDINADOR"] },
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        })
      : [];

    const recipientIds = new Set([
      sheet.uploadedById,
      ...sheet.activity.leaders.map((leader) => leader.userId),
      ...communityMembers.map((member) => member.id),
    ]);

    for (const recipientId of recipientIds) {
      await notifyUser(
        {
          recipientId,
          type: "HOJA_RECHAZADA",
          title: sheet.community
            ? `Hoja de ruta con observaciones: ${sheet.activity.title} · ${sheet.community.name}`
            : `Hoja de ruta rechazada: ${sheet.activity.title}`,
          body: `La versión ${sheet.version} de la hoja de ruta${
            sheet.community ? ` de la Comunidad ${sheet.community.name}` : ""
          } de «${sheet.activity.title}» fue rechazada. Motivo: «${truncate(reason, 260)}». Corrige el documento y sube una nueva versión.`,
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
          communityId: sheet.communityId,
          reviewedById: actor.id,
          rejectionReason: reason,
        },
      },
      tx,
    );
  });

  revalidateRouteSheets(sheet.activityId);

  return {
    success: `Hoja de ruta v${sheet.version}${
      sheet.community ? ` de ${sheet.community.name}` : ""
    } rechazada. La Comunidad y los encargados recibieron el motivo.`,
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
