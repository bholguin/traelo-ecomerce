"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSyncExternalStore } from "react";
import { db } from "./db";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

export const useCart = () => useLiveQuery(() => db.cart.toArray(), [], undefined);

export const useCartCount = () =>
  useLiveQuery(async () => (await db.cart.toArray()).reduce((n, i) => n + i.quantity, 0), [], 0);

export const usePendingCount = () =>
  useLiveQuery(
    () => db.orders.where("status").anyOf("pendiente", "enviando", "error").count(),
    [],
    0,
  );

export const useCatalogMeta = () =>
  useLiveQuery(async () => {
    const [synced, demo] = await Promise.all([db.meta.get("catalogSyncedAt"), db.meta.get("catalogDemo")]);
    return {
      syncedAt: typeof synced?.value === "number" ? synced.value : null,
      demo: demo?.value === 1,
    };
  }, []);
