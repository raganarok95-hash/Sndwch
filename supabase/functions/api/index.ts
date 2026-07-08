import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";

// SND//WCH — api
// Punto único de acceso a datos sensibles (clientes, pedidos, transacciones, cuentas admin).
// Usa la SERVICE_ROLE key (nunca expuesta al navegador) porque esas tablas ahora tienen
// RLS activado sin políticas para anon — solo este endpoint (o el dueño desde el dashboard
// de Supabase) puede leer o escribir en ellas.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");
// Firma HMAC de las sesiones (clientes y admin) — DEBE venir de una variable de entorno,
// nunca vivir en el código fuente: quien lea este archivo (repo, backup, historial git)
// podría forjar un token válido para cualquier cuenta si estuviera hardcodeada aquí.
// Configúrala con: supabase secrets set SESSION_SECRET=...
// A propósito NO se lanza un throw aquí a nivel de módulo: un throw en este punto tumba
// TODA la función (incluido el manejo de OPTIONS/CORS) para TODAS las acciones, no solo
// las que usan sesión — un solo secreto faltante dejaría sin servicio hasta el catálogo
// público. El chequeo real vive en hmac(), donde solo revienta la acción que de verdad
// necesita firmar/verificar un token.
const SESSION_SECRET = Deno.env.get("SESSION_SECRET");
const TOKEN_TTL_SECONDS = 30 * 24 * 3600;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const REFERRAL_BONUS_POINTS = 50;
// Antes solo un registro CON código de referido recibía puntos al crear cuenta — cualquier
// otro registro nuevo empezaba en 0 sin ningún incentivo de bienvenida.
const WELCOME_BONUS_POINTS = 20;
// Antes los tiers (MEMBER/REGULAR/FREQUENT/VIP) eran solo una etiqueta/color sin ningún
// beneficio real — VIP ahora gana puntos extra por pedido.
const VIP_POINTS_MULTIPLIER = 1.25;
const STALE_MANUAL_PAYMENT_HOURS = 3;
// El secreto compartido con pg_cron ya no vive como literal aquí ni en el cuerpo del cron
// job — ambos lo resuelven contra Supabase Vault (ver migración migrate_cron_secret_to_vault),
// así que ni el código fuente (comprometible a git) ni el historial de cron.job exponen el
// valor en texto plano. verify_cron_secret() es SECURITY DEFINER y compara internamente.
async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    return await rpc("verify_cron_secret", { p_secret: provided });
  } catch {
    return false;
  }
}

// Horario de atención — debe reflejar EXACTAMENTE el mismo horario que STORE_HOURS en
// index.html (usado ahí solo para el badge visual; aquí se usa para rechazar pedidos
// programados fuera de horario, que el cliente podría forzar sin este chequeo).
const STORE_HOURS: Array<[number, number] | null> = [
  [11, 22], [11, 22], [11, 22], [11, 22], [11, 22], [11, 22], [11, 22],
];
function isWithinStoreHours(d: Date): boolean {
  const range = STORE_HOURS[d.getDay()];
  if (!range) return false;
  const h = d.getHours() + d.getMinutes() / 60;
  return h >= range[0] && h < range[1];
}

// Par de llaves VAPID para Web Push. La pública NO es secreta — vive tal cual en el
// cliente (index.html) para pushManager.subscribe(); debe ser SIEMPRE el mismo par que
// la privada de abajo. La privada sí es un secreto real y se lee de una variable de
// entorno (configúrala con: supabase secrets set VAPID_PRIVATE_KEY=... — nunca la
// pongas directamente en este archivo). Sin ella, el envío de push queda deshabilitado
// mas el resto de la API sigue funcionando con normalidad.
// ⚠️ Reemplaza VAPID_SUBJECT por un mailto: o https: real del negocio antes de
// publicar (los servicios de push lo usan solo para contactarte en caso de abuso).
const VAPID_PUBLIC_KEY = "BKTQjrOAOBVbt-wG_vUol13SrlwS0FrWppXxgu0velMopQOsIzxHF0hu3BDMSItRVHlan23RQZA6dF3wpbU1rA0";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = "mailto:contacto@sndwch.com";
// Envuelto en try/catch: una llave VAPID mal formada no debe tumbar TODA la función
// (ver el mismo razonamiento arriba para SESSION_SECRET) — sin esto el envío de push
// simplemente queda deshabilitado, en vez de dejar caído todo el backend.
if (VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.error("VAPID setup failed:", e);
  }
}

// Para mandar el PIN nuevo de recuperación de cuenta por correo en vez de devolverlo
// directo en la respuesta (ver actRecover). Comparte el mismo secreto de proyecto que
// usa la función send-order-email — configúralo con: supabase secrets set RESEND_API_KEY=...
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "SND//WCH <pedidos@sndwch.app>";
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, user.length - 1))}@${domain}`;
}
async function sendRecoveryEmail(to: string, name: string, newPin: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">RECUPERACIÓN DE CUENTA</div>
          <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name || ""},</p>
          <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Pediste recuperar tu PIN. Este es tu nuevo PIN:</p>
          <p style="font-size:34px;font-weight:900;color:#CBA258;letter-spacing:.1em;margin:16px 0">${newPin}</p>
          <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Si no fuiste tú, contáctanos de inmediato.</p>
        </div>
      </div>
    `;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: "SND//WCH — Tu nuevo PIN", html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

const STATUS_PUSH_MESSAGES: Record<string, { title: string; body: string }> = {
  PREPARANDO: { title: "¡Tu pedido está en preparación!", body: "Ya estamos armando tu pedido." },
  "EN CAMINO": { title: "¡Tu pedido va en camino! 🛵", body: "Prepárate, ya casi llega." },
  ENTREGADO: { title: "¡Pedido entregado! ✅", body: "Gracias por tu compra. ¡Buen provecho!" },
};

// Ventana de hora estimada de llegada (estilo "9:20 - 9:40" tipo apps de delivery) a partir
// de los minutos que ingresa el operador — se calcula en hora de Perú (UTC-5, sin horario de
// verano) porque eso es lo que un cliente espera ver, no la hora UTC del servidor.
function etaWindowText(etaMinutes: number): string {
  const fmt = (d: Date) => d.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hourCycle: "h23" });
  const now = Date.now();
  const from = new Date(now + (etaMinutes - 5) * 60000);
  const to = new Date(now + (etaMinutes + 5) * 60000);
  return `${fmt(from)} - ${fmt(to)}`;
}

async function sendPushToPhone(
  phone: string,
  payload: { title: string; body: string; url?: string; tag?: string; renotify?: boolean },
) {
  if (!VAPID_PRIVATE_KEY) return;
  const subs = await sbGet("push_subscriptions", `customer_phone=eq.${encodeURIComponent(phone)}`);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch (e: any) {
      // Suscripción caducada/inválida (el navegador la revocó) — la limpiamos.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sbDelete("push_subscriptions", `id=eq.${encodeURIComponent(sub.id)}`);
      } else {
        // Cualquier otro fallo de envío quedaba completamente silencioso antes de esto.
        await debugLog({ stage: "exception", context: "sendPushToPhone", statusCode: e?.statusCode, error: String(e) });
      }
    }
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// A diferencia de daily-summary/birthday-bonus/winback-campaign/send-order-email, esta
// función (la de mayor tráfico y la que mueve dinero real) no escribía ningún registro a
// debug_logs — sus fallos solo vivían en console.error, visible nada más desde el panel de
// logs de Supabase. best-effort: un fallo al loguear nunca debe tumbar la respuesta real.
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ source: "api", detail }),
    });
  } catch (_e) { /* nunca debe tumbar la respuesta real */ }
}

