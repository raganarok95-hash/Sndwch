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
export async function actGetStoreHours(_b: any) {
  await loadStoreHours();
  const settings = await sbGet("app_settings", "select=business_launched&id=eq.true");
  return {
    hours: STORE_HOURS.map((range) => (range ? { open: range[0], close: range[1], closed: false } : { open: null, close: null, closed: true })),
    businessLaunched: settings?.[0]?.business_launched === true,
    // El píxel de Meta se activa solo si el secret existe — así se prende sin redesplegar
    // el cliente, y mientras no esté configurado la app no carga ningún script de terceros.
    metaPixelId: META_PIXEL_ID || null,
  };
}

export async function actAdminSetBusinessLaunched(b: any) {
  const s = await requireAdmin(b.token);
  const launched = b.launched === true;
  await sbUpdate("app_settings", "id=eq.true", { business_launched: launched, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "set-business-launched", undefined, { launched });
  return { success: true, launched };
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
