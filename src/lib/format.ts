import type { Product } from "./types";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (value: number) => cop.format(value);

export const formatDate = (ms: number) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(ms);

// Porcentaje de descuento frente al precio "antes"; 0 si no hay.
export const discountOf = (p: Pick<Product, "price" | "regularPrice">) =>
  p.regularPrice && p.regularPrice > p.price ? Math.round((1 - p.price / p.regularPrice) * 100) : 0;
