# Contexto del proyecto: Tienda PWA offline + WooCommerce + Dropi

Lee también `AGENTS.md`: esta es Next.js 16.4 y sus APIs difieren de versiones anteriores. Antes de escribir código de Next, consulta `node_modules/next/dist/docs/`.

## Qué es

Una PWA responsive para Colombia. Vende productos del catálogo de **Dropi** (dropshipping colombiano) con **pago contra entrega**. Su requisito central es **funcionar sin conexión**: el cliente navega el catálogo, arma el carrito y confirma el pedido sin señal, y el pedido se envía solo cuando vuelve la red.

Idioma de la interfaz y de los textos: español de Colombia. Moneda: COP sin decimales.

## Arquitectura

```
Celular (PWA Next.js) ──pedidos──▶ /api/pedidos (Vercel) ──REST v3──▶ WooCommerce ──plugin Dropify──▶ Dropi
                      ◀─catálogo── /api/catalogo (Vercel) ◀─Store API─┘
```

- **Frontend + API:** Next.js 16 (App Router, Turbopack, `cacheComponents: true`), desplegado en **Vercel**.
- **Backend invisible:** WordPress + WooCommerce en modo headless, en un hosting PHP aparte. Sirve de catálogo y de panel de pedidos.
- **Integración con Dropi:** el plugin oficial de WordPress `wc-dropi-integration` ("Dropify"). Importa los productos de Dropi a Woo y crea en Dropi cada pedido de Woo. Se configura con el access token que da Dropi en *Mis tiendas*. **No llamamos a Dropi directamente**: su API no tiene documentación pública.

## Decisiones tomadas (no cambiarlas sin preguntar)

| Decisión | Motivo |
| --- | --- |
| PWA, no app nativa | Un solo código; se instala desde el navegador |
| Next.js + Vercel | Elección del usuario; los route handlers reemplazan a un mini-plugin de WordPress |
| WooCommerce como intermediario con Dropi | La integración la resuelve el plugin oficial; evita depender de una API no documentada |
| Solo pago contra entrega | Es el modelo nativo de Dropi; no hay pagos en línea en el MVP |
| Sin cuentas de cliente ni login | Fuera del MVP |
| Llaves de Woo solo en variables de entorno de Vercel | Nunca en el navegador ni con prefijo `NEXT_PUBLIC_` |
| Serwist para el service worker | Sucesor mantenido de next-pwa; se construye después de `next build` para precachear las rutas prerenderizadas |

## Stack

- Next.js 16.4, React 19.3, TypeScript, Tailwind CSS v4 (tokens en `src/app/globals.css` con `@theme`)
- Serwist 9.5 en modo configurador: `serwist.config.mjs` y `serwist build` después de `next build`
- Dexie 4 + dexie-react-hooks (IndexedDB)
- Sin Google Fonts: se usa la pila de fuentes del sistema, que funciona offline

## Estructura

```
src/app/
  page.tsx                 catálogo (búsqueda + categorías)
  producto/page.tsx        ficha: UNA ruta /producto?id=123 que lee de IndexedDB
  carrito/  checkout/  pedidos/  offline/
  api/catalogo/route.ts    Store API de Woo → JSON; modo demo sin variables
  api/pedidos/route.ts     valida, recalcula precio/stock, deduplica y crea el pedido en Woo
  sw.ts                    service worker (Serwist)
  manifest.ts              manifest PWA
src/lib/
  db.ts       Dexie: tablas products, cart, orders, meta
  sync.ts     refreshCatalog(), enqueueOrder(), flushQueue(), retryOrder()
  woo.ts      cliente WooCommerce, solo servidor ("server-only")
  hooks.ts    useOnline, useCart, useCartCount, usePendingCount, useCatalogMeta
  brand.ts    nombre de la tienda y color del tema (un solo lugar)
  product-cache.ts  producto tocado en el catálogo, para que la ficha pinte en el primer render
  types.ts  format.ts  colombia.ts (33 departamentos)  demo-products.ts
src/components/
  Header (barra superior + barra flotante en celular), SyncManager, Pwa (SerwistProvider),
  Catalog, ProductDetail, Orders (línea de tiempo), ProductImage, Icons (SVG propios, sin dependencias)
```

## Reglas del modo offline (importantes)

