# Contexto del proyecto: Tienda PWA + WooCommerce + Dropi + Wompi

Lee también `AGENTS.md`: esta es Next.js 16.4 y sus APIs difieren de versiones anteriores. Antes de escribir código de Next, consulta `node_modules/next/dist/docs/`.

## Qué es

Una PWA responsive para Colombia (instalable con el manifest, **sin service worker ni modo offline**). Vende productos del catálogo de **Dropi** (dropshipping colombiano). **El producto se paga contra entrega y el envío se paga al confirmar el pedido, en línea con Wompi.**

**SSR primero, por SEO:** todo lo público (inicio, categorías, fichas) se renderiza en el servidor con datos de Woo, para que Google lo indexe. Lo del dispositivo (carrito, checkout, mis pedidos) es cliente y vive en `localStorage`.

Idioma de la interfaz y de los textos: español de Colombia. Moneda: COP sin decimales.

## Arquitectura

```
Celular (PWA Next.js) ──pedidos──▶ /api/pedidos (Vercel) ──REST v3──▶ WooCommerce ──plugin Dropify──▶ Dropi
       │   ◀── páginas SSR ── Next (Vercel) ◀── Store API ──┘                ▲
       └──pago del envío──▶ Wompi ──webhook──▶ /api/pagos/webhook ── "Procesando" ┘
```

- **Frontend + API:** Next.js 16 (App Router, Turbopack, `cacheComponents` + `partialPrefetching`), desplegado en **Vercel**. Las páginas públicas son server components que leen de `src/lib/catalogo.ts` (caché con `use cache`); solo lo interactivo y lo del dispositivo (carrito, checkout, mis pedidos, resultado del pago) es cliente.
- **Pagos:** Wompi (Bancolombia), solo para el envío. Ver "Pago del envío con Wompi".
- **Backend invisible:** WordPress + WooCommerce en modo headless, en un hosting PHP aparte. Sirve de catálogo y de panel de pedidos.
- **Integración con Dropi:** el plugin oficial de WordPress `wc-dropi-integration` ("Dropify"). Importa los productos de Dropi a Woo y crea en Dropi cada pedido de Woo. Se configura con el access token que da Dropi en *Mis tiendas*. **No llamamos a Dropi directamente**: su API no tiene documentación pública.

## Decisiones tomadas (no cambiarlas sin preguntar)

| Decisión | Motivo |
| --- | --- |
| PWA, no app nativa | Un solo código; se instala desde el navegador |
| **SSR primero** (desde la Fase 0 del plan SEO) | Elección del usuario: usar Next por su SSR y posicionar los productos en Google |
| **Sin modo offline** (desde la integración con Wompi) | Elección del usuario: el pago necesita red, y la cola offline + service worker sumaban complejidad. Se quitaron Serwist, Dexie, la cola de pedidos, `/offline` y `/producto`. `public/sw.js` es un service worker "de baja" que desinstala el viejo en los celulares que lo tenían |
| **Wompi** como pasarela del envío | Elección del usuario. Web Checkout (redirección): los datos de pago nunca pasan por nuestro servidor |
| Next.js + Vercel | Elección del usuario; los route handlers reemplazan a un mini-plugin de WordPress |
| WooCommerce como intermediario con Dropi | La integración la resuelve el plugin oficial; evita depender de una API no documentada |
| Producto contra entrega + envío prepagado al confirmar | Decisión del usuario: reduce pedidos falsos y devoluciones (cada rechazo cuesta flete). El envío se paga con Wompi si hay tarifa; si no ("Por confirmar"), se coordina con el cliente |
| Sin cuentas de cliente ni login | Fuera del MVP |
| Llaves de Woo solo en variables de entorno de Vercel | Nunca en el navegador ni con prefijo `NEXT_PUBLIC_` |

## Stack

- Next.js 16.4, React 19.3, TypeScript, Tailwind CSS v4 (tokens en `src/app/globals.css` con `@theme`)
- `localStorage` con `useSyncExternalStore` para carrito y pedidos (`src/lib/storage.ts`), sin librerías
- Wompi Web Checkout + eventos (webhook), sin SDK
- react-hook-form 7 en el checkout (validación por campo con las mismas reglas que `/api/pedidos`; sin librería de esquemas)
- Sin Google Fonts: se usa la pila de fuentes del sistema

## Estructura

