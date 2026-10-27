"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import { parseDateOnlyInput } from "@/lib/dates";
import {
  isAllowedLogbookPhotoMime,
  LOGBOOK_PHOTO_MAX_BYTES,
  logbookPhotoExtension,
  nextPublishedPageNumber,
} from "@/lib/logbook";
import {
  createLogbookEntrySchema,
  logbookEntryIdSchema,
  reviewLogbookEntrySchema,
  setLogbookKeeperSchema,
  updateLogbookEntrySchema,
} from "@/features/logbook/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { notifyUser } from "@/server/notifications";
import { getStorage } from "@/server/storage";
import { enqueuePushNotification } from "@/server/web-push";

function revalidateLogbook(entryId?: string) {
  revalidatePath("/bitacora");
  revalidatePath("/bitacora/revision");
  revalidatePath("/admin/bitacora");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  if (entryId) revalidatePath(`/bitacora/${entryId}/editar`);
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function truncate(value: string, max = 260) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function resolveActivityId(
  activityId: string | undefined,
): Promise<{ id: string | null; error?: string }> {
  if (!activityId) return { id: null };

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      deletedAt: null,
      isPublished: true,
      endsAt: { lte: new Date() },
    },
    select: { id: true },
  });

  if (!activity) {
    return {
      id: null,
      error: "La actividad seleccionada no existe o todavía no ha terminado.",
    };
  }

  return { id: activity.id };
}

async function preparePhoto(
  upload: File | null,
): Promise<{ file: File | null; error?: string }> {
  if (!upload) return { file: null };

  if (!isAllowedLogbookPhotoMime(upload.type)) {
    return {
      file: null,
      error: "La foto debe ser JPG, PNG o WEBP.",
    };
  }

  if (upload.size > LOGBOOK_PHOTO_MAX_BYTES) {
    return {
      file: null,
      error: "La foto supera el máximo de 1.5 MB después de optimizarla.",
    };
  }

  return { file: upload };
}

async function nextPageNumber(tx: Prisma.TransactionClient) {
  const current = await tx.logbookEntry.aggregate({
    where: { status: "PUBLICADA", deletedAt: null },
    _max: { pageNumber: true },
  });

  return nextPublishedPageNumber([current._max.pageNumber]);
}

async function getReviewAudience(
  tx: Prisma.TransactionClient,
  authorId: string,
) {
  return tx.user.findMany({
    where: {
      id: { not: authorId },
      isActive: true,
      deletedAt: null,
      OR: [{ role: "AA" }, { isLogbookKeeper: true }],
    },
    select: { id: true },
  });
}

async function notifyAudience(
  tx: Prisma.TransactionClient,
  entry: { id: string; title: string; authorId: string },
  authorName: string,
  dedupeSuffix = "initial",
) {
  const recipients = await getReviewAudience(tx, entry.authorId);

  for (const recipient of recipients) {
    await notifyUser(
      {
        recipientId: recipient.id,
        type: "BITACORA_ENVIADA",
        title: `Nueva página en La Bitácora: ${entry.title}`,
        body: `${authorName} escribió una página que espera revisión antes de sumarse al libro de la unidad.`,
        entityType: "LogbookEntry",
        entityId: entry.id,
        actionUrl: "/bitacora/revision",
        dedupeKey: `logbook:submit:${entry.id}:${recipient.id}:${dedupeSuffix}`,
        priority: 2,
      },
      tx,
    );
  }
}

