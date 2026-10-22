import { formatCOP } from "@/lib/format";

// Desglose del modelo de pago: envío al confirmar, productos contra entrega.
// envio: undefined = destino aún no elegido; null = sin tarifa para ese destino.
// tone "dark" para el resumen del carrito (fondo tinta), "light" para el checkout.
export function PagoResumen({
  productos,
  envio,
  tone = "light",
}: {
  productos: number;
  envio: number | null | undefined;
  tone?: "dark" | "light";
}) {
  const muted = tone === "dark" ? "text-surface/70" : "text-muted";
  const line = tone === "dark" ? "border-surface/15" : "border-line";
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt>
          Envío <span className={`block text-xs ${muted}`}>Lo pagas al confirmar</span>
        </dt>
        <dd className="text-right tabular-nums">{envioLabel(envio)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt>
          Productos <span className={`block text-xs ${muted}`}>Los pagas en efectivo al recibir</span>
        </dt>
        <dd className="tabular-nums">{formatCOP(productos)}</dd>
      </div>
      <div className={`flex items-baseline justify-between border-t pt-3 ${line}`}>
        <dt className="font-semibold">
          Total{" "}
          {typeof envio !== "number" && <span className={`block text-xs font-normal ${muted}`}>Sin el envío</span>}
        </dt>
        <dd className="font-display text-2xl font-black tabular-nums">{formatCOP(productos + (envio ?? 0))}</dd>
      </div>
    </dl>
  );
}

export const envioLabel = (envio: number | null | undefined) =>
  envio === undefined ? "Según tu destino" : envio === null ? "Por confirmar" : formatCOP(envio);

// Mientras no haya pasarela de pagos, el envío se cobra coordinando con el cliente.
export const notaPagoEnvio = (envio: number | null | undefined) =>
  envio === null
    ? "Aún no tenemos tarifa para tu destino: te contactaremos al celular que registres para confirmarte el valor del envío y coordinar el pago."
    : "Te contactaremos al celular que registres para coordinar el pago del envío.";
