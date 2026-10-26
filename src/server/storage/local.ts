import "server-only";

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PutObjectInput, StorageAdapter } from "@/server/storage/types";

/**
 * Adaptador de desarrollo: guarda los archivos en disco local.
 * Se activa con STORAGE_DRIVER="local" (valor por defecto).
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly driver = "local" as const;
  private readonly baseDir: string;

  constructor(baseDir = process.env.LOCAL_STORAGE_DIR ?? ".storage") {
    // `turbopackIgnore` evita que el build rastree dinámicamente todo el
    // proyecto por una ruta configurable por entorno. La resolución real en
    // tiempo de ejecución no cambia.
    this.baseDir = path.resolve(/* turbopackIgnore: true */ baseDir);
  }

  private resolve(key: string): string {
    const fullPath = path.resolve(this.baseDir, key);
    const prefix = `${this.baseDir}${path.sep}`;

    if (!fullPath.startsWith(prefix)) {
      throw new Error("Ruta de almacenamiento inválida.");
    }

    return fullPath;
  }

  async put({ key, body }: PutObjectInput): Promise<void> {
    const fullPath = this.resolve(key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, body);
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const info = await stat(this.resolve(key));
      return info.isFile();
    } catch {
      return false;
    }
  }
}
