"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { ArrowLeftIcon, CashIcon, MinusIcon, OfflineIcon, PlusIcon, TruckIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, db } from "@/lib/db";
import { discountOf, formatCOP } from "@/lib/format";
import { productCache } from "@/lib/product-cache";

const PERKS = [
  { icon: CashIcon, title: "Pagas al recibir", text: "En efectivo, cuando lo tengas en la mano." },
  { icon: TruckIcon, title: "Toda Colombia", text: "Te lo llevamos a tu municipio." },
  { icon: OfflineIcon, title: "Sin señal", text: "Tu pedido se guarda y sale solo." },
];

// Una sola ruta (/producto?id=) que lee desde IndexedDB: así la ficha
// abre sin conexión. Una página renderizada en servidor por producto no.
export function ProductDetail() {
  const id = Number(useSearchParams().get("id"));
  const router = useRouter();
  // Con el producto del catálogo en memoria, el primer render ya trae la foto
  // y la transición desde la tarjeta funciona.
  const product = useLiveQuery(() => (id ? db.products.get(id) : undefined), [id], productCache.get(id) ?? null);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const loaded = Boolean(product);

  // Lleva el foco al título para que lectores de pantalla anuncien la ficha.
  useEffect(() => {
    if (loaded) heading.current?.focus({ preventScroll: true });
  }, [loaded, id]);

  if (product === null)
    return (
      <div className="grid gap-6 md:grid-cols-2" aria-hidden="true">
        <div className="aspect-square animate-pulse rounded-[2rem] bg-soft" />
        <div className="space-y-3 pt-2">
          <div className="h-8 w-3/4 animate-pulse rounded-full bg-soft" />
          <div className="h-6 w-1/3 animate-pulse rounded-full bg-soft" />
        </div>
      </div>
    );
  if (!product)
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Este producto no está en el catálogo guardado.</p>
        <Link href="/" className="mt-4 inline-block font-semibold underline">
          Volver a la tienda
        </Link>
      </div>
    );

  const discount = discountOf(product);
  const lowStock = typeof product.stock === "number" && product.stock > 0 && product.stock <= 10;

  async function add() {
    await addToCart(product!, qty);
    router.push("/carrito");
  }

  return (
    <div className="pb-24 sm:pb-0">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeftIcon width={16} height={16} />
        Tienda
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-12">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-soft">
            <ViewTransition name={`producto-${product.id}`} share="morph" default="none">
              <ProductImage src={product.images[photo]} name={product.name} id={product.id} />
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
        </div>

        <div>
          {product.categories[0] && (
            <p className="inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">
              {product.categories[0]}
            </p>
          )}
          <h1
            ref={heading}
            tabIndex={-1}
            className="mt-3 font-display text-3xl leading-tight font-extrabold tracking-tight outline-none sm:text-4xl"
          >
            {product.name}
          </h1>

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

          {/* En celular: barra fija abajo. En escritorio: en línea. */}
          {product.inStock ? (
            <div
              className="fixed inset-x-3 z-30 flex gap-2 rounded-full border border-line/70 bg-card/90 p-2 shadow-xl shadow-ink/10 backdrop-blur-xl sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none"
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
                onClick={add}
                className="flex h-12 flex-1 items-center justify-between gap-2 rounded-full bg-ink px-5 font-semibold text-surface transition-transform active:scale-[0.98]"
              >
                <span>Agregar</span>
                <span className="font-display tabular-nums">{formatCOP(product.price * qty)}</span>
              </button>
            </div>
          ) : (
            <p className="mt-8 rounded-full bg-soft py-3 text-center font-semibold text-muted">Agotado</p>
          )}
        </div>
      </div>
    </div>
  );
}
