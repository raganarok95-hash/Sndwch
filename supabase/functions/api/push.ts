// SND//WCH — api / push
// Notificaciones push (Web Push / VAPID) para avisar cambios de estado de pedido.
import webpush from "npm:web-push@3.6.7";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from "./env.ts";
import { sbGet, sbDelete } from "./db.ts";
import { debugLog } from "./logging.ts";

// Envuelto en try/catch: una llave VAPID mal formada no debe tumbar TODA la función
// (mismo razonamiento que con SESSION_SECRET en env.ts) — sin esto el envío de push
// simplemente queda deshabilitado, en vez de dejar caído todo el backend.
if (VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.error("VAPID setup failed:", e);
  }
}

export const STATUS_PUSH_MESSAGES: Record<string, { title: string; body: string }> = {
  PREPARANDO: { title: "¡Tu pedido está en preparación!", body: "Ya estamos armando tu pedido." },
  "EN CAMINO": { title: "¡Tu pedido va en camino! 🛵", body: "Prepárate, ya casi llega." },
  ENTREGADO: { title: "¡Pedido entregado! ✅", body: "Gracias por tu compra. ¡Buen provecho!" },
};

// Ventana de hora estimada de llegada (estilo "9:20 - 9:40" tipo apps de delivery) a partir
// de los minutos que ingresa el operador — se calcula en hora de Perú (UTC-5, sin horario de
// verano) porque eso es lo que un cliente espera ver, no la hora UTC del servidor.
export function etaWindowText(etaMinutes: number): string {
  const fmt = (d: Date) => d.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hourCycle: "h23" });
  const now = Date.now();
  const from = new Date(now + (etaMinutes - 5) * 60000);
  const to = new Date(now + (etaMinutes + 5) * 60000);
  return `${fmt(from)} - ${fmt(to)}`;
}

type PushPayload = { title: string; body: string; url?: string; tag?: string; renotify?: boolean; vibrate?: number[]; urgency?: "very-low" | "low" | "normal" | "high" };

async function sendPushToSubs(subs: any[], payload: PushPayload) {
  if (!VAPID_PRIVATE_KEY) return;
  // urgency es un header del protocolo Web Push (RFC 8030), no va dentro del cuerpo
  // cifrado que arma el service worker — se separa acá para no reenviarlo dos veces.
  const { urgency, ...notification } = payload;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(notification),
        urgency ? { urgency } : undefined,
      );
    } catch (e: any) {
      // Suscripción caducada/inválida (el navegador la revocó) — la limpiamos.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sbDelete("push_subscriptions", `id=eq.${encodeURIComponent(sub.id)}`);
      } else {
        // Cualquier otro fallo de envío quedaba completamente silencioso antes de esto.
        await debugLog({ stage: "exception", context: "sendPushToSubs", statusCode: e?.statusCode, error: String(e) });
      }
    }
  }
}

export async function sendPushToPhone(
  phone: string,
  payload: PushPayload,
) {
  if (!VAPID_PRIVATE_KEY) return;
  const subs = await sbGet("push_subscriptions", `customer_phone=eq.${encodeURIComponent(phone)}`);
  await sendPushToSubs(subs, payload);
}

// push_subscriptions no distingue admin de cliente — un dueño/operador es simplemente una
// cuenta cuyo teléfono también aparece en admin_accounts, así que para avisarle buscamos sus
// suscripciones cruzando ambas tablas en vez de necesitar una columna/flag nueva.
export async function sendPushToAdmins(
  payload: PushPayload,
) {
  if (!VAPID_PRIVATE_KEY) return;
  const admins = await sbGet("admin_accounts", "select=phone");
  if (!admins.length) return;
  const phones = admins.map((a: any) => `"${a.phone}"`).join(",");
  const subs = await sbGet("push_subscriptions", `customer_phone=in.(${phones})`);
  await sendPushToSubs(subs, payload);
}
