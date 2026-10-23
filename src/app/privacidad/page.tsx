import type { Metadata } from "next";
import Link from "next/link";
import { Dato, Indice, LegalHeader, Resumen, Seccion } from "@/components/Legal";
import { LEGAL } from "@/config/legal";
import { APP_NAME } from "@/lib/brand";

// BORRADOR de la política de tratamiento de datos personales según la Ley 1581 de
// 2012 y su decreto reglamentario (Decreto 1377 de 2013, compilado en el Decreto
// 1074 de 2015). DEBE revisarlo un abogado antes de lanzar. Los datos de la tienda
// van en src/config/legal.ts; los que falten se ven resaltados como "Por definir".
// Si cambias qué datos se piden en el checkout o a quién se envían, actualiza esta página.

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: `Cómo ${APP_NAME} recolecta, usa y protege tus datos personales, y cómo ejercer tus derechos.`,
};

const SECCIONES = [
  ["responsable", "Responsable del tratamiento"],
  ["marco", "Marco legal y alcance"],
  ["datos", "Qué datos recolectamos"],
  ["finalidades", "Para qué usamos tus datos"],
  ["autorizacion", "Tu autorización"],
  ["compartir", "Con quién compartimos tus datos"],
  ["celular", "Datos guardados en tu celular"],
  ["derechos", "Tus derechos"],
  ["ejercer", "Cómo ejercer tus derechos"],
  ["seguridad", "Seguridad"],
  ["conservacion", "Cuánto tiempo conservamos tus datos"],
  ["vigencia", "Vigencia y cambios"],
] as const;

