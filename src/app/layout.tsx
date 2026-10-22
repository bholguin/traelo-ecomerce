import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Pwa } from "@/components/Pwa";
import { SyncManager } from "@/components/SyncManager";
import { APP_NAME, APP_TAGLINE, THEME_COLOR } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  formatDetection: { telephone: false },
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
        </Pwa>
      </body>
    </html>
  );
}
