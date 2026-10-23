"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { CashIcon, OfflineIcon, TruckIcon } from "@/components/Icons";
import { envioLabel, notaPagoEnvio, PagoResumen } from "@/components/PagoResumen";
import { ProductImage } from "@/components/ProductImage";
import { DEPARTAMENTOS } from "@/lib/colombia";
import { costoEnvio } from "@/lib/envio";
import { formatCOP } from "@/lib/format";
import { useCart, useOnline } from "@/lib/hooks";
import { enqueueOrder } from "@/lib/sync";
import type { Customer } from "@/lib/types";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  department: string;
  city: string;
  address: string;
  notes: string;
};

const DEFAULTS: CheckoutForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  department: "",
  city: "",
  address: "",
  notes: "",
};

// Mismas reglas que valida /api/pedidos (largos máximos, celular de 10 dígitos que
// empieza por 3): así el servidor no rechaza lo que el formulario dejó pasar.
const requerido = (campo: string, max = 120) => ({
  required: `Escribe ${campo}.`,
  validate: (v: string) => v.trim() !== "" || `Escribe ${campo}.`,
  maxLength: { value: max, message: `Máximo ${max} caracteres.` },
});

const field =
  "h-12 w-full rounded-2xl border border-line bg-card px-4 outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5 aria-invalid:border-bad aria-invalid:focus:ring-bad/10";

