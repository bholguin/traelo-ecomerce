import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEMO_PRODUCTS } from "./demo-products";
import { slugify } from "./format";
import type { Product } from "./types";
import { fetchCatalog, wooConfigured } from "./woo";

// Capa de datos del SSR: todas las páginas públicas leen de aquí.
// El catálogo completo se guarda en caché unos minutos (tag "catalogo"); el resto
// de funciones filtran sobre él. Con un catálogo de dropshipping (decenas o pocos
// cientos de productos) es más simple y rápido que consultar a Woo por cada filtro.
// Fase 2: subir a cacheLife("hours") e invalidar con revalidateTag("catalogo")
// desde un webhook de Woo.

export type Categoria = { name: string; slug: string; count: number };

export async function getCatalog(): Promise<{ products: Product[]; demo: boolean }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogo");

  if (!wooConfigured()) return { products: DEMO_PRODUCTS, demo: true };
  const products = await fetchCatalog();
  return { products: products.sort((a, b) => a.name.localeCompare(b.name, "es")), demo: false };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(): Promise<Categoria[]> {
  const { products } = await getCatalog();
  const byName = new Map<string, number>();
  for (const p of products) for (const c of p.categories) byName.set(c, (byName.get(c) ?? 0) + 1);
  return [...byName]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function getCategory(slug: string) {
  const [{ products }, categories] = await Promise.all([getCatalog(), getCategories()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return { category, products: products.filter((p) => p.categories.includes(category.name)) };
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export async function searchProducts(query: string): Promise<Product[]> {
  const q = normalize(query.trim());
  if (!q) return [];
  const { products } = await getCatalog();
  return products.filter((p) => normalize(p.name).includes(q) || normalize(p.description).includes(q));
}
