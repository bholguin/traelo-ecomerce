import type { Metadata } from "next";

// La página es cliente (lee el carrito del dispositivo) y no puede exportar metadata: va aquí.
// Es del dispositivo del cliente: no se indexa.
export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false, follow: false } };

export default function Layout({ children }: LayoutProps<"/checkout">) {
  return children;
}