// Registro de auditoría para acciones admin sensibles (puntos manuales, cancelar pedido,
// agregar/quitar cuentas admin) — hoy solo hay 1 cuenta admin así que no importa mucho,
// pero es barato de tener listo para el día en que haya más de una persona con acceso, en
// vez de tener que reconstruir "quién hizo qué" a mano desde cero en ese momento.
async function logAdminAction(actorPhone: string, action: string, target?: string, detail?: unknown) {
  try {
    await sbInsert("admin_action_log", { actor_phone: actorPhone, action, target: target ?? null, detail: detail ?? null });
  } catch (_e) { /* nunca debe tumbar la acción real */ }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function sbHeaders(extra?: Record<string, string>) {
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
async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
async function sbInsert(table: string, data: unknown) {
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
async function sbUpdate(table: string, query: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Error actualizando ${table}: ${await r.text()}`);
  return r.json();
}
async function sbDelete(table: string, query: string) {
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
async function rpc(name: string, args: unknown) {
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
type SessionPayload = { phone: string; isAdmin: boolean; exp: number; v: number };
async function signToken(payload: SessionPayload): Promise<string> {
  const p = b64url(enc.encode(JSON.stringify(payload)));
  const s = await hmac(p);
  return `${p}.${s}`;
}
async function verifyToken(token: string | undefined | null): Promise<SessionPayload | null> {
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
async function verifyActiveSession(token: string | undefined | null): Promise<{ payload: SessionPayload; row: any } | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(payload.phone)}`);
  if (!rows.length) return null;
  const row = rows[0];
  if ((row.session_version || 1) !== (payload.v || 1)) return null;
  return { payload, row };
}
async function requireSession(token: string | undefined): Promise<SessionPayload> {
  const active = await verifyActiveSession(token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  return active.payload;
}
async function requireAdmin(token: string | undefined): Promise<SessionPayload> {
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
function safeCustomer(row: any) {
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
async function loginLockoutRemainingMinutes(phone: string): Promise<number | null> {
  return await rpc("login_lockout_remaining_minutes", { p_phone: phone });
}
async function registerLoginFailure(phone: string) {
  await rpc("register_login_failure", { p_phone: phone, p_max_attempts: MAX_LOGIN_ATTEMPTS, p_lockout_minutes: LOCKOUT_MINUTES });
}
async function resetLoginAttempts(phone: string) {
  await rpc("reset_login_attempts", { p_phone: phone });
}

const REWARDS: Record<string, { pts: number; label: string }> = {
  R01: { pts: 40, label: "TOPPING // EXTRA" },
  R02: { pts: 80, label: "4TA // SALSA" },
  R03: { pts: 140, label: "SAUCE // SET" },
  R04: { pts: 180, label: "DOBLE // PROTEÍNA" },
  R05: { pts: 250, label: "BEBIDA // GRATIS" },
  R06: { pts: 400, label: "SÁNDWICH // GRATIS" },
};

function tierName(pts: number): string {
  if (pts >= 400) return "VIP";
  if (pts >= 200) return "FREQUENT";
  if (pts >= 80) return "REGULAR";
  return "MEMBER";
}

async function actRegister(b: any) {
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const pin = String(b.pin || "").trim();
  const email = b.email ? String(b.email).trim() : null;
  const dni = String(b.dni || "").trim();
  const bday = b.bday ? String(b.bday).trim() : null;
  const referredBy = b.referredBy ? String(b.referredBy).trim() : null;

  if (!name || !phone || pin.length < 4) throw new ApiError("Completa nombre, teléfono y PIN (mínimo 4 dígitos).");
  if (!/^\d{8}$/.test(dni)) throw new ApiError("DNI es obligatorio y debe tener 8 dígitos.");
  if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) throw new ApiError("Correo inválido.");

  // Antes eran 2 consultas secuenciales a la misma tabla — un solo `or=()` cubre ambos
  // chequeos de duplicado en un round-trip. El lookup de referido no depende de este
  // resultado, así que corre en paralelo en vez de después.
  const [dupes, referrerRows] = await Promise.all([
    sbGet("customers", `or=(phone.eq.${encodeURIComponent(phone)},dni.eq.${encodeURIComponent(dni)})&select=phone,dni`),
    referredBy && referredBy !== phone
      ? sbGet("customers", `referral_code=eq.${encodeURIComponent(referredBy)}&select=phone`)
      : Promise.resolve([]),
  ]);
  if (dupes.some((c: any) => c.phone === phone)) throw new ApiError("Ya existe una cuenta con ese teléfono.", 409);
  if (dupes.some((c: any) => c.dni === dni)) throw new ApiError("Ya existe una cuenta con ese DNI.", 409);

  let referredByValid: string | null = null;
  if (referrerRows.length) referredByValid = referrerRows[0].phone;

  const hashed = await rpc("hash_pin", { plain: pin });
  const rows = await sbInsert("customers", {
    phone,
    name,
    pin: hashed,
    email,
    dni,
    birthday: bday,
    points: WELCOME_BONUS_POINTS,
    pending_points: 0,
    total_orders: 0,
    total_redeemed: 0,
    referral_code: phone,
    referred_by: referredByValid,
  });
  let customer = safeCustomer(rows[0]);
  // Bono de bienvenida para TODO registro nuevo (antes solo quien llegaba con un código de
  // referido recibía puntos al crear cuenta) — se registra en el historial igual que
  // cualquier otro ingreso de puntos, no solo se suma en silencio.
  await sbInsert("transactions", {
    customer_phone: phone,
    type: "earn_confirmed",
    points: WELCOME_BONUS_POINTS,
    description: "Bono de bienvenida",
    confirmed: true,
  });

  // Vincula el pedido de invitado que originó este registro (botón "CREAR CUENTA Y GANAR
  // PUNTOS POR ESTE PEDIDO" en la confirmación) — antes esto solo creaba la cuenta sin
  // tocar el pedido, así que el cliente nunca recibía los puntos que la propia app le
  // prometía. El `ref` (incluye un componente aleatorio, ver oref() en el cliente) es la
  // misma prueba de acceso que ya usan my-orders/submit-rating para invitados, y el filtro
  // customer_phone=is.null evita "robar" un pedido que ya tiene dueño.
  const claimOrderRef = b.claimOrderRef ? String(b.claimOrderRef).trim().slice(0, 40) : null;
  if (claimOrderRef) {
    try {
      const orderRows = await sbGet(
        "orders",
        `ref=eq.${encodeURIComponent(claimOrderRef)}&customer_phone=is.null&select=id,ref,total,payment_status,customer_address`,
      );
      const order = orderRows[0];
      if (order) {
        await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { customer_phone: phone });
        if (order.payment_status === "paid") {
          // El pedido de invitado ya estaba pagado (tarjeta) y nunca pasó por
          // finalize_order_customer_update en su momento (no había phone/custRow) — se
          // otorgan los puntos retroactivamente ahora que se sabe a quién pertenece. Si en
          // cambio quedó "pending" (Yape/Plin), basta con haber asignado customer_phone:
          // confirmManualPayment ya funciona sola cuando el admin confirme el pago.
          const updated = await rpc("finalize_order_customer_update", {
            p_phone: phone,
            p_points_delta: order.total,
            p_credit_delta: 0,
            p_total_orders_delta: 1,
            p_last_address: order.customer_address,
            p_total_redeemed_delta: 0,
            p_referrer_phone: referredByValid,
            p_referral_bonus: referredByValid ? REFERRAL_BONUS_POINTS : 0,
          });
          customer = safeCustomer(updated);
          const claimAuditInserts: Promise<unknown>[] = [
            sbInsert("transactions", {
              customer_phone: phone,
              type: "earn_confirmed",
              points: order.total,
              description: "Pedido SND//WCH (vinculado tras crear cuenta)",
              order_ref: order.ref,
              confirmed: true,
            }),
          ];
          if (referredByValid) {
            claimAuditInserts.push(sbInsert("transactions", { customer_phone: phone, type: "earn_confirmed", points: REFERRAL_BONUS_POINTS, description: "Bono por referido", confirmed: true }));
            claimAuditInserts.push(sbInsert("transactions", { customer_phone: referredByValid, type: "earn_confirmed", points: REFERRAL_BONUS_POINTS, description: "Bono por invitar a " + name, confirmed: true }));
          }
          await Promise.all(claimAuditInserts);
        }
      }
    } catch (e) {
      // Vincular el pedido es un plus — nunca debe hacer fallar la creación de la cuenta.
      console.error("claimOrderRef failed:", e);
    }
  }

  const token = await signToken({ phone, isAdmin: false, exp: Date.now() / 1000 + TOKEN_TTL_SECONDS, v: rows[0].session_version || 1 });
  return { customer, isAdmin: false, token };
}

async function actLogin(b: any) {
  const phone = String(b.phone || "").trim();
  const pin = String(b.pin || "").trim();
  if (!phone || !pin) throw new ApiError("Ingresa teléfono y PIN.");

  // El chequeo de bloqueo va ANTES de saber si la cuenta existe, y con el mismo mensaje
  // para ambos casos — así un teléfono sin cuenta y uno con cuenta bloqueada responden
  // idéntico (ver el comentario en loginLockoutRemainingMinutes).
  const remaining = await loginLockoutRemainingMinutes(phone);
  if (remaining !== null) throw new ApiError(`Demasiados intentos fallidos. Intenta de nuevo en ${remaining} min.`, 429);

  // customers y admin_accounts no dependen entre sí (ambos solo necesitan `phone`) — se
  // piden juntos y el resultado de admin_accounts simplemente no se usa si el login falla.
  const [rows, adminRowsEarly] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(phone)}`),
    sbGet("admin_accounts", `phone=eq.${encodeURIComponent(phone)}&select=phone`),
  ]);
  if (!rows.length) {
    await registerLoginFailure(phone);
    throw new ApiError("Teléfono o PIN incorrecto.", 401);
  }
  const row = rows[0];
  const ok = await rpc("verify_pin", { p_phone: phone, plain: pin });
  if (!ok) {
    await registerLoginFailure(phone);
    throw new ApiError("Teléfono o PIN incorrecto.", 401);
  }
  await resetLoginAttempts(phone);
  const isAdmin = adminRowsEarly.length > 0;
  const token = await signToken({ phone, isAdmin, exp: Date.now() / 1000 + TOKEN_TTL_SECONDS, v: row.session_version || 1 });
  return { customer: safeCustomer(row), isAdmin, token };
}

async function actSessionCheck(b: any) {
  // Igual que requireAdmin: verifyToken es local (sin I/O), así que customers y
  // admin_accounts pueden pedirse en paralelo en vez de en serie.
  const payload = await verifyToken(b.token);
  if (!payload) return { valid: false };
  const [rows, adminRows] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(payload.phone)}`),
    sbGet("admin_accounts", `phone=eq.${encodeURIComponent(payload.phone)}&select=phone`),
  ]);
  const row = rows[0];
  if (!row || (row.session_version || 1) !== (payload.v || 1)) return { valid: false };
  return { valid: true, customer: safeCustomer(row), isAdmin: adminRows.length > 0 };
}

async function actLogoutEverywhere(b: any) {
  // verifyActiveSession ya trae la fila de customers — reusarla evita pedirla de nuevo.
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  const current = active.row.session_version || 1;
  await sbUpdate("customers", `phone=eq.${encodeURIComponent(active.payload.phone)}`, { session_version: current + 1 });
  return { success: true };
}

