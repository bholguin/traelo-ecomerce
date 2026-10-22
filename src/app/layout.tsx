import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Pwa } from "@/components/Pwa";
import { SyncManager } from "@/components/SyncManager";
import "./globals.css";

const APP_NAME = "Tienda";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Compra contra entrega en toda Colombia, incluso sin conexión.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fffdf9",
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
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5">{children}</main>
        </Pwa>
      </body>
    </html>
  );
}
