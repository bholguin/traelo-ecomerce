import { connection } from "next/server";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { dropiConfigured, getCatalog } from "@/lib/dropi";

export async function GET() {
  await connection();

  if (!dropiConfigured()) {
    return Response.json({ demo: true, products: DEMO_PRODUCTS });
  }

  try {
    const { products, skipped } = await getCatalog();
    if (skipped.length) console.warn("[catalogo] productos omitidos", skipped);
    if (products.length === 0 && skipped.length > 0) {
      return Response.json({ error: "Ningún producto de Dropi se pudo cargar", skipped }, { status: 502 });
    }
    return Response.json({ demo: false, products, skipped });
  } catch (e) {
    console.error("[catalogo]", e);
    return Response.json({ error: "No se pudo leer el catálogo" }, { status: 502 });
  }
}
