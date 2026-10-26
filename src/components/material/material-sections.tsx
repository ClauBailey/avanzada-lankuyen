import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Flag,
  Headphones,
  Library,
  Megaphone,
  Music,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

import { CopyTextButton } from "@/components/material/copy-text-button";
import { FlagLightbox } from "@/components/material/flag-lightbox";
import { MarkdownContent } from "@/components/material/markdown-content";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatShortDate } from "@/lib/dates";
import {
  MATERIAL_CORE,
  plainTextFromMarkdown,
  type MaterialCoreKey,
  type MaterialResourceView,
} from "@/lib/material";
import { cn } from "@/lib/utils";

function coreMeta(key: MaterialCoreKey) {
  return MATERIAL_CORE.find((item) => item.key === key)!;
}

function UpdatedNote({ resource }: { resource: MaterialResourceView }) {
  return (
    <p className="text-[11px] text-ink-soft">
      Actualizado el {formatShortDate(resource.updatedAt)} por los AA de la unidad.
    </p>
  );
}

interface SectionHeadingProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  summary: string | null;
  resource: MaterialResourceView;
  dark?: boolean;
  accent?: "anil" | "gold";
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  summary,
  resource,
  dark = false,
  accent = "anil",
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl",
            dark
              ? "border border-white/15 bg-white/10 text-gold"
              : accent === "gold"
                ? "bg-gold-soft text-[#7a5a16]"
                : "bg-anil-50 text-anil-700",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.22em]",
              dark ? "text-gold" : "text-anil-600",
            )}
          >
            {eyebrow}
          </p>
          <h2
            className={cn(
              "mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl",
              dark ? "text-white" : "text-ink",
            )}
          >
            {title}
          </h2>
          {summary ? (
            <p
              className={cn(
                "mt-1.5 max-w-xl text-sm leading-relaxed",
                dark ? "text-anil-100/70" : "text-ink-soft",
              )}
            >
              {summary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        <CopyTextButton
          text={plainTextFromMarkdown(resource.bodyMd)}
          appearance={dark ? "dark" : "light"}
        />
      </div>
    </div>
  );
}

export function GritoSection({ resource }: { resource: MaterialResourceView }) {
  return (
    <section id="grito" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-anil-950 p-6 shadow-float sm:p-10">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-25" />
        <div className="mountain-bg pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative">
          <SectionHeading
            icon={Megaphone}
            eyebrow={coreMeta("grito").eyebrow}
            title={resource.title}
            summary={resource.summary}
            resource={resource}
            dark
          />

          <div className="mt-7 border-t border-white/10 pt-7">
            <MarkdownContent
              content={resource.bodyMd}
              tone="grito"
              omitHeading={resource.title}
            />
          </div>

          <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.18em] text-anil-200/55">
            Texto de la Avanzada Lankuyen · actualizado el{" "}
            {formatShortDate(resource.updatedAt)}
          </p>
        </div>
      </div>
    </section>
  );
}

export function OracionSection({ resource }: { resource: MaterialResourceView }) {
  return (
    <section id="oracion" className="scroll-mt-24">
      <Card className="overflow-hidden border-anil-100">
        <div className="relative border-b border-anil-100/80 bg-gradient-to-r from-anil-50 via-white to-anil-50/60 p-5 sm:p-7">
          <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.18]" />
          <div className="relative">
            <SectionHeading
              icon={Sparkles}
              eyebrow={coreMeta("oracion").eyebrow}
              title={resource.title}
              summary={resource.summary}
              resource={resource}
            />
          </div>
        </div>

        <div className="relative bg-[radial-gradient(circle_at_50%_0%,rgba(98,104,192,0.10),transparent_62%)] px-5 py-10 sm:px-10 sm:py-14">
          <div className="mx-auto mb-7 flex max-w-xs items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-anil-200" />
            <Star className="size-3.5 text-gold" aria-hidden="true" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-anil-200" />
          </div>

          <MarkdownContent
            content={resource.bodyMd}
            tone="prayer"
            omitHeading={resource.title}
            className="mx-auto max-w-2xl"
          />

          <div className="mx-auto mt-9 flex max-w-xs items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-anil-200" />
            <span className="size-1.5 rounded-full bg-gold/70" aria-hidden="true" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-anil-200" />
          </div>
        </div>
      </Card>
    </section>
  );
}

