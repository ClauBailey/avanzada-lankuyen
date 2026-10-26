import type { RouteSheetStatus } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import {
  ROUTE_SHEET_STATUS_BADGE,
  ROUTE_SHEET_STATUS_LABELS,
} from "@/lib/route-sheets";
import { cn } from "@/lib/utils";

export function RouteSheetStatusBadge({
  status,
  className,
}: {
  status: RouteSheetStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={ROUTE_SHEET_STATUS_BADGE[status]}
      className={cn(className)}
    >
      {ROUTE_SHEET_STATUS_LABELS[status]}
    </Badge>
  );
}
