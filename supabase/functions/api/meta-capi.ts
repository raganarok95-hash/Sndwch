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
