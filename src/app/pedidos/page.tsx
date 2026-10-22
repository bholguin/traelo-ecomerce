import type { Metadata } from "next";
import { Suspense } from "react";
import { Orders } from "@/components/Orders";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false, follow: false } };

export default function PedidosPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Cargando…</p>}>
      <Orders />
    </Suspense>
  );
}
