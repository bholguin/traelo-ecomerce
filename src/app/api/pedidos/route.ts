import { findDepartamento } from "@/lib/colombia";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import {
  configuredProducts,
  createDropiOrder,
  DropiError,
  dropiConfigured,
  fetchDropiProduct,
  toProduct,
  type DropiProduct,
} from "@/lib/dropi";
import { getEntry, markDone, release, reserve } from "@/lib/idempotency";
import type { Customer, OrderPayload, OrderResponse, Product } from "@/lib/types";

const json = (body: OrderResponse, status = 200) => Response.json(body, { status });
const retryLater = (message: string) => Response.json({ ok: false, message }, { status: 503 });

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

  const depto = findDepartamento(c.department!.trim());
  if (!depto) return { ok: false, message: "Departamento inválido" };
  if (!depto.cities.includes(c.city!.trim()))
    return { ok: false, message: `"${c.city}" no está en la lista de municipios de ${depto.name}` };

  const phone = String(c.phone ?? "").replace(/\D/g, "");
  if (!PHONE.test(phone)) return { ok: false, message: "Celular inválido (10 dígitos, empieza por 3)" };

  return {
    ok: true,
    data: {
      clientOrderId: b.clientOrderId,
      items: b.items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) || 0 })),
      customer: {
        firstName: c.firstName!.trim(),
        lastName: c.lastName!.trim(),
        phone,
        email: typeof c.email === "string" && c.email.includes("@") ? c.email.trim() : undefined,
        department: depto.code,
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

  // ---- Modo demo: sin DROPI_TOKEN ----
  if (!dropiConfigured()) {
    const check = checkLines(payload, new Map(DEMO_PRODUCTS.map((p) => [p.id, p])));
    if (!check.ok) return json({ ok: false, kind: "business", message: check.message }, 409);
    return json({ ok: true, orderId: 0, total: check.total, demo: true });
  }

  // ---- Idempotencia ----
  const existing = await getEntry(payload.clientOrderId);
  if (existing?.state === "done") {
    return json({ ok: true, orderId: existing.orderId ?? 0, total: existing.total, duplicated: true });
  }
  if (!(await reserve(payload.clientOrderId))) {
    return retryLater("Este pedido ya se está procesando");
  }

  try {
    // Solo se venden productos configurados en la tienda
    const allowed = new Map(configuredProducts().map((c) => [c.id, c]));
    const ids = [...new Set(payload.items.map((i) => i.productId))];
    if (ids.some((id) => !allowed.has(id))) {
      await release(payload.clientOrderId);
      return json({ ok: false, kind: "business", message: "Un producto ya no se vende en esta tienda" }, 409);
    }

    // Datos frescos de Dropi (precio, stock, proveedor), sin caché
    const fresh = new Map<number, DropiProduct>();
    for (const id of ids) fresh.set(id, await fetchDropiProduct(id));
    const catalog = new Map([...fresh].map(([id, p]) => [id, toProduct(p, allowed.get(id))]));

    const check = checkLines(payload, catalog);
    if (!check.ok) {
      await release(payload.clientOrderId);
      return json({ ok: false, kind: "business", message: check.message }, 409);
    }

    const order = await createDropiOrder({
      clientOrderId: payload.clientOrderId,
      customer: payload.customer,
      lines: payload.items.map((i) => ({
        product: fresh.get(i.productId)!,
        quantity: i.quantity,
        unitPrice: catalog.get(i.productId)!.price,
      })),
    });

    await markDone(payload.clientOrderId, { orderId: order.id, total: check.total });
    return json({ ok: true, orderId: order.id ?? 0, total: check.total });
  } catch (e) {
    await release(payload.clientOrderId).catch(() => {});
    console.error("[pedidos]", e);
    if (e instanceof DropiError && e.kind === "rejected") {
      // Dropi rechazó el pedido (ciudad sin cobertura, producto inactivo, token inválido...)
      return json({ ok: false, kind: "business", message: `Dropi: ${e.message}` }, 409);
    }
    // Error de red o 5xx → la PWA reintenta con espera creciente
    return retryLater("Dropi no respondió");
  }
}
