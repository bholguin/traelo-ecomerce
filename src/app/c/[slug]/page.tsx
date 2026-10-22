import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { GridSkeleton, ProductGrid } from "@/components/ProductGrid";
import { getCategories, getCategory } from "@/lib/catalogo";

// Todas las categorías se prerenderizan en el build. Con Cache Components debe
// devolver al menos un parámetro: si no hay categorías, uno de relleno (→ 404).
export async function generateStaticParams() {
  const categories = await getCategories().catch(() => []);
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "sin-categorias" }];
}

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const data = await getCategory((await params).slug);
  if (!data) return { title: "Categoría no encontrada" };
  return {
    title: data.category.name,
    description: `${data.category.name}: ${data.category.count} productos con pago contra entrega y envío a toda Colombia.`,
  };
}

export default function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: Pick<PageProps<"/c/[slug]">, "params">) {
  const { slug } = await params;
  const [data, categories] = await Promise.all([getCategory(slug), getCategories()]);
  if (!data) notFound();

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {data.category.name} <span className="text-muted">· {data.category.count}</span>
      </h1>
      <CatalogToolbar categories={categories} active={slug} />
      <ProductGrid products={data.products} />
    </>
  );
}
