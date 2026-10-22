const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (value: number) => cop.format(value);

export const formatDate = (ms: number) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(ms);