```
src/app/
  page.tsx                 inicio SSR: hero + catálogo
  p/[slug]/page.tsx        ficha SSR (generateStaticParams con todos los productos)
  c/[slug]/page.tsx        categoría SSR
  buscar/page.tsx          búsqueda SSR (?q=), noindex
  robots.ts  opengraph-image.tsx   robots (todo bloqueado si !indexable()) e imagen para compartir
  terminos/  privacidad/    términos y política de datos (borradores legales; datos de la tienda en src/config/legal.ts, piezas en components/Legal.tsx)
  carrito/  checkout/  pedidos/   cliente, leen localStorage
  pago/page.tsx            regreso de Wompi (/pago?id=<transacción>), noindex
  api/pedidos/route.ts     valida, recalcula precio/stock, deduplica y crea el pedido en Woo
  api/pedidos/estado/      estado en Woo de los pedidos del dispositivo
  api/pagos/route.ts       URL firmada del Web Checkout de Wompi para pagar el envío
  api/pagos/estado/        consulta la transacción a Wompi al volver (y registra el pago si el webhook no llegó)
  api/pagos/webhook/       eventos de Wompi: pago aprobado → pedido a "Procesando"
  manifest.ts              manifest PWA
public/sw.js               service worker "de baja" (no generado: desinstala el de Serwist en celulares viejos)
src/lib/
  storage.ts  carrito y pedidos en localStorage: useCart, useCartCount, useOrders, addToCart, saveOrder…
  pedidos.ts  cliente: submitOrder(), payShipping(), canPayShipping(), refreshOrderStatuses()
  catalogo.ts capa de datos del SSR: getCatalog (use cache + cacheTag "catalogo"), getProductBySlug, getCategories, searchProducts
  woo.ts      cliente WooCommerce, solo servidor ("server-only"); incluye markShippingPaid()
  wompi.ts    cliente Wompi, solo servidor: firma de integridad, checkoutUrl, fetchTransaction, verifyEvent
  envio.ts    costoEnvio() y pagoEnLinea()
  site.ts     SITE_URL: NEXT_PUBLIC_SITE_URL → dominio de producción de Vercel → localhost
  seo.ts      indexable() (solo producción con Woo) y jsonLd() para <script type="application/ld+json">
  brand.ts    nombre de la tienda y color del tema (un solo lugar)
  types.ts  format.ts  colombia.ts (33 departamentos)  demo-products.ts
src/components/
  Header (barra superior + barra flotante en celular), PagoResumen, PagoResultado,
  ProductView (ficha SSR) + ProductIslands (Gallery, AddToCart, FocusHeading),
  ProductCard + QuickAdd, ProductGrid, CatalogToolbar,
  Orders (línea de tiempo + botón "Pagar envío"), ProductImage, Icons (SVG propios, sin dependencias)
```

## Reglas del cliente

1. **`useSearchParams` va dentro de `<Suspense>`** (lo exige `cacheComponents`).
2. Los hooks de `storage.ts` devuelven `undefined` en el servidor y antes de hidratar: las páginas muestran "Cargando…". Las páginas de cliente siguen prerenderizándose como estáticas.
3. Las fotos usan `<img>`, no `next/image` (habría que declarar el dominio de Woo/Dropi en `images.remotePatterns`).
4. No hay cuentas: "Mis pedidos" es lo que guardó ese navegador. Si el cliente borra los datos del sitio, deja de verlos (el pedido sigue en Woo).

## Pedidos

- El checkout envía el pedido en línea a `/api/pedidos` (`submitOrder`). Si falla la red o el servidor, muestra el error y el cliente vuelve a confirmar; un 409/400 (`business`/`validation`: agotado, precio o envío cambiado) se muestra igual. **No hay cola ni reintentos automáticos.**
- Cada pedido tiene un `clientOrderId` (UUID) que el checkout genera una vez por pedido, no por intento. El servidor lo guarda en el meta `_pwa_client_order_id` y, si llega repetido, devuelve el pedido existente. Hoy busca entre los últimos 50 pedidos; con más volumen hará falta un índice propio.
- Al crearse, el pedido se guarda en `localStorage` (`Order` en `types.ts`, con `remoteId`) y se vacía el carrito. Si se puede pagar el envío en línea, el checkout lleva directo a Wompi; si no, a `/pedidos?nuevo=`.
- Seguimiento: `refreshOrderStatuses()` pide a `POST /api/pedidos/estado` el estado en Woo (al abrir Mis pedidos, cada 30 s con la pestaña visible y al volver a ella) y lo guarda en `remoteStatus`. Deja de consultar los estados finales (`FINAL_REMOTE_STATUSES`). El servidor solo responde si `remoteId` y `clientOrderId` coinciden.

## Pago del envío con Wompi

