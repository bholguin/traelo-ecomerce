"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { setCartQuantity } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/lib/hooks";

export default function CarritoPage() {
  const cart = useCart();
  if (cart === undefined) return <p className="py-16 text-center text-muted">Cargando…</p>;

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (cart.length === 0)
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-bold">Tu carrito está vacío</h1>
        <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-surface">
          Ver productos
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Carrito</h1>
      <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
        {cart.map((item) => (
          <li key={item.productId} className="flex gap-3 p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft">
              <ProductImage src={item.image} name={item.name} id={item.productId} />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="line-clamp-2 text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted">{formatCOP(item.price)} c/u</span>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex h-9 items-center rounded-full border border-line">
                  <button
                    className="h-full w-9"
                    onClick={() => setCartQuantity(item.productId, item.quantity - 1)}
                    aria-label="Menos"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="h-full w-9"
                    onClick={() => setCartQuantity(item.productId, Math.min(20, item.quantity + 1))}
                    aria-label="Más"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold">{formatCOP(item.price * item.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-soft p-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total productos</span>
          <span>{formatCOP(total)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">El costo de envío se confirma al despachar. Pagas al recibir.</p>
        <Link
          href="/checkout"
          className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-white"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
