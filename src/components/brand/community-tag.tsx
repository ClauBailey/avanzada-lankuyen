import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommunityTagProps {
  name?: string | null;
  color?: string | null;
  className?: string;
}

export function CommunityTag({ name, color, className }: CommunityTagProps) {
  if (!name) {
    return (
      <Badge variant="outline" className={cn("normal-case tracking-normal", className)}>
        Sin comunidad asignada
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 normal-case tracking-normal", className)}
      style={
        color
          ? {
              borderColor: `${color}55`,
              backgroundColor: `${color}14`,
              color,
            }
          : undefined
      }
    >
      <span
        className="size-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {name}
    </Badge>
  );
}
