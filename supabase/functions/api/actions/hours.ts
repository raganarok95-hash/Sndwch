// SND//WCH — api / actions/hours
// Horario de atención editable desde el panel admin (antes era un array hardcodeado en
// env.ts que exigía redesplegar la función para cambiar un horario feriado o de temporada).
import { STORE_HOURS, loadStoreHours, META_PIXEL_ID } from "../env.ts";
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
  const settings = await sbGet("app_settings", "select=business_launched,paused_until,google_review_url&id=eq.true");
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
    // URL de reseña de Google. Viaja por acá (público por diseño, igual que el píxel) para
    // que el dueño la pegue desde el panel sin redesplegar el cliente. Null mientras no la
    // haya configurado: sin URL no hay a dónde mandar a nadie.
    googleReviewUrl: settings?.[0]?.google_review_url || null,
  };
}

// La URL de reseña de Google es un dato REAL del negocio: no se puede inventar (misma
// regla que el RUC o la razón social), así que se pega desde el panel y nunca se hardcodea.
// Se valida que sea una URL de Google de verdad — pegar por error el link de otra cosa
// mandaría a todos los clientes a un sitio ajeno con el sello del negocio encima.
const GOOGLE_REVIEW_HOSTS = ["google.com", "goo.gl", "g.page", "maps.app.goo.gl"];
export async function actAdminSetGoogleReviewUrl(b: any) {
  const s = await requireAdmin(b.token);
  const raw = String(b.url || "").trim();
  if (!raw) {
    await sbUpdate("app_settings", "id=eq.true", { google_review_url: null, updated_at: new Date().toISOString() });
    await logAdminAction(s.phone, "set-google-review-url", undefined, { url: null });
    return { success: true, url: null };
  }
  let host = "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") throw new ApiError("El enlace debe empezar con https://", 400);
    host = u.hostname.toLowerCase().replace(/^www\./, "");
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Eso no parece un enlace válido. Copia el que te da Google para pedir reseñas.", 400);
  }
  if (!GOOGLE_REVIEW_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
    throw new ApiError("El enlace tiene que ser de Google (google.com, g.page o maps.app.goo.gl).", 400);
  }
  await sbUpdate("app_settings", "id=eq.true", { google_review_url: raw.slice(0, 500), updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "set-google-review-url", undefined, { url: raw.slice(0, 500) });
  return { success: true, url: raw.slice(0, 500) };
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
