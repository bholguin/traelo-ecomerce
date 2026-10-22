import "server-only";

// Evita crear dos veces el mismo pedido en Dropi cuando el celular reintenta
// (por ejemplo, si la respuesta se perdió por mala señal).
//
// Con Redis (recomendado en producción): Vercel → Storage / Marketplace → Upstash Redis.
// La integración crea KV_REST_API_URL y KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL/_TOKEN).
// Sin Redis se usa memoria del proceso: sirve para desarrollo, pero en Vercel
// cada instancia tiene su propia memoria, así que no protege del todo.

const URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export type Done = { orderId: number | null; total: number };
type Entry = { state: "pending" } | ({ state: "done" } & Done);

const memory = new Map<string, { value: Entry; expires: number }>();

async function redis<T>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

const key = (id: string) => `pedido:${id}`;

export const idempotencyBackend = () => (URL && TOKEN ? "redis" : "memoria");

export async function getEntry(id: string): Promise<Entry | null> {
  if (URL && TOKEN) {
    const raw = await redis<string | null>("GET", key(id));
    return raw ? (JSON.parse(raw) as Entry) : null;
  }
  const m = memory.get(key(id));
  if (!m || m.expires < Date.now()) return null;
  return m.value;
}

/** Reserva el pedido. Devuelve false si otro intento ya lo está procesando. */
export async function reserve(id: string): Promise<boolean> {
  const value = JSON.stringify({ state: "pending" } satisfies Entry);
  if (URL && TOKEN) {
    return (await redis<string | null>("SET", key(id), value, "NX", "EX", 600)) === "OK";
  }
  if (await getEntry(id)) return false;
  memory.set(key(id), { value: { state: "pending" }, expires: Date.now() + 600_000 });
  return true;
}

export async function markDone(id: string, done: Done) {
  const value: Entry = { state: "done", ...done };
  if (URL && TOKEN) {
    await redis("SET", key(id), JSON.stringify(value), "EX", 60 * 60 * 24 * 30);
    return;
  }
  memory.set(key(id), { value, expires: Date.now() + 30 * 86_400_000 });
}

export async function release(id: string) {
  if (URL && TOKEN) {
    await redis("DEL", key(id));
    return;
  }
  memory.delete(key(id));
}
