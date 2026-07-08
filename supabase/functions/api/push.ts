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

export async function sendPushToPhone(
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
