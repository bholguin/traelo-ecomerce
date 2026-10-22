import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Permite abrir `npm run dev` desde el celular con la IP del computador en la red
  // local (http://192.168.x.x:3000). Sin esto Next bloquea los recursos de desarrollo
  // y la página no se vuelve interactiva. Solo aplica en desarrollo.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
