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
  | "folder-kanban"
  | "handshake"
  | "menu"
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
  { href: "/acompanamiento", label: "Acompañamiento", icon: "users-round" },
  { href: "/mi-comunidad", label: "Mi comunidad", icon: "community" },
  { href: "/mi-comunidad/bitacora", label: "Bitácora de comunidad", icon: "book" },
  { href: "/miembros", label: "Miembros", icon: "users-round" },
  { href: "/logros", label: "Logros", icon: "trophy" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
  { href: "/proyectos", label: "Proyectos", icon: "folder-kanban" },
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
  { href: "/admin/objetivos", label: "Objetivos Brújula", icon: "compass" },
  { href: "/admin/actividades", label: "Actividades", icon: "calendar-plus" },
  { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
  { href: "/proyectos", label: "Proyectos", icon: "folder-kanban" },
  { href: "/admin/red-de-apoyo", label: "Red de apoyo", icon: "handshake" },
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

/** Rutas que pertenecen exclusivamente a la experiencia juvenil. */
export const YOUTH_ONLY_HREFS = [
  "/brujula",
  "/camino",
  "/mi-comunidad",
  "/mi-comunidad/bitacora",
  "/mi-comunidad/asistencia",
] as const;

export type NavRole = "AA" | "PP" | "COORDINADOR";

export interface NavFilterOptions {
  role: NavRole;
  variant: "member" | "admin";
  hasCommunity?: boolean;
}

/**
 * Navegación visible según rol. El AA nunca ve Mi Brújula, Mi Camino ni Mi
 * Comunidad: su lugar es el acompañamiento y el panel de la unidad.
 */
export function visibleNavItems(
  items: readonly NavItem[],
  options: NavFilterOptions,
): NavItem[] {
  const { role, variant, hasCommunity = false } = options;
  const isYouth = role === "PP" || role === "COORDINADOR";

  return items.filter((item) => {
    if (item.href.startsWith("/mi-comunidad")) {
      return isYouth && hasCommunity;
    }

    if (item.href === "/brujula" || item.href === "/camino") {
      return isYouth;
    }

    if (item.href === "/acompanamiento") {
      return role === "AA";
    }

    if (variant === "admin" && role !== "AA") {
      return [
        "/proyectos",
        "/ciclo",
        "/admin/red-de-apoyo",
        "/inicio",
      ].includes(item.href);
    }

    return true;
  });
}

/**
 * Barra inferior móvil: exactamente 4 accesos directos + el botón «Más».
 */
export const MOBILE_BOTTOM_BAR_ITEMS = 5;

export function mobilePrimaryNav(role: NavRole): NavItem[] {
  if (role === "AA") {
    return [
      { href: "/inicio", label: "Inicio", icon: "home", exact: true },
      {
        href: "/acompanamiento",
        label: "Acompañar",
        icon: "users-round",
      },
      { href: "/calendario", label: "Calendario", icon: "calendar" },
      {
        href: "/admin/hojas-de-ruta",
        label: "Rutas",
        icon: "file-check",
      },
    ];
  }

  return [
    { href: "/inicio", label: "Inicio", icon: "home", exact: true },
    { href: "/brujula", label: "Brújula", icon: "compass" },
    { href: "/calendario", label: "Calendario", icon: "calendar" },
    { href: "/mi-comunidad", label: "Comunidad", icon: "community" },
  ];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Módulos del cajón «Más». Se agrupan por contexto y nunca duplican los cuatro
 * accesos directos de la barra inferior.
 */
export function mobileMoreGroups(
  options: NavFilterOptions,
): NavGroup[] {
  const { role, variant } = options;
  const primary = new Set(mobilePrimaryNav(role).map((item) => item.href));

  const filterGroup = (group: NavGroup): NavGroup => ({
    ...group,
    items: group.items.filter((item) => !primary.has(item.href)),
  });

  if (role === "AA") {
    return [
      filterGroup({
        title: "Vida de unidad",
        items: [
          { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
          { href: "/proyectos", label: "Proyectos", icon: "folder-kanban" },
          { href: "/admin/bitacora", label: "Bitácora", icon: "book" },
          { href: "/admin/material", label: "Material", icon: "book" },
          { href: "/miembros", label: "Miembros", icon: "users-round" },
          { href: "/logros", label: "Logros", icon: "trophy" },
        ],
      }),
      filterGroup({
        title: "Espacio personal",
        items: [{ href: "/perfil", label: "Mi perfil", icon: "user" }],
      }),
      filterGroup({
        title: "Gestión del Equipo Adulto",
        items: [
          { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
          {
            href: "/admin/comunidades",
            label: "Comunidades",
            icon: "community",
          },
          {
            href: "/admin/objetivos",
            label: "Objetivos Brújula",
            icon: "compass",
          },
          {
            href: "/admin/actividades",
            label: "Actividades",
            icon: "calendar-plus",
          },
          {
            href: "/admin/evaluaciones",
            label: "Evaluaciones",
            icon: "star",
          },
          {
            href: "/admin/red-de-apoyo",
            label: "Red de apoyo",
            icon: "handshake",
          },
          { href: "/admin/insignias", label: "Insignias", icon: "award" },
          {
            href: "/admin/configuracion",
            label: "Configuración",
            icon: "settings",
          },
        ],
      }),
    ];
  }

  const youthGroups: NavGroup[] = [
    {
      title: "Vida de unidad",
      items: [
        { href: "/ciclo", label: "Ciclo y Asamblea", icon: "vote" },
        { href: "/proyectos", label: "Proyectos", icon: "folder-kanban" },
        { href: "/hojas-de-ruta", label: "Hojas de ruta", icon: "file" },
        { href: "/bitacora", label: "Bitácora", icon: "book" },
        { href: "/material", label: "Material", icon: "book" },
        { href: "/miembros", label: "Miembros", icon: "users-round" },
        { href: "/logros", label: "Logros", icon: "trophy" },
      ],
    },
    {
      title: "Espacio personal",
      items: [
        { href: "/camino", label: "Mi Camino", icon: "compass" },
        { href: "/perfil", label: "Mi Perfil", icon: "user" },
      ],
    },
  ];

  if (variant === "admin") {
    return youthGroups
      .map(filterGroup)
      .filter((group) => group.items.length > 0);
  }

  return youthGroups.map(filterGroup);
}
