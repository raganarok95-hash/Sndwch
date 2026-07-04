import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — winback-campaign
// Cron semanal: le escribe a clientes con correo que no piden hace 30+ días
// (y a quienes nunca se les mandó nada, o hace más de 30 días desde el último
// mensaje) para reactivarlos. No manda más de un correo cada 30 días por cliente.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const INACTIVE_DAYS = 30;
const DAY_MS = 86400000;

function sbHeaders(extra?: Record<string, string>) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra };
}
async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
async function sbUpdate(table: string, query: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: "PATCH", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Error actualizando ${table}: ${await r.text()}`);
  return r.json();
}
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, { method: "POST", headers: sbHeaders({ Prefer: "return=minimal" }), body: JSON.stringify({ source: "winback-campaign", detail }) });
  } catch (_e) {}
}
// El secreto compartido con pg_cron ya no vive como literal aquí — se valida contra
// Supabase Vault vía la misma RPC verify_cron_secret que usa la función api principal.
async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/verify_cron_secret`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ p_secret: provided }),
    });
    if (!r.ok) return false;
    return await r.json();
  } catch {
    return false;
  }
}
async function sendWinbackEmail(to: string, name: string, points: number) {
  if (!RESEND_API_KEY) return { ok: false, data: { skipped: true } };
  const html = `
    <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
      <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
        <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
        <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">TE EXTRAÑAMOS //</div>
        <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name},</p>
        <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Hace tiempo no te vemos por SND//WCH. Todavía tienes <b style="color:#CBA258">${points} puntos</b> esperando ser canjeados, y seguimos con las mismas builds de siempre.</p>
        <p style="font-size:12px;color:#8BAF9A;margin-top:16px">Pide de nuevo en sndwch.app 🥪</p>
      </div>
    </div>
  `;
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
    const [customers, orders] = await Promise.all([
      sbGet("customers", "select=phone,name,email,points,created_at,last_winback_sent&email=not.is.null"),
      sbGet("orders", "select=customer_phone,created_at&payment_status=eq.paid&customer_phone=not.is.null&order=created_at.desc&limit=2000"),
    ]);

    const lastOrderByPhone: Record<string, number> = {};
    orders.forEach((o: any) => {
      const t = new Date(o.created_at).getTime();
      if (!lastOrderByPhone[o.customer_phone] || t > lastOrderByPhone[o.customer_phone]) lastOrderByPhone[o.customer_phone] = t;
    });

    let sent = 0;
    for (const c of customers) {
      const lastActivity = lastOrderByPhone[c.phone] ?? new Date(c.created_at).getTime();
      const daysSinceActivity = (now - lastActivity) / DAY_MS;
      if (daysSinceActivity < INACTIVE_DAYS) continue;
      if (c.last_winback_sent) {
        const daysSinceEmail = (now - new Date(c.last_winback_sent).getTime()) / DAY_MS;
        if (daysSinceEmail < INACTIVE_DAYS) continue;
      }
      try {
        const res = await sendWinbackEmail(c.email, c.name, c.points || 0);
        await sbUpdate("customers", `phone=eq.${encodeURIComponent(c.phone)}`, { last_winback_sent: new Date().toISOString() });
        sent++;
        await debugLog({ stage: "email_sent", phone: c.phone, ok: res.ok });
      } catch (e) {
        await debugLog({ stage: "email_failed", phone: c.phone, error: String(e) });
      }
    }

    await debugLog({ stage: "done", checked: customers.length, sent });
    return new Response(JSON.stringify({ success: true, sent }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await debugLog({ stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
