"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, ViewTransition, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { addToCart } from "@/lib/db";
import { discountOf, formatCOP } from "@/lib/format";
import type { Product } from "@/lib/types";

// Islas interactivas de la ficha. El resto de la ficha (ProductView) se
// renderiza en el servidor.

export function Gallery({ product }: { product: Product }) {
  const [photo, setPhoto] = useState(0);
  const discount = discountOf(product);
  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-soft">
        <ViewTransition name={`producto-${product.id}`} share="morph" default="none">
          {/* La primera foto es el LCP de la ficha: se carga con prioridad. */}
          <ProductImage src={product.images[photo]} name={product.name} id={product.id} priority />
        </ViewTransition>
        {discount > 0 && (
          <span className="absolute top-4 left-4 rounded-full bg-lime px-3 py-1 text-sm font-bold text-ink">
            −{discount}%
          </span>
        )}
      </div>
      {product.images.length > 1 && (
        <div className="no-scrollbar mt-3 flex snap-x gap-2 overflow-x-auto">
          {product.images.map((src, i) => (
            <button
              key={src}
              onClick={() => setPhoto(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === photo}
              className="size-16 shrink-0 snap-start overflow-hidden rounded-2xl ring-2 ring-transparent ring-offset-2 ring-offset-surface transition aria-pressed:ring-ink"
            >
              <ProductImage src={src} name={`${product.name} ${i + 1}`} id={product.id} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// Lleva el foco al título al abrir la ficha: la transición de la foto no maneja
// el foco y los lectores de pantalla perderían el contexto.
export function FocusHeading({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={className}>
      {children}
    </h1>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  return (
    // En celular: sticky, pegada abajo mientras se lee la ficha. Va en el flujo
    // normal y sin backdrop-filter: si sticky falla sigue visible, y las barras
    // fixed con desenfoque fallan en navegadores integrados (Instagram, Facebook).
    <div
      className="sticky z-30 mt-8 flex gap-2 rounded-full border border-line bg-card p-2 shadow-xl shadow-ink/10 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="flex h-12 items-center rounded-full bg-soft">
        <button
          className="grid h-full w-11 place-items-center"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Menos"
        >
          <MinusIcon width={18} height={18} />
        </button>
        <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button
          className="grid h-full w-11 place-items-center"
          onClick={() => setQty((q) => Math.min(20, q + 1))}
          aria-label="Más"
        >
          <PlusIcon width={18} height={18} />
        </button>
      </div>
      <button
        onClick={async () => {
          await addToCart(product, qty);
          router.push("/carrito");
        }}
        className="flex h-12 flex-1 items-center justify-between gap-2 rounded-full bg-ink px-5 font-semibold text-surface transition-transform active:scale-[0.98]"
      >
        <span>Agregar</span>
        <span className="font-display tabular-nums">{formatCOP(product.price * qty)}</span>
      </button>
    </div>
  );
}
