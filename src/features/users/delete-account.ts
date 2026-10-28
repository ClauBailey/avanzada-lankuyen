/**
 * Reglas de negocio del borrado de cuentas, aisladas de Prisma y de Next.js
 * para poder probarlas directamente con `node --test`.
 */

export type AccountRole = "AA" | "PP" | "COORDINADOR";

export interface DeleteAccountActor {
  id: string;
  role: AccountRole;
}

export interface DeleteAccountTarget {
  id: string;
  role: AccountRole;
  /** Si la cuenta está desactivada no cuenta para el mínimo de AA activos. */
  isActive?: boolean;
}

export class AccountDeletionError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AccountDeletionError";
    this.statusCode = statusCode;
  }
}

/**
 * Valida que la sesión pueda borrar la cuenta objetivo.
 *
 * - Solo un AA puede borrar cuentas (403 para cualquier otro rol).
 * - Nadie puede borrar su propia cuenta activa.
 * - Si el objetivo es AA, debe quedar al menos otro AA activo.
 */
export function assertCanDeleteAccount(
  actor: DeleteAccountActor,
  target: DeleteAccountTarget,
  activeAaCount: number,
): void {
  if (actor.role !== "AA") {
    throw new AccountDeletionError(
      "No tienes permiso para eliminar cuentas.",
      403,
    );
  }

  if (actor.id === target.id) {
    throw new AccountDeletionError(
      "No puedes eliminar tu propia cuenta.",
      400,
    );
  }

  if (target.role === "AA" && target.isActive !== false && activeAaCount <= 1) {
    throw new AccountDeletionError(
      "Debe quedar al menos un Adulto Acompañante activo en la unidad.",
      409,
    );
  }
}
