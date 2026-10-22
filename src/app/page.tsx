import { Suspense } from "react";
import { CatalogToolbar, DemoBanner } from "@/components/CatalogToolbar";
import { Hero } from "@/components/Hero";
import { GridSkeleton, ProductGrid } from "@/components/ProductGrid";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { getCatalog, getCategories } from "@/lib/catalogo";
import { jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Datos estructurados de la tienda (Google: nombre, logo y sitio en resultados).
// Fase 2: agregar teléfono de WhatsApp (contactPoint) y redes (sameAs) cuando existan.
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: APP_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: APP_TAGLINE,
  areaServed: { "@type": "Country", name: "Colombia" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ORGANIZATION)} />
      <Hero />
      <div id="productos" className="scroll-mt-20">
        <Suspense fallback={<GridSkeleton />}>
          <HomeCatalog />
        </Suspense>
      </div>
    </>
  );
}

async function HomeCatalog() {
  const [{ products, demo }, categories] = await Promise.all([getCatalog(), getCategories()]);
  return (
    <>
      {demo && <DemoBanner />}
      <CatalogToolbar categories={categories} />
      <ProductGrid products={products} empty="Todavía no hay productos publicados." />
    </>
  );
}
