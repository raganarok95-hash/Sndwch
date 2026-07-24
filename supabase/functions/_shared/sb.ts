// SND//WCH — _shared/sb
// Helpers de PostgREST + debugLog reusados por las funciones edge de un solo archivo
// (daily-summary, birthday-bonus, winback-campaign, weekly-summary, send-order-email).
// Antes cada una reimplementaba esto por separado (~20-40 líneas casi idénticas x5) sin
// ningún módulo compartido — ya causó una divergencia real (send-order-email tenía un
// fallback de SB_URL hardcodeado que ninguna otra tenía) (hallazgo de auditoría de
// arquitectura de código, ALTO). La función `api` (mucha más compleja, con RPC/insert/
// update/storage) mantiene su propio db.ts — no vale la pena forzarla a compartir esto.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function sbHeaders(extra?: Record<string, string>) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra };
}
export async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
export async function sbInsert(table: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Error creando en ${table}: ${await r.text()}`);
  return r.json();
}
export async function sbUpdate(table: string, query: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: "PATCH", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Error actualizando ${table}: ${await r.text()}`);
  return r.json();
}
// Llama a un RPC de Postgres (ej. increment_customer_points) — para incrementos que
// deben ser atómicos, nunca un sbGet+cálculo local+sbUpdate (esto último es lectura-luego-
// escritura: si algo más toca la misma fila entre la lectura y la escritura, ese cambio
// se pierde en silencio bajo el valor calculado con el dato viejo).
export async function sbRpc(name: string, args: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: sbHeaders(), body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`Error en RPC ${name}: ${await r.text()}`);
  return r.json();
}
export async function debugLog(source: string, detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, { method: "POST", headers: sbHeaders({ Prefer: "return=minimal" }), body: JSON.stringify({ source, detail }) });
  } catch (_e) { /* nunca debe tumbar la respuesta real */ }
}
// El secreto compartido con pg_cron vive en Supabase Vault, validado vía la misma RPC
// que usa la función api principal — nunca un literal en el código.
export async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/verify_cron_secret`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ p_secret: provided }),
    });
    if (!r.ok) return false;
    return await r.json();
  } catch {
    return false;
  }
}