export async function createLogbookEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("logbook:create");

  const parsed = createLogbookEntrySchema.safeParse({
    title: readField(formData, "title"),
    adventureDate: readField(formData, "adventureDate"),
    contentMd: readField(formData, "contentMd"),
    activityId: readField(formData, "activityId") || undefined,
    publishNow: readField(formData, "publishNow") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const adventureDate = parseDateOnlyInput(parsed.data.adventureDate);
  if (!adventureDate) return { error: "La fecha de la aventura no es válida." };

  const activity = await resolveActivityId(parsed.data.activityId);
  if (activity.error) return { error: activity.error };

  const uploadValue = formData.get("photo");
  const uploadFile =
    uploadValue instanceof File && uploadValue.size > 0 ? uploadValue : null;
  const prepared = await preparePhoto(uploadFile);
  if (prepared.error) return { error: prepared.error };

  const canReview = user.role === "AA" || user.isLogbookKeeper;
  const publishNow = canReview && parsed.data.publishNow === "on";
  const storage = getStorage();
  const objectKey = prepared.file
    ? `logbook/${randomUUID()}${logbookPhotoExtension(
        prepared.file.name,
        prepared.file.type,
      )}`
    : null;

  let uploaded = false;

  try {
    if (prepared.file && objectKey) {
      await storage.put({
        key: objectKey,
        body: new Uint8Array(await prepared.file.arrayBuffer()),
        contentType: prepared.file.type,
      });
      uploaded = true;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const photo = prepared.file
            ? await tx.file.create({
                data: {
                  provider: storage.driver === "local" ? "LOCAL" : "R2",
                  objectKey: objectKey!,
                  originalName:
                    prepared.file!.name.trim().slice(0, 255) ||
                    "foto-bitacora",
                  mimeType: prepared.file!.type,
                  sizeBytes: prepared.file!.size,
                  isPublic: false,
                  uploadedById: user.id,
                },
                select: { id: true },
              })
            : null;

          const pageNumber = publishNow ? await nextPageNumber(tx) : null;

          const entry = await tx.logbookEntry.create({
            data: {
              title: parsed.data.title,
              adventureDate,
              contentMd: parsed.data.contentMd.replace(/\r\n?/g, "\n"),
              status: publishNow ? "PUBLICADA" : "PENDIENTE_APROBACION",
              pageNumber,
              authorId: user.id,
              activityId: activity.id,
              photoFileId: photo?.id ?? null,
              publishedAt: publishNow ? new Date() : null,
              reviewedById: publishNow ? user.id : null,
              reviewedAt: publishNow ? new Date() : null,
            },
            select: { id: true, title: true },
          });

          const authorName = `${user.firstName} ${user.lastName}`;

          if (!publishNow) {
            await notifyAudience(
              tx,
              { ...entry, authorId: user.id },
              authorName,
            );
          }

          await recordAudit(
            {
              actor: user,
              action: "logbook.submit",
              entityType: "LogbookEntry",
              entityId: entry.id,
              after: {
                title: entry.title,
                adventureDate: parsed.data.adventureDate,
                activityId: activity.id,
                photoFileId: photo?.id ?? null,
                status: publishNow ? "PUBLICADA" : "PENDIENTE_APROBACION",
                pageNumber,
              },
            },
            tx,
          );

          if (publishNow) {
            await recordAudit(
              {
                actor: user,
                action: "logbook.approve",
                entityType: "LogbookEntry",
                entityId: entry.id,
                after: {
                  status: "PUBLICADA",
                  pageNumber,
                  reviewedById: user.id,
                  selfPublished: true,
                },
              },
              tx,
            );
          }

          return entry;
        });

        revalidateLogbook(created.id);

        return {
          success: publishNow
            ? "La página se publicó en La Bitácora."
            : "Página enviada. Un AA o el Guardián de la Bitácora la revisará.",
        };
      } catch (error) {
        if (isUniqueViolation(error) && publishNow && attempt < 2) continue;
        throw error;
      }
    }

    return { error: "No pudimos asignar el número de página. Inténtalo otra vez." };
  } catch (error) {
    if (uploaded && objectKey) {
      await storage.delete(objectKey).catch(() => undefined);
    }
    console.error("Error al crear página de La Bitácora", error);
    return { error: "No pudimos guardar la página. Inténtalo nuevamente." };
  }
}

/**
 * Permite al autor corregir y reenviar una página rechazada.
 */
