import Link from "next/link";
import { Bell, LogOut, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { MobileNav, SidebarNav } from "@/components/layout/nav-links";
import { logoutAction } from "@/features/auth/actions";
import { APP_NAME, ROLE_LABELS, ROLE_SHORT_LABELS, UNIT_TAGLINE } from "@/lib/constants";
import { adminNav, memberNav } from "@/lib/navigation";
import { cn, getInitials } from "@/lib/utils";
import type { SessionUser } from "@/server/auth/session";

interface AppShellProps {
  user: SessionUser;
  variant: "member" | "admin";
  unreadCount: number;
  children: React.ReactNode;
}

export function AppShell({ user, variant, unreadCount, children }: AppShellProps) {
  const items = variant === "admin" ? adminNav : memberNav;
  const fullName = `${user.firstName} ${user.lastName}`;
  const roleLabel = ROLE_LABELS[user.role];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar de escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-hidden bg-anil-950 lg:flex">
        <div className="topo-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-anil-950 via-anil-950/70 to-transparent" />

        <div className="relative z-10 flex h-full flex-col">
          <Link
            href={variant === "admin" ? "/admin" : "/inicio"}
            className="flex items-center gap-3 px-5 pb-6 pt-6"
          >
            <BrandMark size={46} className="ring-2 ring-white/15" />
            <span className="min-w-0">
              <span className="block font-display text-lg font-semibold leading-tight text-white">
                Lankuyen
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-200/60">
                Avanzada · Pioneros
              </span>
            </span>
          </Link>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
            {variant === "admin" ? (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-200/45">
                Administración
              </p>
            ) : (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-anil-200/45">
                Mi camino
              </p>
            )}
            <SidebarNav items={items} />
          </div>

          <div className="relative border-t border-white/10 p-4">
            {user.role === "AA" ? (
              <Link
                href={variant === "admin" ? "/inicio" : "/admin"}
                className="mb-3 flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold-soft transition-colors hover:bg-gold/15"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                {variant === "admin" ? "Ir a mi vista" : "Ir al panel AA"}
              </Link>
            ) : null}

            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white ring-1 ring-white/15">
                {getInitials(user.firstName, user.lastName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{fullName}</p>
                <p className="truncate text-[11px] text-anil-200/60">{roleLabel}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="flex size-9 items-center justify-center rounded-lg text-anil-200/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="sr-only">Cerrar sesión</span>
                </button>
              </form>
            </div>

            {user.community ? (
              <p className="mt-3 truncate text-[11px] text-anil-200/55">
                Comunidad · <span className="text-anil-100/85">{user.community.name}</span>
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={variant === "admin" ? "/admin" : "/inicio"} className="lg:hidden">
                <BrandMark size={36} />
              </Link>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-ink lg:text-base">
                  {variant === "admin" ? "Panel de administración" : APP_NAME}
                </p>
                <p className="hidden truncate text-[11px] text-ink-soft sm:block">
                  {variant === "admin" ? "Gestión de la unidad" : UNIT_TAGLINE}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notificaciones"
                className="relative flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:border-anil-200 hover:text-anil-800"
                title={
                  unreadCount > 0
                    ? `${unreadCount} notificación${unreadCount === 1 ? "" : "es"} sin leer`
                    : "Notificaciones"
                }
              >
                <Bell className="size-[18px]" aria-hidden="true" />
                <span className="sr-only">
                  Notificaciones
                  {unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}
                </span>
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-canvas">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-anil-100 text-xs font-bold text-anil-800">
                  {getInitials(user.firstName, user.lastName)}
                </span>
                <div className="hidden sm:block">
                  <p className="max-w-[150px] truncate text-xs font-semibold text-ink">
                    {fullName}
                  </p>
                  <p className="text-[10px] text-ink-soft">
                    {ROLE_SHORT_LABELS[user.role]}
                    {user.community ? ` · ${user.community.name}` : ""}
                  </p>
                </div>
              </div>

              <form action={logoutAction} className="lg:hidden">
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="size-[18px]" aria-hidden="true" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sr-only sm:hidden">Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:px-10 lg:pb-14 lg:pt-10",
          )}
        >
          {children}
        </main>
      </div>

      <MobileNav items={items} unreadCount={unreadCount} />
    </div>
  );
}
