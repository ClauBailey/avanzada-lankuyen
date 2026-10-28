/**
 * Reglas puras de paginación de notificaciones.
 *
 * Se mantienen sin dependencias del servidor para poder probarlas con
 * `node --test` sin levantar Next.js ni la base de datos.
 */

export const NOTIFICATIONS_PAGE_SIZE = 10;

/**
 * El orden siempre es del aviso más reciente al más antiguo. El `id` desempata
 * dos notificaciones creadas en el mismo milisegundo.
 */
export const NOTIFICATIONS_ORDER_BY = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

/** Convierte el searchParam `?page=` en un entero válido desde 1. */
export function normalizeNotificationPage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed =
    typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);

  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

/** Total de páginas, con una página mínima para que la vista no quede vacía. */
export function notificationTotalPages(totalCount: number): number {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return 1;
  return Math.ceil(totalCount / NOTIFICATIONS_PAGE_SIZE);
}

/** `skip`/`take` derivados de la página solicitada. */
export function notificationPageWindow(page: number): {
  page: number;
  skip: number;
  take: number;
} {
  const safePage = normalizeNotificationPage(page);
  return {
    page: safePage,
    skip: (safePage - 1) * NOTIFICATIONS_PAGE_SIZE,
    take: NOTIFICATIONS_PAGE_SIZE,
  };
}
