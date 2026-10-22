"use client";

import Link from "next/link";
import { ArrowRightIcon, BagIcon, MinusIcon, PlusIcon, ShieldIcon, TrashIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { setCartQuantity } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/lib/hooks";

export default function CarritoPage() {
  const cart = useCart();
  if (cart === undefined) return <p className="py-16 text-center text-muted">Cargando…</p>;

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const units = cart.reduce((s, i) => s + i.quantity, 0);

  if (cart.length === 0)
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="grid size-20 place-items-center rounded-[1.75rem] bg-linear-to-br from-brand to-brand-2 text-white shadow-lg shadow-brand/30">
          <BagIcon width={36} height={36} />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">Tu carrito está vacío</h1>
        <p className="mt-1 text-muted">Agrega algo y págalo cuando te llegue.</p>
        <Link href="/" className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-surface">
          Ver productos
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Carrito <span className="text-muted">· {units}</span>
      </h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
        <ul className="space-y-3">
          {cart.map((item) => (
            <li key={item.productId} className="flex gap-3 rounded-3xl border border-line bg-card p-3">
              <Link
                href={`/producto?id=${item.productId}`}
                className="size-24 shrink-0 overflow-hidden rounded-2xl bg-soft"
                tabIndex={-1}
                aria-hidden="true"
              >
                <ProductImage src={item.image} name={item.name} id={item.productId} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-2">
                  <span className="line-clamp-2 flex-1 text-sm font-medium">{item.name}</span>
                  <button
                    onClick={() => setCartQuantity(item.productId, 0)}
                    aria-label={`Quitar ${item.name}`}
                    className="-m-1 grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-soft hover:text-bad"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
                <span className="text-xs text-muted">{formatCOP(item.price)} c/u</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex h-9 items-center rounded-full bg-soft">
                    <button
                      className="grid h-full w-9 place-items-center"
                      onClick={() => setCartQuantity(item.productId, item.quantity - 1)}
                      aria-label="Menos"
                    >
                      <MinusIcon width={16} height={16} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button
                      className="grid h-full w-9 place-items-center"
                      onClick={() => setCartQuantity(item.productId, Math.min(20, item.quantity + 1))}
                      aria-label="Más"
                    >
                      <PlusIcon width={16} height={16} />
                    </button>
                  </div>
                  <span className="font-display font-bold tabular-nums">{formatCOP(item.price * item.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-3xl bg-ink p-5 text-surface lg:sticky lg:top-24">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-surface/70">Productos</dt>
              <dd className="tabular-nums">{formatCOP(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface/70">Envío</dt>
              <dd>Se confirma al despachar</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-surface/15 pt-3">
              <dt className="font-semibold">Total productos</dt>
              <dd className="font-display text-2xl font-black tabular-nums">{formatCOP(total)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-5 flex h-13 items-center justify-center gap-2 rounded-full bg-lime font-semibold text-ink transition-transform active:scale-[0.98]"
          >
            Continuar con el pedido
            <ArrowRightIcon width={18} height={18} />
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-surface/70">
            <ShieldIcon width={16} height={16} />
            No pagas nada ahora: pagas al recibir.
          </p>
        </aside>
      </div>
    </div>
  );
}
