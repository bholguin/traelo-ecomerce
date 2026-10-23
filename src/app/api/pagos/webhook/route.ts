import { orderIdFromReference, verifyEvent, wompiConfigured, type WompiEvent } from "@/lib/wompi";
import { markShippingPaid, wooConfigured } from "@/lib/woo";

// Eventos de Wompi. Configurar en Wompi → Desarrolladores → URL de eventos:
//   https://<dominio>/api/pagos/webhook  (una URL para sandbox y otra para producción)
// Wompi reintenta hasta 3 veces en 24 h (30 min, 3 h, 24 h) si no recibe un 200.
export async function POST(request: Request) {
  if (!wompiConfigured() || !wooConfigured()) return new Response(null, { status: 503 });
  const event = (await request.json().catch(() => null)) as WompiEvent | null;
  if (!event || !verifyEvent(event, request.headers.get("x-event-checksum")))
    return new Response(null, { status: 401 });

  const tx = event.data.transaction;
  // Solo interesa el pago aprobado; rechazos y anulaciones dejan el pedido "En espera".
  if (event.event !== "transaction.updated" || tx?.status !== "APPROVED") return new Response(null, { status: 200 });
  const orderId = orderIdFromReference(tx.reference);
  if (!orderId) return new Response(null, { status: 200 }); // pago de otro origen (por ejemplo un link de pago)

  try {
    const result = await markShippingPaid(orderId, tx);
    console.info("[pagos/webhook]", orderId, tx.id, result);
    return new Response(null, { status: 200 });
  } catch (e) {
    // Woo caído: un 500 hace que Wompi reintente más tarde.
    console.error("[pagos/webhook]", e);
    return new Response(null, { status: 500 });
  }
}
