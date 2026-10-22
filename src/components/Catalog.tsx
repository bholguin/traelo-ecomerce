"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useMemo, useState, ViewTransition } from "react";
import { CheckIcon, PlusIcon, SearchIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, db } from "@/lib/db";
import { discountOf, formatCOP, formatDate } from "@/lib/format";
import { useCatalogMeta } from "@/lib/hooks";
import { productCache } from "@/lib/product-cache";
import type { Product } from "@/lib/types";

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Catalog() {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), []);
  const meta = useCatalogMeta();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set((products ?? []).flatMap((p) => p.categories))].sort(),
    [products],
  );

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return (products ?? []).filter(
      (p) =>
        (!category || p.categories.includes(category)) &&
        (!q || normalize(p.name).includes(q) || normalize(p.description).includes(q)),
    );
  }, [products, query, category]);

  return (
    <div>
      {meta?.demo && (
        <p className="mb-4 rounded-2xl border border-warn/60 bg-warn/15 px-4 py-3 text-sm">
          Modo demo: catálogo de prueba. Configura <code>WC_URL</code>, <code>WC_KEY</code> y{" "}
          <code>WC_SECRET</code> para cargar tus productos de Dropi.
        </p>
      )}

      <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 bg-surface/85 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center">
        <label className="relative block sm:w-80">
          <span className="sr-only">Buscar productos</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="h-12 w-full rounded-full border border-line bg-card pr-5 pl-11 shadow-sm outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5"
          />
        </label>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "todas"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className="h-10 shrink-0 snap-start rounded-full border border-line bg-card px-4 text-sm font-medium transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-surface"
            >
              {c ?? "Todo"}
            </button>
          ))}
        </div>
      </div>

      {products === undefined ? (
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <div className="aspect-[4/5] animate-pulse rounded-3xl bg-soft" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-soft" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded-full bg-soft" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-muted">
          El catálogo aún no se ha descargado. Conéctate a internet una vez para guardarlo en el celular.
        </p>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-lg font-bold">Nada por aquí</p>
          <p className="mt-1 text-sm text-muted">Prueba con otra palabra o categoría.</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ul>
      )}

      {meta?.syncedAt && (
        <p className="mt-10 text-center text-xs text-muted">Catálogo actualizado: {formatDate(meta.syncedAt)}</p>
      )}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const discount = discountOf(p);
  const lowStock = typeof p.stock === "number" && p.stock > 0 && p.stock <= 5;
  const href = `/producto?id=${p.id}`;
  const remember = () => productCache.set(p.id, p);

  return (
    <li className="reveal group @container flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-soft">
        <Link href={href} onClick={remember} className="block h-full" tabIndex={-1} aria-hidden="true">
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
          <button
            onClick={async () => {
              await addToCart(p);
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
            aria-label={`Agregar ${p.name} al carrito`}
            className={`absolute right-2.5 bottom-2.5 grid size-11 place-items-center rounded-full shadow-lg shadow-ink/15 transition-all active:scale-90 ${
              added ? "bg-ink text-lime" : "bg-card text-ink hover:bg-ink hover:text-surface"
            }`}
          >
            {added ? <CheckIcon /> : <PlusIcon />}
          </button>
        ) : (
          <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-card/90 py-2 text-center text-xs font-semibold text-muted backdrop-blur">
            Agotado
          </span>
        )}
      </div>

      <div className="px-1 pt-3">
        <Link href={href} onClick={remember} className="line-clamp-2 text-sm leading-snug font-medium hover:underline">
          {p.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-base font-bold @[14rem]:text-lg">{formatCOP(p.price)}</span>
          {discount > 0 && <s className="text-xs text-muted">{formatCOP(p.regularPrice!)}</s>}
        </div>
      </div>
      <span role="status" className="sr-only">
        {added ? `${p.name} agregado al carrito` : ""}
      </span>
    </li>
  );
}
