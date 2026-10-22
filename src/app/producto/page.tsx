import { Suspense } from "react";
import { ProductDetail } from "@/components/ProductDetail";

export const metadata = { title: "Producto" };

export default function ProductoPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Cargando…</p>}>
      <ProductDetail />
    </Suspense>
  );
}
