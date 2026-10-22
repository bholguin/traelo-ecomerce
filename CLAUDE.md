# Contexto del proyecto: Tienda PWA offline + Dropi (100% Vercel)

Lee también `AGENTS.md`: esta es Next.js 16.4 y sus APIs difieren de versiones anteriores. Antes de escribir código de Next, consulta `node_modules/next/dist/docs/`.

## Qué es

Una PWA responsive para Colombia. Vende productos del catálogo de **Dropi** (dropshipping colombiano) con **pago contra entrega**. Su requisito central es **funcionar sin conexión**: el cliente navega el catálogo, arma el carrito y confirma el pedido sin señal, y el pedido se envía solo a Dropi cuando vuelve la red.

Idioma de la interfaz y de los textos: español de Colombia. Moneda: COP sin decimales.

## Arquitectura

```
Celular (PWA Next.js) ──pedidos──▶ /api/pedidos  (Vercel) ──POST orders/myorders──▶ Dropi
                      ◀─catálogo── /api/catalogo (Vercel) ◀─GET products/v2/{id}──┘
```

Todo vive en **Vercel**: frontend, route handlers y (opcional) Upstash Redis. **No hay WordPress ni WooCommerce**; se descartaron porque Vercel no los puede alojar y el usuario quería un solo servicio.

## Decisiones tomadas (no cambiarlas sin preguntar)

| Decisión | Motivo |
| --- | --- |
| PWA, no app nativa | Un solo código; se instala desde el navegador |
| Next.js + Vercel, sin WooCommerce | Elección del usuario: todo en un solo hosting, todo en React |
| Llamar directo a la API de integraciones de Dropi | Replicando el plugin oficial de WordPress, que es la única referencia de esa API |
| Solo pago contra entrega (`rate_type: "CON RECAUDO"`) | Es el modelo nativo de Dropi |
| Sin cuentas de cliente ni login | Fuera del MVP |
| Productos a vender en `src/config/productos.ts` (+ `DROPI_PRODUCT_IDS`) | Sin Woo no hay panel; el catálogo de Dropi es enorme y de todos los proveedores |
| Token de Dropi solo en variables de entorno de Vercel | Nunca en el navegador ni con prefijo `NEXT_PUBLIC_` |
| Serwist para el service worker | Sucesor mantenido de next-pwa; se construye después de `next build` para precachear las rutas prerenderizadas |

## La API de Dropi (lo más delicado del proyecto)

Dropi **no publica documentación**. Todo `src/lib/dropi.ts` se sacó del código del plugin oficial `wc-dropi-integration` 4.7.3. Si algo falla con Dropi, compara primero contra ese plugin.

- Base: `https://api.dropi.co/integrations/` (configurable con `DROPI_API_URL`).
- Auth: header `dropi-integration-key: <DROPI_TOKEN>` en todas las llamadas.
- Respuesta: `{ isSuccess: boolean, message?: string, status?: string, objects?: T }`.
- `GET products/v2/{id}` devuelve el producto: `name`, `description` (HTML), `type` (`SIMPLE` | `VARIABLE`), `suggested_price`, `sale_price`, `stock`, `warehouse_product[].stock`, `photos[]` / `gallery[]` (`urlS3` → CloudFront `https://d39ru7awumhhs2.cloudfront.net/`, o `url` → `https://api.dropi.co/`), `categories[].name`, `user_id` (proveedor), `active`.
- Stock = suma de `warehouse_product[].stock` si existe; si no, `stock`.
- `POST orders/myorders`: el cuerpo replica `OrdersModel::save` del plugin, con `total_order`, `notes`, `name`, `surname`, `dir`, `country: "CO"`, `state` (**código** del departamento: `VAC`, `CUN`…), `city` (nombre exacto del municipio), `phone`, `client_email`, `payment_method_id: 1`, `status: "PENDIENTE CONFIRMACION"`, `type: "FINAL_ORDER"`, `rate_type: "CON RECAUDO"`, `calculate_costs_and_shiping: true`, `supplier_id` (`user_id` del primer producto), `shop_order_id`, `create_product_if_not_exist: false` y `products[]` (objeto completo del producto + `quantity`, `price` de venta unitario, `stock`, `token`). La respuesta trae `objects.id`, el ID del pedido en Dropi.
- Diferencia con el plugin: `shop_order_id` lleva nuestro `clientOrderId` (UUID texto); el plugin envía el ID numérico del pedido de Woo. **No verificado contra la API real.**
- Departamentos y municipios (`src/lib/colombia.ts`, 32 departamentos y 1.268 municipios) salen de las listas del plugin. No cambies los textos: Dropi los usa para la cobertura y el flete. Bogotá está como "Bogota" dentro de Cundinamarca (`CUN`). El checkout usa selectores cerrados para que el cliente no escriba un municipio que Dropi no reconozca.

## Stack

