"use client";

import { db } from "./db";
import {
  FINAL_REMOTE_STATUSES,
  type Customer,
  type OrderPayload,
  type OrderResponse,
  type OrderStatusResponse,
  type Product,
  type QueuedOrder,
} from "./types";

const MAX_BACKOFF_MS = 15 * 60 * 1000;

// ---------- Catálogo ----------

export async function refreshCatalog(): Promise<{ ok: boolean; count?: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false };
  try {
    const res = await fetch("/api/catalogo", { cache: "no-store" });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { products: Product[]; demo: boolean };
    await db.transaction("rw", db.products, db.meta, async () => {
      await db.products.clear();
      await db.products.bulkPut(data.products);
      await db.meta.put({ key: "catalogSyncedAt", value: Date.now() });
      await db.meta.put({ key: "catalogDemo", value: data.demo ? 1 : 0 });
    });
    return { ok: true, count: data.products.length };
  } catch {
    return { ok: false };
  }
}

// ---------- Cola de pedidos ----------

export async function enqueueOrder(customer: Customer): Promise<QueuedOrder> {
  const items = await db.cart.toArray();
  if (items.length === 0) throw new Error("El carrito está vacío");
  const order: QueuedOrder = {
    clientOrderId: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "pendiente",
    items,
    customer,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    attempts: 0,
    nextAttemptAt: 0,
  };
  // El pedido queda guardado ANTES de intentar enviarlo: nunca se pierde.
  await db.transaction("rw", db.orders, db.cart, async () => {
    await db.orders.add(order);
    await db.cart.clear();
  });
  void requestPersistentStorage();
  void flushQueue();
  return order;
}

// Pide al navegador que no borre IndexedDB por su cuenta (por falta de espacio o,
// en Safari, por días sin abrir el sitio). No protege de un borrado manual.
// Se pide al guardar un pedido: antes no hay nada que valga la pena conservar.
// El navegador decide si lo concede; si no, todo sigue funcionando igual.
async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist || (await navigator.storage.persisted())) return;
    await navigator.storage.persist();
  } catch {
    // Navegador sin StorageManager: nada que hacer.
  }
}

let flushing = false;

export async function flushQueue(force = false) {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  flushing = true;
  try {
    const now = Date.now();
    const due = await db.orders
      .where("status")
      .anyOf("pendiente", "error", "enviando")
      .filter((o) => force || o.nextAttemptAt <= now)
      .toArray();

    for (const order of due) {
      await sendOrder(order);
    }
  } finally {
    flushing = false;
  }
}

async function sendOrder(order: QueuedOrder) {
  await db.orders.update(order.clientOrderId, { status: "enviando" });
  const payload: OrderPayload = {
    clientOrderId: order.clientOrderId,
    customer: order.customer,
    items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
  };

  try {
    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as OrderResponse | null;

    if (res.ok && data?.ok) {
      await db.orders.update(order.clientOrderId, {
        status: "enviado",
        remoteId: data.orderId,
        total: data.total,
        message: data.demo ? "Modo demo: no se creó en WooCommerce" : undefined,
      });
      return;
    }

    if (data && !data.ok && (data.kind === "business" || data.kind === "validation")) {
      // Agotado, precio cambiado, datos inválidos: reintentar no lo arregla.
      await db.orders.update(order.clientOrderId, { status: "revision", message: data.message });
      return;
    }

    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    const attempts = order.attempts + 1;
    const backoff = Math.min(MAX_BACKOFF_MS, 2 ** attempts * 5000);
    await db.orders.update(order.clientOrderId, {
      status: "error",
      attempts,
      nextAttemptAt: Date.now() + backoff,
      message: e instanceof Error ? e.message : "Error de red",
    });
  }
}

// ---------- Estado de pedidos enviados ----------

let checkingStatuses = false;

// Trae de WooCommerce el estado de los pedidos ya enviados que aún pueden cambiar.
export async function refreshOrderStatuses() {
  if (checkingStatuses) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  checkingStatuses = true;
  try {
    const active = await db.orders
      .where("status")
      .equals("enviado")
      .filter((o) => Boolean(o.remoteId) && !FINAL_REMOTE_STATUSES.includes(o.remoteStatus ?? ""))
      .limit(100)
      .toArray();
    if (active.length === 0) return;

    const res = await fetch("/api/pedidos/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: active.map((o) => ({ id: o.remoteId, clientOrderId: o.clientOrderId })) }),
    });
    const data = (await res.json().catch(() => null)) as OrderStatusResponse | null;
    if (!res.ok || !data?.ok) return;

    const checkedAt = Date.now();
    await db.transaction("rw", db.orders, async () => {
      for (const o of active) {
        const remoteStatus = data.statuses[o.remoteId!];
        if (remoteStatus) await db.orders.update(o.clientOrderId, { remoteStatus, remoteCheckedAt: checkedAt });
      }
    });
  } catch {
    // Sin red o servidor caído: se reintenta en el próximo ciclo.
  } finally {
    checkingStatuses = false;
  }
}

export async function retryOrder(clientOrderId: string) {
  await db.orders.update(clientOrderId, { status: "pendiente", nextAttemptAt: 0 });
  await flushQueue(true);
}
