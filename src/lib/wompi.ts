import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Variables de entorno (configurarlas en Vercel). Wompi → Desarrolladores → Llaves y secretos:
//   NEXT_PUBLIC_WOMPI_PUBLIC_KEY  pub_test_xxx / pub_prod_xxx  (pública: el checkout la sabe)
//   WOMPI_PRIVATE_KEY             prv_test_xxx / prv_prod_xxx  (consultar transacciones)
//   WOMPI_INTEGRITY_SECRET        test_integrity_xxx / prod_integrity_xxx  (firmar el pago)
//   WOMPI_EVENTS_SECRET           test_events_xxx / prod_events_xxx  (verificar el webhook)
// Las de prueba (test) usan el sandbox de Wompi; las de producción cobran de verdad.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET;
const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;

export const wompiConfigured = () => Boolean(PUBLIC_KEY && PRIVATE_KEY && INTEGRITY_SECRET && EVENTS_SECRET);

const API_URL = PUBLIC_KEY?.startsWith("pub_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type WompiStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";

export type WompiTransaction = {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  status: WompiStatus;
};

// ---------- Referencia ----------

// Wompi exige una referencia única por transacción: si un pago se rechaza, el
// reintento necesita otra. Por eso lleva el número del pedido y un sufijo.
export const paymentReference = (orderId: number) => `${orderId}-${Date.now().toString(36)}`;

export function orderIdFromReference(reference: string): number | null {
  const m = /^(\d+)-[0-9a-z]+$/.exec(reference);
  return m ? Number(m[1]) : null;
}

// ---------- Web Checkout ----------

// URL del Web Checkout de Wompi. La firma de integridad impide que el cliente
// cambie el monto o la referencia: sha256(referencia + monto + moneda + secreto).
export function checkoutUrl(input: {
  reference: string;
  amountInCents: number;
  redirectUrl: string;
  customer: { fullName: string; phone: string; email?: string };
}): string {
  const currency = "COP";
  const params = new URLSearchParams({
    "public-key": PUBLIC_KEY!,
    currency,
    "amount-in-cents": String(input.amountInCents),
    reference: input.reference,
    "signature:integrity": sha256(`${input.reference}${input.amountInCents}${currency}${INTEGRITY_SECRET}`),
    "redirect-url": input.redirectUrl,
    "customer-data:full-name": input.customer.fullName,
    "customer-data:phone-number": input.customer.phone,
    ...(input.customer.email && { "customer-data:email": input.customer.email }),
  });
  return `https://checkout.wompi.co/p/?${params}`;
}

// ---------- Transacciones ----------

export async function fetchTransaction(id: string): Promise<WompiTransaction> {
  const res = await fetch(`${API_URL}/transactions/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${PRIVATE_KEY}` },
  });
  if (!res.ok) throw new Error(`Wompi respondió ${res.status}`);
  return ((await res.json()) as { data: WompiTransaction }).data;
}

// ---------- Eventos (webhook) ----------

export type WompiEvent = {
  event: string;
  data: { transaction?: WompiTransaction } & Record<string, unknown>;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

// Checksum del evento: sha256 de los valores de signature.properties (rutas
// dentro de data, en ese orden) + timestamp + secreto de eventos. Las propiedades
// cambian por evento: se leen del evento, no se fijan aquí.
export function verifyEvent(e: WompiEvent, headerChecksum: string | null): boolean {
  if (!EVENTS_SECRET || !Array.isArray(e?.signature?.properties) || !Number.isInteger(e.timestamp)) return false;
  const values = e.signature.properties.map((path) => {
    const v = path.split(".").reduce<unknown>((obj, k) => (obj as Record<string, unknown> | undefined)?.[k], e.data);
    return v === undefined || v === null ? "" : String(v);
  });
  const expected = Buffer.from(sha256(`${values.join("")}${e.timestamp}${EVENTS_SECRET}`));
  const received = Buffer.from(String(headerChecksum ?? e.signature.checksum ?? "").toLowerCase());
  return received.length === expected.length && timingSafeEqual(received, expected);
}