export default function PrivacidadPage() {
  const contacto = (
    <>
      el correo <Dato valor={LEGAL.correo} falta="correo de atención" /> o el WhatsApp{" "}
      <Dato valor={LEGAL.whatsapp} falta="celular de atención" />
    </>
  );

  return (
    <article className="mx-auto max-w-3xl">
      <LegalHeader title="Política de tratamiento de datos personales" actualizado={LEGAL.actualizado} />

      <Resumen>
        <li>Solo pedimos los datos necesarios para entregarte el pedido: nombre, celular y dirección (el correo es opcional).</li>
        <li>Los usamos para procesar, despachar y entregar tu pedido, y para atenderte.</li>
        <li>Los compartimos solo con quienes intervienen en la entrega y con nuestros proveedores tecnológicos.</li>
        <li>No los usamos para publicidad sin tu autorización expresa.</li>
        <li>Puedes conocerlos, corregirlos o pedir que los eliminemos cuando quieras.</li>
      </Resumen>

      <Indice secciones={SECCIONES} />

      <div className="mt-10 space-y-10">
        <Seccion secciones={SECCIONES} id="responsable">
          <p>
            El responsable del tratamiento de tus datos personales es{" "}
            <Dato valor={LEGAL.responsable} falta="nombre o razón social" />, identificado con{" "}
            <Dato valor={LEGAL.identificacion} falta="NIT o cédula" />, con domicilio en{" "}
            <Dato valor={LEGAL.direccion} falta="dirección" />, <Dato valor={LEGAL.ciudad} falta="ciudad" />, quien opera
            la tienda {APP_NAME}.
          </p>
          <p>Para cualquier asunto relacionado con tus datos personales puedes contactarnos por {contacto}.</p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="marco">
          <p>
            Esta política cumple la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y
            las demás normas colombianas sobre protección de datos personales. Aplica a los datos que recolectamos a
            través de la tienda {APP_NAME} y de nuestros canales de atención.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="datos">
          <p>Cuando haces un pedido recolectamos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Nombre y apellido.</li>
            <li>Número de celular.</li>
            <li>Correo electrónico, si decides darlo.</li>
            <li>Dirección de entrega: departamento, ciudad o municipio, dirección, barrio e indicaciones.</li>
            <li>Los datos del pedido: productos, cantidades, valores y fecha.</li>
          </ul>
          <p>
            Como cualquier sitio web, nuestros proveedores de alojamiento registran datos técnicos básicos de las
            visitas, como la dirección IP y el tipo de navegador, para operar y proteger el servicio.
          </p>
          <p>
            No pedimos datos sensibles (como datos de salud, origen étnico u orientación política) ni datos de pago con
            tarjeta. La tienda no está dirigida a menores de edad.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="finalidades">
          <p>Usamos tus datos para:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Recibir, verificar y procesar tu pedido.</li>
            <li>Despachar y entregar el pedido en la dirección que nos indicaste.</li>
            <li>Contactarte para confirmar el pedido, coordinar el pago del envío o resolver novedades de la entrega.</li>
            <li>Mostrarte el estado de tus pedidos.</li>
            <li>Atender peticiones, quejas, reclamos, solicitudes de retracto y garantías.</li>
            <li>Prevenir pedidos falsos o fraudulentos.</li>
            <li>Cumplir obligaciones legales, contables y tributarias.</li>
          </ul>
          <p>
            No usamos tus datos para enviarte publicidad sin tu autorización expresa, que te pediríamos por separado.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="autorizacion">
          <p>
            Al confirmar un pedido nos autorizas a tratar tus datos para las finalidades de esta política. Antes de
            confirmar te mostramos el enlace a esta política. Puedes revocar tu autorización en cualquier momento,
            salvo cuando debamos conservar los datos por un deber legal o contractual, por ejemplo mientras el pedido
            esté en curso.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="compartir">
          <p>Compartimos tus datos solo en la medida necesaria para cumplir las finalidades anteriores, con:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Los proveedores de los productos y los operadores logísticos y transportadores que preparan y entregan tu
              pedido. Reciben tu nombre, celular, dirección y los datos del pedido.
            </li>
            <li>
              Wompi, la pasarela con la que pagas el envío en línea. Recibe tu nombre, celular, correo (si lo diste) y
              el valor del pago. Los datos de tu medio de pago los pide y los trata Wompi directamente, según su
              propia política.
            </li>
            <li>
              Nuestros proveedores tecnológicos (alojamiento del sitio y gestión de pedidos), que tratan los datos por
              cuenta nuestra y bajo nuestras instrucciones. Algunos pueden tener sus servidores fuera de Colombia; en
              esos casos exigimos que protejan tus datos según la ley colombiana.
            </li>
            <li>Las autoridades, cuando una norma o una orden lo exija.</li>
          </ul>
          <p>No vendemos ni alquilamos tus datos personales.</p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="celular">
          <p>
            Como no hay cuentas de cliente, tu carrito y tus pedidos se guardan en tu celular, en el almacenamiento del
            navegador, para que puedas verlos y seguirlos. El carrito no nos llega hasta que confirmas el pedido.
          </p>
          <p>
            Puedes borrar esa información cuando quieras eliminando los datos del sitio en la configuración de tu
            navegador. Tus pedidos no se cancelan: solo dejas de verlos en Mis pedidos.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="derechos">
          <p>Como titular de tus datos tienes derecho a:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización que nos diste.</li>
            <li>Ser informado sobre el uso que les damos.</li>
            <li>
              Revocar la autorización o pedir que eliminemos tus datos, cuando no exista un deber legal o contractual
              de conservarlos.
            </li>
            <li>Acceder gratuitamente a tus datos.</li>
            <li>
              Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de haber hecho tu
              consulta o reclamo ante nosotros.
            </li>
          </ul>
        </Seccion>

        <Seccion secciones={SECCIONES} id="ejercer">
          <p>
            Escríbenos por {contacto} indicando tu nombre, tu número de celular o de pedido, y qué quieres hacer. Para
            proteger tus datos, podemos pedirte información que nos permita verificar tu identidad.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Consultas</strong> (conocer qué datos tenemos y cómo los usamos): respondemos en máximo diez (10)
              días hábiles. Si no es posible en ese plazo, te informaremos el motivo y la nueva fecha, que no superará
              cinco (5) días hábiles adicionales.
            </li>
            <li>
              <strong>Reclamos</strong> (corregir, actualizar o eliminar datos, revocar la autorización o denunciar un
              incumplimiento): respondemos en máximo quince (15) días hábiles. Si no es posible en ese plazo, te
              informaremos el motivo y la nueva fecha, que no superará ocho (8) días hábiles adicionales. Si al reclamo
              le falta información, te la pediremos dentro de los cinco (5) días siguientes; si pasan dos (2) meses sin
              recibirla, entenderemos que desististe del reclamo.
            </li>
          </ul>
        </Seccion>

        <Seccion secciones={SECCIONES} id="seguridad">
          <p>
            Protegemos tus datos con medidas razonables: conexión cifrada (HTTPS), acceso restringido a los sistemas de
            pedidos y claves de acceso guardadas solo en nuestros servidores. Ningún sistema es completamente
            infalible; si ocurre un incidente que afecte tus datos, actuaremos según la ley.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="conservacion">
          <p>
            Conservamos tus datos mientras sean necesarios para las finalidades de esta política y durante el tiempo que
            exijan las normas legales, contables y tributarias. Después los eliminamos o los anonimizamos.
          </p>
        </Seccion>

        <Seccion secciones={SECCIONES} id="vigencia">
          <p>
            Esta política rige desde el {LEGAL.actualizado}. Si la cambiamos, publicaremos la nueva versión en esta
            página con su fecha; si el cambio es sustancial, te lo informaremos antes de aplicarlo.
          </p>
          <p>
            Consulta también nuestros{" "}
            <Link href="/terminos" className="underline">
              términos y condiciones
            </Link>
            .
          </p>
        </Seccion>
      </div>
    </article>
  );
}