export async function updateLogbookEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("logbook:create");

  const parsed = updateLogbookEntrySchema.safeParse({
    entryId: readField(formData, "entryId"),
    title: readField(formData, "title"),
    adventureDate: readField(formData, "adventureDate"),
    contentMd: readField(formData, "contentMd"),
    activityId: readField(formData, "activityId") || undefined,
    publishNow: readField(formData, "publishNow") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const adventureDate = parseDateOnlyInput(parsed.data.adventureDate);
  if (!adventureDate) return { error: "La fecha de la aventura no es válida." };

  const current = await prisma.logbookEntry.findFirst({
    where: { id: parsed.data.entryId, authorId: user.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      pageNumber: true,
      photoFileId: true,
      photoFile: { select: { objectKey: true } },
    },
  });

  if (!current) return { error: "La página no existe o no te pertenece." };
  if (current.status !== "RECHAZADA") {
    return {
      error: "Solo puedes corregir páginas rechazadas por la moderación.",
    };
  }

  const activity = await resolveActivityId(parsed.data.activityId);
  if (activity.error) return { error: activity.error };

  const uploadValue = formData.get("photo");
  const uploadFile =
    uploadValue instanceof File && uploadValue.size > 0 ? uploadValue : null;
  const prepared = await preparePhoto(uploadFile);
  if (prepared.error) return { error: prepared.error };

  const canReview = user.role === "AA" || user.isLogbookKeeper;
  const publishNow = canReview && parsed.data.publishNow === "on";
  const removePhoto = readField(formData, "removePhoto") === "on";
  const storage = getStorage();
  const newObjectKey = prepared.file
    ? `logbook/${randomUUID()}${logbookPhotoExtension(
        prepared.file.name,
        prepared.file.type,
      )}`
    : null;

  let uploaded = false;

  try {
    if (prepared.file && newObjectKey) {
      await storage.put({
        key: newObjectKey,
        body: new Uint8Array(await prepared.file.arrayBuffer()),
        contentType: prepared.file.type,
      });
      uploaded = true;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.$transaction(async (tx) => {
          const photo = prepared.file
            ? await tx.file.create({
                data: {
                  provider: storage.driver === "local" ? "LOCAL" : "R2",
                  objectKey: newObjectKey!,
                  originalName:
                    prepared.file!.name.trim().slice(0, 255) ||
                    "foto-bitacora",
                  mimeType: prepared.file!.type,
                  sizeBytes: prepared.file!.size,
                  isPublic: false,
                  uploadedById: user.id,
                },
                select: { id: true },
              })
            : null;

          const pageNumber = publishNow ? await nextPageNumber(tx) : null;

          await tx.logbookEntry.update({
            where: { id: current.id },
            data: {
              title: parsed.data.title,
              adventureDate,
              contentMd: parsed.data.contentMd.replace(/\r\n?/g, "\n"),
              activityId: activity.id,
              photoFileId: photo?.id ?? (removePhoto ? null : current.photoFileId),
              status: publishNow ? "PUBLICADA" : "PENDIENTE_APROBACION",
              pageNumber,
              publishedAt: publishNow ? new Date() : null,
              reviewedById: publishNow ? user.id : null,
              reviewedAt: publishNow ? new Date() : null,
              rejectionReason: null,
            },
          });

          const authorName = `${user.firstName} ${user.lastName}`;

          if (!publishNow) {
            await notifyAudience(
              tx,
              { id: current.id, title: parsed.data.title, authorId: user.id },
              authorName,
              `resubmit-${randomUUID()}`,
            );
          }

          await recordAudit(
            {
              actor: user,
              action: "logbook.submit",
              entityType: "LogbookEntry",
              entityId: current.id,
              before: {
                title: current.title,
                status: current.status,
                pageNumber: current.pageNumber,
              },
              after: {
                title: parsed.data.title,
                status: publishNow ? "PUBLICADA" : "PENDIENTE_APROBACION",
                pageNumber,
                resubmitted: true,
                photoFileId: photo?.id ?? current.photoFileId,
              },
            },
            tx,
          );

          if (publishNow) {
            await recordAudit(
              {
                actor: user,
                action: "logbook.approve",
                entityType: "LogbookEntry",
                entityId: current.id,
                after: {
                  status: "PUBLICADA",
                  pageNumber,
                  reviewedById: user.id,
                  selfPublished: true,
                },
              },
              tx,
            );
          }
        });

        if (current.photoFile?.objectKey && (prepared.file || removePhoto)) {
          await storage
            .delete(current.photoFile.objectKey)
            .catch(() => undefined);
        }

        revalidateLogbook(current.id);
        return {
          success: publishNow
            ? "La página corregida se publicó en La Bitácora."
            : "Página corregida y reenviada a revisión.",
        };
      } catch (error) {
        if (isUniqueViolation(error) && publishNow && attempt < 2) continue;
        throw error;
      }
    }

    return { error: "No pudimos asignar el número de página. Inténtalo otra vez." };
  } catch (error) {
    if (uploaded && newObjectKey) {
      await storage.delete(newObjectKey).catch(() => undefined);
    }
    console.error("Error al corregir página de La Bitácora", error);
    return { error: "No pudimos guardar los cambios. Inténtalo nuevamente." };
  }
}

