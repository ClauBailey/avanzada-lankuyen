/**
 * Sincronización offline de La Brújula (RF-PWA-01 / RF-PWA-02).
 *
 * La Brújula se guarda localmente para poder leerla sin conexión. Las
 * ediciones hechas offline se encolan y se reconcilian al volver la red.
 *
 * Regla constitucional (Art. II y XII): ninguna redacción se pierde. Si el
 * objetivo cambió en otro dispositivo mientras estaba offline, el texto del
 * servidor ya vive en `UserCompassObjectiveVersion`; el texto offline se agrega
 * como una versión nueva. Nunca se sobrescribe el historial.
 *
 * Módulo puro en su reconciliación: se prueba con `node --test` sin navegador.
 */

export const COMPASS_SNAPSHOT_PREFIX = "lankuyen:brujula:snapshot";
export const COMPASS_QUEUE_PREFIX = "lankuyen:brujula:queue";

export interface OfflineCompassVersion {
  text: string;
  createdAt: Date | string;
}

export interface ReconcileOfflineObjectiveEditInput {
  serverCurrentText: string;
  serverVersions: OfflineCompassVersion[];
  offlineBaseText: string;
  offlineNewText: string;
}

export interface ReconcileOfflineObjectiveEditResult {
  /** El texto offline difiere del servidor y debe agregarse como versión. */
  shouldAppend: boolean;
  /** El servidor cambió mientras la persona estaba offline. */
  conflict: boolean;
  /** Redacciones nuevas que deben insertarse, en orden. */
  versionsToAppend: Array<{ text: string; createdAt: string }>;
  /** Texto que queda como redacción vigente del objetivo. */
  finalText: string;
  /** Historial completo que resulta de conservar servidor y edición offline. */
  resultingHistory: string[];
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Reconcilia una edición offline con el estado actual del servidor.
 *
 * - Sin cambios → no agrega versiones.
 * - El servidor sigue igual a la base offline → agrega el texto nuevo.
 * - El servidor cambió (edición concurrente) → conserva ambos: el texto del
 *   servidor ya está en el historial y el texto offline se agrega como versión
 *   sucesiva. `conflict` queda en `true` para poder avisar a la persona.
 */
export function reconcileOfflineObjectiveEdit(
  input: ReconcileOfflineObjectiveEditInput,
  now: Date = new Date(),
): ReconcileOfflineObjectiveEditResult {
  const serverCurrent = input.serverCurrentText;
  const offlineBase = input.offlineBaseText;
  const offlineNew = input.offlineNewText;

  const serverHistory = input.serverVersions.map((version) =>
    normalize(version.text),
  );
  const history: string[] = input.serverVersions.map((version) => version.text);

  // Garantiza que la redacción vigente del servidor esté representada aunque
  // la consulta no traiga versiones (defensa ante datos antiguos).
  if (
    normalize(serverCurrent).length > 0 &&
    !serverHistory.includes(normalize(serverCurrent))
  ) {
    history.push(serverCurrent);
  }

  if (normalize(offlineNew).length === 0) {
    return {
      shouldAppend: false,
      conflict: false,
      versionsToAppend: [],
      finalText: serverCurrent,
      resultingHistory: history,
    };
  }

  if (normalize(offlineNew) === normalize(serverCurrent)) {
    return {
      shouldAppend: false,
      conflict: false,
      versionsToAppend: [],
      finalText: serverCurrent,
      resultingHistory: history,
    };
  }

  const conflict = normalize(serverCurrent) !== normalize(offlineBase);

  if (!history.some((text) => normalize(text) === normalize(offlineNew))) {
    history.push(offlineNew);
  }

  return {
    shouldAppend: true,
    conflict,
    versionsToAppend: [{ text: offlineNew, createdAt: now.toISOString() }],
    finalText: offlineNew,
    resultingHistory: history,
  };
}

// ------------------------------------------------------------
// Persistencia local (navegador)
// ------------------------------------------------------------

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function compassSnapshotKey(userId: string): string {
  return `${COMPASS_SNAPSHOT_PREFIX}:${userId}`;
}

export function compassQueueKey(userId: string): string {
  return `${COMPASS_QUEUE_PREFIX}:${userId}`;
}

export interface CompassOfflineSnapshot<T = unknown> {
  savedAt: string;
  data: T;
}

export function saveCompassSnapshot<T>(userId: string, data: T): void {
  const store = storage();
  if (!store) return;
  try {
    const snapshot: CompassOfflineSnapshot<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    store.setItem(compassSnapshotKey(userId), JSON.stringify(snapshot));
  } catch {
    // Cuota llena o almacenamiento bloqueado: la app sigue funcionando online.
  }
}

export function readCompassSnapshot<T>(
  userId: string,
): CompassOfflineSnapshot<T> | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(compassSnapshotKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as CompassOfflineSnapshot<T>;
  } catch {
    return null;
  }
}

export type OfflineCompassEditKind = "OBJECTIVE_TEXT";

export interface OfflineCompassEdit {
  id: string;
  kind: OfflineCompassEditKind;
  objectiveId: string;
  offlineBaseText: string;
  offlineNewText: string;
  createdAt: string;
}

export function createOfflineEditId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `edit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readOfflineQueue(userId: string): OfflineCompassEdit[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(compassQueueKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineCompassEdit[]) : [];
  } catch {
    return [];
  }
}

export function writeOfflineQueue(
  userId: string,
  edits: OfflineCompassEdit[],
): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(compassQueueKey(userId), JSON.stringify(edits));
  } catch {
    // Sin almacenamiento no se puede garantizar la cola; se informa en la UI.
  }
}

export function enqueueOfflineEdit(
  userId: string,
  edit: OfflineCompassEdit,
): OfflineCompassEdit[] {
  const queue = readOfflineQueue(userId);
  const next = [
    ...queue.filter(
      (item) =>
        !(item.kind === edit.kind && item.objectiveId === edit.objectiveId),
    ),
    edit,
  ];
  writeOfflineQueue(userId, next);
  return next;
}

export function clearOfflineQueue(userId: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(compassQueueKey(userId));
  } catch {
    // Sin almacenamiento no hay nada que limpiar.
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
