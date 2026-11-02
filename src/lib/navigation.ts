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
  | "compass"
  | "vote"
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
  { href: "/brujula", label: "Mi Brújula", icon: "compass" },
  { href: "/camino", label: "Mi camino", icon: "compass" },
  { href: "/mi-comunidad", label: "Mi comunidad", icon: "community" },
  { href: "/mi-comunidad/bitacora", label: "Bitácora de comunidad", icon: "book" },
  { href: "/miembros", label: "Miembros", icon: "users-round" },
  { href: "/logros", label: "Logros", icon: "trophy" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
  { href: "/bitacora", label: "Bitácora", icon: "book" },
  { href: "/hojas-de-ruta", label: "Hojas de ruta", icon: "file" },
  { href: "/material", label: "Material", icon: "book" },
  { href: "/notificaciones", label: "Notificaciones", icon: "bell" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Tablero", icon: "dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
  { href: "/acompanamiento", label: "Acompañamiento", icon: "users-round" },
  { href: "/miembros", label: "Miembros", icon: "users-round" },
  { href: "/admin/comunidades", label: "Comunidades", icon: "community" },
  { href: "/admin/actividades", label: "Actividades", icon: "calendar-plus" },
  { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
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
