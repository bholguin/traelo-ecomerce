"use client";

import { pagoEnLinea } from "./envio";
import { clearCart, readCart, readOrders, saveOrder, updateOrders } from "./storage";
import {
  FINAL_REMOTE_STATUSES,
  type Customer,
  type Order,
  type OrderPayload,
  type OrderResponse,
  type OrderStatusResponse,
  type PaymentResponse,
} from "./types";

// ---------- Crear el pedido ----------

export type SubmitResult = { ok: true; order: Order } | { ok: false; message: string };

// Envía el carrito a /api/pedidos. clientOrderId lo genera el checkout una vez
// por pedido: si la red falla y el cliente vuelve a confirmar, el servidor
// reconoce el mismo id y no crea un pedido duplicado.
export async function submitOrder(clientOrderId: string, customer: Customer, shipping: number | null): Promise<SubmitResult> {
  const items = readCart();
  if (items.length === 0) return { ok: false, message: "El carrito está vacío" };
  const payload: OrderPayload = {
    clientOrderId,
    customer,
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
    shipping,
  };

  let res: Response;
  try {
    res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: "No pudimos enviar el pedido. Revisa tu conexión e inténtalo de nuevo." };
  }
  const data = (await res.json().catch(() => null)) as OrderResponse | null;
  if (!data?.ok) {
    // Agotado, precio cambiado, datos inválidos (409/400) o servidor caído (5xx).
    const message = data && "message" in data ? data.message : "";
    return { ok: false, message: res.status >= 500 || !message ? "La tienda no respondió. Inténtalo de nuevo en un momento." : message };
  }

  const order: Order = {
    clientOrderId,
    remoteId: data.orderId,
    createdAt: Date.now(),
    items,
    customer,
    total: data.total,
    shipping: data.shipping,
    remoteStatus: data.demo ? undefined : "on-hold",
    demo: data.demo,
  };
  saveOrder(order);
  clearCart();
  return { ok: true, order };
}

// ---------- Pago del envío ----------

// El pedido espera el pago del envío y se puede pagar en línea.
export const canPayShipping = (o: Order) =>
  pagoEnLinea(o.shipping) && !o.demo && o.remoteId > 0 && (!o.remoteStatus || o.remoteStatus === "on-hold");

// Pide al servidor la URL firmada del checkout de Wompi y lleva al cliente allá.
// Al terminar, Wompi lo devuelve a /pago. Si algo falla, devuelve el mensaje.
export async function payShipping(o: Order): Promise<string | null> {
  try {
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: o.remoteId, clientOrderId: o.clientOrderId }),
    });
    const data = (await res.json().catch(() => null)) as PaymentResponse | null;
    if (data?.ok) {
      window.location.assign(data.url);
      return null;
    }
    return data?.message ?? "No pudimos abrir el pago. Inténtalo de nuevo.";
  } catch {
    return "No pudimos abrir el pago. Revisa tu conexión e inténtalo de nuevo.";
  }
}

// ---------- Estado de pedidos ----------

let checkingStatuses = false;

// Trae de WooCommerce el estado de los pedidos que aún pueden cambiar.
export async function refreshOrderStatuses() {
  if (checkingStatuses) return;
  const active = readOrders()
    .filter((o) => o.remoteId > 0 && !o.demo && !FINAL_REMOTE_STATUSES.includes(o.remoteStatus ?? ""))
    .slice(0, 100);
  if (active.length === 0) return;
  checkingStatuses = true;
  try {
    const res = await fetch("/api/pedidos/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: active.map((o) => ({ id: o.remoteId, clientOrderId: o.clientOrderId })) }),
    });
    const data = (await res.json().catch(() => null)) as OrderStatusResponse | null;
    if (!res.ok || !data?.ok) return;

    const checkedAt = Date.now();
    const patches = new Map<string, Partial<Order>>();
    for (const o of active) {
      const remoteStatus = data.statuses[o.remoteId];
      if (remoteStatus) patches.set(o.clientOrderId, { remoteStatus, remoteCheckedAt: checkedAt });
    }
    updateOrders(patches);
  } catch {
    // Sin red o servidor caído: se reintenta en el próximo ciclo.
  } finally {
    checkingStatuses = false;
  }
}
