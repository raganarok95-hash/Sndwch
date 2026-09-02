// SND//WCH — api / actions/hours
// Horario de atención editable desde el panel admin (antes era un array hardcodeado en
// env.ts que exigía redesplegar la función para cambiar un horario feriado o de temporada).
import { STORE_HOURS, loadStoreHours, META_PIXEL_ID, MAX_ORDERS_PER_HOUR, QUEUE_MINUTES_PER_ORDER } from "../env.ts";
import { sbGet, sbUpdate, sbUpsert } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";

// businessLaunched viene de app_settings (tabla singleton, fila única id=true) — la
// tarjeta "Avísame cuando abramos" del Home se condiciona a esta bandera real en vez de
// solo cust/wlDone, para que desaparezca sola el día del lanzamiento sin tocar código
// (hallazgo P1 de crítica impeccable 2026-07-30). El admin la togglea desde el panel.
// Pausa temporal: "hoy ya no puedo" / "vuelvo en 2 horas". Se compara contra la hora
// actual al leer, así que la tienda se reabre SOLA — nadie tiene que acordarse de
// revertirla. Antes esto obligaba a editar el horario semanal recurrente, y si se olvidaba
// revertirlo el negocio perdía ese mismo día de la semana siguiente entero.
export async function storePausedUntil(): Promise<string | null> {
  const rows = await sbGet("app_settings", "select=paused_until&id=eq.true");
  const until = rows?.[0]?.paused_until;
  if (!until) return null;
  return new Date(until).getTime() > Date.now() ? until : null;
}

export async function actGetStoreHours(_b: any) {
  await loadStoreHours();
  const settings = await sbGet("app_settings", "select=business_launched,paused_until&id=eq.true");
  const pausedUntilRaw = settings?.[0]?.paused_until;
  const pausedUntil = pausedUntilRaw && new Date(pausedUntilRaw).getTime() > Date.now() ? pausedUntilRaw : null;
  return {
    hours: STORE_HOURS.map((range) => (range ? { open: range[0], close: range[1], closed: false } : { open: null, close: null, closed: true })),
    businessLaunched: settings?.[0]?.business_launched === true,
    // El píxel de Meta se activa solo si el secret existe — así se prende sin redesplegar
    // el cliente, y mientras no esté configurado la app no carga ningún script de terceros.
    metaPixelId: META_PIXEL_ID || null,
    // El cliente lo usa para mostrar "volvemos a las X" en vez de un genérico "cerrado".
    pausedUntil,
    ...(await capacidad()),
  };
}

// ── Capacidad y cola (#23, #24, #16) ────────────────────────────────────────────────────
//
// Hasta acá el tope por hora existía SOLO en el servidor (`assertHourCapacity`), y el
// cliente se enteraba de que la franja estaba llena recién al tocar PAGAR — después de
// armar el sándwich entero, elegir la hora y escribir la dirección. Es el mismo defecto que
// ya obligó a poner el selector de distrito en el checkout: la restricción existía y la
// única forma de descubrirla era chocar contra ella.
//
// Sobre la "auto-pausa" (#23): pausar la TIENDA ENTERA cuando se llena una hora sería peor
// que lo que ya hay, porque bloquearía también las horas vacías. Lo que hace falta no es
// otro interruptor, es que el cliente VEA qué franjas están llenas antes de elegir.
//
// Y la "reapertura automática" (#24) sale gratis por construcción: esto se calcula en vivo
// contra la hora actual, así que cuando el reloj pasa una franja llena deja de estar llena
// sola. No hay ningún estado que alguien tenga que acordarse de revertir — mismo criterio
// que la pausa temporal, que se reanuda comparando contra la hora en vez de guardando un
// "cerrado" que después hay que apagar.
const CAPACITY_WINDOW_HOURS = 48;

