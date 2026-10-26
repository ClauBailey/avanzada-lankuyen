import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CircleDashed,
  Eye,
  Library,
  PenLine,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { MaterialPublishToggle } from "@/components/admin/material-publish-toggle";
import { MaterialResourceForm } from "@/components/admin/material-resource-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { findMaterialCore } from "@/lib/material";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Material · Panel AA",
};

export default async function AdminMaterialPage() {
  await requirePermission("material:manage");

  const resources = await prisma.unitResource.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      bodyMd: true,
      imageFileId: true,
      sortOrder: true,
      isPublished: true,
      updatedAt: true,
    },
  });

  const published = resources.filter((resource) => resource.isPublished).length;
  const drafts = resources.length - published;
  const nextSortOrder =
    resources.reduce((max, resource) => Math.max(max, resource.sortOrder), 0) +
    10;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Material digital"
        description="Edita el Grito, la Oración, el Himno y la Bandera; agrega recursos a la biblioteca y decide qué ve la unidad. Cada cambio queda en la auditoría."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/material"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Eye className="size-4" aria-hidden="true" />
              Ver como la unidad
            </Link>
            <Badge variant="outline">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {resources.length} recurso{resources.length === 1 ? "" : "s"}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Publicados"
          value={published}
          hint="Visibles en /material para toda la unidad"
          icon={Eye}
          className="border-emerald-200/70 bg-emerald-50/30"
        />
        <StatCard
          label="En borrador"
          value={drafts}
          hint="Solo visibles para los AA"
          icon={CircleDashed}
          className={drafts > 0 ? "border-amber-200/80 bg-amber-50/30" : undefined}
        />
        <StatCard
          label="Recursos totales"
          value={resources.length}
          hint="4 pilares, biblioteca y recursos nuevos"
          icon={Library}
        />
      </div>

      <Card className="overflow-hidden">
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-canvas/50">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-800 text-white">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  Crear un recurso nuevo
                </p>
                <p className="text-xs text-ink-soft">
                  Manuales, historia, cantos o guías que se suman a la biblioteca
                  de la unidad.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-anil-700">
              <PenLine className="size-3.5" aria-hidden="true" />
              Abrir formulario
            </span>
          </summary>
          <div className="border-t border-line/70 bg-canvas/25 p-5 sm:p-6">
            <MaterialResourceForm mode="create" nextSortOrder={nextSortOrder} />
          </div>
        </details>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-600">
              Contenido de la unidad
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Recursos y pilares
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Los pilares se ordenan por su campo «Orden» y aparecen en el lector
              con su diseño propio. Los recursos adicionales se suman a la
              biblioteca.
            </p>
          </div>
          <Badge variant="outline">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Solo AA
          </Badge>
        </div>

        <ul className="space-y-4">
          {resources.map((resource) => {
            const core = findMaterialCore(resource.slug);
            const anchor = core?.key ?? "otros";

            return (
              <li key={resource.id}>
                <Card
                  className={cn(
                    "overflow-hidden",
                    !resource.isPublished && "border-dashed",
                  )}
                >
                  <div className="flex flex-col gap-4 border-b border-line/70 bg-canvas/25 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-start gap-3.5">
                      {resource.imageFileId ? (
                        <Image
                          src={`/api/files/${resource.imageFileId}`}
                          alt={resource.title}
                          width={160}
                          height={112}
                          unoptimized
                          className="h-20 w-28 shrink-0 rounded-xl border border-line bg-white object-contain p-1"
                        />
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-anil-50 text-anil-700">
                          {core ? (
                            <BookOpen className="size-5" aria-hidden="true" />
                          ) : (
                            <Library className="size-5" aria-hidden="true" />
                          )}
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={core ? "gold" : "default"}>
                            {core ? "Pilar de identidad" : "Biblioteca"}
                          </Badge>
                          <Badge
                            variant={resource.isPublished ? "success" : "warning"}
                          >
                            {resource.isPublished ? "Publicado" : "Borrador"}
                          </Badge>
                          <span className="font-mono text-[10px] text-ink-soft">
                            orden {resource.sortOrder}
                          </span>
                          <span className="font-mono text-[10px] text-ink-soft">
                            /{resource.slug}
                          </span>
                        </div>

                        <h3 className="mt-1.5 font-display text-lg font-semibold leading-tight text-ink">
                          {resource.title}
                        </h3>
                        {resource.summary ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
                            {resource.summary}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Actualizado el {formatTimestamp(resource.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <MaterialPublishToggle
                        id={resource.id}
                        title={resource.title}
                        isPublished={resource.isPublished}
                      />
                      <Link
                        href={`/material#${anchor}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        Ver en el lector
                      </Link>
                    </div>
                  </div>

                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-anil-700 hover:bg-canvas/40 sm:px-5">
                      <span className="inline-flex items-center gap-1.5">
                        <PenLine className="size-3.5" aria-hidden="true" />
                        Editar contenido, imagen y orden
                      </span>
                      <span className="text-[11px] font-normal text-ink-soft group-open:hidden">
                        Abrir
                      </span>
                      <span className="hidden text-[11px] font-normal text-ink-soft group-open:inline">
                        Cerrar
                      </span>
                    </summary>
                    <div className="border-t border-line/70 bg-canvas/20 p-4 sm:p-5">
                      <MaterialResourceForm
                        mode="edit"
                        resource={{
                          id: resource.id,
                          slug: resource.slug,
                          title: resource.title,
                          summary: resource.summary,
                          bodyMd: resource.bodyMd,
                          sortOrder: resource.sortOrder,
                          isPublished: resource.isPublished,
                          imageFileId: resource.imageFileId,
                        }}
                      />
                    </div>
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
