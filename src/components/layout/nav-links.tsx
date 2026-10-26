"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Home,
  LayoutDashboard,
  Settings2,
  Star,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isNavItemActive,
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
  items,
  unreadCount = 0,
}: {
  items: NavItem[];
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-20px_rgba(20,22,58,0.4)] backdrop-blur lg:hidden"
    >
      <div className="scrollbar-thin flex overflow-x-auto px-1.5">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = navIcons[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[70px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-anil-800" : "text-ink-soft hover:text-anil-700",
              )}
            >
              <span
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-anil-100 text-anil-800" : "text-ink-soft",
                )}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {item.icon === "bell" && unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-surface">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