async function capacidad(): Promise<{ fullHours: string[]; queueAhead: number; maxPerHour: number; queueMinutesPerOrder: number }> {
  const base = { fullHours: [] as string[], queueAhead: 0, maxPerHour: MAX_ORDERS_PER_HOUR, queueMinutesPerOrder: QUEUE_MINUTES_PER_ORDER };
  try {
    const desde = new Date();
    desde.setMinutes(0, 0, 0);
    const hasta = new Date(desde.getTime() + CAPACITY_WINDOW_HOURS * 3600000);
    const from = encodeURIComponent(desde.toISOString());
    const to = encodeURIComponent(hasta.toISOString());
    const [programados, inmediatos, enCola] = await Promise.all([
      sbGet("orders", `status=neq.CANCELADO&delivery_time=not.is.null&delivery_time=gte.${from}&delivery_time=lt.${to}&select=delivery_time&limit=1000`),
      sbGet("orders", `status=neq.CANCELADO&delivery_time=is.null&created_at=gte.${from}&created_at=lt.${to}&select=created_at&limit=1000`),
      // Lo que la cocina tiene por delante AHORA. "EN CAMINO" no cuenta: ese pedido ya
      // salió y no compite por el tiempo de armado del que está por entrar.
      sbGet("orders", `status=in.(RECIBIDO,PREPARANDO)&select=id&limit=200`),
    ]);
    const porHora = new Map<string, number>();
    const sumar = (iso: string) => {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return;
      d.setMinutes(0, 0, 0);
      const k = d.toISOString();
      porHora.set(k, (porHora.get(k) || 0) + 1);
    };
    for (const o of programados) sumar(o.delivery_time);
    for (const o of inmediatos) sumar(o.created_at);
    base.fullHours = [...porHora.entries()].filter(([, n]) => n >= MAX_ORDERS_PER_HOUR).map(([k]) => k).sort();
    base.queueAhead = enCola.length;
  } catch (e) {
    // La capacidad es información de apoyo: si falla, el cliente ve el horario igual y el
    // servidor sigue rechazando lo que no puede cumplir (`assertHourCapacity`). Romper
    // get-store-hours por esto dejaría la app sin poder decir siquiera si está abierta.
    console.error("capacidad() failed:", e);
  }
  return base;
}

export async function actAdminSetBusinessLaunched(b: any) {
  const s = await requireAdmin(b.token);
  const launched = b.launched === true;
  await sbUpdate("app_settings", "id=eq.true", { business_launched: launched, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "set-business-launched", undefined, { launched });
  return { success: true, launched };
}

export async function actAdminPauseStore(b: any) {
  const s = await requireAdmin(b.token);
  // minutes = 0 (o ausente) significa reanudar ahora mismo.
  const minutes = Number(b.minutes) || 0;
  if (minutes < 0 || minutes > 60 * 24 * 7) throw new ApiError("Duración de pausa inválida.", 400);
  const until = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : null;
  await sbUpdate("app_settings", "id=eq.true", { paused_until: until, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "pause-store", undefined, { minutes, until });
  return { success: true, pausedUntil: until };
}

export async function actAdminSetStoreHours(b: any) {
  const s = await requireAdmin(b.token);
  const days = Array.isArray(b.days) ? b.days : [];
  if (days.length !== 7) throw new ApiError("Debes enviar el horario de los 7 días.", 400);
  const rows = days.map((d: any, weekday: number) => {
    if (d && d.closed) return { weekday, open_hour: null, close_hour: null, closed: true };
    const open = Number(d?.open);
    const close = Number(d?.close);
    if (!Number.isFinite(open) || !Number.isFinite(close) || open < 0 || close > 24 || open >= close) {
      throw new ApiError("Horario inválido para uno de los días.", 400);
    }
    return { weekday, open_hour: open, close_hour: close, closed: false };
  });
  await sbUpsert("store_hours", rows, "weekday");
  await loadStoreHours();
  await logAdminAction(s.phone, "set-store-hours", undefined, { days: rows });
  return { success: true };
}
