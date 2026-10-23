"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, PackageIcon, StoreIcon } from "@/components/Icons";
import { APP_NAME } from "@/lib/brand";
import { canPayShipping } from "@/lib/pedidos";
import { useCartCount, useOrders } from "@/lib/storage";

// En la ficha y en el checkout la barra inferior se esconde: esas páginas
// tienen su propio botón fijo abajo.
const HIDE_DOCK = ["/p/", "/checkout"];

export function Header() {
  const cartCount = useCartCount();
  // Pedidos con el envío por pagar: el cliente tiene algo que hacer en Mis pedidos.
  const pending = useOrders()?.filter(canPayShipping).length ?? 0;
  const path = usePathname();

  const nav = [
    { href: "/", label: "Tienda", icon: StoreIcon, badge: 0 },
    { href: "/pedidos", label: "Pedidos", icon: PackageIcon, badge: pending },
    { href: "/carrito", label: "Carrito", icon: BagIcon, badge: cartCount },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME}, inicio`}>
            <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-brand to-brand-2 font-display text-2xl font-black text-white shadow-lg shadow-brand/30">
              {APP_NAME[0].toLowerCase()}
            </span>
            <span className="font-display text-[1.75rem] leading-none font-extrabold tracking-tight">
              {APP_NAME.toLowerCase()}
            </span>
          </Link>

          <nav className="ml-4 hidden gap-1 sm:flex" aria-label="Principal">
            {nav.slice(0, 2).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={path === n.href ? "page" : undefined}
                className="relative rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface"
              >
                {n.label}
                {n.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-warn px-1.5 text-xs font-bold text-ink">{n.badge}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Visible en todos los tamaños: en la ficha y el checkout no hay barra inferior. */}
            <Link
              href="/carrito"
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : ""}`}
              className="relative flex h-11 items-center gap-2 rounded-full bg-ink px-3.5 text-sm font-semibold text-surface transition-transform active:scale-95 sm:px-4"
            >
              <BagIcon width={20} height={20} />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span key={cartCount} className="animate-bump rounded-full bg-lime px-1.5 text-xs font-bold text-ink">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Barra flotante en celular. Va fuera del header: backdrop-blur convierte
          al header en el contenedor de los elementos fixed. */}
      {!HIDE_DOCK.some((prefix) => path.startsWith(prefix)) && (
        <nav
          aria-label="Principal"
          className="fixed inset-x-4 z-30 mx-auto flex max-w-sm gap-1 rounded-full border border-line/70 bg-card/85 p-1.5 shadow-xl shadow-ink/10 backdrop-blur-xl sm:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          {nav.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold transition-colors ${
                  active ? "bg-ink text-surface" : "text-muted"
                }`}
              >
                <n.icon width={22} height={22} />
                {n.label}
                {n.badge > 0 && (
                  <span
                    key={n.badge}
                    className={`absolute top-1 left-[calc(50%+0.4rem)] min-w-5 animate-bump rounded-full px-1 text-center text-[11px] leading-5 font-bold ring-2 ${
                      active ? "ring-ink" : "ring-card"
                    } ${n.href === "/pedidos" ? "bg-warn text-ink" : "bg-lime text-ink"}`}
                  >
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
