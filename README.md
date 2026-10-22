# Tienda PWA offline · Dropi Colombia · 100% Vercel

PWA en Next.js 16 que vende productos de Dropi con pago contra entrega. Funciona **sin conexión**: el cliente navega, arma el carrito y confirma el pedido sin señal, y el pedido se envía solo a Dropi cuando vuelve la red. No usa WordPress ni WooCommerce: todo corre en Vercel.

```
Celular (PWA) ──pedidos──▶ /api/pedidos  (Vercel) ──POST orders/myorders──▶ Dropi
              ◀─catálogo── /api/catalogo (Vercel) ◀─GET products/v2/{id}──┘
```

## Arrancar

```bash
npm install
npm run dev          # desarrollo (el service worker está apagado en dev)
npm run build        # next build + serwist build (genera public/sw.js)
npm start            # producción local: aquí sí funciona el modo offline
```

Sin `DROPI_TOKEN` la tienda corre en **modo demo**, con 6 productos de prueba, y los pedidos no se envían a ningún lado.

## Conectar con Dropi

1. **Token:** en dropi.co → *Mis tiendas* → crea una tienda (o abre la tuya) → copia el token de integración.
2. **Productos:** pon los IDs de los productos que vas a vender en `src/config/productos.ts`, con tu precio de venta, o en la variable `DROPI_PRODUCT_IDS` (`123,456`). Si no pones precio, se usa el precio sugerido por Dropi.
3. **Variables en Vercel** (*Settings → Environment Variables*): `DROPI_TOKEN` y, opcionalmente, `DROPI_PRODUCT_IDS`. Ver `.env.example`.
4. **Redis para no duplicar pedidos** (recomendado): Vercel → *Storage* → Upstash Redis → conéctalo al proyecto. Crea `KV_REST_API_URL` y `KV_REST_API_TOKEN` solo.
5. Despliega, abre la URL en el celular → *Agregar a pantalla de inicio*.

## De dónde salen los endpoints de Dropi

Dropi no publica documentación de su API. `src/lib/dropi.ts` replica lo que hace el **plugin oficial de Dropi para WooCommerce** (`wc-dropi-integration` 4.7.3, código abierto en WordPress.org):

| Qué | Plugin (archivo) | Aquí |
| --- | --- | --- |
| URL base Colombia | `Constants.php` → `https://api.dropi.co/integrations/` | `DROPI_API_URL` (mismo valor por defecto) |
| Autenticación | header `dropi-integration-key: <token>` | igual |
| Leer un producto | `ProductsModel::getProduct` → `GET products/v2/{id}` | `fetchDropiProduct` |
| Crear pedido | `OrdersModel::save` → `POST orders/myorders` | `createDropiOrder` |
| Stock | suma de `warehouse_product[].stock` (`Product_List.php`) | `dropiStock` |
| Fotos | `CLOUDFRONT_URL + urlS3`, o `IMG_URL + url` | `toProduct` |
| Departamento | se envía el **código** (`VAC`, `CUN`…) | igual (`lib/colombia.ts`) |
| Municipio | nombre exacto de la lista del plugin | selector cerrado con 1.268 municipios |

El cuerpo del pedido lleva los mismos campos que arma el plugin: `status: "PENDIENTE CONFIRMACION"`, `type: "FINAL_ORDER"`, `rate_type: "CON RECAUDO"`, `calculate_costs_and_shiping: true`, `supplier_id` y `products[]` con el objeto del producto más `quantity`, `price` y `token`.

> ⚠️ Si Dropi cambia su API, la tienda deja de crear pedidos. Los pedidos rechazados quedan en el celular con estado "Requiere revisión" y el mensaje de Dropi. Los errores aparecen en los logs de Vercel con el prefijo `[pedidos]`.

## Probar contra un Dropi simulado

`scripts/mock-dropi.mjs` responde con la misma forma que la API real (`{isSuccess, message, objects}`) y guarda en un log cada llamada que recibe:

```bash
node scripts/mock-dropi.mjs &
DROPI_TOKEN=token-prueba DROPI_API_URL=http://localhost:3200/integrations/ DROPI_PRODUCT_IDS=111 npm start
```

## Cómo funciona el offline

| Qué | Dónde se guarda | Estrategia |
| --- | --- | --- |
| Páginas y JS/CSS | Cache Storage (precache de Serwist) | Se instalan en la primera visita |
| Catálogo | IndexedDB (`products`) | Se lee siempre local; se refresca cada 10 min y al volver la red |
| Fotos | Cache Storage `fotos-productos` | Cache-first, 400 fotos, 30 días |
| Carrito | IndexedDB (`cart`) | Local |
| Pedidos | IndexedDB (`orders`) | Cola: se guarda primero, se envía después |

Estados de un pedido: `pendiente` → `enviando` → `enviado`. Un error de red o una caída de Dropi pasa a `error` y se reintenta con espera creciente (hasta 15 min). Un rechazo (agotado, precio cambiado, rechazo de Dropi) pasa a `revision` y se muestra al cliente.

## Estructura

```
src/
  config/productos.ts      ← qué productos vendes y a qué precio
  app/
    page.tsx               catálogo
    producto/page.tsx      ficha (lee de IndexedDB, abre offline)
    carrito/ checkout/ pedidos/ offline/
    api/catalogo/route.ts  productos configurados → Dropi (caché 5 min) o demo
    api/pedidos/route.ts   valida, recalcula precio/stock con Dropi, deduplica, crea el pedido
    sw.ts  manifest.ts
  lib/
    dropi.ts               cliente de la API de Dropi (solo servidor)
    idempotency.ts         evita pedidos duplicados (Redis o memoria)
    colombia.ts            departamentos y municipios en el formato de Dropi
    db.ts  sync.ts  hooks.ts  types.ts
scripts/mock-dropi.mjs
```

## Limitaciones actuales

- **Productos con variaciones (talla/color) no se venden todavía:** el catálogo los omite y los registra en el log. El plugin los maneja con `variation_id`; está pendiente.
- Todos los productos de un pedido van con el proveedor del primero (`supplier_id`), igual que el plugin. Si vendes productos de varios proveedores, conviene separar los pedidos por proveedor.
- Costo de envío: Dropi lo calcula (`calculate_costs_and_shiping`); la app muestra solo el total de productos.
- Falta anti-spam en el checkout (por ejemplo Cloudflare Turnstile).
