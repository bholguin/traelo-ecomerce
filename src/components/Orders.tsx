"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon, PackageIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { formatCOP, formatDate } from "@/lib/format";
import { canPayShipping, payShipping, refreshOrderStatuses } from "@/lib/pedidos";
import { useOrders } from "@/lib/storage";
import type { Order } from "@/lib/types";

const STATUS_EVERY_MS = 30 * 1000;

// Estado en WooCommerce. Los estados que agregue un plugin (por ejemplo Dropify)
// y no estén aquí se muestran como "En proceso".
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
const DEMO = { label: "Demo", tone: "bg-soft text-muted" };
const CLOSED = ["cancelled", "refunded", "failed", "trash"];

const statusBadge = (o: Order) => (o.demo ? DEMO : REMOTE_STATUS[o.remoteStatus ?? "on-hold"] ?? REMOTE_FALLBACK);

// Aún no pasa a "Procesando" en Woo: falta el pago del envío.
const awaitingShipping = (o: Order) =>
  !o.demo && (!o.remoteStatus || o.remoteStatus === "on-hold" || o.remoteStatus === "pending");

const STEPS = ["Recibido", "En preparación", "Entregado"];

// Paso actual de la línea de tiempo, o null si el pedido se cerró sin entregar.
function stepOf(o: Order): number | null {
  if (awaitingShipping(o) || o.demo) return 0;
  if (o.remoteStatus === "completed") return 2;
  if (CLOSED.includes(o.remoteStatus ?? "")) return null;
  return 1;
}

// Trae el estado de los pedidos al abrir, cada 30 s con la pestaña visible y al volver a ella.
function useOrderStatusRefresh() {
  useEffect(() => {
    void refreshOrderStatuses();
    const onVisible = () => document.visibilityState === "visible" && void refreshOrderStatuses();
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(onVisible, STATUS_EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(t);
    };
  }, []);
}

function PayShippingButton({ order }: { order: Order }) {
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  return (
    <>
      <button
        disabled={state.loading}
        onClick={async () => {
          setState({ loading: true, error: null });
          // Si abre Wompi, la página se va; si no, queda el mensaje.
          const error = await payShipping(order);
          setState({ loading: false, error });
        }}
        className="mt-3 flex h-11 w-full items-center justify-between rounded-full bg-ink px-5 text-sm font-semibold text-surface disabled:opacity-60"
      >
        <span>{state.loading ? "Abriendo el pago…" : "Pagar envío"}</span>
        <span className="font-display tabular-nums">{formatCOP(order.shipping ?? 0)}</span>
      </button>
      {state.error && <p className="mt-2 text-xs text-bad">{state.error}</p>}
    </>
  );
}

export function Orders() {
  const nuevo = useSearchParams().get("nuevo");
  const orders = useOrders();
  useOrderStatusRefresh();
  const nuevoOrder = orders?.find((o) => o.clientOrderId === nuevo);

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
          <p className="mt-3 font-display text-xl font-bold">¡Pedido recibido!</p>
          <p className="mt-1 text-sm text-surface/75">
            {nuevoOrder && canPayShipping(nuevoOrder)
              ? "Para despacharlo falta el pago del envío: puedes hacerlo aquí abajo."
              : "Para despacharlo falta el pago del envío: te contactaremos al celular que registraste."}
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
                      {o.demo ? "Pedido de prueba" : `Pedido #${o.remoteId}`}
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

                {step !== null && (
                  <ol className="mt-5 grid grid-cols-3 gap-1" aria-label="Progreso del pedido">
                    {STEPS.map((label, i) => (
                      <li key={label} aria-current={i === step ? "step" : undefined}>
                        <span
                          className={`block h-1.5 rounded-full ${
                            i < step ? "bg-ink" : i === step ? "bg-linear-to-r from-ink to-brand" : "bg-soft"
                          } ${i === step && step < 2 ? "motion-safe:animate-pulse" : ""}`}
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

                {canPayShipping(o) ? (
                  <PayShippingButton order={o} />
                ) : (
                  awaitingShipping(o) && (
                    <p className="mt-3 rounded-2xl bg-warn/15 p-3 text-xs text-ink">
                      Para despachar este pedido falta el pago del envío.{" "}
                      {o.shipping === null
                        ? "Te contactaremos al celular que registraste para confirmarte su valor y coordinar el pago."
                        : "Te contactaremos al celular que registraste para coordinarlo."}
                    </p>
                  )
                )}
                {o.demo && (
                  <p className="mt-3 rounded-2xl bg-soft p-3 text-xs text-muted">Modo demo: no se creó en WooCommerce.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
