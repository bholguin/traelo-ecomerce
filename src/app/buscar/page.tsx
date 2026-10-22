import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { GridSkeleton, ProductGrid } from "@/components/ProductGrid";
import { getCategories, searchProducts } from "@/lib/catalogo";

// Resultados de búsqueda interna: no se indexan (contenido duplicado y casi infinito).
export const metadata: Metadata = { title: "Buscar", robots: { index: false, follow: true } };

export default function SearchPage({ searchParams }: PageProps<"/buscar">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/buscar">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
  const [results, categories] = await Promise.all([searchProducts(q), getCategories()]);

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {q ? (
          <>
            “{q}” <span className="text-muted">· {results.length}</span>
          </>
        ) : (
          "Buscar"
        )}
      </h1>
      <CatalogToolbar categories={categories} query={q} />
      <ProductGrid products={results} empty={q ? "Prueba con otra palabra." : "Escribe qué estás buscando."} />
    </>
  );
}
