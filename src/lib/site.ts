// URL pública de la tienda (sin barra final). Se usa para metadata, canonical,
// sitemap e imágenes para compartir.
//
// Cuando tengas dominio propio, define NEXT_PUBLIC_SITE_URL en Vercel
// (Settings → Environment Variables), por ejemplo https://traelo.co, y vuelve a desplegar.
// Mientras tanto se usa el dominio de producción que Vercel asigna al proyecto,
// y en local http://localhost:3000.
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || fromVercel || "http://localhost:3000").replace(/\/$/, "");
