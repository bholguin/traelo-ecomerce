"use client";

import { db } from "./db";
import type { Customer, OrderPayload, OrderResponse, Product, QueuedOrder } from "./types";

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
  void flushQueue();
  return order;
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
        message: data.demo ? "Modo demo: no se creó en Dropi" : undefined,
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

export async function retryOrder(clientOrderId: string) {
  await db.orders.update(clientOrderId, { status: "pendiente", nextAttemptAt: 0 });
  await flushQueue(true);
}
