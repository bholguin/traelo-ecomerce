// Dropi simulado: misma forma de respuesta que la API real ({isSuccess, message, objects}).
import http from "node:http";
import fs from "node:fs";

const LOG = process.argv[2] ?? "mock-dropi.log";
const products = {
  111: {
    id: 111, name: "Faja reductora", type: "SIMPLE", sku: "FAJ-1", user_id: 77, active: true,
    sale_price: "45000", suggested_price: "99900", description: "<p>Talla única</p>",
    warehouse_product: [{ stock: 3 }, { stock: 4 }],
    photos: [{ id: 1, urlS3: "colombia/products/111/foto.jpg" }],
    categories: [{ name: "Belleza" }],
  },
  222: {
    id: 222, name: "Camiseta", type: "VARIABLE", user_id: 77, suggested_price: "50000", stock: 10,
  },
};

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      fs.appendFileSync(LOG, JSON.stringify({ method: req.method, url: req.url, key: req.headers["dropi-integration-key"], body: body ? JSON.parse(body) : null }) + "\n");
      res.setHeader("Content-Type", "application/json");
      if (req.headers["dropi-integration-key"] !== "token-prueba") {
        return res.end(JSON.stringify({ isSuccess: false, message: "Token inválido" }));
      }
      const m = req.url.match(/^\/integrations\/products\/v2\/(\d+)$/);
      if (m && req.method === "GET") {
        const p = products[m[1]];
        return res.end(JSON.stringify(p ? { isSuccess: true, objects: p } : { isSuccess: false, message: "Producto no encontrado" }));
      }
      if (req.url === "/integrations/orders/myorders" && req.method === "POST") {
        const data = JSON.parse(body);
        if (data.city === "Ciudad sin cobertura") return res.end(JSON.stringify({ isSuccess: false, message: "Sin cobertura" }));
        return res.end(JSON.stringify({ isSuccess: true, message: "ok", objects: { id: 987654 } }));
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ isSuccess: false, message: "not found" }));
    });
  })
  .listen(3200, () => console.log("mock dropi en :3200"));
