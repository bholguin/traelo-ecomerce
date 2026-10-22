import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetailFromQuery } from "@/components/ProductDetail";
import { ProductSkeleton } from "@/components/ProductView";

// Ficha offline heredada (/producto?id=). La pública es /p/[slug]; esta queda para
// enlaces viejos y carritos guardados antes del SSR. No se indexa.
export const metadata: Metadata = { title: "Producto", robots: { index: false, follow: true } };

export default function ProductoPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetailFromQuery />
    </Suspense>
  );
}
