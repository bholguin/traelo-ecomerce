import { cacheLife } from "next/cache";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

// Con Cache Components, new Date() no se puede leer sin caché al prerenderizar.
async function AnioActual() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// En celular, el espacio de abajo deja libre la barra flotante (Header).
export function Footer() {
  return (
    <footer className="border-t border-line/70 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <AnioActual /> {APP_NAME} · Producto contra entrega, envío a toda Colombia
        </p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/terminos" className="hover:text-ink hover:underline">
            Términos y condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-ink hover:underline">
            Política de datos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
