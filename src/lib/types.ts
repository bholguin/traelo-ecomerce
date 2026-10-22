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
  | "enviado" // creado en Dropi
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
  message?: string;
};

export type OrderPayload = {
  clientOrderId: string;
  items: { productId: number; quantity: number; price: number }[];
  customer: Customer;
};

export type OrderResponse =
  | { ok: true; orderId: number; total: number; duplicated?: boolean; demo?: boolean }
  | { ok: false; kind: "validation" | "business"; message: string };
