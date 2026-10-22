import Link from "next/link";
import { OfflineIcon } from "@/components/Icons";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="grid size-20 place-items-center rounded-[1.75rem] bg-soft text-muted">
        <OfflineIcon width={36} height={36} />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">Esta página no está guardada</h1>
      <p className="mt-2 max-w-sm text-muted">
        Sin conexión puedes usar la tienda, el carrito y tus pedidos. Lo demás vuelve con la señal.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-surface">
        Ir a la tienda
      </Link>
    </div>
  );
}
