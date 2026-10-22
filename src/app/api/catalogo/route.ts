import { connection } from "next/server";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { fetchCatalog, wooConfigured } from "@/lib/woo";

export async function GET() {
  // Siempre en tiempo de petición: el catálogo cambia en Dropi/Woo.
  await connection();

  if (!wooConfigured()) {
    return Response.json({ demo: true, products: DEMO_PRODUCTS });
  }

  try {
    const products = await fetchCatalog();
    return Response.json(
      { demo: false, products },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    console.error("[catalogo]", e);
    return Response.json({ error: "No se pudo leer el catálogo" }, { status: 502 });
  }
}