function Field({
  id,
  label,
  error,
  children,
  wide,
}: {
  id: keyof CheckoutForm;
  label: string;
  error?: FieldError;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error?.message && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-bad">
          {error.message}
        </p>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-line bg-card/60 p-4 sm:p-5">
      <legend className="flex items-center gap-2 px-1 font-display text-lg font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-ink text-sm text-surface">{n}</span>
        {title}
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const online = useOnline();
  const router = useRouter();
  // Se queda en true al guardar: el carrito se vacía y, sin esto, el efecto de
  // abajo mandaría al carrito vacío antes de llegar a Mis pedidos.
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CheckoutForm>({ mode: "onTouched", defaultValues: DEFAULTS });

  // El envío depende del destino: se recalcula al elegir departamento y ciudad.
  const [department, city] = useWatch({ control, name: ["department", "city"] });
  const envio = department ? costoEnvio(department, city) : undefined;

  const empty = cart !== undefined && cart.length === 0 && !sending;
  useEffect(() => {
    if (empty) router.replace("/carrito");
  }, [empty, router]);

  if (cart === undefined || cart.length === 0) return <p className="py-16 text-center text-muted">Cargando…</p>;
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // Atributos de accesibilidad de cada campo según su error.
  const a11y = (name: keyof CheckoutForm) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  async function onSubmit(v: CheckoutForm) {
    const customer: Customer = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phone: v.phone.replace(/\D/g, ""),
      email: v.email.trim() || undefined,
      department: v.department,
      city: v.city.trim(),
      address: v.address.trim(),
      notes: v.notes.trim() || undefined,
    };
    setSending(true);
    try {
      const order = await enqueueOrder(customer);
      router.push(`/pedidos?nuevo=${order.clientOrderId}`);
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "No se pudo guardar el pedido" });
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Finalizar pedido</h1>
      <p className="mt-1 text-sm text-muted">Solo te pedimos lo necesario para entregarte.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        {/* noValidate: los mensajes los muestra react-hook-form, no las burbujas del navegador */}
        <form id="checkout" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Step n={1} title="¿Quién recibe?">
            <Field id="firstName" label="Nombre" error={errors.firstName}>
              <input
                {...register("firstName", requerido("tu nombre"))}
                {...a11y("firstName")}
                autoComplete="given-name"
                className={field}
              />
            </Field>
            <Field id="lastName" label="Apellido" error={errors.lastName}>
              <input
                {...register("lastName", requerido("tu apellido"))}
                {...a11y("lastName")}
                autoComplete="family-name"
                className={field}
              />
            </Field>
            <Field id="phone" label="Celular" error={errors.phone} wide>
              <input
                {...register("phone", {
                  required: "Escribe tu celular.",
                  validate: (v) =>
                    /^3\d{9}$/.test(v.replace(/\D/g, "")) || "Escribe un celular de 10 dígitos que empiece por 3.",
                })}
                {...a11y("phone")}
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                autoComplete="tel-national"
                className={field}
              />
            </Field>
            <Field id="email" label="Correo (opcional)" error={errors.email} wide>
              <input
                {...register("email", {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Revisa el correo: parece incompleto." },
                })}
                {...a11y("email")}
                type="email"
                autoComplete="email"
                className={field}
              />
            </Field>
          </Step>

          <Step n={2} title="¿Dónde lo entregamos?">
            <Field id="department" label="Departamento" error={errors.department}>
              <select
                {...register("department", { required: "Elige el departamento." })}
                {...a11y("department")}
                className={field}
              >
                <option value="" disabled>
                  Elige uno
                </option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field id="city" label="Ciudad o municipio" error={errors.city}>
              <input
                {...register("city", requerido("la ciudad o municipio"))}
                {...a11y("city")}
                autoComplete="address-level2"
                className={field}
              />
            </Field>
            <Field id="address" label="Dirección completa y barrio" error={errors.address} wide>
              <input
                {...register("address", requerido("la dirección", 250))}
                {...a11y("address")}
                autoComplete="street-address"
                className={field}
              />
            </Field>
            <Field id="notes" label="Indicaciones para la entrega (opcional)" error={errors.notes} wide>
              <textarea
                {...register("notes", { maxLength: { value: 500, message: "Máximo 500 caracteres." } })}
                {...a11y("notes")}
                rows={2}
                placeholder="Torre, apartamento, punto de referencia…"
                className={`${field} h-auto py-3`}
              />
            </Field>
          </Step>

          <Step n={3} title="Pago">
            <div className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-card p-4 sm:col-span-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-lime">
                <TruckIcon />
              </span>
              <span className="flex-1">
                <span className="flex justify-between gap-2 font-semibold">
                  Envío: lo pagas al confirmar
                  <span className="text-right tabular-nums">{envioLabel(envio)}</span>
                </span>
                {/* Cuando exista la pasarela de pagos, aquí va el pago en línea del envío. */}
                <span className="block text-sm text-muted">
                  {envio === undefined ? "Elige el departamento para calcularlo." : notaPagoEnvio(envio)}
                </span>
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 sm:col-span-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                <CashIcon />
              </span>
              <span className="flex-1">
                <span className="flex justify-between gap-2 font-semibold">
                  Productos: contra entrega
                  <span className="tabular-nums">{formatCOP(total)}</span>
                </span>
                <span className="block text-sm text-muted">Los pagas en efectivo cuando recibes el pedido.</span>
              </span>
            </div>
          </Step>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-line bg-card p-4">
            <h2 className="font-display font-bold">Tu pedido</h2>
            <ul className="mt-3 space-y-3">
              {cart.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-soft">
                    <ProductImage src={i.image} name={i.name} id={i.productId} />
                  </span>
                  <span className="line-clamp-2 flex-1">
                    <span className="font-semibold">{i.quantity}×</span> {i.name}
                  </span>
                  <span className="tabular-nums">{formatCOP(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <PagoResumen productos={total} envio={envio} />
            </div>
          </div>

          {!online && (
            <p className="flex gap-3 rounded-3xl bg-soft p-4 text-sm">
              <OfflineIcon className="mt-0.5 shrink-0" />
              Estás sin señal. Tu pedido se guarda en el celular y se envía solo cuando vuelva la conexión. Después
              coordinamos contigo el pago del envío.
            </p>
          )}

          {errors.root?.message && (
            <p role="alert" className="rounded-2xl bg-bad/10 p-3 text-sm font-medium text-bad">
              {errors.root.message}
            </p>
          )}

          <button
            form="checkout"
            disabled={sending}
            className="flex h-14 w-full items-center justify-between rounded-full bg-ink px-6 font-semibold text-surface transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <span>{sending ? "Guardando…" : online ? "Confirmar pedido" : "Guardar pedido"}</span>
            <span className="font-display tabular-nums">{formatCOP(total + (envio ?? 0))}</span>
          </button>
          <p className="text-center text-xs text-muted">
            Al confirmar aceptas los{" "}
            <Link href="/terminos" target="_blank" className="underline">
              términos y condiciones
            </Link>{" "}
            y autorizas el tratamiento de tus datos según la{" "}
            <Link href="/privacidad" target="_blank" className="underline">
              política de datos
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
