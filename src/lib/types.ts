export type Product = {
  id: number;
  slug: string; // URL pública: /p/{slug}
  name: string;
  description: string;
  price: number; // COP, entero
  regularPrice?: number;
  images: string[];
  categories: string[];
  inStock: boolean;
  stock?: number | null;
};

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

export type Customer = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  department: string;
  city: string;
  address: string;
  notes?: string;
};

// Pedido ya creado en WooCommerce, guardado en el dispositivo para "Mis pedidos".
export type Order = {
  clientOrderId: string;
  remoteId: number; // número del pedido en WooCommerce (0 en modo demo)
  createdAt: number;
  items: CartItem[];
  customer: Customer;
  total: number; // valor de los productos: se paga contra entrega
  shipping: number | null; // envío, se paga al confirmar; null = por confirmar
  remoteStatus?: string; // estado en WooCommerce ("on-hold", "processing"…)
  remoteCheckedAt?: number;
  demo?: boolean;
};

// Estados de WooCommerce que ya no cambian: no se vuelven a consultar.
export const FINAL_REMOTE_STATUSES = ["completed", "cancelled", "refunded", "failed", "trash"];

export type OrderStatusResponse =
  | { ok: true; statuses: Record<number, string>; demo?: boolean }
  | { ok: false; message: string };

export type OrderPayload = {
  clientOrderId: string;
  items: { productId: number; quantity: number; price: number }[];
  customer: Customer;
  shipping?: number | null; // el valor de envío que el cliente vio y aceptó
};

export type OrderResponse =
  | { ok: true; orderId: number; total: number; shipping: number | null; duplicated?: boolean; demo?: boolean }
  | { ok: false; kind: "validation" | "business"; message: string };

// Pago del envío con Wompi (POST /api/pagos): URL del checkout de Wompi.
export type PaymentResponse = { ok: true; url: string } | { ok: false; message: string };

// Resultado de un pago al volver de Wompi (POST /api/pagos/estado).
export type PaymentStatusResponse =
  | { ok: true; status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING"; orderId: number }
  | { ok: false; message: string };
