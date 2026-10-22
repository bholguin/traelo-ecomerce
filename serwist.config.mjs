// @ts-check
// Serwist se construye DESPUÉS de `next build`, así precachea todas las rutas prerenderizadas.
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});
