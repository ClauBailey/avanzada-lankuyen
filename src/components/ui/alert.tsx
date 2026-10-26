import * as React from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const styles = {
  error: {
    container: "border-red-200 bg-red-50 text-red-900",
    icon: CircleAlert,
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CircleCheck,
  },
  info: {
    container: "border-anil-200 bg-anil-50 text-anil-900",
    icon: Info,
  },
} as const;

interface AlertProps extends React.ComponentProps<"div"> {
  variant?: keyof typeof styles;
}

export function Alert({ className, variant = "error", children, ...props }: AlertProps) {
  const style = styles[variant];
  const Icon = style.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        style.container,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
