import "server-only";
import type { Customer, Product } from "./types";

// Variables de entorno (solo servidor; configurarlas en Vercel, nunca con prefijo NEXT_PUBLIC_):
//   WC_URL     https://admin.tutienda.com   (sin barra final)
//   WC_KEY     ck_xxx  (llave REST de WooCommerce, permisos lectura/escritura)
//   WC_SECRET  cs_xxx
const WC_URL = process.env.WC_URL?.replace(/\/$/, "");
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;

export const wooConfigured = () => Boolean(WC_URL && WC_KEY && WC_SECRET);

// ---------- Store API (pública): catálogo ----------

type StoreProduct = {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  prices: { price: string; regular_price: string; currency_minor_unit: number };
  images: { src: string; thumbnail: string }[];
  categories: { name: string }[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  low_stock_remaining: number | null;
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function mapStoreProduct(p: StoreProduct): Product {
  const unit = 10 ** (p.prices.currency_minor_unit ?? 0);
  const price = Math.round(Number(p.prices.price) / unit);
  const regular = Math.round(Number(p.prices.regular_price) / unit);
  return {
    id: p.id,
    slug: p.slug,
    name: stripHtml(p.name),
    description: stripHtml(p.short_description || p.description).slice(0, 600),
    price,
    regularPrice: regular > price ? regular : undefined,
    images: p.images.map((i) => i.src),
    categories: p.categories.map((c) => stripHtml(c.name)),
    inStock: p.is_in_stock && p.is_purchasable,
    stock: p.low_stock_remaining,
  };
}

export async function fetchCatalog(): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${WC_URL}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Store API respondió ${res.status}`);
    const items = (await res.json()) as StoreProduct[];
    all.push(...items.map(mapStoreProduct));
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) break;
  }
  return all;
}

export async function fetchProductsByIds(ids: number[]): Promise<Map<number, Product>> {
  const res = await fetch(
    `${WC_URL}/wp-json/wc/store/v1/products?include=${ids.join(",")}&per_page=100`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Store API respondió ${res.status}`);
  const items = (await res.json()) as StoreProduct[];
  return new Map(items.map((p) => [p.id, mapStoreProduct(p)]));
}

// ---------- REST API (privada): pedidos ----------

const authHeader = () =>
  "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

async function wcRest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WC_URL}/wp-json/wc/v3${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WooCommerce REST ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

type WcOrder = {
  id: number;
  status: string;
  total: string;
  shipping_total?: string;
  billing?: { first_name: string; last_name: string; phone: string; email?: string };
  meta_data: { key: string; value: unknown }[];
};

export const CLIENT_ORDER_META = "_pwa_client_order_id";
const SHIPPING_META = "_pwa_envio";
const PAYMENT_META = "_pwa_pago_wompi"; // id de la transacción de Wompi que pagó el envío

// Evita duplicados cuando la PWA reintenta: busca entre los pedidos recientes
// uno con el mismo client_order_id. Suficiente para el MVP; con mucho volumen
// conviene un índice propio (por ejemplo una tabla en Vercel KV o Postgres).
export async function findOrderByClientId(clientOrderId: string): Promise<WcOrder | null> {
  const recent = await wcRest<WcOrder[]>(`/orders?per_page=50&orderby=date&order=desc`);
  return (
    recent.find((o) =>
      o.meta_data.some((m) => m.key === CLIENT_ORDER_META && m.value === clientOrderId),
    ) ?? null
  );
}

// Estado de pedidos ya creados. Solo responde los que traen el client_order_id
// correcto: así nadie puede consultar pedidos ajenos adivinando números.
export async function fetchOrderStatuses(
  refs: { id: number; clientOrderId: string }[],
): Promise<Record<number, string>> {
  const orders = await wcRest<WcOrder[]>(
    `/orders?include=${refs.map((r) => r.id).join(",")}&per_page=100&_fields=id,status,meta_data`,
  );
  const expected = new Map(refs.map((r) => [r.id, r.clientOrderId]));
  const statuses: Record<number, string> = {};
  for (const o of orders) {
    const ok = o.meta_data.some((m) => m.key === CLIENT_ORDER_META && m.value === expected.get(o.id));
    if (ok) statuses[o.id] = o.status;
  }
  return statuses;
}

export async function createCodOrder(input: {
  clientOrderId: string;
  customer: Customer;
  lines: { productId: number; quantity: number }[];
  shipping: number | null; // envío prepagado (se cobra aparte del contra entrega)
}): Promise<WcOrder> {
  const c = input.customer;
  const address = {
    first_name: c.firstName,
    last_name: c.lastName,
    address_1: c.address,
    city: c.city,
    state: c.department,
    country: "CO",
    phone: c.phone,
    ...(c.email ? { email: c.email } : {}),
  };
  return wcRest<WcOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      // "on-hold" (En espera): el envío se paga al confirmar y todavía no está
      // pagado. Con Wompi pasa solo a "Procesando" (markShippingPaid); si el pago
      // se coordinó con el cliente, se pasa a mano.
      // VERIFICAR EN FASE 0: que el plugin de Dropi cree el pedido en Dropi al
      // cambiar de "En espera" a "Procesando", y que el valor a recaudar sea solo
      // el de los productos (sin el envío, que ya se pagó). Ver README.
      status: "on-hold",
      payment_method: "cod",
      payment_method_title: "Producto contra entrega · envío prepagado",
      set_paid: false,
      billing: address,
      shipping: address,
      customer_note: c.notes ?? "",
      line_items: input.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      ...(input.shipping && {
        shipping_lines: [
          { method_id: "flat_rate", method_title: "Envío (se paga al confirmar)", total: String(input.shipping) },
        ],
      }),
      meta_data: [
        { key: CLIENT_ORDER_META, value: input.clientOrderId },
        { key: "_pwa_origen", value: "pwa" },
        // Al pagar el envío con Wompi pasa a "pagado" (ver markShippingPaid).
        { key: SHIPPING_META, value: input.shipping ? "pendiente de pago" : "por cotizar" },
      ],
    }),
  });
}

