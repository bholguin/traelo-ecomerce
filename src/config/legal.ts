// Datos legales de la tienda. Aparecen en /terminos. Los campos vacíos se muestran
// resaltados como "Por definir": hay que llenarlos ANTES de lanzar, y un abogado
// debe revisar el texto completo de src/app/terminos/page.tsx.
//
// La Ley 1480 de 2011 (Estatuto del Consumidor) exige que en comercio electrónico
// el cliente pueda identificar al vendedor y contactarlo.
export const LEGAL = {
  // Persona natural o empresa que vende: "Nombre Apellido" o "Mi Empresa S.A.S."
  responsable: "",
  // "NIT 900.123.456-7" o "C.C. 1.234.567.890"
  identificacion: "",
  direccion: "", // dirección física de notificación
  ciudad: "", // ciudad del domicilio
  correo: "", // correo de atención al cliente (PQR, retracto, garantías)
  whatsapp: "", // celular de atención, ej. "300 123 4567"
  // Tiempo estimado de entrega una vez confirmado el pago del envío.
  // Ej. "2 a 5 días hábiles en ciudades principales y hasta 8 días hábiles en el resto del país"
  tiempoEntrega: "",
  // DECISIÓN PENDIENTE (con abogado): qué pasa con el envío pagado si el cliente
  // rechaza el pedido en la puerta. Ej. "El valor del envío no se reembolsa, porque
  // cubre un servicio de transporte que ya se prestó." Ver la sección 7 de /terminos.
  rechazoEnPuerta: "",
  // Fecha de la versión vigente del texto.
  actualizado: "22 de octubre de 2026",
};
