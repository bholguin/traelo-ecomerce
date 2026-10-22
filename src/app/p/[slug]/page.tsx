import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductSkeleton, ProductView } from "@/components/ProductView";
import { getCatalog, getProductBySlug } from "@/lib/catalogo";

// Todos los productos se prerenderizan en el build: así la primera visita de
// Google recibe la ficha completa y no el esqueleto. Los productos nuevos se
// generan en su primera visita y quedan en caché (ISR con Cache Components).
// Con Cache Components debe devolver al menos un parámetro.
export async function generateStaticParams() {
  const { products } = await getCatalog().catch(() => ({ products: [] }));
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "sin-productos" }];
}

// Fase 2 del plan SEO: canonical, Open Graph y JSON-LD de Product.
export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name, description: product.description.slice(0, 155) };
}

export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  return <ProductView product={product} />;
}
