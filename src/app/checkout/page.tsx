"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DEPARTAMENTOS } from "@/lib/colombia";
import { formatCOP } from "@/lib/format";
import { useCart, useOnline } from "@/lib/hooks";
import { enqueueOrder } from "@/lib/sync";
import type { Customer } from "@/lib/types";

const field = "h-12 w-full rounded-xl border border-line bg-white px-4 outline-none focus:border-ink";

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
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Datos de envío</h1>
      <p className="mt-1 text-sm text-muted">Pago contra entrega · {formatCOP(total)} en productos</p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input name="firstName" required placeholder="Nombre" autoComplete="given-name" className={field} />
        <input name="lastName" required placeholder="Apellido" autoComplete="family-name" className={field} />
        <input
          name="phone"
          required
          inputMode="numeric"
          placeholder="Celular (ej. 3001234567)"
          autoComplete="tel-national"
          className={`${field} sm:col-span-2`}
        />
        <input
          name="email"
          type="email"
          placeholder="Correo (opcional)"
          autoComplete="email"
          className={`${field} sm:col-span-2`}
        />
        <select name="department" required defaultValue="" className={field}>
          <option value="" disabled>
            Departamento
          </option>
          {DEPARTAMENTOS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input name="city" required placeholder="Ciudad o municipio" autoComplete="address-level2" className={field} />
        <input
          name="address"
          required
          placeholder="Dirección completa, barrio"
          autoComplete="street-address"
          className={`${field} sm:col-span-2`}
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Indicaciones para la entrega (opcional)"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-ink sm:col-span-2"
        />

        {error && <p className="text-sm font-medium text-bad sm:col-span-2">{error}</p>}

        <button
          disabled={sending}
          className="h-12 rounded-full bg-brand font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {sending ? "Guardando…" : online ? "Confirmar pedido" : "Guardar pedido (se enviará al volver la señal)"}
        </button>
      </form>
    </div>
  );
}
