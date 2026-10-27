import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getStorage } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("No autorizado.", { status: 401 });
  }

  const { fileId } = await params;

  const file = await prisma.file.findFirst({
    where: { id: fileId, deletedAt: null },
    select: {
      objectKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      isPublic: true,
      uploadedById: true,
      justifications: {
        take: 1,
        select: {
          attendanceResponse: { select: { userId: true } },
        },
      },
      routeSheets: {
        where: { deletedAt: null },
        select: {
          status: true,
          uploadedById: true,
          activity: {
            select: {
              isPublished: true,
              deletedAt: true,
              leaders: {
                where: { userId: user.id },
                select: { userId: true },
              },
            },
          },
        },
      },
      unitResources: {
        select: { isPublished: true },
      },
      logbookEntries: {
        where: { deletedAt: null },
        select: { status: true, authorId: true },
      },
    },
  });

  if (!file) {
    return new Response("Archivo no encontrado.", { status: 404 });
  }

  const isJustificationAuthor = file.justifications.some(
    (item) => item.attendanceResponse.userId === user.id,
  );
  const isUploader = file.uploadedById === user.id;
  const isAA = user.role === "AA";

  // Una hoja APROBADA de una actividad publicada es documentación abierta
  // para cualquier miembro activo. Mientras está pendiente o rechazada solo
  // la ven los AA, quien la subió y los encargados de la actividad.
  const canViewRouteSheet = file.routeSheets.some((sheet) => {
    if (isAA) return true;
    if (sheet.uploadedById === user.id) return true;
    if (sheet.activity.leaders.length > 0) return true;

    return (
      sheet.status === "APROBADA" &&
      sheet.activity.isPublished &&
      sheet.activity.deletedAt === null
    );
  });

  // Las imágenes de un recurso publicado son parte del material abierto de la
  // unidad. Un AA puede previsualizar también las imágenes de borradores.
  const canViewMaterialImage =
    file.unitResources.some((resource) => resource.isPublished) ||
    (isAA && file.unitResources.length > 0);

  // Las fotos de páginas publicadas son parte del libro abierto de la unidad.
  // Mientras la página está pendiente o rechazada solo las ven su autor, los
  // AA y el Guardián de La Bitácora.
  const canViewLogbookPhoto = file.logbookEntries.some(
    (entry) =>
      entry.status === "PUBLICADA" ||
      entry.authorId === user.id ||
      isAA ||
      user.isLogbookKeeper,
  );

  const allowed =
    file.isPublic ||
    isJustificationAuthor ||
    isUploader ||
    canViewRouteSheet ||
    canViewMaterialImage ||
    canViewLogbookPhoto;

  // Las fotos de páginas que aún no se publican nunca deben quedar en la caché
  // del navegador: en un dispositivo compartido otra sesión podría verlas.
  const cacheControl =
    file.logbookEntries.length > 0 &&
    file.logbookEntries.every((entry) => entry.status !== "PUBLICADA")
      ? "private, no-store"
      : "private, max-age=60";

  if (!allowed) {
    // Mismo 404 que un archivo inexistente para no revelar su existencia.
    return new Response("Archivo no encontrado.", { status: 404 });
  }

  let bytes: Uint8Array;

  try {
    bytes = await getStorage().get(file.objectKey);
  } catch {
    return new Response("Archivo no disponible.", { status: 404 });
  }

  const encodedName = encodeURIComponent(file.originalName);
  const isSvg = file.mimeType === "image/svg+xml";

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      ...(isSvg
        ? {
            // Un SVG servido inline puede contener scripts. La CSP los bloquea
            // incluso si el archivo se abre directamente en una pestaña.
            "Content-Security-Policy":
              "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
          }
        : {}),
    },
  });
}