- Next.js 16.4 (App Router, Turbopack, `cacheComponents: true`), React 19.3, TypeScript, Tailwind CSS v4 (tokens en `src/app/globals.css` con `@theme`)
- Serwist 9.5 en modo configurador: `serwist.config.mjs` y `serwist build` después de `next build`
- Dexie 4 + dexie-react-hooks (IndexedDB)
- Upstash Redis por su REST API con `fetch` (sin dependencia), opcional
- Sin Google Fonts: se usa la pila de fuentes del sistema, que funciona offline

## Estructura

```
src/config/productos.ts    qué productos de Dropi se venden y a qué precio
src/app/
  page.tsx                 catálogo (búsqueda + categorías)
  producto/page.tsx        ficha: UNA ruta /producto?id=123 que lee de IndexedDB
  carrito/  checkout/  pedidos/  offline/
  api/catalogo/route.ts    getCatalog() (use cache + cacheLife("minutes")); modo demo sin token
  api/pedidos/route.ts     valida, comprueba que el producto esté configurado, recalcula con datos frescos de Dropi, deduplica y crea el pedido
  sw.ts  manifest.ts
src/lib/
  dropi.ts         cliente de Dropi (solo servidor, "server-only")
  idempotency.ts   reserve / markDone / release por clientOrderId (Redis o memoria)
  colombia.ts      DEPARTAMENTOS {code, name, cities[]}, findDepartamento()
  db.ts            Dexie: products, cart, orders, meta
  sync.ts          refreshCatalog(), enqueueOrder(), flushQueue(), retryOrder()
  hooks.ts  types.ts  format.ts  demo-products.ts
src/components/    Header, SyncManager, Pwa (SerwistProvider), Catalog, ProductDetail, Orders, ProductImage
scripts/mock-dropi.mjs   Dropi simulado para probar sin token real
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

## Cola de pedidos y respuestas de `/api/pedidos`

| Respuesta | Cuándo | La PWA hace |
| --- | --- | --- |
| 200 `{ok:true, orderId}` | creado en Dropi (o `duplicated:true` si ya existía) | `enviado` |
| 400 `{ok:false, kind:"validation"}` | datos inválidos, municipio fuera de la lista | `revision` |
| 409 `{ok:false, kind:"business"}` | agotado, precio cambiado, producto no configurado, Dropi rechazó (`isSuccess:false`) | `revision` |
| 503 | Dropi caído o sin respuesta, o el mismo pedido se está procesando | `error` → reintento con `2^intentos × 5 s`, máximo 15 min |

Idempotencia: `reserve(clientOrderId)` (SET NX, 10 min) → crear → `markDone` (30 días). Si algo falla, `release` para permitir el reintento. Sin Redis se usa memoria del proceso, que en Vercel no protege entre instancias.

## Variables de entorno

`DROPI_TOKEN` (obligatoria en producción), `DROPI_PRODUCT_IDS` (opcional), `DROPI_API_URL` (opcional), `KV_REST_API_URL` y `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`, recomendadas). Ver `.env.example`. **Sin `DROPI_TOKEN`, la app corre en modo demo** con `DEMO_PRODUCTS`.

## Estado actual

- ✅ PWA y capa offline. Probado en Chromium a 390 px: catálogo offline, ficha offline, carrito, checkout offline con selectores de departamento y municipio, pedido en cola que se sincroniza al volver la red, sin errores de JavaScript.
- ✅ Integración directa con Dropi, probada contra `scripts/mock-dropi.mjs`: catálogo (precio sugerido, stock por bodegas, fotos CloudFront, omite `VARIABLE` y los IDs inexistentes), pedido creado, reintento deduplicado, precio cambiado, stock insuficiente, producto no configurado, municipio inválido, Dropi caído (503) y reintento exitoso al volver.
- ⏳ **Bloqueante antes de lanzar:** un pedido real con el token real. Revisar en el panel de Dropi que llegue con la dirección, el municipio, el valor a recaudar y el proveedor correctos. Confirmar que acepta `shop_order_id` como texto.

## Pendiente / próximos trabajos

- **Productos con variaciones** (`type: "VARIABLE"`): el plugin envía `variation_id` en cada producto del pedido. Hoy el catálogo los omite.
- **Varios proveedores en un pedido:** hoy va todo con el `supplier_id` del primero, igual que el plugin. Evaluar separar el pedido por proveedor.
- Anti-spam en el checkout (Cloudflare Turnstile) y límite de pedidos por IP.
- Costo de envío visible al cliente: Dropi lo calcula, pero la app no lo muestra.
- Seguimiento de la guía en "Mis pedidos".
- Marca: el nombre "Tienda", los colores (`--color-brand: #e4572e`) y los íconos de `public/` son provisionales.
- Llevar al repo la prueba E2E con Playwright (se corrió fuera del proyecto).

## Comandos

```bash
npm install
npm run dev     # desarrollo, sin service worker
npm run build   # next build && serwist build serwist.config.mjs → genera public/sw.js
npm start       # producción local, con modo offline
npm run lint
node scripts/mock-dropi.mjs   # Dropi simulado en :3200 (token: token-prueba)
```

`public/sw.js` es un archivo generado: está en `.gitignore` y en los ignores de ESLint. No lo edites; edita `src/app/sw.ts`.
