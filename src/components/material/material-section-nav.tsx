import Link from "next/link";
import {
  Flag,
  Library,
  Megaphone,
  Music,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { MaterialCoreKey } from "@/lib/material";

const ICONS: Record<MaterialCoreKey, LucideIcon> = {
  grito: Megaphone,
  oracion: Sparkles,
  himno: Music,
  bandera: Flag,
  otros: Library,
};

interface MaterialSectionNavProps {
  sections: Array<{ key: MaterialCoreKey; label: string; shortLabel: string }>;
}

export function MaterialSectionNav({ sections }: MaterialSectionNavProps) {
  return (
    <nav
      aria-label="Secciones del material"
      className="sticky top-16 z-20 -mx-4 border-y border-line/80 bg-canvas/92 px-4 py-2 backdrop-blur lg:top-[72px] lg:mx-0 lg:rounded-2xl lg:border lg:shadow-card"
    >
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-0.5">
        {sections.map((section) => {
          const Icon = ICONS[section.key];

          return (
            <Link
              key={section.key}
              href={`#${section.key}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-anil-300 hover:bg-anil-50 hover:text-anil-800"
            >
              <Icon className="size-3.5 text-anil-600" aria-hidden="true" />
              {section.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
