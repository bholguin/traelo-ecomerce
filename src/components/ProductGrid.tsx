import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const GRID = "mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products, empty }: { products: Product[]; empty?: string }) {
  if (products.length === 0)
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg font-bold">Nada por aquí</p>
        <p className="mt-1 text-sm text-muted">{empty ?? "Prueba con otra palabra o categoría."}</p>
      </div>
    );
  return (
    <ul className={GRID}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}

export function GridSkeleton() {
  return (
    <ul className={GRID} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-soft" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-soft" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded-full bg-soft" />
        </li>
      ))}
    </ul>
  );
}
