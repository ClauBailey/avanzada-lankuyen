import { CalendarCheck2, CalendarX2, CircleCheck, CircleSlash } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AttendanceSummary } from "@/features/attendance/queries";
import { cn } from "@/lib/utils";

const statStyles = [
  {
    key: "present" as const,
    label: "Presentes",
    icon: CircleCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    key: "justified" as const,
    label: "Justificados",
    icon: CircleSlash,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    key: "absent" as const,
    label: "Ausentes",
    icon: CalendarX2,
    className: "border-red-200 bg-red-50 text-red-800",
  },
];

export function AttendanceSummaryCard({
  summary,
  className,
}: {
  summary: AttendanceSummary;
  className?: string;
}) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
            Asistencia del semestre
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">
            {summary.semesterName ?? "Sin semestre activo"}
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Registros ratificados por los AA en actividades vigentes.
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-anil-50 text-anil-700">
          <CalendarCheck2 className="size-5" aria-hidden="true" />
        </span>
      </div>

      {summary.total === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-4 text-sm text-ink-soft">
          Aún no hay asistencias ratificadas en este semestre.
        </p>
      ) : (
        <>
          <div className="mt-5 flex items-end gap-2">
            <p className="font-display text-4xl font-semibold text-ink">
              {summary.rate}%
            </p>
            <p className="pb-1 text-xs text-ink-soft">
              de asistencia efectiva · {summary.present} de {summary.total}{" "}
              actividades
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {statStyles.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className={cn(
                    "rounded-xl border px-3.5 py-3",
                    stat.className,
                  )}
                >
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {summary[stat.key]}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
