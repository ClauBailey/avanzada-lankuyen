import Link from "next/link";
import { BookOpenCheck, Compass, Sparkles, UsersRound } from "lucide-react";

import {
  CompassTemplateCreateForm,
  CompassTemplateEditForm,
  DeleteCompassTemplateButton,
} from "@/components/admin/compass-template-forms";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  COMPASS_AREAS,
  compassAreaDefinition,
  type CompassAreaKey,
} from "@/features/compass/catalog";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Objetivos de La Brújula · Panel AA",
};

function isAreaKey(value: string): value is CompassAreaKey {
  return COMPASS_AREAS.some((area) => area.key === value);
}

export default async function AdminObjetivosPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  await requirePermission("compass_template:manage");
  const { area: areaParam } = await searchParams;
  const selectedArea = areaParam && isAreaKey(areaParam) ? areaParam : null;

  const templates = await prisma.compassObjectiveTemplate.findMany({
    orderBy: [{ area: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      area: true,
      terminalObjective: true,
      intermediateObjective: true,
      sortOrder: true,
      _count: { select: { adoptions: true } },
    },
  });

  const filtered = selectedArea
    ? templates.filter((template) => template.area === selectedArea)
    : templates;

  const totalAdoptions = templates.reduce(
    (sum, template) => sum + template._count.adoptions,
    0,
  );
  const nextSortOrder =
    templates.reduce((max, template) => Math.max(max, template.sortOrder), 0) +
    10;

  const grouped = COMPASS_AREAS.map((area) => ({
    area,
    items: filtered.filter((template) => template.area === area.key),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="La Brújula · Catálogo referencial"
        title="Objetivos de La Brújula"
        description="Edita, agrega o corrige las plantillas oficiales del Manual (pp. 175–201). El catálogo es referencial: cada persona joven escribe y conserva su propia redacción e historial."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <BookOpenCheck className="size-3.5" aria-hidden="true" />
              {templates.length} plantillas
            </Badge>
            <Link
              href="/acompanamiento"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <UsersRound className="size-4" aria-hidden="true" />
              Ir a acompañamiento
            </Link>
          </div>
        }
      />

      <Card className="border-anil-200 bg-anil-50/40 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles className="size-4 text-anil-700" aria-hidden="true" />
          Invariante constitucional
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          El Equipo Adulto edita únicamente estas plantillas referenciales.
          Jamás modifica los objetivos personales de una persona joven ni su historial de
          versiones. Si corriges una plantilla que alguien ya adoptó, su
          redacción se conserva intacta y verá la propuesta oficial como
          referencia.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Plantillas"
          value={templates.length}
          hint="Objetivos referenciales del Manual"
          icon={Compass}
        />
        <StatCard
          label="Áreas cubiertas"
          value={new Set(templates.map((template) => template.area)).size}
          hint="Seis áreas de Desarrollo"
          icon={Sparkles}
        />
        <StatCard
          label="Adopciones"
          value={totalAdoptions}
          hint="Objetivos personales vinculados (sin exponer identidades)"
          icon={UsersRound}
        />
      </div>

      <nav aria-label="Filtrar por Área de Desarrollo" className="flex flex-wrap gap-2">
        <Link
          href="/admin/objetivos"
          className={buttonVariants({
            variant: selectedArea ? "ghost" : "secondary",
            size: "sm",
          })}
        >
          Todas las áreas
        </Link>
        {COMPASS_AREAS.map((area) => (
          <Link
            key={area.key}
            href={`/admin/objetivos?area=${area.key}`}
            className={buttonVariants({
              variant: selectedArea === area.key ? "secondary" : "ghost",
              size: "sm",
            })}
          >
            {area.label}
          </Link>
        ))}
      </nav>

      <Card>
        <details>
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 hover:bg-canvas/40">
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                Agregar objetivo al catálogo
              </p>
              <p className="text-xs text-ink-soft">
                Suma una línea educativa del Manual en cualquiera de las seis
                Áreas de Desarrollo.
              </p>
            </div>
            <Badge variant="outline">Nuevo</Badge>
          </summary>
          <CardContent className="border-t border-line/70 pt-4">
            <CompassTemplateCreateForm nextSortOrder={nextSortOrder} />
          </CardContent>
        </details>
      </Card>

      {grouped.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No hay plantillas en esta área"
          description="Prueba con otra Área de Desarrollo o agrega una nueva línea educativa al catálogo."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.area.key} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-ink">
                  {compassAreaDefinition(group.area.key).label}
                </h2>
                <Badge variant="outline">{group.items.length} objetivos</Badge>
              </div>
              <p className="text-sm text-ink-soft">
                {compassAreaDefinition(group.area.key).description}
              </p>

              <div className="space-y-3">
                {group.items.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="default">{template.code}</Badge>
                          <span className="font-mono text-[10px] text-ink-soft">
                            orden {template.sortOrder}
                          </span>
                          <Badge
                            variant={
                              template._count.adoptions > 0
                                ? "success"
                                : "outline"
                            }
                          >
                            {template._count.adoptions} adopción
                            {template._count.adoptions === 1 ? "" : "es"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                          Horizonte terminal
                        </p>
                        <p className="text-sm text-ink">
                          {template.terminalObjective}
                        </p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                          Objetivo intermedio (15–17 años)
                        </p>
                        <p className="text-sm text-ink">
                          {template.intermediateObjective}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
                      <CompassTemplateEditForm
                        template={{
                          id: template.id,
                          code: template.code,
                          area: template.area,
                          terminalObjective: template.terminalObjective,
                          intermediateObjective: template.intermediateObjective,
                          sortOrder: template.sortOrder,
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <DeleteCompassTemplateButton
                          templateId={template.id}
                          code={template.code}
                          adoptions={template._count.adoptions}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
