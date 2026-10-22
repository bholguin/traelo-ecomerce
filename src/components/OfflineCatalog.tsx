"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ProductCard } from "@/components/ProductCard";
import { GridSkeleton } from "@/components/ProductGrid";
import { db } from "@/lib/db";
import { formatDate, slugify } from "@/lib/format";
import { useCatalogMeta } from "@/lib/hooks";

// Catálogo SIN CONEXIÓN: el que SyncManager guardó en IndexedDB. Con señal, el
// catálogo es el de las páginas SSR; este solo aparece en la página de respaldo
// offline. categorySlug filtra cuando el cliente abrió /c/slug sin señal.
export function OfflineCatalog({ categorySlug }: { categorySlug?: string }) {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), []);
  const meta = useCatalogMeta();

  if (products === undefined) return <GridSkeleton />;
  if (products.length === 0)
    return (
      <p className="py-16 text-center text-muted">
        El catálogo aún no se ha guardado en este celular. Conéctate a internet una vez para descargarlo.
      </p>
    );

  const visible = categorySlug
    ? products.filter((p) => p.categories.some((c) => slugify(c) === categorySlug))
    : products;

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {(visible.length ? visible : products).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
      {meta?.syncedAt && (
        <p className="mt-10 text-center text-xs text-muted">Catálogo guardado: {formatDate(meta.syncedAt)}</p>
      )}
    </>
  );
}
