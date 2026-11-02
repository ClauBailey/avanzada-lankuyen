"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CloudOff, CloudUpload, RefreshCw } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { syncOfflineCompassEditsAction } from "@/features/compass/actions";
import {
  clearOfflineQueue,
  readOfflineQueue,
  saveCompassSnapshot,
} from "@/features/compass/offline-sync";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

function subscribeToConnectivity(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function readOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Copia local de La Brújula + sincronización de ediciones offline.
 *
 * - Guarda una instantánea de lectura en `localStorage` para abrirla sin red.
 * - Recibe las ediciones de `ObjectiveTextForm`: se guardan primero en la cola
 *   local y luego se sincronizan, de modo que una caída de red no pierde nada.
 * - `syncOfflineCompassEditsAction` reconcilia conservando ambas redacciones si
 *   el objetivo cambió en otro dispositivo (Art. II y XII).
 */
export function CompassOfflineSync({
  userId,
  snapshot,
}: {
  userId: string;
  snapshot: unknown;
}) {
  const [state, action] = useActionState(
    syncOfflineCompassEditsAction,
    EMPTY_ACTION_STATE,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    readOnline,
    () => true,
  );
  const syncingRef = useRef(false);

  const runSync = useCallback(() => {
    if (syncingRef.current) return;
    const queue = readOfflineQueue(userId);
    if (queue.length === 0) return;

    const formData = new FormData();
    formData.set("edits", JSON.stringify(queue));
    syncingRef.current = true;
    startTransition(async () => {
      try {
        await action(formData);
      } finally {
        syncingRef.current = false;
      }
    });
  }, [action, userId]);

  useEffect(() => {
    saveCompassSnapshot(userId, snapshot);
  }, [userId, snapshot]);

  // Lectura inicial de la cola fuera del render (evita desajustes de hidratación).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPendingCount(readOfflineQueue(userId).length);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);

  // Cada vez que se encola una redacción se intenta sincronizar si hay red.
  useEffect(() => {
    const handler = () => {
      setPendingCount(readOfflineQueue(userId).length);
      if (readOnline()) runSync();
    };
    window.addEventListener("lankuyen:compass-queue", handler);
    return () => window.removeEventListener("lankuyen:compass-queue", handler);
  }, [userId, runSync]);

  useEffect(() => {
    if (!state.success) return;

    clearOfflineQueue(userId);
    const timer = window.setTimeout(() => setPendingCount(0), 0);
    return () => window.clearTimeout(timer);
  }, [state, userId]);

  // Al volver la red (o al montar estando online) se reintenta la cola.
  useEffect(() => {
    if (online) runSync();
  }, [online, runSync]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {online ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
            <CloudUpload className="size-3" aria-hidden="true" />
            En línea · copia local al día
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/70 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
            <CloudOff className="size-3" aria-hidden="true" />
            Sin conexión · tu Brújula sigue disponible en este dispositivo
          </span>
        )}

        {pendingCount > 0 ? (
          <span className="rounded-full border border-anil-200 bg-anil-50 px-2.5 py-0.5 text-[10px] font-semibold text-anil-800">
            {pendingCount} edición{pendingCount === 1 ? "" : "es"} pendiente
            {pendingCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {pendingCount > 0 && online ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSync();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <SubmitButton size="sm" pendingLabel="Sincronizando…">
            <RefreshCw aria-hidden="true" />
            Sincronizar ahora
          </SubmitButton>
        </form>
      ) : null}

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
    </div>
  );
}
