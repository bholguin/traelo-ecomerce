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
  meta_data: { key: string; value: unknown }[];
};

export const CLIENT_ORDER_META = "_pwa_client_order_id";

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
      // pagado. Al confirmar el pago, pasa el pedido a "Procesando" en Woo.
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
        // Cuando exista pasarela de pagos, aquí quedará la referencia del pago.
        { key: "_pwa_envio", value: input.shipping ? "pendiente de pago" : "por cotizar" },
      ],
    }),
  });
}
