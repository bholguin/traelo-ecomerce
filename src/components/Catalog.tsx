"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, db } from "@/lib/db";
import { formatCOP, formatDate } from "@/lib/format";
import { useCatalogMeta } from "@/lib/hooks";

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Catalog() {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), []);
  const meta = useCatalogMeta();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

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
        <p className="mb-4 rounded-xl border border-warn/60 bg-warn/15 px-4 py-2.5 text-sm">
          Modo demo: catálogo de prueba. Configura <code>WC_URL</code>, <code>WC_KEY</code> y{" "}
          <code>WC_SECRET</code> para cargar tus productos de Dropi.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos"
          aria-label="Buscar productos"
          className="h-11 w-full rounded-full border border-line bg-white px-5 outline-none focus:border-ink sm:max-w-sm"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "todas"}
              onClick={() => setCategory(c)}
              className={`h-9 shrink-0 rounded-full border px-4 text-sm ${
                category === c ? "border-ink bg-ink text-surface" : "border-line bg-white text-ink"
              }`}
            >
              {c ?? "Todas"}
            </button>
          ))}
        </div>
      </div>

      {products === undefined ? (
        <p className="py-16 text-center text-muted">Cargando catálogo…</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-muted">
          El catálogo aún no se ha descargado. Conéctate a internet una vez para guardarlo en el celular.
        </p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-muted">No hay productos que coincidan.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <Link href={`/producto?id=${p.id}`} className="block aspect-square overflow-hidden bg-soft">
                <ProductImage src={p.images[0]} name={p.name} id={p.id} />
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <Link href={`/producto?id=${p.id}`} className="line-clamp-2 text-sm font-medium leading-snug">
                  {p.name}
                </Link>
                <div className="mt-auto flex items-baseline gap-2 pt-1">
                  <span className="font-bold">{formatCOP(p.price)}</span>
                  {p.regularPrice && (
                    <span className="text-xs text-muted line-through">{formatCOP(p.regularPrice)}</span>
                  )}
                </div>
                <button
                  disabled={!p.inStock}
                  onClick={async () => {
                    await addToCart(p);
                    setAdded(p.id);
                    setTimeout(() => setAdded((a) => (a === p.id ? null : a)), 1200);
                  }}
                  className="mt-2 h-10 rounded-full bg-brand text-sm font-semibold text-white disabled:bg-line disabled:text-muted"
                >
                  {!p.inStock ? "Agotado" : added === p.id ? "Agregado ✓" : "Agregar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta?.syncedAt && (
        <p className="mt-8 text-center text-xs text-muted">
          Catálogo actualizado: {formatDate(meta.syncedAt)}
        </p>
      )}
    </div>
  );
}
