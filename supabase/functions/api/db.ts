// SND//WCH — api / db
// Acceso a PostgREST (tablas + funciones RPC) usando la SERVICE_ROLE key — nunca
// expuesta al navegador. Estas son las únicas funciones que hablan directo con
// Supabase; todo lo demás en la función pasa por aquí.
import { SB_URL, SERVICE_KEY } from "./env.ts";
import { ApiError } from "./types.ts";

export function sbHeaders(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}
// Las 4 funciones CRUD de abajo lanzan un Error genérico (no ApiError) en fallos de
// PostgREST — el handler de nivel superior los registra con console.error y responde
// un mensaje genérico al cliente. Nunca devolver el texto crudo de Postgres/PostgREST
// (nombres de tabla/columna/constraint) al llamador — es información interna.
export async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
export async function sbInsert(table: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const text = await r.text();
    // 23505 = unique_violation de Postgres — se traduce a un ApiError claro en los pocos
    // lugares donde puede pasar por una condición de carrera esperable (teléfono/DNI
    // duplicado al registrarse, chargeId de Culqi reusado), en vez de un 500 genérico.
    if (r.status === 409 && text.includes("23505")) {
      if (table === "customers") throw new ApiError("Ya existe una cuenta con ese teléfono o DNI.", 409);
      if (table === "orders" && text.includes("payment_id")) throw new ApiError("Este pago ya fue usado en otro pedido.", 409);
      if (table === "ratings") throw new ApiError("Este pedido ya fue calificado.", 409);
    }
    throw new Error(`Error creando en ${table}: ${text}`);
  }
  return r.json();
}
export async function sbUpdate(table: string, query: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Error actualizando ${table}: ${await r.text()}`);
  return r.json();
}
export async function sbDelete(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!r.ok) throw new Error(`Error eliminando en ${table}: ${await r.text()}`);
}
// A diferencia de las funciones de arriba, rpc() sí traduce ciertas excepciones de
// negocio (lanzadas por nuestras funciones atómicas de saldo — ver migración
// atomic_balance_functions) a un ApiError claro para el cliente; cualquier otro
// fallo cae al Error genérico igual que sbGet/sbInsert/sbUpdate/sbDelete.
export async function rpc(name: string, args: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const text = await r.text();
    console.error(`rpc ${name} error:`, text);
    if (text.includes("insufficient_credit")) throw new ApiError("Crédito insuficiente.", 402);
    if (text.includes("insufficient_points")) throw new ApiError("Puntos insuficientes.", 402);
    if (text.includes("insufficient_balance")) throw new ApiError("Saldo insuficiente para este pedido.", 402);
    if (text.includes("already_claimed")) throw new ApiError("Ya reclamaste el reto de este mes.", 409);
    if (text.includes("customer_not_found")) throw new ApiError("Cliente no encontrado.", 404);
    throw new Error(`rpc ${name} failed`);
  }
  // Las funciones que declaran `returns void` (ej. gift_credit) responden sin cuerpo —
  // r.json() lanzaría un SyntaxError al intentar parsear una respuesta vacía.
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