export function HimnoSection({ resource }: { resource: MaterialResourceView }) {
  return (
    <section id="himno" className="scroll-mt-24">
      <Card className="overflow-hidden">
        <div className="border-b border-line/70 bg-gradient-to-r from-anil-50/80 via-surface to-surface p-5 sm:p-7">
          <SectionHeading
            icon={Music}
            eyebrow={coreMeta("himno").eyebrow}
            title={resource.title}
            summary={resource.summary}
            resource={resource}
            accent="gold"
          />
        </div>

        <div className="p-5 sm:p-9">
          <div className="mx-auto max-w-2xl">
            <MarkdownContent
              content={resource.bodyMd}
              tone="anthem"
              omitHeading={resource.title}
            />
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-2 border-t border-line/70 pt-4 text-[11px] leading-relaxed text-ink-soft">
            <Headphones className="mt-0.5 size-3.5 shrink-0 text-anil-500" aria-hidden="true" />
            <p>
              La letra conserva los saltos de línea para leerla o cantarla desde el
              teléfono. Los AA pueden agregar enlaces a audio o acordes dentro del
              texto del himno.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

export function BanderaSection({ resource }: { resource: MaterialResourceView }) {
  const hasImage = Boolean(resource.imageFileId);
  const src = hasImage
    ? `/api/files/${resource.imageFileId}`
    : "/material/bandera-placeholder.svg";
  const alt = "Bandera de la Avanzada Lankuyen";

  return (
    <section id="bandera" className="scroll-mt-24">
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <div className="relative overflow-hidden bg-anil-950 p-4 sm:p-6">
            <div className="topo-bg pointer-events-none absolute inset-0 opacity-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-anil-950 to-transparent" />
            <div className="relative">
              <FlagLightbox
                src={src}
                alt={alt}
                isPlaceholder={!hasImage}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-[11px] leading-relaxed text-anil-100/65">
                  {hasImage
                    ? "Bandera oficial de la Avanzada · toca la imagen para ampliarla."
                    : "Imagen de referencia · los AA aún no han subido la bandera oficial."}
                </p>
                {hasImage ? (
                  <a
                    href={src}
                    download
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className:
                        "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15",
                    })}
                  >
                    <Download aria-hidden="true" />
                    Descargar
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <SectionHeading
              icon={Flag}
              eyebrow={coreMeta("bandera").eyebrow}
              title={resource.title}
              summary={resource.summary}
              resource={resource}
              accent="gold"
            />

            <div className="mt-6 border-t border-line/70 pt-5">
              <MarkdownContent
                content={resource.bodyMd}
                omitHeading={resource.title}
              />
            </div>

            <div className="mt-6">
              <UpdatedNote resource={resource} />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

interface LibrarySectionProps {
  intro: MaterialResourceView | null;
  resources: MaterialResourceView[];
}

export function LibrarySection({ intro, resources }: LibrarySectionProps) {
  return (
    <section id="otros" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-anil-50 text-anil-700">
            <Library className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-anil-600">
              {coreMeta("otros").eyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Biblioteca de la unidad
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Manuales, historia de Lankuyen, guías de etapa y lecturas que los AA
              comparten con toda la Avanzada.
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {resources.length} recurso{resources.length === 1 ? "" : "s"} adicional
          {resources.length === 1 ? "" : "es"}
        </Badge>
      </div>

      {intro ? (
        <Card className="overflow-hidden border-anil-100 bg-gradient-to-br from-anil-50/60 via-surface to-surface">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-600">
                  {coreMeta("otros").label}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink">
                  {intro.title}
                </h3>
                {intro.summary ? (
                  <p className="mt-1 text-sm text-ink-soft">{intro.summary}</p>
                ) : null}
              </div>
              <UpdatedNote resource={intro} />
            </div>
            <div className="mt-4 border-t border-line/70 pt-4">
              <MarkdownContent content={intro.bodyMd} omitHeading={intro.title} />
            </div>
          </div>
        </Card>
      ) : null}

      {resources.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <li key={resource.id} className="h-full">
              <Card className="flex h-full flex-col overflow-hidden">
                {resource.imageFileId ? (
                  <Image
                    src={`/api/files/${resource.imageFileId}`}
                    alt={resource.title}
                    width={800}
                    height={420}
                    unoptimized
                    className="h-40 w-full border-b border-line/70 object-cover"
                  />
                ) : null}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">Recurso de la unidad</Badge>
                    <span className="text-[11px] text-ink-soft">
                      {formatShortDate(resource.updatedAt)}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                    {resource.title}
                  </h3>
                  {resource.summary ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {resource.summary}
                    </p>
                  ) : null}

                  <details className="group mt-auto pt-4">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-anil-700 hover:text-anil-900">
                      Leer recurso
                      <span className="transition-transform group-open:rotate-90" aria-hidden="true">
                        ›
                      </span>
                    </summary>
                    <div className="mt-3 border-t border-line/70 pt-3">
                      <MarkdownContent
                        content={resource.bodyMd}
                        omitHeading={resource.title}
                      />
                    </div>
                  </details>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : intro ? null : (
        <Card className="border-dashed bg-surface/70 p-6">
          <p className="text-sm text-ink-soft">
            Los AA todavía no han publicado recursos adicionales en la biblioteca.
          </p>
          <Link
            href="/material"
            className="mt-2 inline-flex text-xs font-semibold text-anil-700 hover:text-anil-900"
          >
            Ver todo el material
          </Link>
        </Card>
      )}
    </section>
  );
}
