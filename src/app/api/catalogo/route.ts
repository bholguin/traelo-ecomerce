import { connection } from "next/server";
import { getCatalog } from "@/lib/catalogo";

// La PWA descarga el catálogo completo a IndexedDB para el modo sin conexión.
// Comparte la caché del SSR (getCatalog), así no consulta a Woo en cada llamada.
export async function GET() {
  await connection();
  try {
    return Response.json(await getCatalog());
  } catch (e) {
    console.error("[catalogo]", e);
    return Response.json({ error: "No se pudo leer el catálogo" }, { status: 502 });
  }
}
