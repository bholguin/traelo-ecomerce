/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // /producto?id=123 y /pedidos?nuevo=... usan la página precacheada sin parámetros
    ignoreURLParametersMatching: [/^id$/, /^nuevo$/, /^utm_/, /^fbclid$/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // La API nunca se cachea en el SW: la PWA guarda sus datos en IndexedDB.
    { matcher: ({ url }) => url.pathname.startsWith("/api/"), handler: new NetworkOnly() },
    // Páginas SSR visitadas (inicio, fichas, categorías): red primero para precios y
    // stock al día; con señal débil (más de 4 s) o sin señal, la copia guardada.
    // Una página nunca visitada cae en el respaldo /offline, que lee de IndexedDB.
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "paginas",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    // Fotos de productos (vienen del dominio de WordPress/Dropi)
    {
      matcher: ({ request, sameOrigin }) => request.destination === "image" && !sameOrigin,
      handler: new CacheFirst({
        cacheName: "fotos-productos",
        plugins: [new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
