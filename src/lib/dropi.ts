import "server-only";
import { cacheLife } from "next/cache";
import { PRODUCTOS, type ProductoTienda } from "@/config/productos";
import type { Customer, Product } from "./types";

// Cliente de la API de integraciones de Dropi.
//
// Todo lo de este archivo replica lo que hace el plugin oficial de Dropi para
// WooCommerce (wc-dropi-integration 4.7.3):
//   - base:   https://api.dropi.co/integrations/          (Constants.php)
//   - auth:   header "dropi-integration-key: <token>"      (todas las llamadas)
//   - producto:      GET  products/v2/{id}                 (ProductsModel::getProduct)
//   - crear pedido:  POST orders/myorders                  (OrdersModel::save)
//   - respuesta:     { isSuccess, message, objects }
// Dropi no publica documentación de esta API: si cambia, este archivo es lo único que hay que ajustar.
//
// Variables de entorno (solo servidor, en Vercel → Settings → Environment Variables):
//   DROPI_TOKEN        token de integración (dropi.co → Mis tiendas → tu tienda)
//   DROPI_API_URL      opcional, por defecto https://api.dropi.co/integrations/
//   DROPI_PRODUCT_IDS  opcional, IDs separados por coma que se suman a src/config/productos.ts

const API_URL = (process.env.DROPI_API_URL ?? "https://api.dropi.co/integrations/").replace(/\/?$/, "/");
const TOKEN = process.env.DROPI_TOKEN;
const IMG_URL = API_URL.replace(/integrations\/$/, ""); // https://api.dropi.co/
const CLOUDFRONT_URL = "https://d39ru7awumhhs2.cloudfront.net/";

export const dropiConfigured = () => Boolean(TOKEN);

// ---------- Tipos de la respuesta de Dropi (solo los campos que usamos) ----------

type DropiPhoto = { id?: number; url?: string | null; urlS3?: string | null };

export type DropiProduct = {
  id: number;
  name: string;
  description?: string | null;
  type?: "SIMPLE" | "VARIABLE" | string;
  sku?: string | null;
  sale_price?: string | number; // precio al dropshipper (tu costo)
  suggested_price?: string | number; // precio de venta sugerido
  stock?: number | string | null;
  warehouse_product?: { stock?: number | string }[];
  photos?: DropiPhoto[];
  gallery?: DropiPhoto[];
  categories?: { name: string }[];
  user_id?: number; // proveedor
  active?: boolean;
  [key: string]: unknown;
};

type DropiResponse<T> = { isSuccess: boolean; message?: string; status?: string; objects?: T };

export class DropiError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "rejected",
  ) {
    super(message);
  }
}

async function dropi<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "dropi-integration-key": TOKEN ?? "",
        ...init?.headers,
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new DropiError(`Dropi no respondió: ${e instanceof Error ? e.message : e}`, "network");
  }

  const body = (await res.json().catch(() => null)) as DropiResponse<T> | null;
  if (res.status >= 500 || res.status === 429 || !body) {
    throw new DropiError(`Dropi respondió ${res.status}`, "network");
  }
  if (!body.isSuccess) {
    throw new DropiError(body.message || body.status || `Dropi rechazó la solicitud (${res.status})`, "rejected");
  }
  return body.objects as T;
}

// ---------- Productos ----------

const stripHtml = (html?: string | null) =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const photoUrl = (p: DropiPhoto) =>
  p.urlS3 ? CLOUDFRONT_URL + p.urlS3 : p.url ? IMG_URL + p.url : null;

// Mismo cálculo del plugin (Product_List.php): si hay bodegas se suma su stock.
export function dropiStock(p: DropiProduct): number {
  if (Array.isArray(p.warehouse_product) && p.warehouse_product.length > 0) {
    return p.warehouse_product.reduce((n, w) => n + (Number(w.stock) || 0), 0);
  }
  return Number(p.stock) || 0;
}

