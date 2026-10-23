import type { PaymentResponse } from "@/lib/types";
import { checkoutUrl, paymentReference, wompiConfigured } from "@/lib/wompi";
import { fetchOrderForPayment, wooConfigured } from "@/lib/woo";

const json = (body: PaymentResponse, status = 200) => Response.json(body, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Arma la URL firmada del Web Checkout de Wompi para pagar el envío de un pedido.
// El monto sale del pedido en Woo, nunca del cliente.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: unknown; clientOrderId?: unknown } | null;
  const orderId = body?.orderId;
  const clientOrderId = body?.clientOrderId;
  if (!Number.isInteger(orderId) || (orderId as number) < 1 || typeof clientOrderId !== "string" || !UUID.test(clientOrderId))
    return json({ ok: false, message: "Pedido inválido" }, 400);
  if (!wompiConfigured() || !wooConfigured())
    return json({ ok: false, message: "El pago en línea no está disponible. Te contactaremos para coordinarlo." }, 503);

  try {
    const order = await fetchOrderForPayment(orderId as number, clientOrderId);
    if (!order) return json({ ok: false, message: "No encontramos el pedido" }, 404);
    if (order.status !== "on-hold") return json({ ok: false, message: "Este pedido no tiene pagos pendientes" }, 409);
    const amountInCents = Math.round(Number(order.shipping_total ?? 0) * 100);
    if (amountInCents <= 0)
      return json({ ok: false, message: "El envío de este pedido aún no tiene valor. Te contactaremos para confirmarlo." }, 409);

    const b = order.billing;
    const url = checkoutUrl({
      reference: paymentReference(order.id),
      amountInCents,
      // Mismo dominio desde el que se pagó (producción, vista previa o local).
      redirectUrl: `${new URL(request.url).origin}/pago`,
      customer: { fullName: `${b?.first_name ?? ""} ${b?.last_name ?? ""}`.trim(), phone: b?.phone ?? "", email: b?.email || undefined },
    });
    return json({ ok: true, url });
  } catch (e) {
    console.error("[pagos]", e);
    return json({ ok: false, message: "La tienda no respondió. Inténtalo de nuevo en un momento." }, 502);
  }
}
