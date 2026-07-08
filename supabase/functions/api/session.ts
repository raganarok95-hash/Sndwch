// SND//WCH — api / session
// Firma/verificación de tokens de sesión (HMAC), helpers de sesión activa/admin, y el
// bloqueo por intentos fallidos de login (tabla login_attempts).
import { SESSION_SECRET, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES } from "./env.ts";
import { sbGet, rpc } from "./db.ts";
import { ApiError, SessionPayload } from "./types.ts";

const enc = new TextEncoder();
function b64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function hmac(data: string): Promise<string> {
  if (!SESSION_SECRET) throw new Error("Falta configurar el secreto SESSION_SECRET.");
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}
export async function signToken(payload: SessionPayload): Promise<string> {
  const p = b64url(enc.encode(JSON.stringify(payload)));
  const s = await hmac(p);
  return `${p}.${s}`;
}
export async function verifyToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || token.indexOf(".") < 0) return null;
  const [p, s] = token.split(".");
  const expected = await hmac(p);
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
export async function verifyActiveSession(token: string | undefined | null): Promise<{ payload: SessionPayload; row: any } | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(payload.phone)}`);
  if (!rows.length) return null;
  const row = rows[0];
  if ((row.session_version || 1) !== (payload.v || 1)) return null;
  return { payload, row };
}
export async function requireSession(token: string | undefined): Promise<SessionPayload> {
  const active = await verifyActiveSession(token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  return active.payload;
}
export async function requireAdmin(token: string | undefined): Promise<SessionPayload> {
  // No reusa requireSession(): ambas consultas (customers para validar la sesión,
  // admin_accounts para el rol) solo dependen de payload.phone, ya conocido tras el HMAC
  // local — corrían en serie, sumando un round-trip completo a cada una de las ~13 acciones
  // admin que pasan por aquí.
  const payload = await verifyToken(token);
  const invalidSession = new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  if (!payload) throw invalidSession;
  const [rows, adminRows] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(payload.phone)}`),
    sbGet("admin_accounts", `phone=eq.${encodeURIComponent(payload.phone)}&select=phone`),
  ]);
  const row = rows[0];
  if (!row || (row.session_version || 1) !== (payload.v || 1)) throw invalidSession;
  if (!Array.isArray(adminRows) || adminRows.length === 0) throw new ApiError("No autorizado.", 403);
  return payload;
}
export function safeCustomer(row: any) {
  if (!row) return null;
  const { pin, reset_token, reset_token_expires, failed_login_count, locked_until, session_version, ...rest } = row;
  return rest;
}

// Intentos fallidos por número de teléfono (tabla login_attempts, migración
// phone_based_login_attempts) — deliberadamente NO ligado a si el teléfono tiene cuenta
// o no. Antes esto vivía en customers.failed_login_count/locked_until, lo que dejaba un
// hueco: un teléfono sin cuenta nunca se bloqueaba (siempre 404/401 al instante), pero
// uno con cuenta sí — esa diferencia de comportamiento permitía deducir qué teléfonos
// están registrados con solo mandar intentos fallidos repetidos. Ahora ambos casos se
// comportan exactamente igual (ver actLogin/actRecover: el chequeo de bloqueo va ANTES
// de verificar si la cuenta existe, y el registro de intentos fallidos ocurre para
// cualquier teléfono, exista o no).
export async function loginLockoutRemainingMinutes(phone: string): Promise<number | null> {
  return await rpc("login_lockout_remaining_minutes", { p_phone: phone });
}
export async function registerLoginFailure(phone: string) {
  await rpc("register_login_failure", { p_phone: phone, p_max_attempts: MAX_LOGIN_ATTEMPTS, p_lockout_minutes: LOCKOUT_MINUTES });
}
export async function resetLoginAttempts(phone: string) {
  await rpc("reset_login_attempts", { p_phone: phone });
}

// El secreto compartido con pg_cron ya no vive como literal aquí ni en el cuerpo del cron
// job — ambos lo resuelven contra Supabase Vault (ver migración migrate_cron_secret_to_vault),
// así que ni el código fuente (comprometible a git) ni el historial de cron.job exponen el
// valor en texto plano. verify_cron_secret() es SECURITY DEFINER y compara internamente.
export async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    return await rpc("verify_cron_secret", { p_secret: provided });
  } catch {
    return false;
  }
}
