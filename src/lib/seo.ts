import "server-only";
import { wooConfigured } from "./woo";

// ¿Puede Google indexar este despliegue? Solo producción con WooCommerce real:
// el modo demo (6 productos de prueba) y las vistas previas de Vercel no se indexan.
export const indexable = () =>
  wooConfigured() && process.env.VERCEL_ENV !== "preview" && process.env.VERCEL_ENV !== "development";

// JSON-LD para un <script type="application/ld+json">. Se escapa "<" para que un
// texto con "</script>" (por ejemplo en una descripción de producto) no rompa la página.
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
