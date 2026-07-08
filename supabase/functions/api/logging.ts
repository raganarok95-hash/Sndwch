// SND//WCH — api / logging
// Registro best-effort a debug_logs (fallos internos) y admin_action_log (auditoría de
// acciones admin sensibles) — un fallo al loguear nunca debe tumbar la respuesta real.
import { SB_URL } from "./env.ts";
import { sbHeaders, sbInsert } from "./db.ts";

// A diferencia de daily-summary/birthday-bonus/winback-campaign/send-order-email, esta
// función (la de mayor tráfico y la que mueve dinero real) no escribía ningún registro a
// debug_logs — sus fallos solo vivían en console.error, visible nada más desde el panel de
// logs de Supabase.
export async function debugLog(detail: unknown) {
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
export async function logAdminAction(actorPhone: string, action: string, target?: string, detail?: unknown) {
  try {
    await sbInsert("admin_action_log", { actor_phone: actorPhone, action, target: target ?? null, detail: detail ?? null });
  } catch (_e) { /* nunca debe tumbar la acción real */ }
}
