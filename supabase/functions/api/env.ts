// SND//WCH — api / env
// Todas las variables de entorno y constantes de negocio del backend, centralizadas en
// un solo lugar en vez de estar dispersas (y a veces repetidas) por todo index.ts.

export const SB_URL = Deno.env.get("SUPABASE_URL")!;
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");
// Firma HMAC de las sesiones (clientes y admin) — DEBE venir de una variable de entorno,
// nunca vivir en el código fuente: quien lea este archivo (repo, backup, historial git)
// podría forjar un token válido para cualquier cuenta si estuviera hardcodeada aquí.
// Configúrala con: supabase secrets set SESSION_SECRET=...
// A propósito NO se lanza un throw aquí a nivel de módulo: un throw en este punto tumba
// TODA la función (incluido el manejo de OPTIONS/CORS) para TODAS las acciones, no solo
// las que usan sesión — un solo secreto faltante dejaría sin servicio hasta el catálogo
// público. El chequeo real vive en hmac() (session.ts), donde solo revienta la acción
// que de verdad necesita firmar/verificar un token.
export const SESSION_SECRET = Deno.env.get("SESSION_SECRET");
export const TOKEN_TTL_SECONDS = 30 * 24 * 3600;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
export const REFERRAL_BONUS_POINTS = 50;
// Antes solo un registro CON código de referido recibía puntos al crear cuenta — cualquier
// otro registro nuevo empezaba en 0 sin ningún incentivo de bienvenida.
export const WELCOME_BONUS_POINTS = 20;
// Antes los tiers (MEMBER/REGULAR/FREQUENT/VIP) eran solo una etiqueta/color sin ningún
// beneficio real — VIP ahora gana puntos extra por pedido.
export const VIP_POINTS_MULTIPLIER = 1.25;
export const STALE_MANUAL_PAYMENT_HOURS = 3;

// Par de llaves VAPID para Web Push. La pública NO es secreta — vive tal cual en el
// cliente (index.html) para pushManager.subscribe(); debe ser SIEMPRE el mismo par que
// la privada de abajo. La privada sí es un secreto real y se lee de una variable de
// entorno (configúrala con: supabase secrets set VAPID_PRIVATE_KEY=... — nunca la
// pongas directamente en este archivo). Sin ella, el envío de push queda deshabilitado
// mas el resto de la API sigue funcionando con normalidad.
// ⚠️ Reemplaza VAPID_SUBJECT por un mailto: o https: real del negocio antes de
// publicar (los servicios de push lo usan solo para contactarte en caso de abuso).
export const VAPID_PUBLIC_KEY = "BKTQjrOAOBVbt-wG_vUol13SrlwS0FrWppXxgu0velMopQOsIzxHF0hu3BDMSItRVHlan23RQZA6dF3wpbU1rA0";
export const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
export const VAPID_SUBJECT = "mailto:contacto@sndwch.com";

// Para mandar el PIN nuevo de recuperación de cuenta por correo en vez de devolverlo
// directo en la respuesta (ver actRecover). Comparte el mismo secreto de proyecto que
// usa la función send-order-email — configúralo con: supabase secrets set RESEND_API_KEY=...
export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
export const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "SND//WCH <pedidos@sndwch.app>";

// Identidad legal del negocio — persona natural con negocio (RUC 10). Usada en el
// Libro de Reclamaciones (obligatorio por el Código de Protección y Defensa del
// Consumidor / INDECOPI) y en el correo de notificación de reclamos al negocio.
export const BUSINESS_LEGAL_NAME = "Ezra Kemish Vertiz Labarrera";
export const BUSINESS_RUC = "10736044523";
export const BUSINESS_CITY = "Trujillo, Perú";
export const CONTACT_EMAIL = "contacto@sndwch.com";

// Horario de atención — debe reflejar EXACTAMENTE el mismo horario que STORE_HOURS en
// index.html (usado ahí solo para el badge visual; aquí se usa para rechazar pedidos
// programados fuera de horario, que el cliente podría forzar sin este chequeo).
export const STORE_HOURS: Array<[number, number] | null> = [
  [11, 22], [11, 22], [11, 22], [11, 22], [11, 22], [11, 22], [11, 22],
];
export function isWithinStoreHours(d: Date): boolean {
  const range = STORE_HOURS[d.getDay()];
  if (!range) return false;
  const h = d.getHours() + d.getMinutes() / 60;
  return h >= range[0] && h < range[1];
}

// Igual que loadCatalogPrices (catalog.ts) — una tabla (store_hours) sobreescribe estos
// valores hardcodeados EN EL MISMO ARRAY (nunca reasignando el binding `const`), así que
// cambiar el horario desde el panel admin ya no exige editar código y redesplegar. Si la
// tabla está vacía o falla la lectura, el horario hardcodeado de arriba sigue de respaldo.
export async function loadStoreHours(): Promise<void> {
  try {
    const { sbGet } = await import("./db.ts");
    const rows = await sbGet("store_hours", "select=weekday,open_hour,close_hour,closed");
    for (const row of rows) {
      const idx = Number(row.weekday);
      if (!Number.isInteger(idx) || idx < 0 || idx > 6) continue;
      STORE_HOURS[idx] = row.closed ? null : [Number(row.open_hour), Number(row.close_hour)];
    }
  } catch (e) {
    console.error("loadStoreHours failed:", e);
  }
}
