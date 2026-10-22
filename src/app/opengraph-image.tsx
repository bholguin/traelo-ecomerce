import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/brand";

// Imagen por defecto al compartir la tienda (WhatsApp, Facebook, X). Se genera en
// el build. Las fichas tendrán la foto del producto (Fase 2 del plan SEO).
export const alt = `${APP_NAME}: pago contra entrega en toda Colombia`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          color: "#fbf9f5",
          backgroundColor: "#1e1814",
          backgroundImage:
            "radial-gradient(circle at 88% 8%, rgba(240,89,43,0.85), transparent 45%), radial-gradient(circle at 100% 95%, rgba(224,35,79,0.7), transparent 45%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 900,
              color: "white",
              backgroundImage: "linear-gradient(135deg, #f0592b, #e0234f)",
            }}
          >
            {APP_NAME[0].toLowerCase()}
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3 }}>{APP_NAME.toLowerCase()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 56, fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>
          <span>Pídelo hoy.</span>
          <span style={{ color: "#c8ee3c" }}>Págalo en tu puerta.</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "rgba(251,249,245,0.75)" }}>
          Pago contra entrega · Envío a toda Colombia
        </div>
      </div>
    ),
    size,
  );
}
