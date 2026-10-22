"use client";

import Dexie, { type EntityTable } from "dexie";
import type { CartItem, Product, QueuedOrder } from "./types";

type Meta = { key: string; value: number | string };

class TiendaDB extends Dexie {
  products!: EntityTable<Product, "id">;
  cart!: EntityTable<CartItem, "productId">;
  orders!: EntityTable<QueuedOrder, "clientOrderId">;
  meta!: EntityTable<Meta, "key">;

  constructor() {
    super("tienda-dropi");
    this.version(1).stores({
      products: "id, name, *categories, inStock",
      cart: "productId",
      orders: "clientOrderId, status, createdAt, nextAttemptAt",
      meta: "key",
    });
  }
}

export const db = new TiendaDB();

// ---------- Carrito ----------

export async function addToCart(p: Product, quantity = 1) {
  await db.transaction("rw", db.cart, async () => {
    const current = await db.cart.get(p.id);
    await db.cart.put({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.images[0],
      quantity: (current?.quantity ?? 0) + quantity,
    });
  });
}

export async function setCartQuantity(productId: number, quantity: number) {
  if (quantity <= 0) return db.cart.delete(productId);
  await db.cart.update(productId, { quantity });
}

export const clearCart = () => db.cart.clear();
