"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductSkeleton, ProductView } from "@/components/ProductView";
import { db } from "@/lib/db";

// Para /producto?id= (va dentro de <Suspense> por useSearchParams).
export function ProductDetailFromQuery() {
  return <ProductDetail id={Number(useSearchParams().get("id"))} />;
}

// Ficha SIN CONEXIÓN: lee el producto de IndexedDB (que SyncManager mantiene al
// día) y lo pinta con la misma ProductView de la ficha SSR. La usan /producto?id=
// y la página de respaldo offline cuando el cliente abre /p/slug sin señal.
export function ProductDetail({ id, slug }: { id?: number; slug?: string }) {
  const product = useLiveQuery(
    () => (id ? db.products.get(id) : slug ? db.products.filter((p) => p.slug === slug).first() : undefined),
    [id, slug],
    null,
  );

  if (product === null) return <ProductSkeleton />;
  if (!product)
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Este producto no está en el catálogo guardado en tu celular.</p>
        <Link href="/" className="mt-4 inline-block font-semibold underline">
          Volver a la tienda
        </Link>
      </div>
    );
  return <ProductView product={product} />;
}
