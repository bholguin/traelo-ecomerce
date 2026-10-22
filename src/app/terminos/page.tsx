import type { Metadata } from "next";
import Link from "next/link";
import { Dato, Indice, LegalHeader, Resumen, Seccion } from "@/components/Legal";
import { LEGAL } from "@/config/legal";
import { APP_NAME } from "@/lib/brand";

// BORRADOR basado en la Ley 1480 de 2011 (Estatuto del Consumidor), la Ley 527 de
// 1999 (comercio electrónico) y la Ley 1581 de 2012 (datos personales), adaptado al
// modelo de la tienda: producto contra entrega y envío pagado al confirmar.
// DEBE revisarlo un abogado antes de lanzar. Los datos de la tienda van en
// src/config/legal.ts; los que falten se ven resaltados como "Por definir".

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de compra en ${APP_NAME}: pago del producto contra entrega, envío, retracto, garantía y datos personales.`,
};


const SECCIONES = [
  ["quienes-somos", "Quiénes somos"],
  ["aceptacion", "Aceptación de estos términos"],
  ["como-comprar", "Cómo funciona la compra"],
  ["precios", "Precios y disponibilidad"],
  ["pagos", "Pagos"],
  ["envios", "Envíos y entregas"],
  ["rechazo", "Si no recibes el pedido"],
  ["retracto", "Derecho de retracto"],
  ["garantia", "Garantía"],
  ["reversion", "Reversión del pago"],
  ["datos", "Datos personales"],
  ["contenido", "Imágenes y contenido"],
  ["atencion", "Atención al cliente y quejas"],
  ["cambios", "Cambios y ley aplicable"],
] as const;


export default function TerminosPage() {
  const contacto = (
    <>
      el correo <Dato valor={LEGAL.correo} falta="correo de atención" /> o el WhatsApp{" "}
      <Dato valor={LEGAL.whatsapp} falta="celular de atención" />
    </>
  );

  return (
    <article className="mx-auto max-w-3xl">
      <LegalHeader title="Términos y condiciones" actualizado={LEGAL.actualizado} />

      <Resumen>
        <li>El producto lo pagas en efectivo cuando te llega.</li>
        <li>El envío lo pagas al confirmar el pedido, y su valor depende de tu destino.</li>
        <li>Tienes 5 días hábiles desde que recibes el producto para retractarte de la compra.</li>
        <li>Los productos tienen garantía legal de calidad, idoneidad y seguridad.</li>
        <li>Usamos tus datos solo para gestionar y entregar tu pedido.</li>
      </Resumen>

      <Indice secciones={SECCIONES} />

      <div className="mt-10 space-y-10">
        <Seccion secciones={SECCIONES} id="quienes-somos">
          <p>
            {APP_NAME} es una tienda en línea que vende productos con entrega en toda Colombia. El responsable de la
            tienda es <Dato valor={LEGAL.responsable} falta="nombre o razón social" />, identificado con{" "}
            <Dato valor={LEGAL.identificacion} falta="NIT o cédula" />, con domicilio en{" "}
            <Dato valor={LEGAL.direccion} falta="dirección" />, <Dato valor={LEGAL.ciudad} falta="ciudad" />.
          </p>
          <p>Puedes contactarnos por {contacto}.</p>
          <p>
            Los productos se despachan a través de una red de proveedores y operadores logísticos aliados, que preparan y
            transportan tu pedido hasta la dirección que nos indiques.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="aceptacion">
          <p>
            Al hacer un pedido en {APP_NAME} aceptas estos términos y condiciones. Si no estás de acuerdo con alguno de
            ellos, te pedimos no hacer pedidos. Para comprar debes ser mayor de edad o contar con la autorización de tu
            representante legal.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="como-comprar">
          <p>
            Eliges los productos, los agregas al carrito y confirmas el pedido con tu nombre, celular y dirección de
            entrega. Debes revisar que esos datos sean correctos y completos: son los que usamos para contactarte y
            entregarte.
          </p>
          <p>
            Puedes armar y confirmar el pedido aunque no tengas señal. En ese caso el pedido queda guardado en tu
            celular y se envía automáticamente cuando vuelva la conexión. Lo recibimos cuando, en{" "}
            <Link href="/pedidos" className="underline">
              Mis pedidos
            </Link>
            , aparece con estado &ldquo;Recibido&rdquo; y un número de pedido. Mientras siga &ldquo;Guardado, esperando
            señal&rdquo;, todavía no nos ha llegado.
          </p>
          <p>
            Al recibir el pedido verificamos el precio y la disponibilidad de cada producto. Si algo cambió (por
            ejemplo, el producto se agotó o su precio cambió), no procesamos el pedido y te lo indicamos en Mis pedidos
            para que lo revises antes de volver a enviarlo.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="precios">
          <p>
            Los precios están en pesos colombianos (COP) e incluyen los impuestos aplicables. El precio que pagas es el
            que se muestra al confirmar el pedido. El valor del envío se informa por separado.
          </p>
          <p>
            Los productos están sujetos a disponibilidad. Si después de recibir tu pedido un producto no puede
            despacharse, te contactaremos para ofrecerte una alternativa o cancelar el pedido, y te devolveremos lo
            que hayas pagado por él.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="pagos">
          <p>
            <strong>Producto:</strong> lo pagas en efectivo al transportador en el momento de la entrega (pago contra
            entrega).
          </p>
          <p>
            <strong>Envío:</strong> lo pagas al confirmar el pedido. Su valor depende del departamento y la ciudad de
            destino, y se muestra antes de que confirmes. Si para tu destino aparece &ldquo;Por confirmar&rdquo;, te
            informamos el valor antes de cobrarlo. Mientras habilitamos el pago en línea, te contactamos al celular que
            registraste para coordinar el pago del envío.
          </p>
          <p>Tu pedido se despacha cuando confirmamos el pago del envío.</p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="envios">
          <p>
            Hacemos envíos a toda Colombia, según la cobertura de los operadores logísticos. El tiempo estimado de
            entrega es de <Dato valor={LEGAL.tiempoEntrega} falta="tiempo estimado de entrega" />, contado desde que
            confirmamos el pago del envío. Es un tiempo estimado: puede variar por la ubicación, el clima, el orden
            público u otras situaciones ajenas a nosotros.
          </p>
          <p>
            Al recibir el pedido, revisa que el paquete esté en buen estado antes de pagar. Si notas daños, déjalo
            anotado con el transportador y escríbenos.
          </p>
          <p>
            Si la entrega no se puede hacer porque la dirección es incorrecta o incompleta, o porque nadie recibe el
            pedido, el transportador puede intentarlo de nuevo o devolverlo, y nos comunicaremos contigo.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="rechazo">
          <p>
            Si rechazas el pedido en el momento de la entrega, no pagas el valor del producto.{" "}
            <Dato valor={LEGAL.rechazoEnPuerta} falta="qué pasa con el valor del envío pagado (definir con abogado)" />
          </p>
          <p>
            Esto no afecta tu derecho de retracto ni la garantía, que se explican en las secciones siguientes.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="retracto">
          <p>
            Como la compra es a distancia, tienes derecho a retractarte, es decir, a deshacer la compra, dentro de los{" "}
            <strong>cinco (5) días hábiles</strong> siguientes a la entrega del producto, como lo establece el artículo 47
            de la Ley 1480 de 2011.
          </p>
          <p>Para ejercerlo:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Escríbenos por {contacto} dentro de ese plazo, con tu número de pedido.
            </li>
            <li>
              Devuelve el producto por los mismos medios y en las mismas condiciones en que lo recibiste: sin usar, con
              sus empaques, accesorios y etiquetas.
            </li>
            <li>Los costos de transporte de la devolución corren por tu cuenta.</li>
          </ul>
          <p>
            Cuando recibamos el producto, te devolvemos en dinero todas las sumas que hayas pagado, sin descuentos ni
            retenciones, a más tardar dentro de los quince (15) días calendario siguientes al ejercicio del retracto.
          </p>
          <p>
            Según la ley, el retracto no aplica, entre otros casos, a bienes de uso personal, bienes perecederos, bienes
            confeccionados o personalizados según tus especificaciones, ni a bienes que por su naturaleza no puedan
            devolverse o se deterioren con rapidez. Si un producto no admite retracto, lo indicaremos en su ficha.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="garantia">
          <p>
            Todos los productos tienen la garantía legal de calidad, idoneidad y seguridad que establece la Ley 1480 de
            2011. El término de la garantía es el indicado en la ficha de cada producto; si no se indica, aplica el
            término previsto en la ley. Corre desde la entrega del producto.
          </p>
          <p>
            Si el producto presenta un defecto, escríbenos por {contacto} con tu número de pedido, una descripción del
            problema y fotos o un video. Según el caso, y como lo establece la ley, la garantía se cumple con la
            reparación del producto, su cambio por otro igual o la devolución del dinero.
          </p>
          <p>
            La garantía no cubre daños causados por mal uso, por no seguir las instrucciones del producto, por
            accidentes o por reparaciones hechas por terceros.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="reversion">
          <p>
            Cuando el envío se pague por un medio de pago electrónico, puedes solicitar la reversión del pago en los
            casos y plazos previstos en el artículo 51 de la Ley 1480 de 2011, por ejemplo si fuiste víctima de fraude o
            si el pedido no te fue entregado.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="datos">
          <p>
            Para gestionar tu pedido recolectamos tu nombre, celular, dirección y, si lo das, tu correo. Los usamos para
            procesar, despachar y entregar el pedido, coordinar el pago del envío y atender tus solicitudes. Los
            compartimos solo con los proveedores y operadores logísticos que intervienen en la entrega.
          </p>
          <p>
            Tus pedidos y tu carrito también se guardan en tu celular, para que la tienda funcione sin conexión; puedes
            borrarlos borrando los datos del sitio en tu navegador.
          </p>
          <p>
            Tratamos tus datos según la Ley 1581 de 2012. Puedes conocer, actualizar, rectificar o pedir que eliminemos
            tus datos escribiéndonos por {contacto}. Los detalles están en nuestra{" "}
            <Link href="/privacidad" className="underline">
              política de tratamiento de datos personales
            </Link>
            .
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="contenido">
          <p>
            Las fotos de los productos son ilustrativas y pueden presentar pequeñas diferencias de color o empaque con el
            producto real. Las marcas, textos e imágenes del sitio pertenecen a {APP_NAME} o a sus titulares, y no
            pueden usarse sin autorización.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="atencion">
          <p>
            Puedes enviarnos peticiones, quejas o reclamos por {contacto}. Te responderemos dentro de los términos que
            establece la ley.
          </p>
          <p>
            Si no estás conforme con la respuesta, puedes acudir a la Superintendencia de Industria y Comercio (SIC),
            autoridad de protección al consumidor en Colombia.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="cambios">
          <p>
            Podemos actualizar estos términos. La versión vigente es la publicada en esta página, con su fecha de
            actualización, y aplica a los pedidos hechos a partir de esa fecha.
          </p>
          <p>Estos términos se rigen por las leyes de la República de Colombia.</p>
        </Seccion>
      </div>
    </article>
  );
}
