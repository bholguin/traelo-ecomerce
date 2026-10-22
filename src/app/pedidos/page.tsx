import { Suspense } from "react";
import { Orders } from "@/components/Orders";

export const metadata = { title: "Mis pedidos" };

export default function PedidosPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Cargando…</p>}>
      <Orders />
    </Suspense>
  );
}
