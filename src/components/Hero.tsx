import { CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";

// Bloque principal del inicio. Hay dos versiones y se elige con la variable de
// entorno HERO_VARIANTE (se lee en el build: cambiarla en Vercel requiere volver a desplegar):
//   "clasico" (por defecto)  titular + beneficios
//   "pasos"                  titular + cómo funciona el contra entrega en 3 pasos
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
  { icon: CashIcon, label: "Pagas al recibir" },
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
  { title: "Eliges y confirmas", text: "Solo nombre, celular y dirección. Funciona sin señal." },
  { title: "Te lo llevamos", text: "A tu municipio, en cualquier parte de Colombia." },
  { title: "Pagas al recibir", text: "En efectivo, cuando lo tienes en la mano." },
];

function HeroPasos() {
  return (
    <section className={`${SECTION} lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10`}>
      <Fondo />
      <div>
        <Pastilla>Sin pagar por adelantado</Pastilla>
        {/* Comparte el ancho con los pasos: un poco más chico para que quepa en dos líneas */}
        <Titular className="lg:text-[3.25rem]" />
        <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">
          No pagas nada antes. Revisas tu pedido y pagas en efectivo cuando te llega.
        </p>
        <a
          href="#productos"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 font-semibold text-ink transition-transform active:scale-[0.98]"
        >
          Ver productos
        </a>
      </div>

      {/* Celular: fila compacta de 3. Escritorio: lista a la derecha. */}
      <ol className="mt-6 grid grid-cols-3 gap-2 lg:mt-0 lg:grid-cols-1 lg:gap-3" aria-label="Cómo funciona">
        {PASOS.map((p, i) => (
          <li
            key={p.title}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row sm:items-center sm:gap-3 lg:gap-4 lg:p-4"
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-xl font-display font-black lg:size-11 lg:text-lg ${
                i === 0 ? "bg-lime text-ink" : "bg-white/10"
              }`}
            >
              {i + 1}
            </span>
            <span>
              <span className="block text-xs leading-tight font-semibold sm:text-sm lg:text-base">{p.title}</span>
              <span className="hidden text-xs text-white/70 lg:block lg:text-sm">{p.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
