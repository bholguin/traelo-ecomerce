import { TARIFAS_ENVIO } from "@/config/envios";

// Modelo de pago: el PRODUCTO se paga contra entrega (efectivo al recibir) y el
// ENVÍO se paga al confirmar el pedido. El envío depende del destino. Mientras no
// haya pasarela de pagos, su cobro se coordina con el cliente y el pedido queda
// "En espera" en Woo.
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
