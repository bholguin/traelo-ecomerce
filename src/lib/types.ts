export type Product = {
  id: number;
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

export type OrderStatus =
  | "pendiente" // guardado en el dispositivo, sin enviar
  | "enviando"
  | "enviado" // creado en WooCommerce
  | "revision" // error de negocio: requiere revisión
  | "error"; // error de red, se reintenta

export type QueuedOrder = {
  clientOrderId: string;
  createdAt: number;
  status: OrderStatus;
  items: CartItem[];
  customer: Customer;
  total: number;
  attempts: number;
  nextAttemptAt: number;
  remoteId?: number;
  remoteStatus?: string; // estado en WooCommerce ("processing", "completed"…), solo si status = "enviado"
  remoteCheckedAt?: number;
  message?: string;
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
};

export type OrderResponse =
  | { ok: true; orderId: number; total: number; duplicated?: boolean; demo?: boolean }
  | { ok: false; kind: "validation" | "business"; message: string };
