import { Catalog } from "@/components/Catalog";

export default function Home() {
  return (
    <>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Paga cuando te llegue</h1>
        <p className="mt-1 text-muted">Envío a toda Colombia con pago contra entrega.</p>
      </section>
      <Catalog />
    </>
  );
}