const orderMeta = (o: WcOrder, key: string) => o.meta_data.find((m) => m.key === key)?.value;

// Pedido para cobrar su envío. Solo lo devuelve si trae el client_order_id
// correcto, igual que fetchOrderStatuses.
export async function fetchOrderForPayment(id: number, clientOrderId: string): Promise<WcOrder | null> {
  const order = await wcRest<WcOrder>(`/orders/${id}`).catch(() => null);
  return order && orderMeta(order, CLIENT_ORDER_META) === clientOrderId ? order : null;
}

const addOrderNote = (id: number, note: string) =>
  wcRest(`/orders/${id}/notes`, { method: "POST", body: JSON.stringify({ note, customer_note: false }) });

export type ShippingPaymentResult = "pagado" | "ya-registrado" | "revisar";

// Registra en Woo un pago aprobado del envío. La llaman el webhook de Wompi y la
// página de regreso (/api/pagos/estado), así que puede llegar dos veces: si la
// transacción ya está registrada, no hace nada.
//
// Pasa el pedido de "En espera" a "Procesando" SIN set_paid: el producto sigue
// siendo contra entrega. VERIFICAR EN FASE 0 que este cambio dispare la creación
// del pedido en Dropi y que el valor a recaudar sea solo el de los productos.
export async function markShippingPaid(
  orderId: number,
  tx: { id: string; amount_in_cents: number; currency: string },
): Promise<ShippingPaymentResult> {
  const order = await wcRest<WcOrder>(`/orders/${orderId}`);
  if (orderMeta(order, PAYMENT_META) === tx.id) return "ya-registrado";

  const expected = Math.round(Number(order.shipping_total ?? 0) * 100);
  const pago = `Wompi ${tx.id} por $${tx.amount_in_cents / 100} ${tx.currency}`;
  const problema =
    tx.currency !== "COP" || tx.amount_in_cents !== expected
      ? `pero el envío del pedido es de $${expected / 100}`
      : order.status !== "on-hold"
        ? `con el pedido en estado "${order.status}"` // cancelado o ya pasado a mano: ¿reembolso?
        : null;
  if (problema) {
    // El pedido no cambia de estado; el pago queda registrado y anotado una sola vez.
    await wcRest(`/orders/${orderId}`, { method: "PUT", body: JSON.stringify({ meta_data: [{ key: PAYMENT_META, value: tx.id }] }) });
    await addOrderNote(orderId, `Pago de envío aprobado (${pago}) ${problema}. Revisar a mano.`);
    return "revisar";
  }

  await wcRest(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "processing",
      meta_data: [
        { key: SHIPPING_META, value: "pagado" },
        { key: PAYMENT_META, value: tx.id },
      ],
    }),
  });
  await addOrderNote(orderId, `Envío pagado: ${pago}.`);
  return "pagado";
}
