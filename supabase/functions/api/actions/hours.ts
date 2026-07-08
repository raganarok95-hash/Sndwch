// SND//WCH — api / actions/hours
// Horario de atención editable desde el panel admin (antes era un array hardcodeado en
// env.ts que exigía redesplegar la función para cambiar un horario feriado o de temporada).
import { STORE_HOURS, loadStoreHours } from "../env.ts";
import { sbUpsert } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";

export async function actGetStoreHours(_b: any) {
  await loadStoreHours();
  return {
    hours: STORE_HOURS.map((range) => (range ? { open: range[0], close: range[1], closed: false } : { open: null, close: null, closed: true })),
  };
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
