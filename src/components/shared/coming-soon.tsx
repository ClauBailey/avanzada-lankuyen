import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  moduleNumber: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  available?: string;
  action?: { href: string; label: string };
  className?: string;
}

export function ComingSoon({
  moduleNumber,
  title,
  description,
  icon: Icon,
  features,
  available,
  action,
  className,
}: ComingSoonProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-dashed bg-surface/80 p-6 sm:p-9",
        className,
      )}
    >
      <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-anil-900 text-gold shadow-float">
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <Badge variant="gold">Módulo {moduleNumber} · Próximamente</Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-line/80 bg-canvas/70 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-anil-700">
            Lo que incluirá esta sección
          </p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-anil-100 text-anil-700">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-soft">
            {available ??
              "La base de autenticación, roles, comunidades y navegación ya está operativa."}
          </p>
          {action ? (
            <Link href={action.href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {action.label}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
