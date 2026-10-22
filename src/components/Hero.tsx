import { CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";

// Bloque principal del inicio. Hay dos versiones y se elige con la variable de
// entorno HERO_VARIANTE (se lee en el build: cambiarla en Vercel requiere volver a desplegar):
//   "clasico" (por defecto)  titular + beneficios
//   "pasos"                  titular + cómo funciona la compra en 3 pasos
export type HeroVariante = "clasico" | "pasos";

export function Hero({ variante = heroVariante() }: { variante?: HeroVariante }) {
  return variante === "pasos" ? <HeroPasos /> : <HeroClasico />;
}

export const heroVariante = (): HeroVariante => (process.env.HERO_VARIANTE === "pasos" ? "pasos" : "clasico");

const SECTION = "relative isolate mb-6 overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:mb-8 sm:p-10";

function Fondo() {
  return <div aria-hidden="true" className="hero-mesh absolute inset-0 -z-10" />;
}

function Pastilla({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
      <span className="size-1.5 rounded-full bg-lime" />
      {children}
    </p>
  );
}

function Titular({ className = "" }: { className?: string }) {
  return (
    <h1 className={`mt-4 max-w-xl font-display text-[2.4rem] leading-[0.95] font-extrabold tracking-tight sm:text-6xl ${className}`}>
      Pídelo hoy.
      <br />
      <span className="text-gradient">Págalo en tu puerta.</span>
    </h1>
  );
}

const PERKS = [
  { icon: CashIcon, label: "Producto contra entrega" },
  { icon: TruckIcon, label: "Envío a toda Colombia" },
  { icon: OfflineIcon, label: "Compra sin señal" },
];

function HeroClasico() {
  return (
    <section className={SECTION}>
      <Fondo />
      <Pastilla>Pago contra entrega</Pastilla>
      <Titular />
      <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">
        Y si te quedas sin señal, tu pedido se guarda en el celular y sale solo cuando vuelva.
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {PERKS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm"
          >
            <Icon width={16} height={16} className="text-lime" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

const PASOS = [
  { title: "Pides y pagas el envío", text: "Nombre, celular y dirección. Puedes armarlo sin señal." },
  { title: "Te lo llevamos", text: "A tu municipio, en cualquier parte de Colombia." },
  { title: "Pagas el producto al recibir", text: "En efectivo, cuando lo tienes en la mano." },
];

function HeroPasos() {
  return (
    <section className={`${SECTION} lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10`}>
      <Fondo />
      <div>
        <Pastilla>Producto contra entrega</Pastilla>
        {/* Comparte el ancho con los pasos: un poco más chico para que quepa en dos líneas */}
        <Titular className="lg:text-[3.25rem]" />
        <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">
          Al pedir solo pagas el envío. El producto lo pagas en efectivo cuando te llega.
        </p>
        <a
          href="#productos"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          Ver productos
        </a>
      </div>

      {/* Celular: un solo panel con los pasos en lista, unidos por una línea, y cada
          título en una sola línea. Tablet: tres cajas en fila. Escritorio: lista a
          la derecha con la explicación de cada paso. */}
      <ol
        aria-label="Cómo funciona"
        className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-3 sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:mt-0 lg:grid-cols-1 lg:gap-3"
      >
        {PASOS.map((p, i) => (
          <li
            key={p.title}
            className="relative flex items-center gap-3 not-last:after:absolute not-last:after:top-full not-last:after:left-3.5 not-last:after:h-3 not-last:after:w-px not-last:after:bg-white/20 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:p-3 sm:backdrop-blur sm:not-last:after:hidden lg:gap-4 lg:p-4"
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-display font-black sm:size-8 sm:rounded-xl sm:text-base lg:size-11 lg:text-lg ${
                i === 0 ? "bg-lime text-ink" : "bg-white/10"
              }`}
            >
              {i + 1}
            </span>
            <span>
              <span className="block text-sm leading-tight font-semibold lg:text-base">{p.title}</span>
              <span className="hidden text-xs text-white/70 lg:block lg:text-sm">{p.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
