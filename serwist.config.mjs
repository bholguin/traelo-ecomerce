// @ts-check
// Serwist se construye DESPUÉS de `next build`, así precachea todas las rutas prerenderizadas.
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Las páginas SSR con datos de Woo (inicio, fichas, categorías, búsqueda) NO van
  // al precache: el precache responde desde caché antes que la red, y el cliente
  // vería precios y stock del momento del build. Se guardan al visitarlas
  // (regla "paginas" en sw.ts). Sí se precachean los cascarones cliente:
  // carrito, checkout, pedidos, /producto y /offline.
  globIgnores: [
    ".next/server/app/index.html",
    ".next/server/app/p/**",
    ".next/server/app/c/**",
    ".next/server/app/buscar.html",
  ],
});
