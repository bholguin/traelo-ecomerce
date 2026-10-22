"use client";

import { usePathname } from "next/navigation";
import { OfflineIcon } from "@/components/Icons";
import { OfflineCatalog } from "@/components/OfflineCatalog";
import { ProductDetail } from "@/components/ProductDetail";

export function OfflineFallback() {
  const path = usePathname();
  const product = path.match(/^\/p\/([^/]+)/)?.[1];
  const category = path.match(/^\/c\/([^/]+)/)?.[1];

  // El aviso de "sin señal" ya lo muestra el encabezado.
  return product ? (
    <ProductDetail slug={decodeURIComponent(product)} />
  ) : (
    <>
      <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight">
        <OfflineIcon width={26} height={26} className="text-muted" />
        Catálogo guardado
      </h1>
      <OfflineCatalog categorySlug={category} />
    </>
  );
}
