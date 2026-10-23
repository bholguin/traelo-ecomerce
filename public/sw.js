// Service worker de baja. La tienda ya no funciona sin conexión, pero los
// celulares que la abrieron antes tienen instalado el service worker de Serwist,
// que seguiría sirviendo páginas y precios desde su caché. El navegador busca
// una versión nueva de /sw.js al navegar: esta borra las cachés, se desinstala y
// recarga las pestañas abiertas para que pidan todo a la red.
// Se puede borrar cuando ya no queden visitantes con la versión anterior.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: "window" });
      tabs.forEach((tab) => tab.navigate(tab.url));
    })(),
  );
});
