// SND//WCH — api / Meta Conversions API (CAPI)
//
// El píxel del navegador solo mide lo que el navegador deja medir: bloqueadores de
// anuncios, Safari/iOS y las extensiones de privacidad se comen una parte grande de los
// eventos, y justo el más importante (la compra) es el que más se pierde. La Conversions
// API manda el mismo evento desde el servidor, donde nada lo puede bloquear — con esto
// Meta ve TODAS las ventas reales y puede optimizar la campaña contra ingresos de verdad
// en vez de contra clics.
//
// Los dos lados mandan el MISMO `event_id` (la referencia del pedido), que es como Meta
// deduplica: si el píxel del navegador sí logró reportar la compra, Meta descarta el
// duplicado en lugar de contarla dos veces.
//
// Todo esto está apagado mientras no existan los secrets. No lanza error si falta
// configuración: es telemetría de marketing, nunca debe tumbar un pedido que ya se cobró.
//   supabase secrets set META_PIXEL_ID=... META_CAPI_TOKEN=...
//
// PRIVACIDAD: los datos personales se mandan SIEMPRE hasheados con SHA-256 (es lo que
// exige Meta y lo único que se debe enviar) — nunca el teléfono o el correo en claro.
// Aun así, esto implica compartir identificadores de tus clientes con Meta: la Política
// de Privacidad debería decirlo antes de activar los secrets en producción.

import { META_PIXEL_ID, META_CAPI_TOKEN, META_GRAPH_VERSION } from "./env.ts";

export function metaCapiConfigured(): boolean {
  return !!META_PIXEL_ID && !!META_CAPI_TOKEN;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Meta exige normalizar ANTES de hashear (minúsculas, sin espacios, teléfono solo dígitos
// con código de país) — si no se normaliza igual que del otro lado, el hash no coincide
// con el del usuario real y la "calidad de coincidencia" se desploma sin dar ningún error.
async function hashEmail(email: string | null | undefined): Promise<string | null> {
  const v = String(email || "").trim().toLowerCase();
  return v.includes("@") ? await sha256Hex(v) : null;
}

// Los teléfonos se guardan como 9 dígitos (formato local peruano). Meta los quiere en
// formato internacional sin "+": 51 + los 9 dígitos.
async function hashPhone(phone: string | null | undefined): Promise<string | null> {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.length === 9 ? "51" + digits : digits;
  return await sha256Hex(full);
}

async function hashName(name: string | null | undefined): Promise<string | null> {
  const first = String(name || "").trim().toLowerCase().split(/\s+/)[0];
  return first ? await sha256Hex(first) : null;
}

export type CapiPurchase = {
  /** Referencia del pedido — el mismo valor que el píxel del navegador manda como eventID. */
  eventId: string;
  /** Solo la comida, sin el delivery (ver comentario en el llamador). */
  value: number;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  /** Cookies _fbp/_fbc del navegador: suben mucho la calidad de coincidencia si llegan. */
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  sourceUrl?: string | null;
  contents?: { id: string; quantity: number }[];
};

export async function sendPurchaseEvent(p: CapiPurchase): Promise<void> {
  if (!metaCapiConfigured()) return;
  try {
    const [em, ph, fn] = await Promise.all([hashEmail(p.email), hashPhone(p.phone), hashName(p.name)]);
    const user_data: Record<string, unknown> = {};
    if (em) user_data.em = [em];
    if (ph) {
      user_data.ph = [ph];
      // external_id permite a Meta unir varias visitas del mismo cliente aunque cambie de
      // dispositivo; se usa el mismo hash del teléfono, que es la identidad real acá.
      user_data.external_id = [ph];
    }
    if (fn) user_data.fn = [fn];
    if (p.fbp) user_data.fbp = p.fbp;
    if (p.fbc) user_data.fbc = p.fbc;
    if (p.clientIp) user_data.client_ip_address = p.clientIp;
    if (p.clientUserAgent) user_data.client_user_agent = p.clientUserAgent;

    const body = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: p.eventId,
        action_source: "website",
        ...(p.sourceUrl ? { event_source_url: p.sourceUrl } : {}),
        user_data,
        custom_data: {
          currency: "PEN",
          value: Math.round(p.value * 100) / 100,
          ...(p.contents && p.contents.length
            ? { contents: p.contents.map((c) => ({ id: c.id, quantity: c.quantity })), content_type: "product" }
            : {}),
        },
      }],
    };

    const r = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN!)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!r.ok) {
      // Se registra pero no se propaga: el pedido ya está cobrado y creado, y un fallo de
      // telemetría no puede convertirse en un error para el cliente.
      console.error("Meta CAPI Purchase falló:", r.status, await r.text());
    }
  } catch (e) {
    console.error("Meta CAPI Purchase lanzó excepción:", e);
  }
}

