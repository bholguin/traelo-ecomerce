import type { PaymentStatusResponse } from "@/lib/types";
import { fetchTransaction, orderIdFromReference, wompiConfigured } from "@/lib/wompi";
import { markShippingPaid, wooConfigured } from "@/lib/woo";

const json = (body: PaymentStatusResponse, status = 200) => Response.json(body, { status });

// Wompi devuelve al cliente a /pago?id=<transacción>. Esa URL no prueba nada (se
// puede escribir a mano): el estado se consulta aquí a Wompi. Si el pago está
// aprobado y el webhook aún no llegó, se registra en Woo de una vez.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { transactionId?: unknown } | null;
  const id = body?.transactionId;
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) return json({ ok: false, message: "Pago inválido" }, 400);
  if (!wompiConfigured() || !wooConfigured()) return json({ ok: false, message: "El pago en línea no está disponible" }, 503);

  try {
    const tx = await fetchTransaction(id);
    const orderId = orderIdFromReference(tx.reference);
    if (!orderId) return json({ ok: false, message: "El pago no corresponde a un pedido de la tienda" }, 404);
    if (tx.status === "APPROVED") await markShippingPaid(orderId, tx);
    return json({ ok: true, status: tx.status, orderId });
  } catch (e) {
    console.error("[pagos/estado]", e);
    return json({ ok: false, message: "No pudimos consultar el pago" }, 502);
  }
}
