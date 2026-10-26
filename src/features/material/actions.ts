"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { firstIssue, readField } from "@/lib/form-data";
import {
  isMaterialImageMime,
  MATERIAL_IMAGE_MAX_BYTES,
  materialImageExtension,
} from "@/lib/material";
import { slugify } from "@/lib/slug";
import {
  materialResourceIdSchema,
  materialResourceSchema,
} from "@/features/material/schemas";
import { recordAudit } from "@/server/audit";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getStorage } from "@/server/storage";

interface ResourceSnapshot {
  title: string;
  summary: string | null;
  bodyMd: string;
  sortOrder: number;
  isPublished: boolean;
  imageFileId: string | null;
}

function snapshot(resource: ResourceSnapshot): ResourceSnapshot {
  return {
    title: resource.title,
    summary: resource.summary,
    bodyMd: resource.bodyMd,
    sortOrder: resource.sortOrder,
    isPublished: resource.isPublished,
    imageFileId: resource.imageFileId,
  };
}

function revalidateMaterial() {
  revalidatePath("/material");
  revalidatePath("/admin/material");
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  revalidatePath("/inicio");
  revalidatePath("/", "layout");
}

function uniqueSlugBase(title: string) {
  const base = slugify(title);
  return base === "comunidad" ? "recurso" : base;
}

async function buildUniqueSlug(
  title: string,
  tx: Prisma.TransactionClient,
) {
  const base = uniqueSlugBase(title);
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const existing = await tx.unitResource.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function svgIsSafe(bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes);
  return !/<script\b|on[a-z]+\s*=|javascript\s*:|<foreignObject\b|<!ENTITY\b/i.test(
    text,
  );
}

interface PreparedUpload {
  bytes: Uint8Array;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  objectKey: string;
}

async function prepareUpload(
  upload: File | null,
): Promise<{ upload: PreparedUpload | null; error?: string }> {
  if (!upload) return { upload: null };

  if (!isMaterialImageMime(upload.type)) {
    return {
      upload: null,
      error: "La imagen debe ser PNG, JPG, WEBP o SVG.",
    };
  }

  if (upload.size > MATERIAL_IMAGE_MAX_BYTES) {
    return {
      upload: null,
      error: "La imagen no puede superar los 5 MB.",
    };
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());

  if (upload.type === "image/svg+xml" && !svgIsSafe(bytes)) {
    return {
      upload: null,
      error:
        "El SVG contiene scripts o recursos incrustados no permitidos. Súbelo como PNG o JPG.",
    };
  }

  const extension = materialImageExtension(upload.name, upload.type);
  const objectKey = `material/${randomUUID()}${extension}`;

  return {
    upload: {
      bytes,
      mimeType: upload.type,
      originalName:
        upload.name.trim().slice(0, 255) || `imagen-material${extension}`,
      sizeBytes: upload.size,
      objectKey,
    },
  };
}

/**
 * Crea o actualiza un recurso de material digital.
 *
 * El estado de publicación se administra desde una acción aparte para que cada
 * cambio quede auditado como `material.toggle_publish`. La imagen se sube por
 * el adaptador de storage activo y queda vinculada a `files`.
 */
