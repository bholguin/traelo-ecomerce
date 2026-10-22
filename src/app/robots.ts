import type { MetadataRoute } from "next";
import { indexable } from "@/lib/seo";

// Fase 2: agregar `sitemap: ${SITE_URL}/sitemap.xml` cuando exista sitemap.ts.
export default function robots(): MetadataRoute.Robots {
  if (!indexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Páginas del dispositivo del cliente o de respaldo offline: sin valor en Google.
      disallow: ["/api/", "/carrito", "/checkout", "/pedidos", "/offline", "/producto"],
    },
  };
}