1. **Toda página debe poder prerenderizarse como estática.** Las páginas son client components que leen de IndexedDB. No hagas render en servidor por producto ni `generateStaticParams` por producto: esas páginas no abrirían sin red.
2. **La ficha de producto es `/producto?id=`.** El service worker ignora los parámetros `id` y `nuevo` (`ignoreURLParametersMatching` en `sw.ts`) para servir la página precacheada.
3. **`useSearchParams` va dentro de `<Suspense>`** (lo exige `cacheComponents`).
4. **El pedido se guarda en IndexedDB antes de enviarse.** Nunca envíes un pedido sin guardarlo primero.
5. **`reloadOnOnline={false}`** en `SerwistProvider`. El valor por defecto (`true`) recarga la página al volver la red y borraba el checkout a medio llenar.
6. La API (`/api/*`) nunca se cachea en el service worker (`NetworkOnly`); los datos viven en IndexedDB.
7. Las fotos usan `<img>`, no `next/image`: la optimización ocurre en el servidor y no funcionaría offline. El service worker las cachea (`fotos-productos`, cache-first, 400 entradas, 30 días).
8. iOS no tiene Background Sync. `SyncManager` sincroniza al montar, en el evento `online`, al volver la pestaña visible y cada 30 s (cola) y cada 10 min (catálogo).
9. El service worker está desactivado en `npm run dev`. Para probar el modo offline: `npm run build && npm start`.

## Cola de pedidos

Estados (`OrderStatus` en `types.ts`): `pendiente` → `enviando` → `enviado`.
- Error de red o 5xx → `error`, con reintento automático y espera creciente (`2^intentos × 5 s`, máximo 15 min).
- Error de negocio o validación (respuesta `{ok:false, kind:"business"|"validation"}`) → `revision`. No se reintenta solo; se muestra al cliente con un botón "Reintentar ahora".
- Seguimiento: `refreshOrderStatuses()` pide a `POST /api/pedidos/estado` el estado en Woo de los pedidos `enviado` (cada 30 s con la pestaña visible, al abrir y al volver la red) y lo guarda en `remoteStatus`. Deja de consultar los estados finales (`FINAL_REMOTE_STATUSES`). El servidor solo responde si `remoteId` y `clientOrderId` coinciden.
- Cada pedido tiene un `clientOrderId` (UUID). El servidor lo guarda en el meta `_pwa_client_order_id` y, si llega repetido, devuelve el pedido existente. Hoy busca entre los últimos 50 pedidos; con más volumen hará falta un índice propio.

## API de pedidos: reglas del servidor

- Nunca confiar en el precio del cliente. Se recalcula con la Store API. Si el precio cambió, el producto está agotado o falta stock, responde 409 `business`.
- Celular colombiano: 10 dígitos que empiezan por 3.
- El pedido se crea con `status: "processing"`, `payment_method: "cod"` y `set_paid: false`, con billing y shipping iguales (`state` = departamento, `country` = "CO").

## Variables de entorno

`WC_URL` (sin barra final), `WC_KEY` y `WC_SECRET` (llave REST de Woo con lectura y escritura, de un usuario dedicado). Ver `.env.example`. **Sin ellas, la app corre en modo demo** con `DEMO_PRODUCTS`, y `/api/pedidos` responde `demo: true` sin crear nada.

## Estado actual

- ✅ Fases 2 y 3: PWA base y capa offline. Probado en Chromium a 390 px: catálogo offline, ficha offline, carrito, checkout offline, pedido en cola que se sincroniza al volver la red, sin errores de JavaScript.
- ✅ Route handlers de catálogo y pedidos, con modo demo.
- ⏳ **Fase 0 (bloqueante antes de lanzar):** confirmar que el plugin de Dropi crea el pedido en Dropi cuando el pedido de Woo **llega por la REST API**. No está verificado; muchos plugins solo escuchan el checkout normal. El plan B está en el README.
- ⏳ Montar WordPress + WooCommerce + plugin Dropify, importar productos y configurar las variables en Vercel.

## Pendiente / próximos trabajos

- Anti-spam en el checkout (Cloudflare Turnstile) y límite de pedidos por IP en `/api/pedidos`.
- Costo de envío: hoy solo se muestra el total de productos ("se confirma al despachar").
- Marca: el nombre "Tráelo" (`src/lib/brand.ts`) es provisional, y los íconos de `public/` todavía son los genéricos. Colores en `oklch` en `globals.css`; los botones principales van en `ink` porque el texto blanco sobre `brand` no da contraste AA.
- Diseño: la foto viaja del catálogo a la ficha con `<ViewTransition name="producto-{id}" share="morph">`, que solo funciona si la ficha la pinta en el primer render (de ahí `productCache`). Las tarjetas aparecen con scroll-driven animations (`.reveal`), sin respaldo porque es decorativo. En `.text-gradient` usa `background-image`, no el atajo `background`.
- Índice de idempotencia más robusto que "últimos 50 pedidos".
- Pruebas automatizadas en el repo (la prueba E2E se corrió con Playwright fuera del proyecto).

## Comandos

```bash
npm install
npm run dev     # desarrollo, sin service worker
npm run build   # next build && serwist build serwist.config.mjs → genera public/sw.js
npm start       # producción local, con modo offline
npm run lint
```

`public/sw.js` es un archivo generado: está en `.gitignore` y en los ignores de ESLint. No lo edites; edita `src/app/sw.ts`.
