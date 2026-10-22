"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckIcon, PackageIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { db } from "@/lib/db";
import { formatCOP, formatDate } from "@/lib/format";
import { retryOrder } from "@/lib/sync";
import type { OrderStatus, QueuedOrder } from "@/lib/types";

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pendiente: { label: "Guardado, esperando señal", tone: "bg-warn/25 text-ink" },
  enviando: { label: "Enviando…", tone: "bg-warn/25 text-ink" },
  error: { label: "Reintentando", tone: "bg-warn/25 text-ink" },
  enviado: { label: "Recibido", tone: "bg-ok/15 text-ok" },
  revision: { label: "Requiere revisión", tone: "bg-bad/10 text-bad" },
};

// Estado en WooCommerce, una vez que el pedido llegó. Los estados que agregue
// un plugin (por ejemplo Dropify) y no estén aquí se muestran como "En proceso".
const REMOTE_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Recibido", tone: "bg-ok/15 text-ok" },
  processing: { label: "En preparación", tone: "bg-ok/15 text-ok" },
  // Los pedidos se crean "En espera" hasta que se paga el envío.
  "on-hold": { label: "Falta pagar el envío", tone: "bg-warn/25 text-ink" },
  completed: { label: "Entregado", tone: "bg-ok/15 text-ok" },
  cancelled: { label: "Cancelado", tone: "bg-bad/10 text-bad" },
  refunded: { label: "Reembolsado", tone: "bg-bad/10 text-bad" },
  failed: { label: "Fallido", tone: "bg-bad/10 text-bad" },
  trash: { label: "Cancelado", tone: "bg-bad/10 text-bad" },
};
const REMOTE_FALLBACK = { label: "En proceso", tone: "bg-ok/15 text-ok" };
const CLOSED = ["cancelled", "refunded", "failed", "trash"];

function statusBadge(o: QueuedOrder) {
  if (o.status !== "enviado" || !o.remoteStatus) return STATUS[o.status];
  return REMOTE_STATUS[o.remoteStatus] ?? REMOTE_FALLBACK;
}

// Pedidos del modelo actual (con envío) que aún no han pasado a "Procesando" en Woo.
// Los viejos (sin envío) se crearon ya en "Procesando" y no muestran la nota.
const awaitingShipping = (o: QueuedOrder) =>
  o.shipping !== undefined &&
  o.status !== "revision" &&
  (!o.remoteStatus || o.remoteStatus === "on-hold" || o.remoteStatus === "pending");

const STEPS = ["Guardado", "Recibido", "En preparación", "Entregado"];

// Paso actual de la línea de tiempo, o null si el pedido se cerró sin entregar.
function stepOf(o: QueuedOrder): number | null {
  if (o.status !== "enviado") return 0;
  if (!o.remoteStatus || o.remoteStatus === "pending" || o.remoteStatus === "on-hold") return 1;
  if (o.remoteStatus === "completed") return 3;
  if (CLOSED.includes(o.remoteStatus)) return null;
  return 2;
}

export function Orders() {
  const nuevo = useSearchParams().get("nuevo");
  const orders = useLiveQuery(() => db.orders.orderBy("createdAt").reverse().toArray(), []);

  if (orders === undefined) return <p className="py-16 text-center text-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Mis pedidos</h1>

      {nuevo && (
        <div className="relative isolate mt-5 overflow-hidden rounded-3xl bg-ink p-5 text-surface">
          <div aria-hidden="true" className="hero-mesh absolute inset-0 -z-10 opacity-70" />
          <span className="grid size-10 place-items-center rounded-full bg-lime text-ink">
            <CheckIcon />
          </span>
          <p className="mt-3 font-display text-xl font-bold">¡Pedido guardado!</p>
          <p className="mt-1 text-sm text-surface/75">
            Está seguro en tu celular y, si no hay señal, se enviará solo cuando vuelva. Para despacharlo falta el
            pago del envío: te contactaremos al celular que registraste.
          </p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="grid size-20 place-items-center rounded-[1.75rem] bg-soft text-muted">
            <PackageIcon width={36} height={36} />
          </span>
          <p className="mt-5 font-display text-xl font-bold">Todavía no tienes pedidos</p>
          <Link href="/" className="mt-5 rounded-full bg-ink px-6 py-3 font-semibold text-surface">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {orders.map((o) => {
            const s = statusBadge(o);
            const step = stepOf(o);
            return (
              <li
                key={o.clientOrderId}
                className={`rounded-3xl border bg-card p-4 sm:p-5 ${
                  o.clientOrderId === nuevo ? "border-ink ring-4 ring-ink/5" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">
                      {o.remoteId ? `Pedido #${o.remoteId}` : "Pedido sin número aún"}
                    </p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i) => (
                      <span
                        key={i.productId}
                        className="size-11 overflow-hidden rounded-xl bg-soft ring-2 ring-card"
                      >
                        <ProductImage src={i.image} name={i.name} id={i.productId} />
                      </span>
                    ))}
                  </div>
                  <p className="line-clamp-2 flex-1 text-sm text-ink/80">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </div>

                {step !== null && o.status !== "revision" && (
                  <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Progreso del pedido">
                    {STEPS.map((label, i) => (
                      <li key={label} aria-current={i === step ? "step" : undefined}>
                        <span
                          className={`block h-1.5 rounded-full ${
                            i < step ? "bg-ink" : i === step ? "bg-linear-to-r from-ink to-brand" : "bg-soft"
                          } ${i === step && step < 3 ? "motion-safe:animate-pulse" : ""}`}
                        />
                        <span
                          className={`mt-1.5 block text-[11px] leading-tight ${
                            i <= step ? "font-semibold text-ink" : "text-muted"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                  <span className="text-sm text-muted">
                    {o.customer.city}, {o.customer.department}
                  </span>
                  <span className="text-right">
                    <span className="block font-display font-bold tabular-nums">{formatCOP(o.total)}</span>
                    <span className="block text-xs text-muted">
                      al recibir{o.shipping ? ` · envío ${formatCOP(o.shipping)}` : ""}
                    </span>
                  </span>
                </div>

                {awaitingShipping(o) && (
                  <p className="mt-3 rounded-2xl bg-warn/15 p-3 text-xs text-ink">
                    Para despachar este pedido falta el pago del envío.{" "}
                    {o.shipping === null
                      ? "Te contactaremos al celular que registraste para confirmarte su valor y coordinar el pago."
                      : "Te contactaremos al celular que registraste para coordinarlo."}
                  </p>
                )}

                {o.message && (
                  <p
                    className={`mt-3 rounded-2xl p-3 text-xs ${o.status === "revision" ? "bg-bad/10 text-bad" : "bg-soft text-muted"}`}
                  >
                    {o.message}
                  </p>
                )}
                {(o.status === "error" || o.status === "revision") && (
                  <button
                    onClick={() => retryOrder(o.clientOrderId)}
                    className="mt-3 h-10 rounded-full bg-ink px-5 text-sm font-semibold text-surface"
                  >
                    Reintentar ahora
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
