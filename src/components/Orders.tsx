"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  "on-hold": { label: "En espera", tone: "bg-warn/25 text-ink" },
  completed: { label: "Entregado", tone: "bg-ok/15 text-ok" },
  cancelled: { label: "Cancelado", tone: "bg-bad/10 text-bad" },
  refunded: { label: "Reembolsado", tone: "bg-bad/10 text-bad" },
  failed: { label: "Fallido", tone: "bg-bad/10 text-bad" },
  trash: { label: "Cancelado", tone: "bg-bad/10 text-bad" },
};
const REMOTE_FALLBACK = { label: "En proceso", tone: "bg-ok/15 text-ok" };

function statusBadge(o: QueuedOrder) {
  if (o.status !== "enviado" || !o.remoteStatus) return STATUS[o.status];
  return REMOTE_STATUS[o.remoteStatus] ?? REMOTE_FALLBACK;
}

export function Orders() {
  const nuevo = useSearchParams().get("nuevo");
  const orders = useLiveQuery(() => db.orders.orderBy("createdAt").reverse().toArray(), []);

  if (orders === undefined) return <p className="py-16 text-center text-muted">Cargando…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Mis pedidos</h1>

      {nuevo && (
        <p className="mt-4 rounded-2xl bg-ok/10 p-4 text-sm">
          <strong>¡Pedido guardado!</strong> Está seguro en tu celular. Si no hay señal, se enviará solo cuando vuelva.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted">Todavía no tienes pedidos.</p>
          <Link href="/" className="mt-4 inline-block font-semibold underline">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((o) => {
            const s = statusBadge(o);
            return (
              <li
                key={o.clientOrderId}
                className={`rounded-2xl border bg-white p-4 ${o.clientOrderId === nuevo ? "border-ink" : "border-line"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {o.remoteId ? `Pedido #${o.remoteId}` : "Pedido sin número aún"}
                    </p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>
                </div>
                <p className="mt-2 text-sm text-ink/80">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted">
                    {o.customer.city}, {o.customer.department}
                  </span>
                  <span className="font-bold">{formatCOP(o.total)}</span>
                </div>
                {o.message && <p className="mt-2 text-xs text-muted">{o.message}</p>}
                {(o.status === "error" || o.status === "revision") && (
                  <button
                    onClick={() => retryOrder(o.clientOrderId)}
                    className="mt-3 h-9 rounded-full border border-ink px-4 text-sm font-semibold"
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
