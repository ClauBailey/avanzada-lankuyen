"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FileText,
  FolderKanban,
  Handshake,
  Home,
  LayoutDashboard,
  Menu,
  Settings2,
  Star,
  Trophy,
  UserRound,
  Users,
  UsersRound,
  Vote,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  type NavGroup,
  type NavIconName,
  type NavItem,
} from "@/lib/navigation";

const navIcons: Record<NavIconName, LucideIcon> = {
  home: Home,
  user: UserRound,
  calendar: CalendarDays,
  file: FileText,
  book: BookOpen,
  star: Star,
  bell: Bell,
  dashboard: LayoutDashboard,
  users: Users,
  community: UsersRound,
  "calendar-plus": CalendarPlus,
  clipboard: ClipboardCheck,
  "file-check": FileCheck2,
  award: Award,
  trophy: Trophy,
  "users-round": UsersRound,
  compass: Compass,
  vote: Vote,
  "folder-kanban": FolderKanban,
  handshake: Handshake,
  menu: Menu,
  settings: Settings2,
  "arrow-left": ArrowLeft,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Navegación principal">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item);
        const Icon = navIcons[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/12 text-white"
                : "text-anil-100/65 hover:bg-white/6 hover:text-white",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
              aria-hidden="true"
            />
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active ? "text-gold" : "text-anil-200/60 group-hover:text-anil-100",
              )}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({
  primaryItems,
  moreGroups,
  unreadCount = 0,
}: {
  primaryItems: NavItem[];
  moreGroups: NavGroup[];
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-100 bg-white/95 pb-safe shadow-[0_-8px_30px_-20px_rgba(20,22,58,0.35)] backdrop-blur md:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {primaryItems.map((item) => {
            const active = isNavItemActive(pathname, item);
            const Icon = navIcons[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-indigo-700"
                    : "text-slate-500 hover:text-indigo-700",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500",
                  )}
                >
                  <Icon className="size-[21px]" aria-hidden="true" />
                  {item.icon === "bell" && unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-more-sheet"
            className="flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-indigo-700"
          >
            <span className="flex size-8 items-center justify-center rounded-xl">
              <Menu className="size-[21px]" aria-hidden="true" />
            </span>
            <span>Más</span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar el menú Más"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
          />
          <div
            id="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Más módulos"
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-indigo-950 px-4 py-3 text-white">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/70">
                  Avanzada Lankuyen
                </p>
                <p className="font-display text-lg font-semibold">Más módulos</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Cerrar"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {moreGroups.map((group) => (
              <section key={group.title} className="mb-5 last:mb-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.items.map((item) => {
                    const active = isNavItemActive(pathname, item);
                    const Icon = navIcons[item.icon];

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-[68px] flex-col justify-between rounded-2xl border p-3 transition-colors",
                          active
                            ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                            : "border-indigo-100 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60",
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                        <span className="text-xs font-semibold leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
