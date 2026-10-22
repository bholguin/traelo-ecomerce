// Tarifas de envío por destino, en COP. AÚN NO DEFINIDAS.
//
// Mientras no haya tarifa para un destino, el envío aparece "Por confirmar" y se
// coordina con el cliente después del pedido. Prioridad: ciudad → departamento →
// por defecto. Al cambiar algo aquí hay que volver a desplegar.
//
// Ejemplo:
//   porDefecto: 18000,
//   porDepartamento: { Antioquia: 12000, "Bogotá D.C.": 10000 },
//   porCiudad: { "Antioquia/medellin": 9000 },
//
// - Departamento: el nombre exacto de la lista del checkout (src/lib/colombia.ts).
// - Ciudad: "Departamento/ciudad", con la ciudad en minúsculas y sin tildes. El
//   cliente la escribe a mano, así que solo coincide si la escribe igual; para
//   tarifas por ciudad conviene un selector de municipios en el checkout.
//
// Si más adelante las tarifas salen de Dropi o de una transportadora, se
// reemplaza costoEnvio() en src/lib/envio.ts y esta tabla deja de usarse.
export const TARIFAS_ENVIO: {
  porDefecto: number | null;
  porDepartamento: Record<string, number>;
  porCiudad: Record<string, number>;
} = {
  porDefecto: null,
  porDepartamento: {},
  porCiudad: {},
};
