import { Suspense } from "react";
import { CatalogToolbar, DemoBanner } from "@/components/CatalogToolbar";
import { CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";
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

const PERKS = [
  { icon: CashIcon, label: "Pagas al recibir" },
  { icon: TruckIcon, label: "Envío a toda Colombia" },
  { icon: OfflineIcon, label: "Compra sin señal" },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ORGANIZATION)} />
      <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:mb-8 sm:p-10">
        <div aria-hidden="true" className="hero-mesh absolute inset-0 -z-10" />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
          <span className="size-1.5 rounded-full bg-lime" />
          Pago contra entrega
        </p>
        <h1 className="mt-4 max-w-xl font-display text-[2.4rem] leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
          Pídelo hoy.
          <br />
          <span className="text-gradient">Págalo en tu puerta.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">
          Y si te quedas sin señal, tu pedido se guarda en el celular y sale solo cuando vuelva.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {PERKS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm"
            >
              <Icon width={16} height={16} className="text-lime" />
              {label}
            </li>
          ))}
        </ul>
      </section>
      <Suspense fallback={<GridSkeleton />}>
        <HomeCatalog />
      </Suspense>
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