export function toProduct(p: DropiProduct, cfg?: ProductoTienda): Product {
  const stock = dropiStock(p);
  const price = Math.round(cfg?.price ?? Number(p.suggested_price ?? p.sale_price ?? 0));
  const photos = [...(p.photos ?? []), ...(p.gallery ?? [])];
  return {
    id: p.id,
    name: cfg?.name ?? stripHtml(p.name),
    description: stripHtml(p.description).slice(0, 600),
    price,
    regularPrice: cfg?.regularPrice && cfg.regularPrice > price ? cfg.regularPrice : undefined,
    images: [...new Set(photos.map(photoUrl).filter((u): u is string => Boolean(u)))],
    categories: cfg?.category ? [cfg.category] : (p.categories ?? []).map((c) => c.name).slice(0, 1),
    inStock: stock > 0 && p.active !== false && price > 0,
    stock,
  };
}

export function configuredProducts(): ProductoTienda[] {
  const extra = (process.env.DROPI_PRODUCT_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .map((id) => ({ id }));
  const byId = new Map<number, ProductoTienda>();
  for (const p of [...extra, ...PRODUCTOS]) byId.set(p.id, { ...byId.get(p.id), ...p });
  return [...byId.values()];
}

export const fetchDropiProduct = (id: number) => dropi<DropiProduct>(`products/v2/${id}`, { method: "GET" });

// Catálogo para la PWA. Se cachea 5 min en el servidor (Vercel) para no
// golpear la API de Dropi con cada visita; el celular además lo guarda en IndexedDB.
export async function getCatalog(): Promise<{ products: Product[]; skipped: { id: number; reason: string }[] }> {
  "use cache";
  cacheLife("minutes");

  const config = configuredProducts();
  const results = await Promise.allSettled(config.map((c) => fetchDropiProduct(c.id)));
  const products: Product[] = [];
  const skipped: { id: number; reason: string }[] = [];

  results.forEach((r, i) => {
    const cfg = config[i];
    if (r.status === "rejected") {
      skipped.push({ id: cfg.id, reason: r.reason instanceof Error ? r.reason.message : "error" });
    } else if (r.value.type && r.value.type !== "SIMPLE") {
      // Los productos con variaciones (talla/color) aún no están soportados en la PWA.
      skipped.push({ id: cfg.id, reason: `tipo ${r.value.type} no soportado todavía` });
    } else {
      products.push(toProduct(r.value, cfg));
    }
  });

  return { products, skipped };
}

// ---------- Pedidos ----------

// Igual que el plugin: status "PENDIENTE CONFIRMACION", type "FINAL_ORDER",
// rate_type "CON RECAUDO" (contra entrega), calculate_costs_and_shiping true,
// supplier_id = proveedor del primer producto, products = objeto del producto de Dropi
// + name, quantity, price (precio de venta unitario) y token.
export async function createDropiOrder(input: {
  clientOrderId: string;
  customer: Customer;
  lines: { product: DropiProduct; quantity: number; unitPrice: number }[];
}): Promise<{ id: number | null }> {
  const c = input.customer;
  const products = input.lines.map((l) => ({
    ...l.product,
    name: l.product.name,
    quantity: l.quantity,
    stock: dropiStock(l.product),
    price: l.unitPrice,
    token: TOKEN,
  }));
  const total = input.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const data = {
    total_order: total,
    notes: [c.notes, `Pedido PWA ${input.clientOrderId}`].filter(Boolean).join(" -- "),
    name: c.firstName,
    surname: c.lastName,
    dir: c.address,
    country: "CO",
    state: c.department, // código del departamento, p. ej. "VAC" (ver lib/colombia.ts)
    city: c.city, // nombre exacto del municipio
    phone: c.phone,
    client_email: c.email ?? "",
    payment_method_id: 1,
    status: "PENDIENTE CONFIRMACION",
    type: "FINAL_ORDER",
    rate_type: "CON RECAUDO",
    products,
    calculate_costs_and_shiping: true,
    supplier_id: input.lines[0]?.product.user_id,
    shop_order_id: input.clientOrderId,
    create_product_if_not_exist: false,
  };

  const order = await dropi<{ id?: number } | null>("orders/myorders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { id: order?.id ?? null };
}
