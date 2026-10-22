import type { Product } from "./types";

// El catálogo guarda aquí el producto que el cliente toca. Así la ficha lo pinta
// en el primer render, sin esperar a IndexedDB, y la foto puede hacer la
// transición desde la tarjeta (<ViewTransition> necesita ambos en el mismo commit).
export const productCache = new Map<number, Product>();
