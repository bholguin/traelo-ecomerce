import { TARIFAS_ENVIO } from "@/config/envios";

// Modelo de pago: el PRODUCTO se paga contra entrega (efectivo al recibir) y el
// ENVÍO se paga al confirmar el pedido. El envío depende del destino. El pedido
// queda "En espera" en Woo hasta que se paga el envío: en línea con Wompi si hay
// tarifa y Wompi está configurado; si no, coordinando con el cliente.
//
// Lo usan el checkout (cliente) y /api/pedidos (servidor) con la misma tabla:
// así el servidor valida que el cliente aceptó el mismo valor.

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * Valor del envío en COP para un destino, o null si no hay tarifa definida
 * (aparece "Por confirmar" y se coordina con el cliente).
 */
export function costoEnvio(departamento: string, ciudad = ""): number | null {
  if (!departamento) return null;
  const t = TARIFAS_ENVIO;
  return t.porCiudad[`${departamento}/${normalize(ciudad)}`] ?? t.porDepartamento[departamento] ?? t.porDefecto;
}

/**
 * true si el envío se paga en línea con Wompi: hay tarifa para el destino y la
 * llave pública de Wompi está configurada. Si no, el pago se coordina con el cliente.
 */
export const pagoEnLinea = (envio: number | null | undefined): envio is number =>
  Boolean(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) && typeof envio === "number" && envio > 0;
