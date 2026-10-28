export type NavIconName =
  | "home"
  | "user"
  | "calendar"
  | "file"
  | "book"
  | "bell"
  | "dashboard"
  | "users"
  | "community"
  | "calendar-plus"
  | "clipboard"
  | "star"
  | "file-check"
  | "award"
  | "trophy"
  | "users-round"
  | "settings"
  | "arrow-left";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  exact?: boolean;
}

export const memberNav: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: "home", exact: true },
  { href: "/perfil", label: "Mi perfil", icon: "user" },
  { href: "/miembros", label: "Miembros", icon: "users-round" },
  { href: "/logros", label: "Logros", icon: "trophy" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/bitacora", label: "Bitácora", icon: "book" },
  { href: "/hojas-de-ruta", label: "Hojas de ruta", icon: "file" },
  { href: "/material", label: "Material", icon: "book" },
  { href: "/notificaciones", label: "Notificaciones", icon: "bell" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Tablero", icon: "dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
  { href: "/miembros", label: "Miembros", icon: "users-round" },
  { href: "/admin/comunidades", label: "Comunidades", icon: "community" },
  { href: "/admin/actividades", label: "Actividades", icon: "calendar-plus" },
  { href: "/admin/asistencia", label: "Asistencia", icon: "clipboard" },
  { href: "/admin/evaluaciones", label: "Evaluaciones", icon: "star" },
  { href: "/admin/bitacora", label: "Bitácora", icon: "book" },
  { href: "/admin/hojas-de-ruta", label: "Hojas de ruta", icon: "file-check" },
  { href: "/admin/insignias", label: "Insignias", icon: "award" },
  { href: "/logros", label: "Logros", icon: "trophy" },
  { href: "/admin/material", label: "Material", icon: "book" },
  { href: "/admin/configuracion", label: "Configuración", icon: "settings" },
  { href: "/inicio", label: "Mi vista", icon: "arrow-left" },
];

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
