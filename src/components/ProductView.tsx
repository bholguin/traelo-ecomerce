import Link from "next/link";
import { ArrowLeftIcon, CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";
import { AddToCart, FocusHeading, Gallery } from "@/components/ProductIslands";
import { discountOf, formatCOP, slugify } from "@/lib/format";
import type { Product } from "@/lib/types";

const PERKS = [
  { icon: CashIcon, title: "Pagas al recibir", text: "En efectivo, cuando lo tengas en la mano." },
  { icon: TruckIcon, title: "Toda Colombia", text: "Te lo llevamos a tu municipio." },
  { icon: OfflineIcon, title: "Sin señal", text: "Tu pedido se guarda y sale solo." },
];

// Ficha de producto. Sin "use client" a propósito: en /p/[slug] se renderiza en
// el servidor (SSR) y la vista offline la reutiliza en el navegador con los
// datos de IndexedDB. Lo interactivo vive en ProductIslands.
export function ProductView({ product }: { product: Product }) {
  const discount = discountOf(product);
  const lowStock = typeof product.stock === "number" && product.stock > 0 && product.stock <= 10;
  const category = product.categories[0];

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeftIcon width={16} height={16} />
        Tienda
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-12">
        <div className="md:sticky md:top-28 md:self-start">
          <Gallery product={product} />
        </div>

        <div>
          {category && (
            <Link
              href={`/c/${slugify(category)}`}
              className="inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted hover:text-ink"
            >
              {category}
            </Link>
          )}
          <FocusHeading className="mt-3 font-display text-3xl leading-tight font-extrabold tracking-tight outline-none sm:text-4xl">
            {product.name}
          </FocusHeading>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-black">{formatCOP(product.price)}</span>
            {discount > 0 && (
              <>
                <s className="text-muted">{formatCOP(product.regularPrice!)}</s>
                <span className="text-sm font-semibold text-ok">
                  Ahorras {formatCOP(product.regularPrice! - product.price)}
                </span>
              </>
            )}
          </div>
          {lowStock && product.inStock && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-bad/10 px-3 py-1 text-sm font-semibold text-bad">
              <span className="size-1.5 rounded-full bg-bad motion-safe:animate-pulse" />
              Quedan {product.stock} unidades
            </p>
          )}

          <ul className="mt-6 grid gap-2 sm:grid-cols-3">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-line bg-card p-3 sm:flex-col sm:gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-soft text-ink">
                  <Icon width={18} height={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">Descripción</h2>
              <p className="mt-2 leading-relaxed text-ink/80">{product.description}</p>
            </div>
          )}

          {product.inStock ? (
            <AddToCart product={product} />
          ) : (
            <p className="mt-8 rounded-full bg-soft py-3 text-center font-semibold text-muted">Agotado</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="grid gap-6 pt-9 md:grid-cols-2" aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-[2rem] bg-soft" />
      <div className="space-y-3 pt-2">
        <div className="h-8 w-3/4 animate-pulse rounded-full bg-soft" />
        <div className="h-6 w-1/3 animate-pulse rounded-full bg-soft" />
      </div>
    </div>
  );
}