export async function reviewLogbookEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("logbook:review");

  const parsed = reviewLogbookEntrySchema.safeParse({
    entryId: readField(formData, "entryId"),
    decision: readField(formData, "decision"),
    rejectionReason: readField(formData, "rejectionReason") || undefined,
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const entry = await prisma.logbookEntry.findFirst({
    where: { id: parsed.data.entryId, deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      pageNumber: true,
      authorId: true,
      author: { select: { firstName: true, lastName: true } },
    },
  });

  if (!entry) return { error: "La página ya no existe." };
  if (entry.status !== "PENDIENTE_APROBACION") {
    return {
      error:
        "Solo se pueden moderar páginas pendientes. Recarga la bandeja para ver el estado actual.",
    };
  }

  const approve = parsed.data.decision === "approve";
  const reason = parsed.data.rejectionReason ?? "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.$transaction(async (tx) => {
        const pageNumber = approve ? await nextPageNumber(tx) : null;

        await tx.logbookEntry.update({
          where: { id: entry.id },
          data: {
            status: approve ? "PUBLICADA" : "RECHAZADA",
            pageNumber,
            publishedAt: approve ? new Date() : null,
            reviewedById: actor.id,
            reviewedAt: new Date(),
            rejectionReason: approve ? null : reason,
          },
        });

        if (entry.authorId !== actor.id) {
          await notifyUser(
            {
              recipientId: entry.authorId,
              type: approve ? "BITACORA_APROBADA" : "BITACORA_RECHAZADA",
              title: approve
                ? `Tu página ya está en La Bitácora: ${entry.title}`
                : `Tu página necesita ajustes: ${entry.title}`,
              body: approve
                ? `La página fue aprobada y ocupa la página ${pageNumber} del libro de la unidad.`
                : `La moderación rechazó la página. Motivo: «${truncate(reason)}». Puedes corregirla y reenviarla.`,
              entityType: "LogbookEntry",
              entityId: entry.id,
              actionUrl: approve ? "/bitacora" : `/bitacora/${entry.id}/editar`,
              dedupeKey: `logbook:${approve ? "approved" : "rejected"}:${entry.id}:${entry.authorId}`,
              priority: approve ? 1 : 3,
            },
            tx,
          );
        }

        await recordAudit(
          {
            actor,
            action: approve ? "logbook.approve" : "logbook.reject",
            entityType: "LogbookEntry",
            entityId: entry.id,
            before: { status: entry.status, pageNumber: entry.pageNumber },
            after: {
              status: approve ? "PUBLICADA" : "RECHAZADA",
              pageNumber,
              reviewedById: actor.id,
              rejectionReason: approve ? null : reason,
            },
          },
          tx,
        );
      });

      revalidateLogbook(entry.id);

      // Post-commit: solo se avisa cuando la página quedó PUBLICADA y el
      // autor no es quien moderó.
      if (approve && entry.authorId !== actor.id) {
        enqueuePushNotification(entry.authorId, {
          title: "¡Página de Bitácora Publicada!",
          body: `Tu relato «${entry.title}» ha sido añadido oficialmente a la Bitácora de la Avanzada.`,
          url: "/bitacora",
          tag: `logbook-${entry.id}`,
        });
      }

      return {
        success: approve
          ? "Página aprobada y numerada en La Bitácora."
          : "Página rechazada. El autor recibió el motivo para corregirla.",
      };
    } catch (error) {
      if (isUniqueViolation(error) && approve && attempt < 2) continue;
      throw error;
    }
  }

  return { error: "No pudimos asignar el número de página. Inténtalo otra vez." };
}

