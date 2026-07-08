// SND//WCH — api / actions/health
// Endpoint de salud para un monitor externo gratuito (ej. UptimeRobot) — antes de esto no
// había forma de detectar una caída total (como los incidentes de SESSION_SECRET/v32 de esta
// sesión) salvo esperar el reclamo de un cliente o revisar logs a mano. No requiere sesión;
// solo confirma que los secretos críticos están configurados y que la DB responde.
import { SESSION_SECRET, RESEND_API_KEY, CULQI_SECRET_KEY, VAPID_PRIVATE_KEY } from "../env.ts";
import { sbGet } from "../db.ts";
import { ApiError } from "../types.ts";
import { debugLog } from "../logging.ts";

export async function actPing(_b: any) {
  const checks = {
    db: false,
    sessionSecret: !!SESSION_SECRET,
    resendKey: !!RESEND_API_KEY,
    culqiKey: !!CULQI_SECRET_KEY,
    vapidKey: !!VAPID_PRIVATE_KEY,
  };
  try {
    await sbGet("customers", "select=phone&limit=1");
    checks.db = true;
  } catch (e) {
    await debugLog({ stage: "exception", context: "ping_db_check", error: String(e) });
  }
  const ok = checks.db && checks.sessionSecret;
  // Un monitor externo (UptimeRobot y similares) típicamente solo mira el código de estado
  // HTTP, no el cuerpo — por eso esto lanza en vez de devolver {ok:false} con 200.
  if (!ok) throw new ApiError("unhealthy: " + JSON.stringify(checks), 503);
  return { ok, checks };
}
