import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "@/components/Icons";
import type { Categoria } from "@/lib/catalogo";

// Búsqueda y categorías con URLs reales (/buscar?q=, /c/slug): el servidor las
// renderiza y Google puede seguir los enlaces de categoría.
export function CatalogToolbar({
  categories,
  active,
  query = "",
}: {
  categories: Categoria[];
  active?: string; // slug de la categoría actual; undefined = "Todo"
  query?: string;
}) {
  const chips = [{ name: "Todo", href: "/", slug: undefined }, ...categories.map((c) => ({ ...c, href: `/c/${c.slug}` }))];

  return (
    <div className="sticky top-20 z-20 -mx-4 flex flex-col gap-3 bg-surface/85 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center">
      <Form action="/buscar" className="relative block sm:w-80" role="search">
        <label htmlFor="buscar" className="sr-only">
          Buscar productos
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          id="buscar"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="¿Qué estás buscando?"
          className="h-12 w-full rounded-full border border-line bg-card pr-5 pl-11 shadow-sm outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5"
        />
      </Form>
      <nav aria-label="Categorías" className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {chips.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            aria-current={c.slug === active && !query ? "page" : undefined}
            className="flex h-10 shrink-0 snap-start items-center rounded-full border border-line bg-card px-4 text-sm font-medium transition-colors aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface"
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function DemoBanner() {
  return (
    <p className="mb-4 rounded-2xl border border-warn/60 bg-warn/15 px-4 py-3 text-sm">
      Modo demo: catálogo de prueba. Configura <code>WC_URL</code>, <code>WC_KEY</code> y <code>WC_SECRET</code> para
      cargar tus productos de Dropi.
    </p>
  );
}
