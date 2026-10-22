import type { Metadata } from "next";
import { OfflineFallback } from "./OfflineFallback";

// Página de respaldo: el service worker la sirve cuando el cliente abre sin señal
// una página que nunca visitó. La URL del navegador sigue siendo la que pidió
// (/p/slug, /c/slug…), y OfflineFallback decide qué mostrar desde IndexedDB.
export const metadata: Metadata = { title: "Sin conexión", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return <OfflineFallback />;
}
