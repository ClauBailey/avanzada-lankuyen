import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-line bg-surface pl-3.5 pr-9 text-sm text-ink shadow-sm transition-colors",
          "focus:border-anil-500 focus:outline-none focus:ring-2 focus:ring-anil-500/20",
          "disabled:cursor-not-allowed disabled:bg-mist disabled:opacity-70",
          "aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
        aria-hidden="true"
      />
    </div>
  );
}
