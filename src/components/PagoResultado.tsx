"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon, TruckIcon } from "@/components/Icons";
import { canPayShipping, payShipping } from "@/lib/pedidos";
import { readOrders, updateOrders } from "@/lib/storage";
import type { PaymentStatusResponse } from "@/lib/types";

type Estado =
  | { kind: "cargando" }
  | { kind: "error"; message: string }
  | { kind: "listo"; status: Extract<PaymentStatusResponse, { ok: true }>["status"]; orderId: number };

// PSE y Nequi pueden quedar unos minutos "PENDING": se vuelve a consultar cada 5 s, hasta 1 min.
const RECHECK_MS = 5000;
const MAX_CHECKS = 12;

async function consultar(transactionId: string): Promise<Estado> {
  try {
    const res = await fetch("/api/pagos/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId }),
    });
    const data = (await res.json().catch(() => null)) as PaymentStatusResponse | null;
    if (data?.ok) return { kind: "listo", status: data.status, orderId: data.orderId };
    return { kind: "error", message: data?.message ?? "No pudimos consultar el pago." };
  } catch {
    return { kind: "error", message: "No pudimos consultar el pago. Revisa tu conexión." };
  }
}

export function PagoResultado() {
  const id = useSearchParams().get("id");
  const [estado, setEstado] = useState<Estado>({ kind: "cargando" });
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async (n: number) => {
      const r = await consultar(id);
      if (cancelled) return;
      setEstado(r);
      if (r.kind === "listo" && r.status === "APPROVED") {
        // Mis pedidos lo muestra en preparación sin esperar la próxima consulta a Woo.
        const local = readOrders().find((o) => o.remoteId === r.orderId);
        if (local) updateOrders(new Map([[local.clientOrderId, { remoteStatus: "processing" }]]));
      }
      if (r.kind === "listo" && r.status === "PENDING" && n < MAX_CHECKS) timer = setTimeout(() => check(n + 1), RECHECK_MS);
    };
    void check(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!id) return <Mensaje titulo="No encontramos el pago" texto="Revisa el estado de tu pedido en Mis pedidos." />;
  if (estado.kind === "cargando") return <p className="py-16 text-center text-muted">Confirmando tu pago…</p>;
  if (estado.kind === "error") return <Mensaje titulo="No pudimos confirmar el pago" texto={estado.message} />;

  if (estado.status === "APPROVED")
    return (
      <Mensaje
        ok
        titulo="¡Envío pagado!"
        texto={`Recibimos el pago del envío del pedido #${estado.orderId}. Ya lo estamos preparando. El producto lo pagas en efectivo cuando te llegue.`}
      />
    );
  if (estado.status === "PENDING")
    return (
      <Mensaje
        titulo="Tu pago está en proceso"
        texto="El banco aún no lo confirma; puede tardar unos minutos. Te mostraremos el estado en Mis pedidos."
      />
    );

  // DECLINED, VOIDED o ERROR: el pedido sigue "En espera" y se puede pagar de nuevo.
  const order = readOrders().find((o) => o.remoteId === estado.orderId);
  return (
    <Mensaje titulo="El pago no se completó" texto="No se hizo ningún cobro. Puedes intentarlo de nuevo con otro medio de pago.">
      {order && canPayShipping(order) && (
        <button
          onClick={async () => setRetryError(await payShipping(order))}
          className="rounded-full bg-ink px-6 py-3 font-semibold text-surface"
        >
          Intentar de nuevo
        </button>
      )}
      {retryError && <p className="w-full text-sm text-bad">{retryError}</p>}
    </Mensaje>
  );
}

function Mensaje({
  titulo,
  texto,
  ok,
  children,
}: {
  titulo: string;
  texto: string;
  ok?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span
        className={`grid size-20 place-items-center rounded-[1.75rem] ${ok ? "bg-lime text-ink" : "bg-soft text-muted"}`}
      >
        {ok ? <CheckIcon width={36} height={36} /> : <TruckIcon width={36} height={36} />}
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-2 text-muted">{texto}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {children}
        <Link href="/pedidos" className="rounded-full border border-line px-6 py-3 font-semibold">
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}