- Se paga en línea si `pagoEnLinea(envio)`: hay tarifa (> 0) y está `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`. Si no, el envío se coordina con el cliente como antes.
- Flujo: pedido creado "En espera" → `POST /api/pagos` (valida `orderId` + `clientOrderId`, lee el monto de `shipping_total` en Woo, **nunca del cliente**) → URL del Web Checkout con firma de integridad `sha256(referencia + centavos + "COP" + secreto)` → Wompi → regreso a `/pago?id=<transacción>`.
- Referencia: `<pedido>-<sufijo>`. Wompi exige referencias únicas; cada intento lleva sufijo nuevo para poder reintentar tras un rechazo.
- Confirmación: el **webhook** (`/api/pagos/webhook`) verifica el checksum (`signature.properties` + `timestamp` + secreto de eventos) y, con `APPROVED`, llama a `markShippingPaid()`. `/api/pagos/estado` hace lo mismo al volver el cliente, por si el webhook tarda. Nunca se confía en la URL de regreso.
- `markShippingPaid()` es idempotente (meta `_pwa_pago_wompi` = id de la transacción): pasa el pedido de "En espera" a "Procesando" **sin `set_paid`** (el producto sigue contra entrega), pone `_pwa_envio` = "pagado" y deja una nota. Si el monto no coincide o el pedido ya no estaba "En espera", no cambia el estado: registra el pago y deja una nota "Revisar a mano".
- Un rechazo deja el pedido "En espera"; el cliente reintenta con "Pagar envío" en Mis pedidos o en `/pago`.
- Wompi reintenta el webhook hasta 3 veces en 24 h si no recibe 200. Un 500 (Woo caído) provoca el reintento.
- Pruebas: con llaves `pub_test_`/`prv_test_` todo va al sandbox (`sandbox.wompi.co`). Configura la URL de eventos en el panel de Wompi, una por ambiente.

## API de pedidos: reglas del servidor

- Nunca confiar en el precio del cliente. Se recalcula con la Store API. Si el precio cambió, el producto está agotado o falta stock, responde 409 `business`.
- Celular colombiano: 10 dígitos que empiezan por 3.
- El pedido se crea con `status: "on-hold"` (falta el pago del envío), `payment_method: "cod"` (el producto) y `set_paid: false`, con billing y shipping iguales (`state` = departamento, `country` = "CO"). Si hay tarifa para el destino, lleva una línea de envío (`shipping_lines`, `flat_rate`). El meta `_pwa_envio` dice "pendiente de pago", "por cotizar" o "pagado". Con Wompi pasa solo a "Procesando"; si el pago se coordinó con el cliente, se pasa a mano.
- Envío **por destino**: `costoEnvio(departamento, ciudad)` en `src/lib/envio.ts`, con la tabla `src/config/envios.ts` (ciudad → departamento → por defecto). **Las tarifas aún no están definidas**: con la tabla vacía, todo destino sale "Por confirmar" (`null`) y el valor se coordina con el cliente. El carrito muestra "Según tu destino" y el checkout lo recalcula al elegir departamento y ciudad. El cliente envía el valor que vio (`shipping`) y el servidor lo recalcula con la misma tabla: si no coincide, responde 409 `business`. En la respuesta, `total` es lo que se recauda contra entrega (productos) y `shipping` va aparte.
- Fase 0 (Dropi): verificar que el plugin cree el pedido al pasar de "En espera" a "Procesando" y que el **valor a recaudar sea solo el de los productos**. Si el plugin suma el envío, el transportador lo cobraría dos veces.

## Variables de entorno

`NEXT_PUBLIC_SITE_URL` (opcional, el dominio propio cuando exista; alimenta `metadataBase`). `GOOGLE_SITE_VERIFICATION` (opcional, código de la etiqueta HTML de Search Console). `HERO_VARIANTE` (opcional: `clasico` por defecto, `pasos`, `destacado` o `categorias`; elige el bloque principal del inicio en `components/Hero.tsx`, se lee en el build. `destacado` y `categorias` leen el catálogo y, sin datos, muestran el clásico). `WC_URL` (sin barra final), `WC_KEY` y `WC_SECRET` (llave REST de Woo con lectura y escritura, de un usuario dedicado). Ver `.env.example`. **Sin ellas, la app corre en modo demo** con `DEMO_PRODUCTS`, y `/api/pedidos` responde `demo: true` sin crear nada.

Wompi: `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` (pública; se inlinea en el build, así que hay que volver a desplegar al cambiarla), `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` (solo servidor). Sin las cuatro, el pago en línea queda apagado y el envío se coordina con el cliente. El prefijo de la llave pública (`pub_test_` / `pub_prod_`) elige sandbox o producción.

## Estado actual

