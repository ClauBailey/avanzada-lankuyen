/**
 * Identidad visible de una persona.
 *
 * El nombre social (`preferredName`) tiene prioridad absoluta sobre el nombre
 * registral en toda la interfaz, las tarjetas compartibles y los documentos
 * exportados. El apellido registral se conserva para mantener la trazabilidad.
 *
 * Módulo puro: se comparte entre servidor, cliente y pruebas con `node --test`.
 */

export interface DisplayNameSource {
  firstName: string;
  lastName?: string | null;
  preferredName?: string | null;
}

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Nombre a mostrar: `preferredName` (si existe) + apellido registral. */
export function getDisplayName(user: DisplayNameSource): string {
  const first = clean(user.preferredName) || clean(user.firstName);
  const last = clean(user.lastName);
  return `${first} ${last}`.trim();
}

/** Iniciales coherentes con el nombre visible. */
export function getDisplayInitials(user: DisplayNameSource): string {
  const display = getDisplayName(user);
  const parts = display.split(" ").filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

/** Primer nombre visible, útil para saludos y mensajes breves. */
export function getDisplayFirstName(user: DisplayNameSource): string {
  return getDisplayName(user).split(" ")[0] ?? "";
}
