import type { Metadata } from "next";
import { Suspense } from "react";
import { PagoResultado } from "@/components/PagoResultado";

export const metadata: Metadata = { title: "Pago del envío", robots: { index: false, follow: false } };

// Wompi devuelve aquí al cliente después de pagar el envío (/pago?id=<transacción>).
export default function PagoPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Cargando…</p>}>
      <PagoResultado />
    </Suspense>
  );
}
