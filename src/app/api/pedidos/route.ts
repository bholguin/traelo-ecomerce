import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { costoEnvio } from "@/lib/envio";
import type { Customer, OrderPayload, OrderResponse, Product } from "@/lib/types";
import {
  createCodOrder,
  fetchProductsByIds,
  findOrderByClientId,
  wooConfigured,
} from "@/lib/woo";

const json = (body: OrderResponse, status = 200) => Response.json(body, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE = /^3\d{9}$/; // celular colombiano: 10 dígitos que empiezan por 3

function validate(body: unknown): { ok: true; data: OrderPayload } | { ok: false; message: string } {
  if (!body || typeof body !== "object") return { ok: false, message: "Cuerpo inválido" };
  const b = body as Partial<OrderPayload>;
  if (typeof b.clientOrderId !== "string" || !UUID.test(b.clientOrderId))
    return { ok: false, message: "clientOrderId inválido" };
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 30)
    return { ok: false, message: "El pedido no tiene productos" };
  for (const i of b.items) {
    if (!Number.isInteger(i?.productId) || !Number.isInteger(i?.quantity) || i.quantity < 1 || i.quantity > 20)
      return { ok: false, message: "Producto o cantidad inválidos" };
  }
  const c = b.customer as Partial<Customer> | undefined;
  const req = (v: unknown, max = 120) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  if (!c || !req(c.firstName) || !req(c.lastName) || !req(c.department) || !req(c.city) || !req(c.address, 250))
    return { ok: false, message: "Faltan datos de envío" };
  const phone = String(c.phone ?? "").replace(/\D/g, "");
  if (!PHONE.test(phone)) return { ok: false, message: "Celular inválido (10 dígitos, empieza por 3)" };

  return {
    ok: true,
    data: {
      clientOrderId: b.clientOrderId,
      shipping: typeof b.shipping === "number" ? b.shipping : null,
      items: b.items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) || 0 })),
      customer: {
        firstName: c.firstName!.trim(),
        lastName: c.lastName!.trim(),
        phone,
        email: typeof c.email === "string" && c.email.includes("@") ? c.email.trim() : undefined,
        department: c.department!.trim(),
        city: c.city!.trim(),
        address: c.address!.trim(),
        notes: typeof c.notes === "string" ? c.notes.slice(0, 500) : undefined,
      },
    },
  };
}

// El servidor recalcula todo: nunca confía en el precio que manda el celular.
function checkLines(payload: OrderPayload, catalog: Map<number, Product>) {
  let total = 0;
  for (const line of payload.items) {
    const p = catalog.get(line.productId);
    if (!p) return { ok: false as const, message: `Un producto ya no está disponible (id ${line.productId})` };
    if (!p.inStock) return { ok: false as const, message: `"${p.name}" está agotado` };
    if (typeof p.stock === "number" && p.stock < line.quantity)
      return { ok: false as const, message: `Solo quedan ${p.stock} unidades de "${p.name}"` };
    if (line.price && line.price !== p.price)
      return { ok: false as const, message: `El precio de "${p.name}" cambió; revisa el pedido` };
    total += p.price * line.quantity;
  }
  return { ok: true as const, total };
}

export async function POST(request: Request) {
  const parsed = validate(await request.json().catch(() => null));
  if (!parsed.ok) return json({ ok: false, kind: "validation", message: parsed.message }, 400);
  const payload = parsed.data;

  // El envío se paga al confirmar y depende del destino: el cliente tuvo que ver
  // y aceptar el mismo valor que calcula el servidor para su dirección.
  const shipping = costoEnvio(payload.customer.department, payload.customer.city);
  if ((payload.shipping ?? null) !== shipping) {
    return json(
      { ok: false, kind: "business", message: "El valor del envío cambió; revisa el pedido antes de confirmarlo" },
      409,
    );
  }

  // ---- Modo demo: sin WooCommerce configurado ----
  if (!wooConfigured()) {
    const catalog = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
    const check = checkLines(payload, catalog);
    if (!check.ok) return json({ ok: false, kind: "business", message: check.message }, 409);
    return json({ ok: true, orderId: 0, total: check.total, shipping, demo: true });
  }

  try {
    const existing = await findOrderByClientId(payload.clientOrderId);
    if (existing) {
      const paid = Number(existing.shipping_total) || null;
      return json({ ok: true, orderId: existing.id, total: Number(existing.total) - (paid ?? 0), shipping: paid, duplicated: true });
    }

    const catalog = await fetchProductsByIds(payload.items.map((i) => i.productId));
    const check = checkLines(payload, catalog);
    if (!check.ok) return json({ ok: false, kind: "business", message: check.message }, 409);

    const order = await createCodOrder({
      clientOrderId: payload.clientOrderId,
      customer: payload.customer,
      lines: payload.items,
      shipping,
    });
    // total = lo que se recauda contra entrega (productos); el envío va aparte.
    return json({ ok: true, orderId: order.id, total: check.total, shipping });
  } catch (e) {
    console.error("[pedidos]", e);
    // 502 → la PWA lo trata como error temporal y reintenta.
    return Response.json({ ok: false, message: "WooCommerce no respondió" }, { status: 502 });
  }
}
