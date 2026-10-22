import Link from "next/link";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold">Esta página no está guardada</h1>
      <p className="mt-2 text-muted">Sin conexión solo están disponibles la tienda, el carrito y tus pedidos.</p>
      <Link href="/" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-surface">
        Ir a la tienda
      </Link>
    </div>
  );
}
