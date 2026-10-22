import type { OrderStatusResponse } from "@/lib/types";
import { fetchOrderStatuses, wooConfigured } from "@/lib/woo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST y no GET: los POST nunca se cachean y la lista de pedidos no queda en la URL.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orders?: unknown } | null;
  const orders = Array.isArray(body?.orders) ? body.orders : null;
  if (!orders || orders.length === 0 || orders.length > 100) {
    return Response.json({ ok: false, message: "Lista de pedidos inválida" }, { status: 400 });
  }
  const refs: { id: number; clientOrderId: string }[] = [];
  for (const o of orders as { id?: unknown; clientOrderId?: unknown }[]) {
    if (!Number.isInteger(o?.id) || (o.id as number) < 1 || typeof o.clientOrderId !== "string" || !UUID.test(o.clientOrderId))
      return Response.json({ ok: false, message: "Pedido inválido" }, { status: 400 });
    refs.push({ id: o.id as number, clientOrderId: o.clientOrderId });
  }

  // Modo demo: los pedidos no existen en WooCommerce.
  if (!wooConfigured()) return Response.json({ ok: true, statuses: {}, demo: true } satisfies OrderStatusResponse);

  try {
    const statuses = await fetchOrderStatuses(refs);
    return Response.json({ ok: true, statuses } satisfies OrderStatusResponse);
  } catch (e) {
    console.error("[pedidos/estado]", e);
    return Response.json({ ok: false, message: "WooCommerce no respondió" }, { status: 502 });
  }
}
