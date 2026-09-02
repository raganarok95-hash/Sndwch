import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — winback-campaign
// Cron semanal: le escribe a clientes con correo que no piden hace 30+ días
// (y a quienes nunca se les mandó nada, o hace más de 30 días desde el último
// mensaje) para reactivarlos. No manda más de un correo cada 30 días por cliente.

import { sbGet, sbInsert, sbUpdate, debugLog, verifyCronSecret } from "../_shared/sb.ts";
import { emailShell } from "../_shared/email-shell.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const INACTIVE_DAYS = 30;
const DAY_MS = 86400000;
const SOURCE = "winback-campaign";

async function sendWinbackEmail(to: string, name: string, points: number) {
  if (!RESEND_API_KEY) return { ok: false, data: { skipped: true } };
  const html = emailShell("TE EXTRAÑAMOS //", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Hace tiempo no te vemos por SND//WCH. Todavía tienes <b style="color:#CBA258">${points} puntos</b> esperando ser canjeados, y seguimos con las mismas builds de siempre.</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:16px">Pide de nuevo en sndwch.app 🥪</p>
  `);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: "SND//WCH — Te extrañamos 🥪", html }),
  });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await verifyCronSecret(req.headers.get("x-cron-secret")))) return new Response("No autorizado", { status: 401 });

  try {
    const now = Date.now();
    // Antes traía los 2000 pedidos MÁS RECIENTES del negocio entero (sin filtro de fecha)
    // para reconstruir el último pedido por teléfono — con suficiente volumen (~300+
    // pedidos/día), 2000 filas dejan de cubrir 30 días completos y un cliente activo podía
    // caer al fallback de `created_at` (fecha de registro, mucho más antigua) y recibir el
    // correo de "te extrañamos" por error. Fix real: solo importa si el cliente pidió
    // dentro de la ventana de inactividad — filtrar por fecha, no por cantidad de filas,
    // resuelve la corrección sin importar el volumen (hallazgo de auditoría 2026-08-07).
    const cutoffIso = new Date(now - INACTIVE_DAYS * DAY_MS).toISOString();
    const [customers, orders] = await Promise.all([
      sbGet("customers", "select=phone,name,email,points,created_at,last_winback_sent&email=not.is.null&limit=20000"),
      sbGet(
        "orders",
        `select=customer_phone,created_at&payment_status=eq.paid&customer_phone=not.is.null&created_at=gte.${encodeURIComponent(cutoffIso)}&limit=20000`,
      ),
    ]);

    const lastOrderByPhone: Record<string, number> = {};
    orders.forEach((o: any) => {
      const t = new Date(o.created_at).getTime();
      if (!lastOrderByPhone[o.customer_phone] || t > lastOrderByPhone[o.customer_phone]) lastOrderByPhone[o.customer_phone] = t;
    });

    // SUPRESIÓN CRUZADA (2026-08-27). `phonesTouchedToday()` de la función `api` evita que
    // un mismo cliente reciba más de un aviso el mismo día, pero solo lo consultan los crons
    // que viven ahí. Esta función y birthday-bonus INSERTABAN en marketing_touches sin
    // leerla nunca. Y no es teórico: `sndwch-winback-campaign` y
    // `sndwch-remind-high-rank-winback` están programados al MISMO minuto (0 15 * * 1), y
    // winback no filtra por total_orders, así que un cliente de rango alto inactivo con
    // correo entra en las dos a la vez — push y correo en el mismo minuto, diciendo lo
    // mismo. Se replica la consulta acá porque son edge functions separadas y no comparten
    // módulo.
    let touchedToday = new Set<string>();
    try {
      const f = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" });
      const [y, m, d] = f.format(new Date()).split("-").map(Number);
      const since = new Date(Date.UTC(y, m - 1, d, 5, 0, 0)).toISOString();
      const rows = await sbGet("marketing_touches", `sent_at=gte.${encodeURIComponent(since)}&select=customer_phone&limit=20000`);
      touchedToday = new Set(rows.map((r: any) => String(r.customer_phone)));
    } catch (e) {
      // Mismo criterio que en `api`: ante un fallo de lectura se prefiere enviar.
      await debugLog(SOURCE, { stage: "touched_today_failed", error: String(e) });
    }

    let sent = 0;
    for (const c of customers) {
      if (touchedToday.has(String(c.phone))) continue;
      const lastActivity = lastOrderByPhone[c.phone] ?? new Date(c.created_at).getTime();
      const daysSinceActivity = (now - lastActivity) / DAY_MS;
      if (daysSinceActivity < INACTIVE_DAYS) continue;
      if (c.last_winback_sent) {
        const daysSinceEmail = (now - new Date(c.last_winback_sent).getTime()) / DAY_MS;
        if (daysSinceEmail < INACTIVE_DAYS) continue;
      }
      try {
        const res = await sendWinbackEmail(c.email, c.name, c.points || 0);
        // `res.ok` se registraba pero no se COMPROBABA: si Resend devolvía un error sin
        // lanzar excepción (rate limit, dominio rebotado, o simplemente RESEND_API_KEY sin
        // configurar, que devuelve {ok:false,skipped:true}), igual se marcaba
        // last_winback_sent y ese cliente quedaba bloqueado 30 días para un correo que
        // nunca recibió.
        if (!res.ok) {
          await debugLog(SOURCE, { stage: "email_not_ok", phone: c.phone });
          continue;
        }
        await sbUpdate("customers", `phone=eq.${encodeURIComponent(c.phone)}`, { last_winback_sent: new Date().toISOString() });
        // Log de marketing_touches (ver admin-campaign-performance en la función api) —
        // best-effort, un fallo acá nunca debe tumbar el envío ya hecho.
        try {
          await sbInsert("marketing_touches", { customer_phone: c.phone, campaign_type: "winback", channel: "email" });
        } catch (e) {
          await debugLog(SOURCE, { stage: "touch_log_failed", phone: c.phone, error: String(e) });
        }
        sent++;
        await debugLog(SOURCE, { stage: "email_sent", phone: c.phone, ok: res.ok });
      } catch (e) {
        await debugLog(SOURCE, { stage: "email_failed", phone: c.phone, error: String(e) });
      }
    }

    await debugLog(SOURCE, { stage: "done", checked: customers.length, sent });
    return new Response(JSON.stringify({ success: true, sent }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await debugLog(SOURCE, { stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
