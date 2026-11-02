import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Lightbulb,
  PenLine,
  SearchX,
  ShieldCheck,
} from "lucide-react";

import { MaterialFilters } from "@/components/material/material-filters";
import { MaterialProposalForm } from "@/components/material/material-proposal-form";
import {
  BanderaSection,
  GritoSection,
  HimnoSection,
  LibrarySection,
  OracionSection,
} from "@/components/material/material-sections";
import { MaterialSectionNav } from "@/components/material/material-section-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  findMaterialCore,
  isMaterialCoreKey,
  MATERIAL_CORE,
  materialMatches,
  type MaterialCoreKey,
  type MaterialResourceView,
} from "@/lib/material";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Material digital",
};

type SearchParams = {
  q?: string;
  seccion?: string;
};

const FOUR_PILLARS = ["grito", "oracion", "himno", "bandera"] as const;

function visibleSections(
  core: Map<MaterialCoreKey, MaterialResourceView>,
  additional: MaterialResourceView[],
  query: string,
  section: MaterialCoreKey | "",
) {
  const matches = (key: MaterialCoreKey) => {
    const resource = core.get(key);
    return Boolean(resource && materialMatches(resource, query));
  };
  const sectionMatches = (key: MaterialCoreKey) => !section || section === key;

  const filteredAdditional = sectionMatches("otros")
    ? additional.filter((resource) => materialMatches(resource, query))
    : [];

  const visible: Record<MaterialCoreKey, boolean> = {
    grito: sectionMatches("grito") && matches("grito"),
    oracion: sectionMatches("oracion") && matches("oracion"),
    himno: sectionMatches("himno") && matches("himno"),
    bandera: sectionMatches("bandera") && matches("bandera"),
    otros:
      sectionMatches("otros") &&
      (matches("otros") || filteredAdditional.length > 0),
  };

  let resultCount = 0;

  for (const key of FOUR_PILLARS) {
    if (visible[key]) resultCount += 1;
  }

  if (sectionMatches("otros") && matches("otros")) resultCount += 1;
  resultCount += filteredAdditional.length;

  return { visible, filteredAdditional, resultCount };
}

export default async function MaterialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission("material:view");
  const params = await searchParams;

  const query = params.q?.trim().slice(0, 120) ?? "";
  const section = isMaterialCoreKey(params.seccion) ? params.seccion : "";

  const resources = await prisma.unitResource.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      bodyMd: true,
      imageFileId: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  const core = new Map<MaterialCoreKey, MaterialResourceView>();
  const additional: MaterialResourceView[] = [];

  for (const resource of resources) {
    const meta = findMaterialCore(resource.slug);
    if (meta) core.set(meta.key, resource);
    else additional.push(resource);
  }

  const canPropose = can(user, "material:propose");
  const ownProposals = canPropose
    ? await prisma.unitResource.findMany({
        where: { proposedById: user.id, isPublished: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
        },
      })
    : [];

  const { visible, filteredAdditional, resultCount } = visibleSections(
    core,
    additional,
    query,
    section,
  );

  const grito = core.get("grito");
  const oracion = core.get("oracion");
  const himno = core.get("himno");
  const bandera = core.get("bandera");
  const otros = core.get("otros");
  const otrosMatches =
    Boolean(otros && materialMatches(otros, query)) &&
    (!section || section === "otros");

  const navSections = MATERIAL_CORE.filter((item) => visible[item.key]).map(
    (item) => ({
      key: item.key,
      label: item.label,
      shortLabel: item.shortLabel,
    }),
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 shadow-float sm:p-9">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-25" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-80" />
        <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-lavender/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              <BookOpen className="size-3" aria-hidden="true" />
              Identidad de la unidad
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-anil-100/70">
              <Compass className="size-3" aria-hidden="true" />
              Añil y Blanco
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-anil-100/70">
              {resources.length} recurso{resources.length === 1 ? "" : "s"} publicado
              {resources.length === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-anil-200/65">
            Material digital
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.08] text-white sm:text-5xl">
            Sendero y Cumbre
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-anil-100/75 sm:text-base">
            El Grito, la Oración, el Himno, la Bandera y la palabra que compartimos.
            Un espacio para leer con calma desde el teléfono, antes de una formación,
            en una ceremonia o alrededor del fuego.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              href="#grito"
              className={buttonVariants({ variant: "gold", size: "sm" })}
            >
              Comenzar a leer
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            {user.role === "AA" ? (
              <Link
                href="/admin/material"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className:
                    "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15",
                })}
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Editar material
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <MaterialFilters
          sections={MATERIAL_CORE.map((item) => ({
            key: item.key,
            label: item.label,
          }))}
          section={section}
          query={query}
          resultCount={resultCount}
          totalCount={resources.length}
        />
      </Suspense>

      {canPropose ? (
        <Card className="overflow-hidden">
          <details className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-canvas/50">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-800 text-white">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    Proponer material como coordinación
                  </p>
                  <p className="text-xs text-ink-soft">
                    Fichas técnicas, guías o recursos que la unidad podría
                    necesitar. El Equipo Adulto los revisa y publica.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ownProposals.length > 0 ? (
                  <Badge variant="warning">
                    {ownProposals.length} en revisión
                  </Badge>
                ) : null}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-anil-700">
                  <PenLine className="size-3.5" aria-hidden="true" />
                  Abrir formulario
                </span>
              </div>
            </summary>
            <div className="space-y-4 border-t border-line/70 bg-canvas/25 p-5 sm:p-6">
              <MaterialProposalForm />

              {ownProposals.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Tus propuestas pendientes
                  </p>
                  <ul className="space-y-1.5">
                    {ownProposals.map((proposal) => (
                      <li
                        key={proposal.id}
                        className="rounded-lg border border-line/70 bg-surface px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-ink">
                          {proposal.title}
                        </p>
                        {proposal.summary ? (
                          <p className="text-[11px] text-ink-soft">
                            {proposal.summary}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        </Card>
      ) : null}

      {navSections.length > 0 ? (
        <MaterialSectionNav sections={navSections} />
      ) : null}

      {resultCount === 0 ? (
        <Card className="border-dashed bg-surface/70 p-6">
          <EmptyState
            icon={resources.length === 0 ? BookOpen : SearchX}
            title={
              resources.length === 0
                ? "Todavía no hay material publicado"
                : "No encontramos material con ese filtro"
            }
            description={
              resources.length === 0
                ? "Los AA de la unidad aún no han publicado recursos. Cuando lo hagan, aparecerán aquí para toda la Avanzada."
                : "Prueba con otra palabra o revisa todo el material de la unidad. Solo se muestran los recursos publicados por los AA."
            }
            className="border-0 bg-transparent p-0"
          />
          {query || section ? (
            <div className="mt-4 text-center">
              <Link
                href="/material"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Ver todo el material
              </Link>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          {visible.grito && grito ? <GritoSection resource={grito} /> : null}
          {visible.oracion && oracion ? (
            <OracionSection resource={oracion} />
          ) : null}
          {visible.himno && himno ? <HimnoSection resource={himno} /> : null}
          {visible.bandera && bandera ? (
            <BanderaSection resource={bandera} />
          ) : null}
          {visible.otros ? (
            <LibrarySection
              intro={otrosMatches ? otros ?? null : null}
              resources={filteredAdditional}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
