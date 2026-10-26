import "server-only";

import { LocalStorageAdapter } from "@/server/storage/local";
import { R2StorageAdapter } from "@/server/storage/r2";
import type { StorageAdapter } from "@/server/storage/types";

let adapter: StorageAdapter | null = null;

/**
 * Selecciona el adaptador según STORAGE_DRIVER.
 *
 * - `local` (por defecto): disco local, pensado para desarrollo.
 * - `r2`: Cloudflare R2 o cualquier endpoint S3 compatible.
 *
 * La capa de dominio solo conoce `StorageAdapter`, de modo que cambiar de
 * driver no afecta a Hojas de Ruta ni al material digital.
 */
export function getStorage(): StorageAdapter {
  if (adapter) return adapter;

  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();

  if (driver === "local") {
    adapter = new LocalStorageAdapter();
    return adapter;
  }

  if (driver === "r2") {
    adapter = new R2StorageAdapter();
    return adapter;
  }

  throw new Error(`STORAGE_DRIVER no reconocido: "${driver}".`);
}
