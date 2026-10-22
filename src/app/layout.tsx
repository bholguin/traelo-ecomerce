import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Pwa } from "@/components/Pwa";
import { SyncManager } from "@/components/SyncManager";
import { APP_NAME, APP_TAGLINE, THEME_COLOR } from "@/lib/brand";
import { indexable } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  formatDetection: { telephone: false },
  // La imagen sale de app/opengraph-image.tsx; Next la agrega sola.
  openGraph: { type: "website", locale: "es_CO", siteName: APP_NAME },
  twitter: { card: "summary_large_image" },
  // Modo demo y vistas previas de Vercel: nada se indexa (ver lib/seo.ts).
  ...(indexable() ? {} : { robots: { index: false, follow: false } }),
  // Search Console → verificación por etiqueta HTML: pega el código en GOOGLE_SITE_VERIFICATION.
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <Pwa>
          <SyncManager />
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 sm:pt-6">{children}</main>
          <Footer />
        </Pwa>
      </body>
    </html>
  );
}