export async function saveMaterialResourceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("material:manage");

  const rawId = readField(formData, "id").trim();
  const idParsed = rawId
    ? materialResourceIdSchema.safeParse({ id: rawId })
    : null;

  if (idParsed && !idParsed.success) {
    return { error: firstIssue(idParsed.error) };
  }

  const parsed = materialResourceSchema.safeParse({
    title: readField(formData, "title"),
    summary: readField(formData, "summary") || undefined,
    bodyMd: readField(formData, "bodyMd"),
    sortOrder: readField(formData, "sortOrder"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const { title, summary, bodyMd, sortOrder } = parsed.data;
  // Normaliza los saltos de línea para que el mismo texto guardado se vea
  // igual sin importar el sistema operativo desde el que edita el AA.
  const normalizedBody = bodyMd.replace(/\r\n?/g, "\n");
  const resourceId = idParsed?.success ? idParsed.data.id : null;

  const current = resourceId
    ? await prisma.unitResource.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          summary: true,
          bodyMd: true,
          sortOrder: true,
          isPublished: true,
          imageFileId: true,
          imageFile: { select: { id: true, objectKey: true } },
        },
      })
    : null;

  if (resourceId && !current) {
    return { error: "El recurso ya no existe." };
  }

  const uploadValue = formData.get("image");
  const uploadFile =
    uploadValue instanceof File && uploadValue.size > 0 ? uploadValue : null;
  const prepared = await prepareUpload(uploadFile);

  if (prepared.error) {
    return { error: prepared.error };
  }

  const removeImage = readField(formData, "removeImage") === "on";
  const publishOnCreate = readField(formData, "isPublished") === "on";
  const storage = getStorage();
  const previousObjectKey = current?.imageFile?.objectKey ?? null;

  let uploadedKey: string | null = null;

  try {
    if (prepared.upload) {
      await storage.put({
        key: prepared.upload.objectKey,
        body: prepared.upload.bytes,
        contentType: prepared.upload.mimeType,
      });
      uploadedKey = prepared.upload.objectKey;
    }

    const result = await prisma.$transaction(async (tx) => {
      let imageFileId = current?.imageFileId ?? null;

      if (prepared.upload) {
        const file = await tx.file.create({
          data: {
            provider: storage.driver === "local" ? "LOCAL" : "R2",
            objectKey: prepared.upload.objectKey,
            originalName: prepared.upload.originalName,
            mimeType: prepared.upload.mimeType,
            sizeBytes: prepared.upload.sizeBytes,
            isPublic: false,
            uploadedById: actor.id,
          },
          select: { id: true },
        });
        imageFileId = file.id;
      } else if (removeImage && current?.imageFileId) {
        imageFileId = null;
      }

      if (!current) {
        const slug = await buildUniqueSlug(title, tx);
        const created = await tx.unitResource.create({
          data: {
            slug,
            title,
            summary: summary ?? null,
            bodyMd: normalizedBody,
            sortOrder,
            isPublished: publishOnCreate,
            imageFileId,
            updatedById: actor.id,
          },
          select: {
            id: true,
            title: true,
            summary: true,
            bodyMd: true,
            sortOrder: true,
            isPublished: true,
            imageFileId: true,
          },
        });

        await recordAudit(
          {
            actor,
            action: "material.create",
            entityType: "UnitResource",
            entityId: created.id,
            after: { ...snapshot(created), slug },
          },
          tx,
        );

        return { id: created.id, title: created.title, slug };
      }

      const updated = await tx.unitResource.update({
        where: { id: current.id },
        data: {
          title,
          summary: summary ?? null,
          bodyMd: normalizedBody,
          sortOrder,
          imageFileId,
          updatedById: actor.id,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          bodyMd: true,
          sortOrder: true,
          isPublished: true,
          imageFileId: true,
        },
      });

      if (
        (prepared.upload || removeImage) &&
        current.imageFileId &&
        current.imageFileId !== imageFileId
      ) {
        await tx.file.update({
          where: { id: current.imageFileId },
          data: { deletedAt: new Date() },
        });
      }

      await recordAudit(
        {
          actor,
          action: "material.update",
          entityType: "UnitResource",
          entityId: current.id,
          before: snapshot(current),
          after: snapshot(updated),
        },
        tx,
      );

      return { id: updated.id, title: updated.title, slug: null };
    });

    if (previousObjectKey && (prepared.upload || removeImage)) {
      await storage.delete(previousObjectKey).catch(() => undefined);
    }

    revalidateMaterial();

    return {
      success: current
        ? `Recurso «${result.title}» actualizado.`
        : `Recurso «${result.title}» creado.`,
    };
  } catch (error) {
    if (uploadedKey) {
      await storage.delete(uploadedKey).catch(() => undefined);
    }

    console.error("Error al guardar material digital", error);

    if (isUniqueViolation(error)) {
      return {
        error:
          "Ya existe un recurso con un identificador similar. Cambia el título e inténtalo otra vez.",
      };
    }

    return {
      error: "No pudimos guardar el recurso. Inténtalo nuevamente.",
    };
  }
}

/** Publica o vuelve a borrador un recurso, dejando rastro en auditoría. */
export async function toggleMaterialPublishAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("material:manage");

  const parsed = materialResourceIdSchema.safeParse({
    id: readField(formData, "id"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const resource = await prisma.unitResource.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true, isPublished: true },
  });

  if (!resource) {
    return { error: "El recurso ya no existe." };
  }

  const nextPublished = !resource.isPublished;

  await prisma.$transaction(async (tx) => {
    await tx.unitResource.update({
      where: { id: resource.id },
      data: {
        isPublished: nextPublished,
        updatedById: actor.id,
      },
    });

    await recordAudit(
      {
        actor,
        action: "material.toggle_publish",
        entityType: "UnitResource",
        entityId: resource.id,
        before: { isPublished: resource.isPublished },
        after: { isPublished: nextPublished },
      },
      tx,
    );
  });

  revalidateMaterial();

  return {
    success: nextPublished
      ? `«${resource.title}» ya es visible para toda la unidad.`
      : `«${resource.title}» quedó en borrador; solo los AA pueden verlo.`,
  };
}