- ✅ PWA base y route handlers de pedidos, con modo demo.
- ✅ Fase 0 del plan SEO (SSR primero). El HTML del servidor trae productos, títulos por ficha y categoría.
- ✅ Modo offline retirado e integración con Wompi (2026-10-22). Probado contra un Woo simulado: creación de pedido, URL firmada (la firma de integridad coincide con el ejemplo de la documentación de Wompi), webhook (firma mala → 401, rechazo sin cambios, aprobado → "Procesando", repetido sin duplicar nota, monto distinto → nota "Revisar a mano") y en Chromium a 390 px: carrito, checkout, Mis pedidos, botón "Pagar envío" → Wompi, sin errores de JavaScript. **No probado contra el sandbox real de Wompi** (faltan llaves): la verificación del checksum del webhook y `fetchTransaction` se validan ahí.
- ⏳ **Fase 0 (bloqueante antes de lanzar):** confirmar que el plugin de Dropi crea el pedido en Dropi cuando el pedido de Woo **llega por la REST API**. No está verificado; muchos plugins solo escuchan el checkout normal. El plan B está en el README.
- ⏳ Montar WordPress + WooCommerce + plugin Dropify, importar productos y configurar las variables en Vercel.

## Pendiente / próximos trabajos

- Plan SEO, siguientes fases:
  - ✅ **Fase 1:** `robots.ts`, `noindex` en modo demo y vistas previas (`indexable()`), páginas privadas con `noindex`, Open Graph e imagen por defecto, JSON-LD `OnlineStore` en el inicio, verificación de Search Console por variable. Falta lo manual: dar de alta la propiedad en Search Console cuando haya dominio. La rama "indexable" (producción con Woo) no se ha probado: no hay Woo todavía.
  - **Fase 2** (con Woo): `generateMetadata` completo (canonical, OG con foto), JSON-LD `Product` + `Offer` y `BreadcrumbList`, `sitemap.ts`, webhook de Woo → `revalidateTag("catalogo")` y subir `getCatalog` a `cacheLife("hours")`, WordPress en "disuadir a los motores de búsqueda". Un slug inexistente hoy responde 200 con `noindex`.
  - **Fase 3:** contenido propio por producto (título ≤ 60, meta ≤ 155, descripción propia, alt en fotos, 3 FAQ) y feed de Merchant Center con URLs `/p/`.
  - **Fase 4:** Core Web Vitals (CrUX) y analítica.
- **Legal, antes de lanzar:** llenar `src/config/legal.ts` (los campos vacíos se ven como "[Por definir]" en `/terminos`), decidir qué pasa con el envío pagado si el cliente rechaza el pedido en la puerta, hacer que un abogado revise `/terminos` y revisar también `/privacidad` (Ley 1581). La autorización de datos hoy se da al confirmar el pedido (texto con enlace bajo el botón); el abogado debe decir si basta o si hace falta una casilla para marcar.
- Anti-spam en el checkout (Cloudflare Turnstile) y límite de pedidos por IP en `/api/pedidos`.
- **Wompi en sandbox:** crear la cuenta, poner las 4 variables con llaves de prueba, configurar la URL de eventos y hacer un pago aprobado, uno rechazado y uno PSE pendiente. Luego, llaves de producción.
- Quitar `public/sw.js` (el service worker "de baja") cuando ya no queden visitantes con el service worker viejo.
- Definir las tarifas de envío por destino (llenar `src/config/envios.ts`, o reemplazar `costoEnvio()` si salen de Dropi o de una transportadora). Para tarifas por ciudad conviene un selector de municipios, porque hoy la ciudad se escribe a mano.
- Marca: el nombre "Tráelo" (`src/lib/brand.ts`) es provisional. Los íconos (`public/icon-*.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`) se generaron del logo del encabezado: degradado `brand` → `brand-2`, radio de 1/3 del lado y "t" blanca a la mitad del alto. El maskable y el de iPhone van a sangre, sin esquinas, porque el sistema recorta su propia forma. Colores en `oklch` en `globals.css`; los botones principales van en `ink` porque el texto blanco sobre `brand` no da contraste AA.
- Diseño: la foto viaja del catálogo a la ficha con `<ViewTransition name="producto-{id}" share="morph">`, que solo forma pareja si la ficha llega en el mismo commit que la navegación (fichas prerenderizadas y prefetcheadas). Las tarjetas aparecen con scroll-driven animations (`.reveal`), sin respaldo porque es decorativo. En `.text-gradient` usa `background-image`, no el atajo `background`.
- Índice de idempotencia más robusto que "últimos 50 pedidos".
- Pruebas automatizadas en el repo (la prueba E2E se corrió con Playwright fuera del proyecto).

## Comandos

```bash
npm install
npm run dev     # desarrollo
npm run build   # next build
npm start       # producción local
npm run lint
```
