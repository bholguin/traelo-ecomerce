# Tienda PWA offline · WooCommerce + Dropi

PWA en Next.js 16 que muestra el catálogo de Dropi, toma pedidos **aun sin conexión** (producto contra entrega, envío pagado al confirmar) y los envía a WooCommerce cuando vuelve la señal. El plugin oficial de Dropi para WooCommerce (Dropify) crea el pedido en Dropi.

```
Celular (PWA) ──pedidos──▶ /api/pedidos (Vercel) ──REST──▶ WooCommerce ──plugin Dropify──▶ Dropi
              ◀─catálogo── /api/catalogo (Vercel) ◀─Store API─┘
```

## Arrancar

```bash
npm install
npm run dev          # desarrollo (el service worker está apagado en dev)
npm run build        # next build + serwist build (genera public/sw.js)
npm start            # producción local: aquí sí funciona el modo offline
```

Sin variables de entorno la tienda corre en **modo demo** con 6 productos de prueba y los pedidos no se crean en ningún lado. Para conectarla, copia `.env.example` a `.env.local` y llena `WC_URL`, `WC_KEY` y `WC_SECRET`.

## Desplegar en Vercel

1. Sube el repo a GitHub y en Vercel → *Add New Project* → importa el repo.
2. *Build Command*: deja el de `package.json` (`next build && serwist build serwist.config.mjs`).
3. En *Settings → Environment Variables* crea `WC_URL`, `WC_KEY`, `WC_SECRET` (nunca con prefijo `NEXT_PUBLIC_`).
4. Despliega y abre la URL en el celular → *Agregar a pantalla de inicio*.

## Cómo funciona el offline

| Qué | Dónde se guarda | Estrategia |
| --- | --- | --- |
| Páginas y JS/CSS | Cache Storage (precache de Serwist) | Se instalan en la primera visita |
| Catálogo | IndexedDB (`products`) | Se lee siempre local, se refresca cada 10 min y al volver la red |
| Fotos | Cache Storage `fotos-productos` | Cache-first, 400 fotos, 30 días |
| Carrito | IndexedDB (`cart`) | Local |
| Pedidos | IndexedDB (`orders`) | Cola: se guarda primero, se envía después |

Estados de un pedido: `pendiente` → `enviando` → `enviado`. Un error de red pasa a `error` y se reintenta con espera creciente (hasta 15 min). Un error de negocio (agotado, precio cambiado) pasa a `revision` y se muestra al cliente.

Cada pedido lleva un `clientOrderId` (UUID). El servidor lo guarda en el meta `_pwa_client_order_id` y, si llega repetido por un reintento, devuelve el pedido existente en vez de crear otro.

La ficha de producto es una sola ruta, `/producto?id=123`, que lee de IndexedDB. Por eso abre sin red.

iOS no soporta Background Sync: la cola se vacía al abrir la app, al volver la conexión y cada 30 s mientras la app está abierta.

## ⚠️ Verificar antes de lanzar (Fase 0)

El plugin de Dropi crea el pedido en Dropi cuando WooCommerce lo registra. **No está verificado** que lo haga también para pedidos creados por la REST API (`/wp-json/wc/v3/orders`), que es lo que usa esta app. Muchos plugins escuchan solo el checkout normal.

Prueba:

La app crea el pedido en Woo **"En espera"** porque el envío se paga al confirmar y todavía no está pagado. Cuando confirmas el pago del envío, lo pasas a mano a **"Procesando"**.

1. Configura las variables y haz un pedido real desde la PWA. Debe aparecer en Woo "En espera", con una línea de envío.
2. Cámbialo a "Procesando" y revisa que aparezca en tu panel de Dropi.
3. En Dropi, revisa el **valor a recaudar**: debe ser solo el de los productos. Si incluye el envío, el transportador cobraría el envío dos veces. En ese caso hay que ajustar cómo se registra el envío en Woo (por ejemplo, como nota y no como línea de envío) o configurarlo en el plugin.
4. Si el pedido no llega a Dropi al pasarlo a "Procesando", hay que preguntar a soporte de Dropi qué evento escucha el plugin.

## Estructura

```
src/
  app/
    page.tsx               catálogo
    producto/page.tsx      ficha (lee de IndexedDB)
    carrito/ checkout/ pedidos/ offline/
    api/catalogo/route.ts  Store API de Woo → JSON (o demo)
    api/pedidos/route.ts   valida, recalcula precios, crea el pedido en Woo
    sw.ts                  service worker (Serwist)
    manifest.ts
  lib/
    db.ts                  IndexedDB con Dexie
    sync.ts                refresco de catálogo + cola de pedidos
    woo.ts                 cliente WooCommerce (solo servidor)
  components/
serwist.config.mjs
```

## Pendiente para producción

- Anti-spam en el checkout (por ejemplo Cloudflare Turnstile) y límite de pedidos por IP.
- Costo de envío: depende del destino y las tarifas aún no están definidas (`src/config/envios.ts`); mientras tanto sale "Por confirmar". El cobro del envío se coordina a mano hasta integrar una pasarela de pagos.
- Reemplazar el nombre "Tienda", los colores y los íconos de `public/`.
