import Link from "next/link";
import { ViewTransition } from "react";
import { ProductImage } from "@/components/ProductImage";
import { QuickAdd } from "@/components/QuickAdd";
import { discountOf, formatCOP } from "@/lib/format";
import type { Product } from "@/lib/types";

// Tarjeta renderizada en el servidor; solo el botón "+" es interactivo.
// href: la ficha SSR (/p/slug). El catálogo offline pasa la ficha de IndexedDB.
export function ProductCard({ product: p, href = `/p/${p.slug}` }: { product: Product; href?: string }) {
  const discount = discountOf(p);
  const lowStock = typeof p.stock === "number" && p.stock > 0 && p.stock <= 5;

  return (
    <li className="reveal group @container flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-soft">
        <Link href={href} className="block h-full" tabIndex={-1} aria-hidden="true">
          <ViewTransition name={`producto-${p.id}`} share="morph" default="none">
            <ProductImage
              src={p.images[0]}
              name={p.name}
              id={p.id}
              className={`transition-transform duration-500 group-hover:scale-105 ${p.inStock ? "" : "opacity-50 grayscale"}`}
            />
          </ViewTransition>
        </Link>

        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-ink">−{discount}%</span>
          )}
          {lowStock && p.inStock && (
            <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              Quedan {p.stock}
            </span>
          )}
        </div>

        {p.inStock ? (
          <QuickAdd product={p} />
        ) : (
          <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-card/90 py-2 text-center text-xs font-semibold text-muted backdrop-blur">
            Agotado
          </span>
        )}
      </div>

      <div className="px-1 pt-3">
        <Link href={href} className="line-clamp-2 text-sm leading-snug font-medium hover:underline">
          {p.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-base font-bold @[14rem]:text-lg">{formatCOP(p.price)}</span>
          {discount > 0 && <s className="text-xs text-muted">{formatCOP(p.regularPrice!)}</s>}
        </div>
      </div>
    </li>
  );
}
