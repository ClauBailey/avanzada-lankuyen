import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden p-5 transition-colors",
        href && "hover:border-anil-200 hover:shadow-float",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-anil-50 text-anil-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      {href ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-anil-700">
          Ver detalle
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
