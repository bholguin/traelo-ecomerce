import type { ReactNode } from "react";

// Piezas compartidas de las páginas legales (/terminos, /privacidad).

// Muestra el dato, o un aviso resaltado si todavía no está en src/config/legal.ts.
export function Dato({ valor, falta }: { valor: string; falta: string }) {
  if (valor) return <>{valor}</>;
  return <mark className="rounded bg-warn/40 px-1 text-ink">[Por definir: {falta}]</mark>;
}

export type Secciones = readonly (readonly [id: string, titulo: string])[];

export function LegalHeader({ title, actualizado }: { title: string; actualizado: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {actualizado}</p>
    </>
  );
}

export function Resumen({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl bg-soft p-5">
      <p className="font-semibold">En resumen</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/85">{children}</ul>
    </div>
  );
}

export function Indice({ secciones }: { secciones: Secciones }) {
  return (
    <nav aria-label="Contenido" className="mt-6 rounded-3xl border border-line bg-card p-5">
      <p className="text-sm font-semibold">Contenido</p>
      <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {secciones.map(([id, titulo], i) => (
          <li key={id}>
            <a href={`#${id}`} className="text-muted hover:text-ink hover:underline">
              {i + 1}. {titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// La numeración sale del orden en `secciones`, igual que en el índice.
export function Seccion({ secciones, id, children }: { secciones: Secciones; id: string; children: ReactNode }) {
  const i = secciones.findIndex(([s]) => s === id);
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-bold tracking-tight">
        {i + 1}. {secciones[i][1]}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}