// Borrado de cuenta a pedido del cliente (antes no existía ningún camino para esto —
// solo un borrado manual del dueño en la base de datos). Pide el PIN de nuevo (no solo
// el token de sesión) para que un token filtrado/robado no baste para una acción
// irreversible. Los pedidos/transacciones/calificaciones se ANONIMIZAN en vez de
// borrarse — el negocio conserva sus cifras de ventas/historial, pero sin ningún dato
// que identifique a esta persona; lo estrictamente personal (direcciones, favoritos,
// suscripciones push, movimientos de crédito) sí se borra por completo.
async function actDeleteAccount(b: any) {
  const s = await requireSession(b.token);
  const pin = String(b.pin || "").trim();
  if (!pin) throw new ApiError("Ingresa tu PIN para confirmar.", 400);
  const ok = await rpc("verify_pin", { p_phone: s.phone, plain: pin });
  if (!ok) throw new ApiError("PIN incorrecto.", 401);

  await Promise.all([
    sbDelete("saved_addresses", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("favorites", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("push_subscriptions", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbDelete("credit_ledger", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    // transactions.customer_phone es NOT NULL + FK a customers.phone — a diferencia de
    // orders/ratings (ambas nullable) no se puede anonimizar con null, así que el ledger
    // personal se borra por completo en vez de conservarse sin identificar (mismo criterio
    // que direcciones/favoritos: es dato estrictamente personal, no una cifra de negocio).
    sbDelete("transactions", `customer_phone=eq.${encodeURIComponent(s.phone)}`),
    sbUpdate("orders", `customer_phone=eq.${encodeURIComponent(s.phone)}`, {
      customer_phone: null,
      customer_name: "Cuenta eliminada",
      customer_email: null,
      customer_address: "Eliminada",
    }),
    sbUpdate("ratings", `customer_phone=eq.${encodeURIComponent(s.phone)}`, { customer_phone: null }),
  ]);
  await sbDelete("customers", `phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

// Compara dos fechas de nacimiento tolerando que estén guardadas en formatos distintos
// (YYYY-MM-DD, el que manda el cliente hoy, vs. DD/MM/AAAA, el que quedó guardado en
// cuentas creadas antes de ese cambio) — antes esto era un === estricto de strings, que
// bloqueaba la recuperación de cuentas viejas aunque el cliente ingresara la fecha
// correcta, porque nunca coincidían byte a byte.
function birthdaysMatch(stored: string, input: string): boolean {
  if (!stored || !input) return false;
  if (stored === input) return true;
  const norm = (s: string): string | null => {
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return null;
  };
  const a = norm(stored);
  const c = norm(input);
  return !!a && !!c && a === c;
}

async function actRecover(b: any) {
  const phone = String(b.phone || "").trim();
  const dni = String(b.dni || "").trim();
  const bday = String(b.bday || "").trim();
  if (!phone || !dni || !bday) throw new ApiError("Completa teléfono, DNI y fecha de nacimiento.");

  // Mismo mecanismo de bloqueo por teléfono que actLogin (comparten la tabla
  // login_attempts) — el chequeo va antes de saber si la cuenta existe, y responde
  // idéntico en ambos casos.
  const remaining = await loginLockoutRemainingMinutes(phone);
  if (remaining !== null) throw new ApiError(`Demasiados intentos fallidos. Intenta de nuevo en ${remaining} min.`, 429);

  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}`);
  if (!rows.length) {
    await registerLoginFailure(phone);
    throw new ApiError("No encontramos una cuenta con esos datos exactos.", 404);
  }
  const row = rows[0];
  const match = row.dni === dni && birthdaysMatch(row.birthday, bday);
  if (!match) {
    await registerLoginFailure(phone);
    throw new ApiError("No encontramos una cuenta con esos datos exactos.", 404);
  }
  await resetLoginAttempts(phone);
  const newPin = String(Math.floor(1000 + Math.random() * 9000));
  const hashed = await rpc("hash_pin", { plain: newPin });
  await sbUpdate("customers", `phone=eq.${encodeURIComponent(phone)}`, { pin: hashed, session_version: (row.session_version || 1) + 1 });
  // DNI + fecha de nacimiento no son secretos fuertes (a veces se filtran/son semi-públicos
  // en Perú) — si el cliente tiene correo registrado, el PIN nuevo se manda ahí en vez de
  // devolverlo aquí, para que quien solo tenga esos dos datos no pueda ver el PIN
  // directamente en la respuesta. Sin correo en el perfil no hay otro canal disponible
  // todavía, así que se mantiene el comportamiento anterior (mostrarlo en la app).
  if (row.email) {
    const sent = await sendRecoveryEmail(row.email, row.name, newPin);
    if (sent) return { success: true, name: row.name, emailSent: true, emailMasked: maskEmail(row.email) };
  }
  return { success: true, newPin, name: row.name, emailSent: false };
}

async function verifyCulqiCharge(chargeId: string, expectedAmountCents: number): Promise<boolean> {
  if (!CULQI_SECRET_KEY) return false;
  try {
    const r = await fetch(`https://api.culqi.com/v2/charges/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
    });
    if (!r.ok) return false;
    const data = await r.json();
    const successful = data?.outcome?.type === "venta_exitosa";
    const amountMatches = Number(data?.amount) === expectedAmountCents;
    return successful && amountMatches;
  } catch {
    return false;
  }
}

const VALID_BASES = new Set(["B01", "B02", "B03"]);
const VALID_TOPS = new Set(["T01", "T02", "T03", "T04", "T05", "T06"]);
const VALID_CHEESE = new Set(["C01", "C02", "C03"]);
const VALID_SAUCES = new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12"]);
const PROT_PRICE: Record<string, { p15: number; p30: number; pDbl: number }> = {
  P01: { p15: 14, p30: 22, pDbl: 6 },
  P02: { p15: 13, p30: 21, pDbl: 6 },
  P03: { p15: 12, p30: 20, pDbl: 4 },
  P04: { p15: 12, p30: 20, pDbl: 5 },
  P05: { p15: 16, p30: 26, pDbl: 9 },
  P06: { p15: 14, p30: 24, pDbl: 7 },
};
const SIG_DATA: Record<string, { base: string; prot: string; tops: string[]; sauces: string[]; p15: number; p30: number }> = {
  SIG01: { base: "B01", prot: "P01", tops: ["T01", "T02", "T03"], sauces: ["S01", "S04"], p15: 18, p30: 22 },
  SIG02: { base: "B02", prot: "P06", tops: ["T04", "T03", "T01"], sauces: ["S02", "S07"], p15: 19, p30: 24 },
  SIG03: { base: "B03", prot: "P05", tops: ["T03", "T02", "T01"], sauces: ["S03", "S08"], p15: 21, p30: 26 },
  SIG04: { base: "B01", prot: "P04", tops: ["T01", "T02", "T06"], sauces: ["S01", "S11"], p15: 16, p30: 20 },
};
const SIDE_PRICE: Record<string, number> = { D01: 5, D02: 5, D03: 3, D04: 4, D05: 3 };
const SIDE_LABEL: Record<string, string> = {
  D01: "CHICHA MORADA // 500ML",
  D02: "INCA KOLA // 355ML",
  D03: "AGUA // SIN GAS",
  D04: "PAPAS // CHIPS",
  D05: "GALLETA // AVENA",
};
const SIG_LABEL: Record<string, string> = {
  SIG01: "THE ORIGINAL // SIGNATURE",
  SIG02: "THE FIRE // BUILD",
  SIG03: "THE SMOKE // BUILD",
  SIG04: "THE FRESH // BUILD",
};
// Antes cambiar un precio requería editar el mismo número en 2 lugares (index.html Y
// esta función) y redesplegar ambos — ver migración create_catalog_prices_table. Esto
// sobreescribe los números hardcodeados de arriba con lo que haya en la tabla, dejando
// nombres/ingredientes/composición sin tocar (siguen siendo criterio de un developer,
// cambian con mucha menos frecuencia). Se llama al inicio de cada acción sensible al
// precio — a esta escala de negocio, un round-trip extra por pedido es aceptable frente
// a la simplicidad de no tener que cachear/invalidar nada.
async function loadCatalogPrices(): Promise<void> {
  try {
    const rows = await sbGet("catalog_prices", "select=code,category,values");
    for (const row of rows) {
      const v = row.values || {};
      if (row.category === "protein" && PROT_PRICE[row.code]) {
        if (typeof v.p15 === "number") PROT_PRICE[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") PROT_PRICE[row.code].p30 = v.p30;
        if (typeof v.pDbl === "number") PROT_PRICE[row.code].pDbl = v.pDbl;
      } else if (row.category === "sig" && SIG_DATA[row.code]) {
        if (typeof v.p15 === "number") SIG_DATA[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") SIG_DATA[row.code].p30 = v.p30;
      } else if (row.category === "side" && row.code in SIDE_PRICE) {
        if (typeof v.price === "number") SIDE_PRICE[row.code] = v.price;
      } else if (row.category === "reward" && REWARDS[row.code]) {
        if (typeof v.pts === "number") REWARDS[row.code].pts = v.pts;
      }
    }
  } catch (e) {
    // Si falla, seguimos con los valores hardcodeados de arriba como respaldo — nunca
    // debe bloquear un pedido por un problema leyendo la tabla de precios.
    console.error("loadCatalogPrices failed:", e);
  }
}
// Acción pública (sin sesión) para que el cliente sepa los precios vigentes sin tener
// que redesplegar el sitio estático cada vez que el dueño cambia uno desde el panel.
async function actGetCatalog(_b: any) {
  await loadCatalogPrices();
  const sigs: Record<string, { p15: number; p30: number }> = {};
  for (const code of Object.keys(SIG_DATA)) sigs[code] = { p15: SIG_DATA[code].p15, p30: SIG_DATA[code].p30 };
  const rewardPts: Record<string, number> = {};
  for (const code of Object.keys(REWARDS)) rewardPts[code] = REWARDS[code].pts;
  return { proteins: PROT_PRICE, sigs, sides: SIDE_PRICE, rewardPts };
}
async function actAdminCatalogSetPrice(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const category = String(b.category || "").trim();
  const values = b.values;
  if (!values || typeof values !== "object") throw new ApiError("Faltan los valores del precio.");
  // Valida la forma exacta esperada por categoría antes de guardar — evita que un typo
  // en el panel guarde un jsonb con campos faltantes/de más que luego rompa el pricing.
  if (category === "protein") {
    if (!PROT_PRICE[code]) throw new ApiError("Proteína desconocida.");
    if (typeof values.p15 !== "number" || typeof values.p30 !== "number" || typeof values.pDbl !== "number" || values.p15 < 0 || values.p30 < 0 || values.pDbl < 0) {
      throw new ApiError("Precio inválido.");
    }
  } else if (category === "sig") {
    if (!SIG_DATA[code]) throw new ApiError("Signature desconocida.");
    if (typeof values.p15 !== "number" || typeof values.p30 !== "number" || values.p15 < 0 || values.p30 < 0) throw new ApiError("Precio inválido.");
  } else if (category === "side") {
    if (!(code in SIDE_PRICE)) throw new ApiError("Bebida/side desconocido.");
    if (typeof values.price !== "number" || values.price < 0) throw new ApiError("Precio inválido.");
  } else if (category === "reward") {
    if (!REWARDS[code]) throw new ApiError("Recompensa desconocida.");
    if (typeof values.pts !== "number" || values.pts < 1) throw new ApiError("Costo en puntos inválido.");
  } else {
    throw new ApiError("Categoría inválida.");
  }
  await sbUpdate("catalog_prices", `code=eq.${encodeURIComponent(code)}`, { values, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "catalog-set-price", code, values);
  await loadCatalogPrices();
  return { success: true };
}
const PROT_LABEL: Record<string, string> = {
  P01: "ASADO // RES",
  P02: "POLLO // TERIYAKI",
  P03: "POLLO // CAJUN",
  P04: "ATÚN // HOUSE",
  P05: "THE ITALIAN",
  P06: "MEATBALL // MARINARA",
};

function rewardWaiver(rewardId: string | null, b: any, basePrice: number, dblSurcharge: number): number {
  if (!rewardId) return 0;
  const reward = REWARDS[rewardId];
  if (!reward) throw new ApiError("Recompensa inválida.");
  if (rewardId === "R04") {
    if (!b.doubleProt) throw new ApiError("Selecciona doble proteína para usar esta recompensa.", 400);
    return dblSurcharge;
  }
  if (rewardId === "R06") {
    if (b.size !== "15") throw new ApiError("Esta recompensa solo es válida en tamaño 15CM.", 400);
    return basePrice;
  }
  return 0;
}

// Valida y tasa un solo build (signature o build-your-own) — usado para favoritos,
// que por ahora solo guardan UN sándwich (no un carrito completo).
function deriveOrder(b: any): { ingredients: string[]; expectedTotal: number } {
  const size = b.size === "15" ? "15" : b.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!b.doubleProt;
  const extraSauce = !!b.extraSauce;
  const rewardId = b.rewardId ? String(b.rewardId) : null;

  if (b.mode === "sig") {
    const sig = SIG_DATA[String(b.sigId || "")];
    if (!sig) throw new ApiError("Signature inválida.");
    const protInfo = PROT_PRICE[sig.prot];
    const basePrice = size === "15" ? sig.p15 : sig.p30;
    const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
    const sauceSurcharge = extraSauce ? 2 : 0;
    const waiver = rewardWaiver(rewardId, b, basePrice, dblSurcharge);
    const ingredients = [sig.base, sig.prot, ...sig.tops, ...sig.sauces];
    if (doubleProt) ingredients.push(sig.prot);
    return { ingredients, expectedTotal: Math.max(0, basePrice + dblSurcharge + sauceSurcharge - waiver) };
  }

  const base = String(b.base || "");
  const prot = String(b.prot || "");
  const cheese = b.cheese ? String(b.cheese) : null;
  const tops: string[] = Array.isArray(b.tops) ? b.tops.filter((x: any) => typeof x === "string") : [];
  const sauces: string[] = Array.isArray(b.sauces) ? b.sauces.filter((x: any) => typeof x === "string") : [];

  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.");
  const protInfo = PROT_PRICE[prot];
  if (!protInfo) throw new ApiError("Proteína inválida.");
  if (cheese && !VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
  if (tops.some((t) => !VALID_TOPS.has(t))) throw new ApiError("Topping inválido.");
  if (sauces.length > 3 || sauces.some((s) => !VALID_SAUCES.has(s))) throw new ApiError("Salsa inválida.");

  const basePrice = size === "15" ? protInfo.p15 : protInfo.p30;
  const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
  const sauceSurcharge = extraSauce ? 2 : 0;
  const waiver = rewardWaiver(rewardId, b, basePrice, dblSurcharge);
  const ingredients = [base, prot, ...tops, ...(cheese ? [cheese] : []), ...sauces];
  if (doubleProt) ingredients.push(prot);
  return { ingredients, expectedTotal: Math.max(0, basePrice + dblSurcharge + sauceSurcharge - waiver) };
}

function buildFromOrder(b: any): Record<string, unknown> {
  if (b.mode === "sig") {
    return { mode: "sig", sigId: b.sigId, size: b.size, doubleProt: !!b.doubleProt, extraSauce: !!b.extraSauce };
  }
  return {
    mode: "byo",
    base: b.base,
    prot: b.prot,
    tops: Array.isArray(b.tops) ? b.tops : [],
    cheese: b.cheese || null,
    sauces: Array.isArray(b.sauces) ? b.sauces : [],
    size: b.size,
    doubleProt: !!b.doubleProt,
    extraSauce: !!b.extraSauce,
  };
}

function validateQty(q: any): number {
  const n = parseInt(q, 10);
  if (!n || n < 1 || n > 20) throw new ApiError("Cantidad inválida.");
  return n;
}

type PricedItem = {
  item: Record<string, unknown>;
  qty: number;
  unitPrice: number;
  basePrice: number;
  dblSurcharge: number;
  ingredientsPerUnit: string[];
  label: string;
  eligibleR04: boolean;
  eligibleR06: boolean;
};

// Tasa y valida UNA línea del carrito (sándwich signature/build o bebida/side).
// Nunca confía en el precio/etiqueta que reporte el cliente — todo se recalcula aquí
// a partir de los catálogos del servidor.
function priceCartItem(raw: any): PricedItem {
  const qty = validateQty(raw?.qty);

  if (raw?.type === "side") {
    const code = String(raw.code || "");
    const price = SIDE_PRICE[code];
    if (price == null) throw new ApiError("Bebida/side inválido.");
    return {
      item: { type: "side", code, qty },
      qty,
      unitPrice: price,
      basePrice: price,
      dblSurcharge: 0,
      ingredientsPerUnit: [code],
      label: SIDE_LABEL[code] || code,
      eligibleR04: false,
      eligibleR06: false,
    };
  }

  const size = raw?.size === "15" ? "15" : raw?.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!raw?.doubleProt;
  const extraSauce = !!raw?.extraSauce;
  // Nota libre del cliente para este producto (ej. "sin cebolla") — puramente
  // informativa para cocina, no afecta precio/ingredientes ni se valida.
  const note = raw?.note ? String(raw.note).trim().slice(0, 140) || null : null;

  if (raw?.type === "sig") {
    const sig = SIG_DATA[String(raw.sigId || "")];
    if (!sig) throw new ApiError("Signature inválida.");
    const protInfo = PROT_PRICE[sig.prot];
    const basePrice = size === "15" ? sig.p15 : sig.p30;
    const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
    const sauceSurcharge = extraSauce ? 2 : 0;
    const ingredientsPerUnit = [sig.base, sig.prot, ...sig.tops, ...sig.sauces];
    if (doubleProt) ingredientsPerUnit.push(sig.prot);
    return {
      item: { type: "sig", sigId: raw.sigId, size, doubleProt, extraSauce, note, qty },
      qty,
      unitPrice: basePrice + dblSurcharge + sauceSurcharge,
      basePrice,
      dblSurcharge,
      ingredientsPerUnit,
      label: SIG_LABEL[String(raw.sigId)] || String(raw.sigId),
      eligibleR04: doubleProt,
      eligibleR06: size === "15",
    };
  }

  if (raw?.type === "byo") {
    const base = String(raw.base || "");
    const prot = String(raw.prot || "");
    const cheese = raw.cheese ? String(raw.cheese) : null;
    const tops: string[] = Array.isArray(raw.tops) ? raw.tops.filter((x: any) => typeof x === "string") : [];
    const sauces: string[] = Array.isArray(raw.sauces) ? raw.sauces.filter((x: any) => typeof x === "string") : [];
    if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.");
    const protInfo = PROT_PRICE[prot];
    if (!protInfo) throw new ApiError("Proteína inválida.");
    if (cheese && !VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
    if (tops.some((t) => !VALID_TOPS.has(t))) throw new ApiError("Topping inválido.");
    if (sauces.length > 3 || sauces.some((s) => !VALID_SAUCES.has(s))) throw new ApiError("Salsa inválida.");
    const basePrice = size === "15" ? protInfo.p15 : protInfo.p30;
    const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
    const sauceSurcharge = extraSauce ? 2 : 0;
    const ingredientsPerUnit = [base, prot, ...tops, ...(cheese ? [cheese] : []), ...sauces];
    if (doubleProt) ingredientsPerUnit.push(prot);
    return {
      item: { type: "byo", base, prot, cheese, tops, sauces, size, doubleProt, extraSauce, note, qty },
      qty,
      unitPrice: basePrice + dblSurcharge + sauceSurcharge,
      basePrice,
      dblSurcharge,
      ingredientsPerUnit,
      label: PROT_LABEL[prot] || prot,
      eligibleR04: doubleProt,
      eligibleR06: size === "15",
    };
  }

  throw new ApiError("Tipo de producto inválido.");
}

// R04 (doble proteína gratis) solo aplica a la primera línea con doble proteína activada;
// R06 (15CM gratis) solo a la primera línea 15CM. El resto de recompensas no exige nada
// del carrito aparte de que no esté vacío — el servidor recalcula esto de forma
// independiente al índice que el cliente crea haber elegido.
function findRewardTargetIndex(priced: PricedItem[], rewardId: string): number {
  if (rewardId === "R04") return priced.findIndex((p) => p.eligibleR04);
  if (rewardId === "R06") return priced.findIndex((p) => p.eligibleR06);
  return priced.length ? 0 : -1;
}

function deriveCart(rawItems: any, rewardId: string | null): { ingredients: string[]; expectedTotal: number; sanitizedItems: Record<string, unknown>[] } {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new ApiError("El carrito está vacío.", 400);
  if (rawItems.length > 30) throw new ApiError("Demasiados productos en el carrito.", 400);

  const priced = rawItems.map(priceCartItem);
  const totalQty = priced.reduce((s, p) => s + p.qty, 0);
  if (totalQty > 100) throw new ApiError("Cantidad total del carrito demasiado alta.", 400);

  let total = priced.reduce((s, p) => s + p.unitPrice * p.qty, 0);
  const ingredients: string[] = [];
  priced.forEach((p) => {
    for (let i = 0; i < p.qty; i++) ingredients.push(...p.ingredientsPerUnit);
  });

  if (rewardId) {
    const reward = REWARDS[rewardId];
    if (!reward) throw new ApiError("Recompensa inválida.");
    const targetIdx = findRewardTargetIndex(priced, rewardId);
    if (targetIdx < 0) throw new ApiError("No tienes ningún producto elegible para esta recompensa en tu carrito.", 400);
    const target = priced[targetIdx];
    const waiver = rewardId === "R04" ? target.dblSurcharge : rewardId === "R06" ? target.basePrice : 0;
    total = Math.max(0, total - waiver);
  }

  return { ingredients, expectedTotal: total, sanitizedItems: priced.map((p) => p.item) };
}

async function actPlaceOrder(b: any) {
  const ref = String(b.ref || "").trim();
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const address = String(b.address || "").trim();
  const clientTotal = Number(b.total || 0);
  const useCredit = !!b.useCredit;
  if (b.cod) throw new ApiError("Pago contra entrega no está disponible por el momento.", 400);
  // Yape/Plin: el cliente transfiere por su cuenta desde su propia app — el servidor no
  // procesa el cobro. El pedido queda payment_status:'pending' hasta que un operador
  // confirme manualmente que el dinero llegó (ver actAdminConfirmPayment); solo entonces
  // se otorgan puntos, y el pedido no puede avanzar de RECIBIDO antes de esa confirmación
  // (ver el guard en actAdminUpdateStatus).
  const manualMethod = b.paymentMethod === "yape" || b.paymentMethod === "plin" ? String(b.paymentMethod) : null;
  const rewardId = b.rewardId ? String(b.rewardId) : null;
  if (!ref || !name || !address || clientTotal < 0) throw new ApiError("Faltan datos del pedido.");
  if (manualMethod && rewardId) throw new ApiError("Las recompensas no se pueden usar con Yape/Plin hasta confirmar el pago.", 400);

  const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
  if (scheduledFor) {
    const schedDate = new Date(scheduledFor);
    const t = schedDate.getTime();
    if (!t || t < Date.now() - 60000) throw new ApiError("La hora programada no es válida.", 400);
    if (!isWithinStoreHours(schedDate)) throw new ApiError("Esa hora está fuera de nuestro horario de atención.", 400);
  }

  // Precios vigentes (pueden haber cambiado desde el panel admin sin redeploy) —
  // ver loadCatalogPrices/catalog_prices.
  await loadCatalogPrices();
  const { ingredients, expectedTotal, sanitizedItems } = deriveCart(b.items, rewardId);
  if (Math.round(expectedTotal) !== Math.round(clientTotal)) {
    throw new ApiError("El total no coincide con los productos del pedido.", 400);
  }

  // verifyActiveSession no depende de la reserva de stock (ni viceversa) — se lanza ya
  // mismo y se resuelve más abajo justo donde se usa, en vez de esperar a que
  // reserve_inventory termine primero para recién empezarla.
  const sessionPromise: Promise<{ payload: SessionPayload; row: any } | null> = b.token
    ? verifyActiveSession(b.token)
    : Promise.resolve(null);

  // Reserva de stock ANTES de cobrar/registrar nada: reserve_inventory revisa Y descuenta
  // en una sola transacción atómica (con bloqueo de fila), así que dos pedidos concurrentes
  // por el último ingrediente disponible no pueden ambos "pasar" — el que llega segundo
  // rechaza limpio en vez de sobrevender. Antes esto se hacía leyendo el stock y
  // escribiéndolo de vuelta al final del todo, sin rechazar el pedido ni protegerlo de
  // condiciones de carrera.
  if (ingredients.length) {
    const codes = Array.from(new Set(ingredients));
    const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
    try {
      await rpc("reserve_inventory", { p_codes: codes, p_qtys: qtys });
    } catch (e) {
      throw new ApiError("Uno o más productos de tu pedido se agotaron. Actualiza tu carrito e intenta de nuevo.", 409);
    }
  }
  // A partir de aquí, `total` es SIEMPRE el valor recalculado por el servidor — nunca el
  // que mandó el cliente. Todo lo que mueve dinero (orders.total, cobro a Culqi, puntos,
  // crédito) debe basarse en esta fuente de verdad, no en `clientTotal` (que solo sirvió
  // para detectar un descuadre grosero arriba; confiar en él aquí abajo permitiría pagar
  // centavos menos del precio real vía devtools).
  const total = expectedTotal;
  const chargeId = useCredit || manualMethod || total === 0 ? "" : String(b.chargeId || "").trim();
  if (total > 0 && !useCredit && !manualMethod && !chargeId) throw new ApiError("Faltan datos del pedido.");

  let phone: string | null = null;
  let custRow: any = null;
  const active = await sessionPromise;
  if (active) {
    phone = active.payload.phone;
    custRow = active.row;
  }

  let reward: { pts: number; label: string } | null = null;
  if (rewardId) {
    if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para usar una recompensa.", 401);
    reward = REWARDS[rewardId] || null;
    if (!reward) throw new ApiError("Recompensa inválida.");
    if ((custRow.points || 0) < reward.pts) throw new ApiError("No tienes puntos suficientes para esta recompensa.", 402);
  }

  let paymentMethod = "culqi";
  let paymentId: string | null = null;
  let paymentStatus = "paid";
  if (total === 0) {
    paymentMethod = "reward";
  } else if (useCredit) {
    if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para pagar con tu crédito.", 401);
    if ((custRow.credit_balance || 0) < total) throw new ApiError("No tienes crédito suficiente para cubrir este pedido.", 402);
    paymentMethod = "credit";
  } else if (manualMethod) {
    paymentMethod = manualMethod;
    paymentStatus = "pending";
  } else {
    const amountCents = Math.round(total * 100);
    const paymentOk = await verifyCulqiCharge(chargeId, amountCents);
    if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);
    paymentId = chargeId;
  }

  async function insertOrder() {
    return sbInsert("orders", {
      ref,
      customer_phone: phone,
      customer_name: name,
      customer_email: email || null,
      customer_address: address,
      summary: b.summary || "",
      notes: b.notes || null,
      total,
      status: "RECIBIDO",
      payment_status: paymentStatus,
      payment_id: paymentId,
      payment_method: paymentMethod,
      mode: null,
      product_key: null,
      size: null,
      build: null,
      items: sanitizedItems,
      delivery_time: scheduledFor,
      redeemed_reward: reward ? reward.label : null,
    });
  }

  let customer = null;
  let orderRows: any[];
  if (phone && custRow && paymentStatus === "paid") {
    const c = custRow;
    const isFirstOrder = (c.total_orders || 0) === 0;
    const isReferral = isFirstOrder && !!c.referred_by;
    // Perk real de tier (antes los tiers eran solo una etiqueta/color sin ningún beneficio
    // tangible): VIP gana puntos 1.25x sobre el total del pedido. Se calcula sobre el tier
    // ANTES de este pedido (el que ya tenía el cliente al entrar), no el que tendría después.
    let basePoints = total;
    if (tierName(c.points || 0) === "VIP") basePoints = Math.round(basePoints * VIP_POINTS_MULTIPLIER);
    let pointsDelta = basePoints;
    if (reward) pointsDelta -= reward.pts;

    // Actualiza el saldo del cliente ANTES de insertar el pedido: si el crédito o los
    // puntos resultan insuficientes por una carrera con otra solicitud concurrente del
    // mismo cliente, finalize_order_customer_update (migración del mismo nombre) lanza
    // una excepción y el pedido NUNCA llega a crearse — en vez de quedar un pedido
    // marcado "pagado" sin el débito real detrás. La función aplica puntos + crédito +
    // contador de pedidos + última dirección + canje + bono de referido en UNA sola
    // transacción de Postgres.
    const updated = await rpc("finalize_order_customer_update", {
      p_phone: phone,
      p_points_delta: pointsDelta,
      p_credit_delta: useCredit ? -total : 0,
      p_total_orders_delta: 1,
      p_last_address: address,
      p_total_redeemed_delta: reward ? 1 : 0,
      p_referrer_phone: isReferral ? c.referred_by : null,
      p_referral_bonus: isReferral ? REFERRAL_BONUS_POINTS : 0,
    });
    customer = safeCustomer(updated);

    orderRows = await insertOrder();

    // Registro de auditoría (tabla transactions) — se hace DESPUÉS de que el saldo y el
    // pedido ya quedaron correctos arriba; si algo aquí falla, ambos siguen siendo la
    // fuente de verdad y solo falta una línea de historial, no un descuadre de dinero.
    // Los inserts de abajo no dependen entre sí, así que corren en paralelo en vez de serie.
    const auditInserts: Promise<unknown>[] = [
      sbInsert("transactions", {
        customer_phone: phone,
        type: "earn_confirmed",
        // basePoints (no `total`): ya incluye el multiplicador VIP — usar `total` acá
        // desalinearía el historial visible del cliente con lo que finalize_order_customer_update
        // realmente le acreditó arriba (el costo de canje de recompensa, si hay, se refleja
        // aparte como su propia transacción "redeem" más abajo).
        points: basePoints,
        description: useCredit ? "Pedido SND//WCH (pagado con crédito)" : "Pedido SND//WCH (pago con tarjeta)",
        order_ref: ref,
        confirmed: true,
      }),
    ];
    if (useCredit) {
      auditInserts.push(sbInsert("credit_ledger", {
        customer_phone: phone,
        delta: -total,
        reason: "Pedido pagado con crédito (" + ref + ")",
      }));
    }
    if (reward) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: phone,
        type: "redeem",
        points: -reward.pts,
        description: reward.label + " canjeado en pedido " + ref,
        order_ref: ref,
        confirmed: true,
      }));
    }
    if (isReferral) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: phone,
        type: "earn_confirmed",
        points: REFERRAL_BONUS_POINTS,
        description: "Bono por referido",
        confirmed: true,
      }));
      auditInserts.push(sbInsert("transactions", {
        customer_phone: c.referred_by,
        type: "earn_confirmed",
        points: REFERRAL_BONUS_POINTS,
        description: "Bono por invitar a " + name,
        confirmed: true,
      }));
    }
    await Promise.all(auditInserts);
  } else {
    orderRows = await insertOrder();
  }

  return { success: true, order: orderRows[0], customer };
}

// Campos que la pantalla de seguimiento de invitado (sin cuenta) realmente muestra —
// deliberadamente excluye customer_phone/customer_email. El `ref` es la única prueba de
// acceso en este modo (ver oref() en index.html, que ahora incluye un componente
// aleatorio para que no sea adivinable); igual no se expone más de lo necesario por si
// alguna vez se comparte o queda en un historial de navegador.
const GUEST_ORDER_FIELDS =
  "id,ref,customer_name,customer_address,summary,total,status,payment_status,payment_method,eta_minutes,redeemed_reward,created_at,date";
async function actMyOrders(b: any) {
  if (b.token) {
    const s = await requireSession(b.token);
    return { orders: await sbGet("orders", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc&limit=20`) };
  }
  if (b.ref) {
    const ref = String(b.ref).trim().slice(0, 40);
    return { orders: await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=${GUEST_ORDER_FIELDS}`) };
  }
  return { orders: [] };
}

async function actMyHistory(b: any) {
  const s = await requireSession(b.token);
  return { transactions: await sbGet("transactions", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc&limit=50`) };
}

const MAX_ADDRESSES = 6;
async function actAddressesList(b: any) {
  const s = await requireSession(b.token);
  return { addresses: await sbGet("saved_addresses", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.asc`) };
}
async function actAddressesAdd(b: any) {
  const s = await requireSession(b.token);
  const label = String(b.label || "").trim();
  const address = String(b.address || "").trim();
  if (!label || !address) throw new ApiError("Ingresa un nombre y la dirección.");
  const existing = await sbGet("saved_addresses", `customer_phone=eq.${encodeURIComponent(s.phone)}&select=id`);
  if (existing.length >= MAX_ADDRESSES) throw new ApiError("Ya tienes el máximo de direcciones guardadas (" + MAX_ADDRESSES + ").", 400);
  const rows = await sbInsert("saved_addresses", {
    customer_phone: s.phone,
    label,
    address,
    lat: typeof b.lat === "number" ? b.lat : null,
    lon: typeof b.lon === "number" ? b.lon : null,
  });
  return { success: true, address: rows[0] };
}
async function actAddressesDelete(b: any) {
  const s = await requireSession(b.token);
  const id = String(b.id || "");
  if (!id) throw new ApiError("Falta la dirección.");
  await sbDelete("saved_addresses", `id=eq.${encodeURIComponent(id)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

const MAX_FAVORITES = 10;
async function actFavoritesList(b: any) {
  const s = await requireSession(b.token);
  return { favorites: await sbGet("favorites", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc`) };
}
async function actFavoritesAdd(b: any) {
  const s = await requireSession(b.token);
  const name = String(b.name || "").trim();
  if (!name) throw new ApiError("Ponle un nombre a tu favorito.");
  const existing = await sbGet("favorites", `customer_phone=eq.${encodeURIComponent(s.phone)}&select=id`);
  if (existing.length >= MAX_FAVORITES) throw new ApiError("Ya tienes el máximo de favoritos guardados (" + MAX_FAVORITES + ").", 400);
  await loadCatalogPrices();
  deriveOrder(b);
  const rows = await sbInsert("favorites", { customer_phone: s.phone, name, build: buildFromOrder(b) });
  return { success: true, favorite: rows[0] };
}
async function actFavoritesDelete(b: any) {
  const s = await requireSession(b.token);
  const id = String(b.id || "");
  if (!id) throw new ApiError("Falta el favorito.");
  await sbDelete("favorites", `id=eq.${encodeURIComponent(id)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

async function actSubmitRating(b: any) {
  const ref = String(b.ref || "").trim();
  const stars = parseInt(b.stars, 10);
  if (!ref || !stars || stars < 1 || stars > 5) throw new ApiError("Calificación inválida.");
  const orders = await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=ref,customer_phone,status`);
  if (!orders.length) throw new ApiError("Pedido no encontrado.", 404);
  if (orders[0].status !== "ENTREGADO") throw new ApiError("Solo puedes calificar un pedido ya entregado.", 400);
  const existing = await sbGet("ratings", `order_ref=eq.${encodeURIComponent(ref)}&select=id`);
  if (existing.length) throw new ApiError("Este pedido ya fue calificado.", 409);
  await sbInsert("ratings", {
    order_ref: ref,
    customer_phone: orders[0].customer_phone || null,
    stars,
    comment: b.comment ? String(b.comment).trim().slice(0, 500) : null,
  });
  return { success: true };
}

const CHALLENGE_TARGET_ORDERS = 3;
const CHALLENGE_BONUS_POINTS = 50;
function monthKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
async function actClaimChallenge(b: any) {
  const s = await requireSession(b.token);
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(s.phone)}`);
  if (!rows.length) throw new ApiError("Cliente no encontrado.", 404);
  const c = rows[0];
  const now = new Date();
  const thisMonth = monthKey(now);
  if (c.challenge_claimed_month === thisMonth) throw new ApiError("Ya reclamaste el reto de este mes.", 409);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const orders = await sbGet(
    "orders",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&payment_status=eq.paid&created_at=gte.${encodeURIComponent(monthStart)}&select=id`,
  );
  if (orders.length < CHALLENGE_TARGET_ORDERS) throw new ApiError(`Todavía te faltan pedidos este mes (${orders.length}/${CHALLENGE_TARGET_ORDERS}).`, 400);
  await sbInsert("transactions", {
    customer_phone: s.phone,
    type: "earn_confirmed",
    points: CHALLENGE_BONUS_POINTS,
    description: "Reto mensual completado (" + CHALLENGE_TARGET_ORDERS + " pedidos)",
    confirmed: true,
  });
  // claim_monthly_challenge marca el mes como reclamado Y suma el bono en una sola
  // sentencia atómica — dos solicitudes simultáneas no pueden ambas pasar el chequeo
  // de arriba y duplicar el bono (la segunda llega tarde y la función lanza
  // 'already_claimed'). Devuelve la fila ya actualizada, evitando un segundo fetch de
  // customers que antes hacía falta solo para leer el estado post-bono.
  const claimed = await rpc("claim_monthly_challenge", { p_phone: s.phone, p_month: thisMonth, p_bonus: CHALLENGE_BONUS_POINTS });
  const finalRow = Array.isArray(claimed) ? claimed[0] : claimed;
  return { success: true, customer: safeCustomer(finalRow) };
}

async function actCreditGift(b: any) {
  const s = await requireSession(b.token);
  const toPhone = String(b.toPhone || "").trim();
  const amount = Number(b.amount || 0);
  if (!toPhone || !amount || amount <= 0) throw new ApiError("Ingresa un teléfono y un monto válido.");
  if (toPhone === s.phone) throw new ApiError("No puedes regalarte crédito a ti mismo.");
  const receiverRows = await sbGet("customers", `phone=eq.${encodeURIComponent(toPhone)}&select=phone`);
  if (!receiverRows.length) throw new ApiError("No encontramos una cuenta con ese teléfono.", 404);
  // gift_credit (migración atomic_balance_functions) debita al emisor y acredita al
  // receptor en UNA sola transacción de Postgres — si algo falla a la mitad, ambas
  // mitades se revierten juntas en vez de que el dinero "desaparezca".
  await rpc("gift_credit", { p_from: s.phone, p_to: toPhone, p_amount: amount });
  await Promise.all([
    sbInsert("credit_ledger", { customer_phone: s.phone, delta: -amount, reason: "Regalo enviado", related_phone: toPhone }),
    sbInsert("credit_ledger", { customer_phone: toPhone, delta: amount, reason: "Regalo recibido", related_phone: s.phone }),
  ]);
  return { success: true };
}

// Pide un registro más que el límite real para poder avisar si se recortó algo, en vez
// de que la cola/el export se vea completo cuando en realidad falta al final.
const ADMIN_ORDERS_LIMIT = 30;
async function actAdminOrders(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("orders", `status=in.(RECIBIDO,PREPARANDO,EN+CAMINO)&order=created_at.desc&limit=${ADMIN_ORDERS_LIMIT + 1}`);
  return { orders: rows.slice(0, ADMIN_ORDERS_LIMIT), truncated: rows.length > ADMIN_ORDERS_LIMIT };
}

// Cuando un pago que no se pudo verificar automáticamente (Yape, Plin, o un pedido
// legado contra entrega) se confirma manualmente por un operador, aquí es donde se
// otorgan los puntos (nunca antes), replicando la misma lógica de "puntos solo tras
// pago confirmado" que usa actPlaceOrder para tarjeta/crédito/recompensa.
async function confirmManualPayment(order: any) {
  if (!order.customer_phone) return;
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(order.customer_phone)}`);
  if (!rows.length) return;
  const c = rows[0];
  const isFirstOrder = (c.total_orders || 0) === 0;
  const methodLabel = order.payment_method === "yape" ? "Yape" : order.payment_method === "plin" ? "Plin" : "pago contra entrega";

  let referrerPhone: string | null = null;
  if (isFirstOrder && c.referred_by) {
    const referrerRows = await sbGet("customers", `phone=eq.${encodeURIComponent(c.referred_by)}&select=phone`);
    if (referrerRows.length) referrerPhone = c.referred_by;
  }

  // Una sola llamada atómica (ver migración finalize_order_customer_update) en vez de
  // varias secuenciales — mismo motivo que en actPlaceOrder.
  await rpc("finalize_order_customer_update", {
    p_phone: order.customer_phone,
    p_points_delta: order.total,
    p_credit_delta: 0,
    p_total_orders_delta: 1,
    p_last_address: order.customer_address,
    p_total_redeemed_delta: 0,
    p_referrer_phone: referrerPhone,
    p_referral_bonus: referrerPhone ? REFERRAL_BONUS_POINTS : 0,
  });

  await sbInsert("transactions", {
    customer_phone: order.customer_phone,
    type: "earn_confirmed",
    points: order.total,
    description: "Pedido SND//WCH (" + methodLabel + ")",
    order_ref: order.ref,
    confirmed: true,
  });
  if (referrerPhone) {
    await sbInsert("transactions", {
      customer_phone: order.customer_phone,
      type: "earn_confirmed",
      points: REFERRAL_BONUS_POINTS,
      description: "Bono por referido",
      confirmed: true,
    });
    await sbInsert("transactions", {
      customer_phone: referrerPhone,
      type: "earn_confirmed",
      points: REFERRAL_BONUS_POINTS,
      description: "Bono por invitar a " + order.customer_name,
      confirmed: true,
    });
  }
}

// CANCELADO deliberadamente NO está aquí: solo se llega a ese estado a través de
// actAdminCancelOrder, que además restituye el inventario descontado — si se agregara
// aquí, este endpoint genérico permitiría "cancelar" un pedido sin devolver el stock.
const VALID_ORDER_STATUSES = new Set(["RECIBIDO", "PREPARANDO", "EN CAMINO", "ENTREGADO"]);
async function actAdminUpdateStatus(b: any) {
  await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  const status = String(b.status || "");
  if (!orderId || !status) throw new ApiError("Faltan datos.");
  if (!VALID_ORDER_STATUSES.has(status)) throw new ApiError("Estado de pedido inválido.", 400);
  const upd: Record<string, unknown> = { status };
  if (b.etaMinutes) {
    const eta = Number(b.etaMinutes);
    if (!Number.isFinite(eta) || eta < 0 || eta > 240) throw new ApiError("ETA inválida.", 400);
    upd.eta_minutes = eta;
  }

  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,total,customer_phone,customer_name,customer_address,payment_method,payment_status`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);

  // Yape/Plin sin confirmar: no se puede avanzar el pedido de RECIBIDO — evita que
  // cocina empiece a preparar un pedido que en realidad nunca se pagó.
  if (order && (order.payment_method === "yape" || order.payment_method === "plin") && order.payment_status !== "paid" && status !== "RECIBIDO") {
    throw new ApiError("Confirma que el pago llegó antes de avanzar el estado del pedido.", 400);
  }

  if (status === "ENTREGADO" && order && order.payment_method === "cod" && order.payment_status !== "paid") {
    // Reclamo atómico: el filtro payment_status=neq.paid en la MISMA sentencia hace que,
    // si dos solicitudes llegan casi juntas (doble clic en "ENTREGADO"), solo una de ellas
    // encuentre la fila para actualizar — la otra recibe un array vacío y no vuelve a
    // otorgar puntos por el mismo pedido (ver el mismo patrón en actAdminConfirmPayment).
    const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid`, { payment_status: "paid" });
    if (claim.length) await confirmManualPayment(order);
  }

  const rows = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, upd);

  if (order?.customer_phone && STATUS_PUSH_MESSAGES[status]) {
    const msg = STATUS_PUSH_MESSAGES[status];
    // En "EN CAMINO" con ETA cargada, reemplazamos el cuerpo genérico por una ventana de
    // hora real (ej. "9:20 - 9:40") en vez de solo "ya casi llega" — mismo tipo de dato que
    // muestran las apps de delivery en su notificación de seguimiento.
    const body = status === "EN CAMINO" && upd.eta_minutes
      ? `Llega entre las ${etaWindowText(upd.eta_minutes as number)}.`
      : msg.body;
    try {
      await sendPushToPhone(order.customer_phone, {
        title: msg.title,
        body: body + " Ref: " + order.ref,
        url: "./index.html",
        tag: "sndwch-order-" + order.ref,
        renotify: true,
      });
    } catch {
      // un push fallido no debe bloquear la actualización de estado del pedido
    }
  }

  return { success: true, order: rows[0] };
}

// El operador revisa su propia app de Yape/Plin y confirma aquí que el dinero llegó
// antes de que el pedido pueda avanzar a cocina. Solo entonces se otorgan los puntos.
async function actAdminConfirmPayment(b: any) {
  await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,total,customer_phone,customer_name,customer_address,payment_method,payment_status`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (!["yape", "plin", "cod"].includes(order.payment_method)) {
    throw new ApiError("Este pedido no requiere confirmación manual de pago.", 400);
  }
  // Reclamo atómico ANTES de otorgar puntos: el filtro payment_status=neq.paid en la misma
  // sentencia hace que un doble clic o un reintento de red en "confirmar pago" solo pueda
  // ganarlo UNA vez — antes se leía payment_status, se otorgaban puntos, y RECIÉN AL FINAL
  // se marcaba paid, dejando una ventana donde dos solicitudes casi simultáneas otorgaban
  // el bono/puntos dos veces para el mismo pedido (confirmado en vivo durante la auditoría).
  const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid`, { payment_status: "paid" });
  if (!claim.length) throw new ApiError("Este pedido ya estaba confirmado.", 409);
  await confirmManualPayment(order);
  return { success: true, order: claim[0] };
}

// Cancela un pedido que nunca se pagó (típicamente Yape/Plin donde el cliente nunca
// transfirió) y restituye el stock que se había descontado al registrarlo — sin esto,
// un pago que nunca llega deja el pedido "vivo" para siempre y el inventario bloqueado.
// Compartido entre la cancelación manual (admin) y la expiración automática de abajo —
// re-deriva los ingredientes de cada línea del pedido y los devuelve al inventario.
async function restockOrderItems(items: any): Promise<void> {
  if (!Array.isArray(items) || !items.length) return;
  const ingredients: string[] = [];
  for (const it of items) {
    try {
      const priced = priceCartItem(it);
      for (let i = 0; i < priced.qty; i++) ingredients.push(...priced.ingredientsPerUnit);
    } catch {
      // Ítem legado que ya no encaja en el catálogo actual — no se puede re-derivar
      // su composición, así que se omite la restitución solo para ese ítem.
    }
  }
  if (!ingredients.length) return;
  const codes = Array.from(new Set(ingredients));
  const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
  await rpc("restock_inventory", { p_codes: codes, p_qtys: qtys });
}

async function actAdminCancelOrder(b: any) {
  const s = await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=id,status,payment_status,items`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (order.status === "ENTREGADO") throw new ApiError("Un pedido ya entregado no se puede cancelar.", 400);
  if (order.status === "CANCELADO") throw new ApiError("Este pedido ya está cancelado.", 409);
  if (order.payment_status === "paid") {
    throw new ApiError("Este pedido ya fue pagado — coordina un reembolso manual si corresponde antes de cancelarlo.", 400);
  }

  await restockOrderItems(order.items);

  const rows = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, { status: "CANCELADO" });
  await logAdminAction(s.phone, "cancel-order", orderId);
  return { success: true, order: rows[0] };
}

// Un pedido Yape/Plin que el cliente nunca terminó de transferir se quedaba "vivo" para
// siempre (RECIBIDO, con el inventario ya reservado) — nada lo cancelaba salvo que un
// operador lo notara y lo cancelara a mano. Este cron (ver migración del cron job) lo
// cancela solo tras STALE_MANUAL_PAYMENT_HOURS y devuelve el stock reservado, reusando
// exactamente la misma lógica de restitución que la cancelación manual del admin. Un
// pedido Yape/Plin sin pagar solo puede estar en RECIBIDO (actAdminUpdateStatus ya
// bloquea avanzarlo de estado sin confirmar el pago primero), así que ese es el único
// status que hace falta revisar aquí.
async function actExpireStaleManualPayments(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const cutoff = new Date(Date.now() - STALE_MANUAL_PAYMENT_HOURS * 3600000).toISOString();
  const stale = await sbGet(
    "orders",
    `payment_method=in.(yape,plin)&payment_status=neq.paid&status=eq.RECIBIDO&created_at=lt.${encodeURIComponent(cutoff)}&select=id,items`,
  );
  let cancelled = 0;
  for (const order of stale) {
    try {
      await restockOrderItems(order.items);
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { status: "CANCELADO" });
      cancelled++;
    } catch (e) {
      console.error("expire-stale-manual-payments failed for order", order.id, e);
    }
  }
  return { success: true, cancelled };
}

async function actPushSubscribe(b: any) {
  const s = await requireSession(b.token);
  const endpoint = String(b.endpoint || "");
  const p256dh = String(b.p256dh || "");
  const auth = String(b.auth || "");
  if (!endpoint || !p256dh || !auth) throw new ApiError("Faltan datos de la suscripción.");
  const existing = await sbGet("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}`);
  if (existing.length) {
    await sbUpdate("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}`, { customer_phone: s.phone, p256dh, auth });
  } else {
    await sbInsert("push_subscriptions", { customer_phone: s.phone, endpoint, p256dh, auth });
  }
  return { success: true };
}

async function actPushUnsubscribe(b: any) {
  const s = await requireSession(b.token);
  const endpoint = String(b.endpoint || "");
  if (!endpoint) throw new ApiError("Falta el endpoint.");
  await sbDelete("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

async function actAdminManualPoints(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const pts = parseInt(b.pts, 10);
  if (!phone || !pts || pts < 1) throw new ApiError("Ingresa teléfono y puntos válidos.");
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}&select=name`);
  if (!rows.length) throw new ApiError("Cliente no encontrado: " + phone, 404);
  await sbInsert("transactions", {
    customer_phone: phone,
    type: "earn_confirmed",
    points: pts,
    description: "Puntos manuales (admin)",
    confirmed: true,
  });
  const newPoints = await rpc("increment_customer_points", { p_phone: phone, p_delta: pts });
  await logAdminAction(s.phone, "manual-points", phone, { pts });
  return { success: true, name: rows[0].name, newPoints };
}

async function actAdminAccountsList(b: any) {
  await requireAdmin(b.token);
  return { accounts: await sbGet("admin_accounts", "order=created_at.asc") };
}
async function actAdminAccountsAdd(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const name = String(b.name || "").trim();
  if (!phone || !name) throw new ApiError("Ingresa nombre y teléfono.");
  await sbInsert("admin_accounts", { phone, name, role: "admin" });
  await logAdminAction(s.phone, "accounts-add", phone, { name });
  return { success: true };
}
async function actAdminAccountsDelete(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const rows = await sbGet("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  if (rows.length && rows[0].role === "superadmin") throw new ApiError("No se puede eliminar al superadmin.", 403);
  await sbDelete("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  await logAdminAction(s.phone, "accounts-delete", phone);
  return { success: true };
}

async function actAdminInventoryToggle(b: any) {
  await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const name = String(b.name || "").trim();
  const inStock = !!b.inStock;
  const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(code)}`);
  if (existing.length) {
    await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(code)}`, { in_stock: inStock });
  } else {
    await sbInsert("inventory", { product_code: code, product_name: name, in_stock: inStock });
  }
  return { success: true };
}

async function actAdminInventorySetStock(b: any) {
  await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const name = String(b.name || "").trim();
  if (!code) throw new ApiError("Falta el producto.");
  const qty = b.qty === null || b.qty === "" || b.qty === undefined ? null : Math.max(0, parseInt(b.qty, 10) || 0);
  const upd: Record<string, unknown> = { stock_qty: qty };
  if (qty != null) upd.in_stock = qty > 0;
  const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(code)}`);
  if (existing.length) {
    await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(code)}`, upd);
  } else {
    await sbInsert("inventory", { product_code: code, product_name: name, in_stock: qty == null || qty > 0, ...upd });
  }
  return { success: true };
}

const EXPORT_LIMIT = 5000;
async function actAdminExportOrders(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "orders",
    `select=ref,date,customer_name,customer_phone,customer_address,customer_email,summary,total,status,payment_status,payment_method,mode,size,eta_minutes,redeemed_reward,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
  return { orders: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}
async function actAdminExportCustomers(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "customers",
    `select=phone,name,email,points,pending_points,total_orders,total_redeemed,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
  return { customers: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}

// Precio aproximado de una línea de carrito YA guardada en un pedido — usado solo para
// atribuir ingresos por producto en el dashboard (no revalida nada, los pedidos ya
// pasaron por deriveCart al crearse).
function statUnitPrice(it: any): number {
  try {
    if (it.type === "side") return SIDE_PRICE[it.code] || 0;
    const size = it.size;
    if (it.type === "sig") {
      const sig = SIG_DATA[it.sigId];
      if (!sig) return 0;
      const pr = PROT_PRICE[sig.prot];
      const base = size === "15" ? sig.p15 : sig.p30;
      return base + (it.doubleProt && pr ? pr.pDbl : 0) + (it.extraSauce ? 2 : 0);
    }
    const pr2 = PROT_PRICE[it.prot];
    if (!pr2) return 0;
    const base2 = size === "15" ? pr2.p15 : pr2.p30;
    return base2 + (it.doubleProt ? pr2.pDbl : 0) + (it.extraSauce ? 2 : 0);
  } catch {
    return 0;
  }
}
function statItemLabel(it: any): string {
  if (it.type === "side") return SIDE_LABEL[it.code] || it.code || "otro";
  if (it.type === "sig") return SIG_LABEL[it.sigId] || it.sigId || "otro";
  return PROT_LABEL[it.prot] || it.prot || "otro";
}

const DASHBOARD_WINDOW_LIMIT = 5000;
async function actDashboardStats(b: any) {
  await requireAdmin(b.token);
  // Sin esto, "productos más vendidos" atribuiría ingresos con precios viejos si el
  // dueño cambió alguno desde que se desplegó la función por última vez.
  await loadCatalogPrices();

  const now = Date.now();
  const DAY = 86400000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(new Date(now));
  const weekStart = todayStart - 6 * DAY;
  const monthStart = startOfDay(new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1));
  // Los pedidos solo se necesitan en JS para las métricas de ventana reciente
  // (hoy/semana/mes/tendencia de 14 días/top productos) — todo lo que es una cifra de
  // "toda la tabla" (ingresos históricos, clientes, puntos, ratings) se calcula en SQL
  // vía dashboard_aggregates, así ya no queda acotado por un limit=1000/200 fijo que se
  // quedaría corto silenciosamente al crecer el negocio.
  const fetchSince = new Date(Math.min(monthStart, todayStart - 13 * DAY)).toISOString();

  const [agg, ordersRaw, outOfStock, allInventory, recentComments] = await Promise.all([
    rpc("dashboard_aggregates", { p_week_start: new Date(weekStart).toISOString(), p_month_start: new Date(monthStart).toISOString() }),
    // Antes traía select=* (hasta 5000 filas x todas las columnas) cuando lo único que se
    // usa más abajo son estas 6 — total/payment_status/created_at para las métricas de
    // período y tendencia, items/product_key/summary para el ranking de productos.
    sbGet(
      "orders",
      `select=total,payment_status,created_at,items,product_key,summary&created_at=gte.${encodeURIComponent(fetchSince)}&order=created_at.desc&limit=${DASHBOARD_WINDOW_LIMIT + 1}`,
    ),
    sbGet("inventory", "in_stock=eq.false&select=product_code,product_name"),
    sbGet("inventory", "stock_qty=not.is.null&select=product_code,product_name,stock_qty,low_stock_threshold"),
    sbGet("ratings", "select=stars,comment,order_ref,created_at&comment=not.is.null&order=created_at.desc&limit=5"),
  ]);
  // trend/topProducts se calculan sobre esta ventana reciente (no toda la tabla, ver
  // comentario arriba) — si algún día hay más de DASHBOARD_WINDOW_LIMIT pedidos en los
  // últimos ~14-31 días, avisamos en vez de recortar en silencio y mostrar un gráfico
  // incompleto sin que nadie lo note.
  const trendTruncated = ordersRaw.length > DASHBOARD_WINDOW_LIMIT;
  const orders = ordersRaw.slice(0, DASHBOARD_WINDOW_LIMIT);
  const lowStock = allInventory.filter((r: any) => r.stock_qty > 0 && r.stock_qty <= (r.low_stock_threshold || 5));

  const paidOrders = orders.filter((o: any) => o.payment_status === "paid");

  function periodStats(sinceMs: number) {
    const inRange = paidOrders.filter((o: any) => new Date(o.created_at).getTime() >= sinceMs);
    const revenue = inRange.reduce((s: number, o: any) => s + (o.total || 0), 0);
    return { revenue, count: inRange.length, avgTicket: inRange.length ? Math.round((revenue / inRange.length) * 100) / 100 : 0 };
  }

  const todayStats = periodStats(todayStart);
  const weekStats = periodStats(weekStart);
  const monthStats = periodStats(monthStart);
  const allTimeStats = {
    revenue: agg.allTime.revenue,
    count: agg.allTime.count,
    avgTicket: agg.allTime.count ? Math.round((agg.allTime.revenue / agg.allTime.count) * 100) / 100 : 0,
  };

  const trend: { date: string; revenue: number; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = todayStart - i * DAY;
    const dayEnd = dayStart + DAY;
    const inDay = paidOrders.filter((o: any) => {
      const t = new Date(o.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    });
    trend.push({
      date: new Date(dayStart).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
      revenue: inDay.reduce((s: number, o: any) => s + (o.total || 0), 0),
      count: inDay.length,
    });
  }

  // statusCounts/pendingPayment/codPending ahora vienen de dashboard_aggregates (calculados
  // sobre TODA la tabla orders en SQL), no del array `orders` que aquí solo cubre la ventana
  // reciente (mes actual + tendencia de 14 días).
  const statusCounts = agg.statusCounts as Record<string, number>;
  const pendingPayment = agg.pendingPayment as number;
  const codPending = agg.codPending as { count: number; total: number };

  // Pedidos con carrito multi-producto (items[]) se cuentan por línea real; los pedidos
  // legados de un solo sándwich (sin items[]) usan el resumen de texto como antes.
  const productMap: Record<string, { count: number; revenue: number }> = {};
  paidOrders.forEach((o: any) => {
    if (Array.isArray(o.items) && o.items.length) {
      o.items.forEach((it: any) => {
        const key = statItemLabel(it);
        const qty = it.qty || 1;
        if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
        productMap[key].count += qty;
        productMap[key].revenue += statUnitPrice(it) * qty;
      });
      return;
    }
    const key = o.product_key || (o.summary || "").split(" S/")[0].split("·")[0].trim() || "otro";
    if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
    productMap[key].count += 1;
    productMap[key].revenue += o.total || 0;
  });
  // Top productos del mes en curso (misma ventana que arriba) — una vista "reciente" es más
  // útil operativamente que un ranking histórico que nunca cambia, y evita tener que replicar
  // la lógica de precio/etiqueta por ítem (statItemLabel/statUnitPrice) en SQL.
  const topProducts = Object.entries(productMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b2) => b2.count - a.count)
    .slice(0, 6);

  // % de cambio vs. el período anterior de igual duración — el dato de "antes" ya viene
  // calculado en SQL (dashboard_aggregates), acá solo se arma el porcentaje; null cuando el
  // período anterior fue 0 (evita un Infinity/NaN sin sentido en vez de "+100%").
  function pctDelta(current: number, prev: number): number | null {
    if (!prev) return current > 0 ? null : 0;
    return Math.round(((current - prev) / prev) * 1000) / 10;
  }
  const weekPrev = agg.weekPrev as { revenue: number; count: number };
  const monthPrev = agg.monthPrev as { revenue: number; count: number };

  return {
    revenue: { today: todayStats, week: weekStats, month: monthStats, allTime: allTimeStats },
    trend,
    ordersByStatus: statusCounts,
    pendingPayment,
    codPending,
    topProducts,
    customers: {
      total: agg.customersTotal,
      newThisWeek: agg.newThisWeek,
      newThisMonth: agg.newThisMonth,
      returning: agg.returning,
      tiers: agg.tierCounts,
    },
    points: { issued: agg.pointsIssued, redeemed: agg.pointsRedeemed, outstanding: agg.pointsIssued - agg.pointsRedeemed },
    avgEtaMinutes: agg.avgEtaMinutes,
    outOfStock,
    lowStock,
    ratings: { avg: agg.ratingsAvg, count: agg.ratingsCount, recentComments },
    trendTruncated,
    referrals: agg.referrals,
    deltas: {
      weekRevenuePct: pctDelta(weekStats.revenue, weekPrev.revenue),
      monthRevenuePct: pctDelta(monthStats.revenue, monthPrev.revenue),
    },
    peakHours: agg.peakHours,
    peakDays: agg.peakDays,
  };
}

// Endpoint de salud para un monitor externo gratuito (ej. UptimeRobot) — antes de esto no
// había forma de detectar una caída total (como los incidentes de SESSION_SECRET/v32 de esta
// sesión) salvo esperar el reclamo de un cliente o revisar logs a mano. No requiere sesión;
// solo confirma que los secretos críticos están configurados y que la DB responde.
async function actPing(_b: any) {
  const checks = {
    db: false,
    sessionSecret: !!SESSION_SECRET,
    resendKey: !!RESEND_API_KEY,
    culqiKey: !!CULQI_SECRET_KEY,
    vapidKey: !!VAPID_PRIVATE_KEY,
  };
  try {
    await sbGet("customers", "select=phone&limit=1");
    checks.db = true;
  } catch (e) {
    await debugLog({ stage: "exception", context: "ping_db_check", error: String(e) });
  }
  const ok = checks.db && checks.sessionSecret;
  // Un monitor externo (UptimeRobot y similares) típicamente solo mira el código de estado
  // HTTP, no el cuerpo — por eso esto lanza en vez de devolver {ok:false} con 200.
  if (!ok) throw new ApiError("unhealthy: " + JSON.stringify(checks), 503);
  return { ok, checks };
}

const ACTIONS: Record<string, (b: any) => Promise<unknown>> = {
  ping: actPing,
  "get-catalog": actGetCatalog,
  register: actRegister,
  login: actLogin,
  "session-check": actSessionCheck,
  recover: actRecover,
  "logout-everywhere": actLogoutEverywhere,
  "delete-account": actDeleteAccount,
  "place-order": actPlaceOrder,
  "my-orders": actMyOrders,
  "my-history": actMyHistory,
  "addresses-list": actAddressesList,
  "addresses-add": actAddressesAdd,
  "addresses-delete": actAddressesDelete,
  "favorites-list": actFavoritesList,
  "favorites-add": actFavoritesAdd,
  "favorites-delete": actFavoritesDelete,
  "submit-rating": actSubmitRating,
  "claim-challenge": actClaimChallenge,
  "credit-gift": actCreditGift,
  "admin-orders": actAdminOrders,
  "admin-update-status": actAdminUpdateStatus,
  "admin-confirm-payment": actAdminConfirmPayment,
  "admin-cancel-order": actAdminCancelOrder,
  "expire-stale-manual-payments": actExpireStaleManualPayments,
  "admin-manual-points": actAdminManualPoints,
  "admin-accounts-list": actAdminAccountsList,
  "admin-accounts-add": actAdminAccountsAdd,
  "admin-accounts-delete": actAdminAccountsDelete,
  "admin-inventory-toggle": actAdminInventoryToggle,
  "admin-inventory-set-stock": actAdminInventorySetStock,
  "admin-catalog-set-price": actAdminCatalogSetPrice,
  "dashboard-stats": actDashboardStats,
  "export-orders": actAdminExportOrders,
  "export-customers": actAdminExportCustomers,
  "push-subscribe": actPushSubscribe,
  "push-unsubscribe": actPushUnsubscribe,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const action = String(body?.action || "");
  const handler = ACTIONS[action];
  if (!handler) return json({ error: "Acción desconocida: " + action }, 400);

  try {
    const result = await handler(body);
    return json(result);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    await debugLog({ stage: "exception", action, error: String(e) });
    return json({ error: "Error interno del servidor." }, 500);
  }
});
