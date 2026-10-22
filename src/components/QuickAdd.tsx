"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/Icons";
import { addToCart } from "@/lib/db";
import type { Product } from "@/lib/types";

// Isla interactiva dentro de la tarjeta (que se renderiza en el servidor).
export function QuickAdd({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  return (
    <>
      <button
        onClick={async () => {
          await addToCart(product);
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        }}
        aria-label={`Agregar ${product.name} al carrito`}
        className={`absolute right-2.5 bottom-2.5 grid size-11 place-items-center rounded-full shadow-lg shadow-ink/15 transition-all active:scale-90 ${
          added ? "bg-ink text-lime" : "bg-card text-ink hover:bg-ink hover:text-surface"
        }`}
      >
        {added ? <CheckIcon /> : <PlusIcon />}
      </button>
      <span role="status" className="sr-only">
        {added ? `${product.name} agregado al carrito` : ""}
      </span>
    </>
  );
}
