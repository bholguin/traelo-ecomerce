"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CashIcon, CheckIcon, OfflineIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { DEPARTAMENTOS } from "@/lib/colombia";
import { formatCOP } from "@/lib/format";
import { useCart, useOnline } from "@/lib/hooks";
import { enqueueOrder } from "@/lib/sync";
import type { Customer } from "@/lib/types";

const field =
  "h-12 w-full rounded-2xl border border-line bg-card px-4 outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5";

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-line bg-card/60 p-4 sm:p-5">
      <legend className="flex items-center gap-2 px-1 font-display text-lg font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-ink text-sm text-surface">{n}</span>
        {title}
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const online = useOnline();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const empty = cart !== undefined && cart.length === 0 && !sending;
  useEffect(() => {
    if (empty) router.replace("/carrito");
  }, [empty, router]);

  if (cart === undefined || cart.length === 0) return <p className="py-16 text-center text-muted">Cargando…</p>;
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const phone = get("phone").replace(/\D/g, "");
    if (!/^3\d{9}$/.test(phone)) {
      setError("Escribe un celular de 10 dígitos que empiece por 3.");
      return;
    }
    const customer: Customer = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      phone,
      email: get("email") || undefined,
      department: get("department"),
      city: get("city"),
      address: get("address"),
      notes: get("notes") || undefined,
    };
    setSending(true);
    try {
      const order = await enqueueOrder(customer);
      router.push(`/pedidos?nuevo=${order.clientOrderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el pedido");
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Finalizar pedido</h1>
      <p className="mt-1 text-sm text-muted">Solo te pedimos lo necesario para entregarte.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <form id="checkout" onSubmit={onSubmit} className="space-y-4">
          <Step n={1} title="¿Quién recibe?">
            <Field label="Nombre">
              <input name="firstName" required autoComplete="given-name" className={field} />
            </Field>
            <Field label="Apellido">
              <input name="lastName" required autoComplete="family-name" className={field} />
            </Field>
            <Field label="Celular" wide>
              <input
                name="phone"
                required
                inputMode="numeric"
                placeholder="3001234567"
                autoComplete="tel-national"
                className={field}
              />
            </Field>
            <Field label="Correo (opcional)" wide>
              <input name="email" type="email" autoComplete="email" className={field} />
            </Field>
          </Step>

          <Step n={2} title="¿Dónde lo entregamos?">
            <Field label="Departamento">
              <select name="department" required defaultValue="" className={field}>
                <option value="" disabled>
                  Elige uno
                </option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad o municipio">
              <input name="city" required autoComplete="address-level2" className={field} />
            </Field>
            <Field label="Dirección completa y barrio" wide>
              <input name="address" required autoComplete="street-address" className={field} />
            </Field>
            <Field label="Indicaciones para la entrega (opcional)" wide>
              <textarea
                name="notes"
                rows={2}
                placeholder="Torre, apartamento, punto de referencia…"
                className={`${field} h-auto py-3`}
              />
            </Field>
          </Step>

          <Step n={3} title="Pago">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-4 sm:col-span-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                <CashIcon />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Contra entrega</span>
                <span className="block text-sm text-muted">Pagas en efectivo cuando recibes el pedido.</span>
              </span>
              <span className="grid size-6 place-items-center rounded-full bg-ink text-surface">
                <CheckIcon width={14} height={14} />
              </span>
            </div>
          </Step>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-line bg-card p-4">
            <h2 className="font-display font-bold">Tu pedido</h2>
            <ul className="mt-3 space-y-3">
              {cart.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-soft">
                    <ProductImage src={i.image} name={i.name} id={i.productId} />
                  </span>
                  <span className="line-clamp-2 flex-1">
                    <span className="font-semibold">{i.quantity}×</span> {i.name}
                  </span>
                  <span className="tabular-nums">{formatCOP(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-sm text-muted">Total productos</span>
              <span className="font-display text-xl font-black tabular-nums">{formatCOP(total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">El envío se confirma al despachar.</p>
          </div>

          {!online && (
            <p className="flex gap-3 rounded-3xl bg-soft p-4 text-sm">
              <OfflineIcon className="mt-0.5 shrink-0" />
              Estás sin señal. Tu pedido se guarda en el celular y se envía solo cuando vuelva la conexión.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-bad/10 p-3 text-sm font-medium text-bad">
              {error}
            </p>
          )}

          <button
            form="checkout"
            disabled={sending}
            className="flex h-14 w-full items-center justify-between rounded-full bg-ink px-6 font-semibold text-surface transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <span>{sending ? "Guardando…" : online ? "Confirmar pedido" : "Guardar pedido"}</span>
            <span className="font-display tabular-nums">{formatCOP(total)}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
