"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount, useOnline, usePendingCount } from "@/lib/hooks";

export function Header() {
  const online = useOnline();
  const cartCount = useCartCount();
  const pending = usePendingCount();
  const path = usePathname();

  const nav = [
    { href: "/", label: "Tienda" },
    { href: "/pedidos", label: "Mis pedidos", badge: pending },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        {!online && (
          <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-surface">
            Sin conexión · puedes seguir comprando, tu pedido se enviará al
            volver la señal
          </div>
        )}
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Tienda<span className="text-brand">.</span>
          </Link>

          <nav className="ml-2 hidden gap-1 sm:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative rounded-full px-3 py-1.5 text-sm ${
                  path === n.href
                    ? "bg-soft font-semibold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {n.label}
                {!!n.badge && (
                  <span className="ml-1.5 rounded-full bg-warn px-1.5 text-xs font-semibold text-ink">
                    {n.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs ${online ? "text-muted" : "font-semibold text-ink"}`}
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${online ? "bg-ok" : "bg-warn"}`}
              />
              {online ? "En línea" : "Offline"}
            </span>
            <Link
              href="/carrito"
              className="relative flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-surface"
            >
              Carrito
              {cartCount > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Navegación inferior en celular: fuera del header, porque backdrop-blur
          convierte al header en el contenedor de los elementos fixed */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm ${
              path === n.href ? "font-semibold text-ink" : "text-muted"
            }`}
          >
            {n.label}
            {!!n.badge && (
              <span className="rounded-full bg-warn px-1.5 text-xs font-semibold text-ink">
                {n.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
