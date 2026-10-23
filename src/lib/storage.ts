"use client";

import { useSyncExternalStore } from "react";
import type { CartItem, Order, Product } from "./types";

// Carrito y "Mis pedidos" viven en localStorage: no hay cuentas de cliente, así
// que el historial es del dispositivo. Los hooks usan useSyncExternalStore y se
// actualizan entre pestañas con el evento "storage".

const CART_KEY = "tienda:carrito";
const ORDERS_KEY = "tienda:pedidos";

const EMPTY_CART: CartItem[] = [];
const EMPTY_ORDERS: Order[] = [];

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CART_KEY || e.key === ORDERS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// useSyncExternalStore exige la misma referencia mientras el dato no cambie:
// se guarda el último texto leído y su valor ya convertido.
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    // Almacenamiento bloqueado: se trabaja como si estuviera vacío.
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    // Dato dañado: se descarta.
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin espacio o almacenamiento bloqueado: no hay dónde guardar.
  }
  notify();
}

const getCart = () => read(CART_KEY, EMPTY_CART);
const getOrders = () => read(ORDERS_KEY, EMPTY_ORDERS);

// ---------- Hooks ----------

// undefined en el servidor y antes de hidratar: las páginas muestran "Cargando…".
export const useCart = () => useSyncExternalStore(subscribe, getCart, () => undefined);

export const useCartCount = () =>
  useSyncExternalStore(
    subscribe,
    () => getCart().reduce((n, i) => n + i.quantity, 0),
    () => 0,
  );

export const useOrders = () => useSyncExternalStore(subscribe, getOrders, () => undefined);

// ---------- Carrito ----------

export function addToCart(p: Product, quantity = 1) {
  const cart = getCart();
  const current = cart.find((i) => i.productId === p.id);
  const item: CartItem = {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.images[0],
    quantity: (current?.quantity ?? 0) + quantity,
  };
  write(CART_KEY, current ? cart.map((i) => (i.productId === p.id ? item : i)) : [...cart, item]);
}

export function setCartQuantity(productId: number, quantity: number) {
  const cart = getCart();
  write(
    CART_KEY,
    quantity <= 0
      ? cart.filter((i) => i.productId !== productId)
      : cart.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
  );
}

export const clearCart = () => write(CART_KEY, []);

export const readCart = getCart;

// ---------- Pedidos ----------

export const readOrders = getOrders;

// Guarda un pedido nuevo (el más reciente va primero) o reemplaza uno existente.
export function saveOrder(order: Order) {
  write(ORDERS_KEY, [order, ...getOrders().filter((o) => o.clientOrderId !== order.clientOrderId)]);
}

export function updateOrders(patches: Map<string, Partial<Order>>) {
  if (patches.size === 0) return;
  write(
    ORDERS_KEY,
    getOrders().map((o) => (patches.has(o.clientOrderId) ? { ...o, ...patches.get(o.clientOrderId) } : o)),
  );
}
