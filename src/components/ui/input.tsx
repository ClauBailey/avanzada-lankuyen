import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-ink shadow-sm transition-colors",
        "placeholder:text-ink-soft/60",
        "focus:border-anil-500 focus:outline-none focus:ring-2 focus:ring-anil-500/20",
        "disabled:cursor-not-allowed disabled:bg-mist disabled:opacity-70",
        "aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}
