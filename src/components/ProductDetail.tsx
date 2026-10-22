"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, db } from "@/lib/db";
import { formatCOP } from "@/lib/format";

// Una sola ruta (/producto?id=) que lee desde IndexedDB: así la ficha
// abre sin conexión. Una página renderizada en servidor por producto no.
export function ProductDetail() {
  const id = Number(useSearchParams().get("id"));
  const router = useRouter();
  const product = useLiveQuery(() => (id ? db.products.get(id) : undefined), [id], null);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);

  if (product === null) return <p className="py-16 text-center text-muted">Cargando…</p>;
  if (!product)
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Este producto no está en el catálogo guardado.</p>
        <Link href="/" className="mt-4 inline-block font-semibold underline">
          Volver a la tienda
        </Link>
      </div>
    );

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-soft">
          <ProductImage src={product.images[photo]} name={product.name} id={product.id} />
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setPhoto(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === photo ? "border-ink" : "border-transparent"
                }`}
              >
                <ProductImage src={src} name={`${product.name} ${i + 1}`} id={product.id} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-muted">{product.categories.join(" · ")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-bold">{formatCOP(product.price)}</span>
          {product.regularPrice && (
            <span className="text-muted line-through">{formatCOP(product.regularPrice)}</span>
          )}
        </div>
        <p className="mt-4 leading-relaxed text-ink/80">{product.description}</p>

        <ul className="mt-5 space-y-1.5 text-sm">
          <li>✓ Pagas en efectivo cuando recibes</li>
          <li>✓ Envío a toda Colombia</li>
          {typeof product.stock === "number" && product.stock > 0 && product.stock <= 10 && (
            <li className="font-semibold text-bad">Quedan {product.stock} unidades</li>
          )}
        </ul>

        {product.inStock ? (
          <div className="mt-6 flex gap-3">
            <div className="flex h-12 items-center rounded-full border border-line">
              <button className="h-full w-11 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
                −
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button className="h-full w-11 text-lg" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Más">
                +
              </button>
            </div>
            <button
              onClick={async () => {
                await addToCart(product, qty);
                router.push("/carrito");
              }}
              className="h-12 flex-1 rounded-full bg-brand font-semibold text-white"
            >
              Agregar al carrito
            </button>
          </div>
        ) : (
          <p className="mt-6 rounded-full bg-soft py-3 text-center font-semibold text-muted">Agotado</p>
        )}
      </div>
    </div>
  );
}
