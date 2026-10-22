import { slugify } from "./format";
import type { Product } from "./types";

// Catálogo de prueba. Se usa solo cuando WC_URL no está configurado,
// para poder desarrollar la PWA antes de tener WooCommerce + Dropi conectados.
const DEMO: Omit<Product, "slug">[] = [
  {
    id: 1001,
    name: "Audífonos inalámbricos Pro",
    description: "Bluetooth 5.3, estuche de carga y hasta 24 horas de batería.",
    price: 89900,
    regularPrice: 119900,
    images: [],
    categories: ["Tecnología"],
    inStock: true,
    stock: 40,
  },
  {
    id: 1002,
    name: "Reloj inteligente deportivo",
    description: "Monitor de ritmo cardíaco, pasos y notificaciones del celular.",
    price: 129900,
    images: [],
    categories: ["Tecnología"],
    inStock: true,
    stock: 18,
  },
  {
    id: 1003,
    name: "Lámpara LED de escritorio",
    description: "Tres tonos de luz, brazo flexible y puerto USB.",
    price: 64900,
    images: [],
    categories: ["Hogar"],
    inStock: true,
    stock: 25,
  },
  {
    id: 1004,
    name: "Organizador de cocina 3 niveles",
    description: "Metal resistente, ideal para especias y frascos.",
    price: 49900,
    regularPrice: 59900,
    images: [],
    categories: ["Hogar"],
    inStock: true,
    stock: 12,
  },
  {
    id: 1005,
    name: "Masajeador cervical eléctrico",
    description: "Calor suave y cinco modos de intensidad.",
    price: 99900,
    images: [],
    categories: ["Bienestar"],
    inStock: false,
    stock: 0,
  },
  {
    id: 1006,
    name: "Botella térmica 1 litro",
    description: "Acero inoxidable, mantiene frío 24 h y caliente 12 h.",
    price: 39900,
    images: [],
    categories: ["Bienestar"],
    inStock: true,
    stock: 60,
  },
];

export const DEMO_PRODUCTS: Product[] = DEMO.map((p) => ({ ...p, slug: slugify(p.name) }));
