# Tienda PWA · WooCommerce + Dropi + Wompi

PWA en Next.js 16 que muestra el catálogo de Dropi con SSR y toma pedidos con **producto contra entrega** y **envío pagado al confirmar con Wompi**. Los pedidos se crean en WooCommerce y el plugin oficial de Dropi (Dropify) los crea en Dropi. No funciona sin conexión.

```
Celular (PWA) ──pedidos──▶ /api/pedidos (Vercel) ──REST──▶ WooCommerce ──plugin Dropify──▶ Dropi
     │      ◀── páginas SSR ── Next (Vercel) ◀─Store API─┘                  ▲
     └──pago del envío──▶ Wompi ──webhook──▶ /api/pagos/webhook ── "Procesando" ┘
```

## Arrancar

```bash
npm install
npm run dev          # desarrollo
npm run build        # next build
npm start            # producción local
```

Sin variables de entorno la tienda corre en **modo demo** con 6 productos de prueba y los pedidos no se crean en ningún lado. Para conectarla, copia `.env.example` a `.env.local` y llena `WC_URL`, `WC_KEY` y `WC_SECRET`. Para cobrar el envío en línea, agrega las cuatro variables de Wompi.

## Desplegar en Vercel

1. Sube el repo a GitHub y en Vercel → *Add New Project* → importa el repo.
2. En *Settings → Environment Variables* crea `WC_URL`, `WC_KEY`, `WC_SECRET` y las de Wompi (`NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`). Solo la llave pública de Wompi lleva `NEXT_PUBLIC_`.
3. En el panel de Wompi → *Desarrolladores* → URL de eventos: `https://<tu-dominio>/api/pagos/webhook` (una para sandbox y otra para producción).
4. Despliega y abre la URL en el celular → *Agregar a pantalla de inicio*.

## Cómo funciona un pedido

1. El carrito vive en `localStorage` del navegador.
2. Al confirmar, el checkout envía el pedido a `/api/pedidos`. El servidor recalcula precios, stock y envío, y crea el pedido en Woo **"En espera"**. Cada pedido lleva un `clientOrderId` (UUID): si el cliente reintenta tras un error de red, el servidor devuelve el pedido existente en vez de crear otro.
3. Si el destino tiene tarifa (`src/config/envios.ts`) y Wompi está configurado, el cliente pasa al checkout de Wompi para pagar el envío (PSE, Nequi, tarjeta…). El monto sale del pedido en Woo, no del navegador, y va firmado.
4. Wompi avisa al webhook. Con el pago aprobado, el pedido pasa a **"Procesando"** (sin marcarlo como pagado: el producto se cobra contra entrega), con una nota y el id de la transacción. Al volver a `/pago`, la app también consulta la transacción por si el webhook tarda.
5. Si el pago se rechaza, el pedido sigue "En espera" y el cliente puede pagar de nuevo desde *Mis pedidos*. Sin tarifa para el destino, el envío se coordina con el cliente como antes.

*Mis pedidos* muestra los pedidos guardados en ese navegador y consulta su estado en Woo cada 30 s.

## ⚠️ Verificar antes de lanzar (Fase 0)

El plugin de Dropi crea el pedido en Dropi cuando WooCommerce lo registra. **No está verificado** que lo haga también para pedidos creados por la REST API (`/wp-json/wc/v3/orders`), que es lo que usa esta app. Muchos plugins escuchan solo el checkout normal.

Prueba:

La app crea el pedido en Woo **"En espera"** porque el envío se paga al confirmar y todavía no está pagado. Cuando Wompi aprueba el pago del envío, la app lo pasa sola a **"Procesando"** (si el pago se coordinó a mano, lo pasas tú).

1. Configura las variables y haz un pedido real desde la PWA. Debe aparecer en Woo "En espera", con una línea de envío.
2. Cámbialo a "Procesando" y revisa que aparezca en tu panel de Dropi.
3. En Dropi, revisa el **valor a recaudar**: debe ser solo el de los productos. Si incluye el envío, el transportador cobraría el envío dos veces. En ese caso hay que ajustar cómo se registra el envío en Woo (por ejemplo, como nota y no como línea de envío) o configurarlo en el plugin.
4. Si el pedido no llega a Dropi al pasarlo a "Procesando", hay que preguntar a soporte de Dropi qué evento escucha el plugin.

## Estructura

```
src/
  app/
    page.tsx  p/[slug]/  c/[slug]/  buscar/   páginas SSR
    carrito/  checkout/  pedidos/  pago/       cliente
    api/pedidos/           crea el pedido en Woo (+ /estado)
    api/pagos/             URL firmada de Wompi (+ /estado, /webhook)
    manifest.ts
  lib/
    storage.ts             carrito y pedidos en localStorage
    pedidos.ts             envío del pedido, pago del envío, estados
    woo.ts                 cliente WooCommerce (solo servidor)
    wompi.ts               cliente Wompi (solo servidor)
  components/
public/sw.js               service worker "de baja": desinstala el de la versión offline
```

## Pendiente para producción

- Probar Wompi en sandbox: pago aprobado, rechazado y PSE pendiente; después, llaves de producción.
- Definir las tarifas de envío (`src/config/envios.ts`). Mientras estén vacías, todo destino sale "Por confirmar" y no se cobra en línea.
- Anti-spam en el checkout (por ejemplo Cloudflare Turnstile) y límite de pedidos por IP.
- Reemplazar el nombre provisional, los colores y los íconos de `public/`.