/**
 * Asigna o traspasa el cargo de Guardián de La Bitácora.
 *
 * El cargo es acumulable al rol base y solo puede existir un guardián activo:
 * al asignar uno nuevo se retira el anterior en la misma transacción.
 */
export async function setLogbookKeeperAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("logbook:manage");

  const parsed = setLogbookKeeperSchema.safeParse({
    userId: readField(formData, "userId"),
    isKeeper: readField(formData, "isKeeper"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { userId } = parsed.data;
  const isKeeper = parsed.data.isKeeper === "true";

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      isLogbookKeeper: true,
    },
  });

  if (!target) return { error: "La cuenta no existe o está inactiva." };
  if (target.role === "AA") {
    return {
      error:
        "El cargo de Guardián es para PP o Coordinadores. Los AA ya moderan La Bitácora.",
    };
  }

  if (target.isLogbookKeeper === isKeeper) {
    return {
      success: isKeeper
        ? "Esta persona ya es Guardián de La Bitácora."
        : "Esta persona no tiene el cargo.",
    };
  }

  const previous = await prisma.user.findFirst({
    where: { isLogbookKeeper: true, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
  });

  await prisma.$transaction(async (tx) => {
    if (isKeeper) {
      await tx.user.updateMany({
        where: { isLogbookKeeper: true },
        data: { isLogbookKeeper: false },
      });
    }

    await tx.user.update({
      where: { id: target.id },
      data: { isLogbookKeeper: isKeeper },
    });

    await recordAudit(
      {
        actor,
        action: "logbook.assign_keeper",
        entityType: "User",
        entityId: target.id,
        before: previous
          ? {
              keeperId: previous.id,
              keeperName: `${previous.firstName} ${previous.lastName}`,
            }
          : null,
        after: {
          keeperId: isKeeper ? target.id : null,
          keeperName: isKeeper
            ? `${target.firstName} ${target.lastName}`
            : null,
          userId: target.id,
        },
      },
      tx,
    );
  });

  revalidateLogbook();

  return {
    success: isKeeper
      ? `${target.firstName} ${target.lastName} es ahora Guardián de La Bitácora.`
      : `${target.firstName} ${target.lastName} ya no es Guardián de La Bitácora.`,
  };
}

export async function deleteLogbookEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("logbook:manage");

  const parsed = logbookEntryIdSchema.safeParse({
    entryId: readField(formData, "entryId"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const entry = await prisma.logbookEntry.findFirst({
    where: { id: parsed.data.entryId, deletedAt: null },
    select: { id: true, title: true, status: true, pageNumber: true },
  });

  if (!entry) return { error: "La página ya no existe." };

  await prisma.$transaction(async (tx) => {
    await tx.logbookEntry.update({
      where: { id: entry.id },
      data: { deletedAt: new Date() },
    });

    await recordAudit(
      {
        actor,
        action: "logbook.delete",
        entityType: "LogbookEntry",
        entityId: entry.id,
        before: {
          title: entry.title,
          status: entry.status,
          pageNumber: entry.pageNumber,
        },
      },
      tx,
    );
  });

  revalidateLogbook(entry.id);
  return { success: "La página se retiró del libro." };
}
