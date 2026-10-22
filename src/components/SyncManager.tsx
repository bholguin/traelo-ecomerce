"use client";

import { useEffect } from "react";
import { flushQueue, refreshCatalog } from "@/lib/sync";

const CATALOG_EVERY_MS = 10 * 60 * 1000;
const QUEUE_EVERY_MS = 30 * 1000;

// Mantiene el catálogo fresco y vacía la cola de pedidos cuando hay red.
// iOS no tiene Background Sync: por eso se sincroniza al abrir la app,
// al volver la conexión y al volver a la pestaña.
export function SyncManager() {
  useEffect(() => {
    const sync = () => {
      void refreshCatalog();
      void flushQueue(true);
    };
    const onVisible = () => document.visibilityState === "visible" && sync();

    sync();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVisible);
    const q = setInterval(() => void flushQueue(), QUEUE_EVERY_MS);
    const c = setInterval(() => void refreshCatalog(), CATALOG_EVERY_MS);

    return () => {
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(q);
      clearInterval(c);
    };
  }, []);

  return null;
}
