import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-anil-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance break-words font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-pretty text-sm leading-relaxed text-ink-soft sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-col gap-2 [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
