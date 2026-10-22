import Link from "next/link";
import { CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { QuickAdd } from "@/components/QuickAdd";
import { getCatalog, getCategories } from "@/lib/catalogo";
import { discountOf, formatCOP } from "@/lib/format";
import type { Product } from "@/lib/types";

// Bloque principal del inicio. Se elige con la variable de entorno HERO_VARIANTE
// (se lee en el build: cambiarla en Vercel requiere volver a desplegar):
//   "clasico" (por defecto)  titular + beneficios
//   "pasos"                  titular + cómo funciona la compra en 3 pasos
//   "destacado"              titular + el producto con mayor descuento, listo para agregar
//   "categorias"             titular + tarjetas de categorías que llevan a /c/slug
// "destacado" y "categorias" leen el catálogo (caché del SSR); si no hay datos
// suficientes, muestran el clásico.
export type HeroVariante = "clasico" | "pasos" | "destacado" | "categorias";

const VARIANTES: HeroVariante[] = ["clasico", "pasos", "destacado", "categorias"];

export const heroVariante = (): HeroVariante =>
  VARIANTES.find((v) => v === process.env.HERO_VARIANTE) ?? "clasico";

export function Hero({ variante = heroVariante() }: { variante?: HeroVariante }) {
  if (variante === "pasos") return <HeroPasos />;
  if (variante === "destacado") return <HeroDestacado />;
  if (variante === "categorias") return <HeroCategorias />;
  return <HeroClasico />;
}

// Mismo alto aproximado que el hero, para el <Suspense> de las variantes con datos.
export function HeroSkeleton() {
  return <div aria-hidden="true" className={`${SECTION} h-[26rem] animate-pulse sm:h-[22rem]`} />;
}

// ---------- Piezas compartidas ----------

const SECTION = "relative isolate mb-6 overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:mb-8 sm:p-10";
const DOS_COLUMNAS = "lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10";

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

function Subtitulo({ children }: { children: string }) {
  return <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">{children}</p>;
}

function VerProductos() {
  return (
    <a
      href="#productos"
      className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 font-semibold text-ink transition-transform active:scale-[0.98]"
    >
      Ver productos
    </a>
  );
}

const MODELO_DE_PAGO = "Al pedir solo pagas el envío. El producto lo pagas en efectivo cuando te llega.";

// ---------- Clásico ----------

const PERKS = [
  { icon: CashIcon, label: "El envío se paga al pedir" },
  { icon: TruckIcon, label: "Envío a toda Colombia" },
  { icon: OfflineIcon, label: "Compra sin señal" },
];

function HeroClasico() {
  return (
    <section className={SECTION}>
      <Fondo />
      <Pastilla>Producto contra entrega</Pastilla>
      <Titular />
      <Subtitulo>
        Al pedir solo pagas el envío; el producto, en efectivo cuando te llega. Y si te quedas sin señal, tu pedido se
        guarda y sale solo cuando vuelva.
      </Subtitulo>
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

// ---------- Pasos ----------

const PASOS = [
  { title: "Pides y pagas el envío", text: "Nombre, celular y dirección. Puedes armarlo sin señal." },
  { title: "Te lo llevamos", text: "A tu municipio, en cualquier parte de Colombia." },
  { title: "Pagas el producto al recibir", text: "En efectivo, cuando lo tienes en la mano." },
];

function HeroPasos() {
  return (
    <section className={`${SECTION} ${DOS_COLUMNAS}`}>
      <Fondo />
      <div>
        <Pastilla>Producto contra entrega</Pastilla>
        {/* Comparte el ancho con los pasos: un poco más chico para que quepa en dos líneas */}
        <Titular className="lg:text-[3.25rem]" />
        <Subtitulo>{MODELO_DE_PAGO}</Subtitulo>
        <VerProductos />
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

// ---------- Producto destacado ----------

// El de mayor descuento entre los disponibles; si ninguno tiene descuento, el primero disponible.
function elegirDestacado(products: Product[]): Product | undefined {
  const disponibles = products.filter((p) => p.inStock);
  return disponibles.reduce<Product | undefined>((mejor, p) => (!mejor || discountOf(p) > discountOf(mejor) ? p : mejor), undefined);
}

async function HeroDestacado() {
  const { products } = await getCatalog();
  const p = elegirDestacado(products);
  if (!p) return <HeroClasico />;
  const discount = discountOf(p);

  return (
    <section className={`${SECTION} ${DOS_COLUMNAS}`}>
      <Fondo />
      <div>
        <Pastilla>Producto contra entrega</Pastilla>
        <Titular className="lg:text-[3.25rem]" />
        <Subtitulo>{MODELO_DE_PAGO}</Subtitulo>
        <VerProductos />
      </div>

      {/* Celular: tarjeta horizontal compacta. Escritorio: tarjeta grande, levemente girada. */}
      <article className="mt-6 flex gap-3 rounded-3xl bg-card p-2.5 text-ink shadow-2xl shadow-black/40 lg:mt-0 lg:ml-auto lg:w-full lg:max-w-sm lg:rotate-2 lg:flex-col lg:p-3.5">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl bg-soft lg:aspect-[4/3] lg:size-auto lg:w-full">
          <Link href={`/p/${p.slug}`} className="block h-full" tabIndex={-1} aria-hidden="true">
            <ProductImage src={p.images[0]} name={p.name} id={p.id} priority />
          </Link>
          {discount > 0 && (
            <span className="absolute top-2 left-2 rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-ink lg:top-3 lg:left-3 lg:text-sm">
              −{discount}%
            </span>
          )}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col justify-between py-1 pr-14 lg:py-1 lg:pl-1.5">
          <div>
            <p className="text-xs font-semibold text-muted">{discount > 0 ? "Oferta destacada" : "Destacado"}</p>
            <Link href={`/p/${p.slug}`} className="line-clamp-2 text-sm leading-snug font-semibold hover:underline lg:text-base">
              {p.name}
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-xl font-black lg:text-2xl">{formatCOP(p.price)}</span>
            {discount > 0 && <s className="text-xs text-muted">{formatCOP(p.regularPrice!)}</s>}
          </div>
          {/* QuickAdd se posiciona abajo a la derecha de este contenedor */}
          <QuickAdd product={p} />
        </div>
      </article>
    </section>
  );
}

// ---------- Collage de categorías ----------

// "Tecnología, Hogar y Bienestar" (máximo 3; si hay más, "… y más").
const listar = (nombres: string[]) =>
  nombres.length > 3
    ? `${nombres.slice(0, 3).join(", ")} y más`
    : nombres.length > 1
      ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`
      : nombres.join("");

// Posición de cada tarjeta: se solapan en abanico y giran un poco. En celular
// ocupan 34 % del ancho cada una (se solapan un poco), con margen a los lados para que el giro no las
// corte contra el borde del bloque; en escritorio, el collage más amplio.
const COLLAGE = [
  "left-[2%] top-6 -rotate-8 lg:left-0 lg:top-10 lg:-rotate-6",
  "left-[33%] top-0 z-10 rotate-2 lg:left-[32%] lg:rotate-3",
  "left-[64%] top-7 rotate-9 lg:left-[64%] lg:top-14 lg:rotate-6",
];

async function HeroCategorias() {
  const [{ products }, categories] = await Promise.all([getCatalog(), getCategories()]);
  const cards = categories.slice(0, 3).map((c) => ({
    ...c,
    // Foto: el primer producto de la categoría que la tenga (o el primero, con su degradado).
    product:
      products.find((p) => p.categories.includes(c.name) && p.images[0]) ??
      products.find((p) => p.categories.includes(c.name))!,
  }));
  if (cards.length === 0) return <HeroClasico />;

  return (
    <section className={`${SECTION} ${DOS_COLUMNAS}`}>
      <Fondo />
      <div>
        <Pastilla>Producto contra entrega</Pastilla>
        <Titular className="lg:text-[3.25rem]" />
        <Subtitulo>{`${listar(categories.map((c) => c.name))}. ${MODELO_DE_PAGO}`}</Subtitulo>
        <VerProductos />
      </div>

      {/* Abanico de hasta 3 categorías, en todos los tamaños. */}
      <nav aria-label="Categorías destacadas" className="relative mt-5 h-48 sm:h-80 lg:mt-0 lg:h-80">
        {cards.map((c, i) => (
          <Link
            key={c.slug}
            href={`/c/${c.slug}`}
            className={`absolute w-[34%] rounded-[1.25rem] bg-card p-1.5 text-ink shadow-xl shadow-black/40 transition-transform hover:-translate-y-1 sm:rounded-3xl sm:p-2 lg:w-[36%] lg:p-2.5 ${COLLAGE[i]}`}
          >
            <span className="block aspect-square overflow-hidden rounded-[0.875rem] bg-soft sm:rounded-2xl">
              <ProductImage src={c.product.images[0]} name={c.name} id={c.product.id} />
            </span>
            <span className="flex items-baseline justify-between gap-2 px-1 pt-1.5 pb-0.5 text-xs font-bold sm:pt-2 sm:text-sm">
              <span className="truncate">{c.name}</span>
              <span className="hidden text-xs font-medium text-muted sm:inline">{c.count} →</span>
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
