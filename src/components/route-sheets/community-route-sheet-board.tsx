import Link from "next/link";
import { CheckCircle2, Clock3, FileWarning, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  communityRouteSheetStatus,
  latestRouteSheetForCommunity,
  type RouteSheetThreadItem,
} from "@/features/route-sheets/rules";

const STATUS_STYLES = {
  SIN_ENTREGAR: {
    badge: "outline" as const,
    className: "border-line bg-canvas/60 text-ink-soft",
    icon: FileWarning,
  },
  PENDIENTE: {
    badge: "warning" as const,
    className: "border-amber-200 bg-amber-50/70 text-amber-900",
    icon: Clock3,
  },
  OBSERVACIONES: {
    badge: "danger" as const,
    className: "border-red-200 bg-red-50/70 text-red-800",
    icon: XCircle,
  },
  APROBADA: {
    badge: "success" as const,
    className: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
    icon: CheckCircle2,
  },
};

export interface CommunityRouteSheetBoardProps {
  communities: { id: string; name: string; color: string | null }[];
  sheets: (RouteSheetThreadItem & { id: string })[];
  hrefForCommunity?: (communityId: string) => string;
  highlightCommunityId?: string | null;
}

/**
 * Tablero semáforo por Comunidad para actividades con `scope === 'COMUNIDAD'`.
 * Cada hilo se evalúa sobre su propia última versión.
 */
export function CommunityRouteSheetBoard({
  communities,
  sheets,
  hrefForCommunity,
  highlightCommunityId = null,
}: CommunityRouteSheetBoardProps) {
  if (communities.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-canvas/40 p-3 text-xs text-ink-soft">
        Todavía no hay Comunidades activas en la Avanzada.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {communities.map((community) => {
        const latest = latestRouteSheetForCommunity(sheets, community.id);
        const status = communityRouteSheetStatus(latest);
        const style = STATUS_STYLES[status.key];
        const Icon = style.icon;
        const href = hrefForCommunity?.(community.id);

        const content = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: community.color ?? "#4527a0" }}
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-semibold text-ink">
                  {community.name}
                </span>
              </span>
              <Badge variant={style.badge}>
                <Icon className="size-3" aria-hidden="true" />
                {status.label}
              </Badge>
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">
              {latest
                ? `Última versión: v${latest.version}`
                : "La Comunidad aún no sube su hoja de ruta."}
            </p>
            {href ? (
              <span className="mt-1 inline-block text-[11px] font-semibold text-anil-700">
                Revisar hoja de esta Comunidad →
              </span>
            ) : null}
          </>
        );

        return (
          <li key={community.id}>
            {href ? (
              <Link
                href={href}
                className={`block rounded-xl border p-3 transition-colors hover:border-anil-300 ${style.className} ${
                  highlightCommunityId === community.id
                    ? "ring-2 ring-anil-300"
                    : ""
                }`}
              >
                {content}
              </Link>
            ) : (
              <div
                className={`rounded-xl border p-3 ${style.className} ${
                  highlightCommunityId === community.id
                    ? "ring-2 ring-anil-300"
                    : ""
                }`}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
