import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  parseRouteSheetStructuredData,
  ROUTE_SHEET_STRUCTURED_SECTIONS,
} from "@/lib/route-sheets";

interface RouteSheetStructuredViewProps {
  data: unknown;
  className?: string;
  compact?: boolean;
}

/**
 * Renderiza las ocho secciones del formulario oficial de Hoja de Ruta
 * (Opción A). Los datos provienen de `RouteSheet.structuredData`.
 */
export function RouteSheetStructuredView({
  data,
  className,
  compact = false,
}: RouteSheetStructuredViewProps) {
  const structured = parseRouteSheetStructuredData(data);

  if (!structured) return null;

  return (
    <div
      className={
        className ??
        "rounded-2xl border border-anil-200 bg-anil-50/30 p-4"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardList className="size-4 text-anil-700" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-anil-800">
          Formulario oficial de Hoja de Ruta
        </p>
        <Badge variant="outline">
          {ROUTE_SHEET_STRUCTURED_SECTIONS.filter(
            (section) => structured[section.key],
          ).length}{" "}
          de {ROUTE_SHEET_STRUCTURED_SECTIONS.length} secciones
        </Badge>
      </div>

      <div
        className={
          compact
            ? "mt-3 space-y-2"
            : "mt-3 grid gap-3 sm:grid-cols-2"
        }
      >
        {ROUTE_SHEET_STRUCTURED_SECTIONS.map((section) => {
          const text = structured[section.key];
          if (!text) return null;
          return (
            <div
              key={section.key}
              className="rounded-xl border border-line/70 bg-surface/80 px-3 py-2"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                {section.order}. {section.label}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
