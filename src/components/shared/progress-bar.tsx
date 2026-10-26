import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({
  value,
  max,
  className,
  barClassName,
  label,
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const percent = Math.min(100, Math.round((value / safeMax) * 100));

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-mist", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      aria-label={label ?? "Progreso"}
    >
      <div
        className={cn("h-full rounded-full bg-anil-700 transition-[width]", barClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