// ── Prueba del token sin registrar nada (2026-10-08) ─────────────────────────────────────
// Dueño: «Meta CAPI ya está colocado como secret. Revísalo bien». Que el secret EXISTA no dice
// que sirva: un token vencido, de otra cuenta o sin acceso a ESTE píxel hace que cada compra
// falle con un console.error que nadie lee, y la pauta optimiza a ciegas. Esto lo prueba de
// verdad contra Meta, en dos pasos:
//   1. GET /me — si el token vale (190 = vencido o mal copiado).
//   2. POST /{píxel}/events con UN evento propio fechado hace 8 días: Meta revisa el token y el
//      permiso sobre el píxel ANTES de mirar el evento, y después lo rechaza por viejo (acepta
//      hasta 7). Así se prueba el permiso de escritura sin sumar nada a las estadísticas.
// Nunca devuelve el token ni lo escribe en un log.
export type VerificacionCapi = {
  pixel: boolean;
  token: boolean;
  tokenValido: boolean | null;
  puedeEscribirAlPixel: boolean | null;
  detalle: string | null;
};

export async function verificarCapi(pixelPrueba?: string): Promise<VerificacionCapi> {
  // Sin argumento prueba el píxel del secret; con uno, ese otro (para encontrar a cuál conjunto
  // de datos pertenece el token cuando no coinciden: 2026-10-08).
  const pixelId = pixelPrueba || META_PIXEL_ID;
  const v: VerificacionCapi = { pixel: !!pixelId, token: !!META_CAPI_TOKEN, tokenValido: null, puedeEscribirAlPixel: null, detalle: null };
  if (!v.token) return v;
  const limpio = (m: unknown) => String(m || "").split(META_CAPI_TOKEN!).join("[token]").slice(0, 220);
  const base = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
  const tk = `access_token=${encodeURIComponent(META_CAPI_TOKEN!)}`;
  try {
    const me = await fetch(`${base}/me?fields=id&${tk}`);
    const dm = await me.json().catch(() => ({}));
    v.tokenValido = me.ok;
    if (!me.ok) {
      v.detalle = `token: (${dm?.error?.code ?? me.status}) ${limpio(dm?.error?.message)}`;
      return v;
    }
    if (!v.pixel) return v;
    const viejo = Math.floor(Date.now() / 1000) - 8 * 86400;
    const r = await fetch(`${base}/${pixelId}/events?${tk}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ event_name: "SndwchVerificacion", event_time: viejo, action_source: "website", user_data: { external_id: ["verificacion"] } }] }),
    });
    const lectura = leerRespuestaDelPixel(r.ok, await r.json().catch(() => ({})), limpio);
    v.puedeEscribirAlPixel = lectura.puede;
    if (lectura.tokenInvalido) v.tokenValido = false;
    v.detalle = lectura.detalle;
  } catch (e) {
    v.detalle = "no se pudo llegar a Meta: " + limpio(e);
  }
  return v;
}

/** Lee la respuesta del evento de prueba. Aparte y pura para poder probarla: si confunde
 *  «sin permiso» con «evento viejo», la verificación diría que todo está bien mientras cada
 *  compra real se pierde (tests-api/verificar-capi.test.ts). */
export function leerRespuestaDelPixel(ok: boolean, cuerpo: any, limpio: (m: unknown) => string = String): { puede: boolean | null; tokenInvalido: boolean; detalle: string | null } {
  if (ok) return { puede: true, tokenInvalido: false, detalle: null };
  const err = cuerpo?.error || {};
  const texto = `${err.message || ""} ${err.error_user_title || ""} ${err.error_user_msg || ""}`.trim();
  if (err.code === 190) return { puede: null, tokenInvalido: true, detalle: `token: (190) ${limpio(err.message)}` };
  if (err.error_subcode === 33 || err.code === 10 || err.code === 200 || /permission|permiso/i.test(texto)) {
    return { puede: false, tokenInvalido: false, detalle: `píxel: (${err.code}/${err.error_subcode ?? "-"}) ${limpio(err.message)}` };
  }
  // Pasó el token y el permiso, y Meta rechazó el evento por viejo: es lo esperado.
  // Meta responde en el idioma de la cuenta: el 2026-10-08 llegó «La fecha del evento es demasiado
  // antigua». El subcódigo 2804003 es el mismo en cualquier idioma.
  if (err.error_subcode === 2804003 || /timestamp|event_time|too far in the past|7 days|demasiado antigua|fecha del evento/i.test(texto)) {
    return { puede: true, tokenInvalido: false, detalle: null };
  }
  return { puede: null, tokenInvalido: false, detalle: `píxel, respuesta no esperada: (${err.code ?? "?"}/${err.error_subcode ?? "-"}) ${limpio(texto)}` };
}
