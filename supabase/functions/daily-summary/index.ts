import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — daily-summary
// Se dispara una vez al día desde pg_cron (ver migración) y le manda al dueño
// un correo de cierre de día: ventas, pedidos abiertos, alertas de stock.
// No requiere sesión de usuario — solo un secreto compartido con el cron job.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "raganarok95@gmail.com";

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}
async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ source: "daily-summary", detail }),
    });
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await verifyCronSecret(req.headers.get("x-cron-secret")))) return new Response("No autorizado", { status: 401 });

  if (!RESEND_API_KEY) {
    await debugLog({ stage: "skipped", reason: "RESEND_API_KEY no configurado" });
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurado" }), { status: 500 });
  }

  try {
    const [orders, customers, outOfStock, recentErrors] = await Promise.all([
      sbGet("orders", "select=*&order=created_at.desc&limit=500"),
      sbGet("customers", "select=phone,created_at&order=created_at.desc&limit=500"),
      sbGet("inventory", "in_stock=eq.false&select=product_code,product_name"),
      sbGet("debug_logs", "select=source,detail,created_at&order=created_at.desc&limit=200"),
    ]);

    // "Hoy" en hora de Lima (UTC-5), sin depender de la zona horaria del runtime.
    const limaNow = new Date(Date.now() - 5 * 3600000);
    const todayKey = limaNow.toISOString().slice(0, 10);
    const isToday = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600000).toISOString().slice(0, 10) === todayKey;

    const ordersToday = orders.filter((o: any) => isToday(o.created_at));
    const paidToday = ordersToday.filter((o: any) => o.payment_status === "paid");
    const revenue = paidToday.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const avgTicket = paidToday.length ? Math.round(revenue / paidToday.length) : 0;
    const stillOpen = orders.filter((o: any) => ["RECIBIDO", "PREPARANDO", "EN CAMINO"].includes(o.status));
    const pendingPaymentToday = ordersToday.filter((o: any) => o.payment_status !== "paid").length;
    const newCustomersToday = customers.filter((c: any) => isToday(c.created_at)).length;

    // Ventana de 24h en errores propios — cualquier fila cuyo detail.stage suene a fallo
    // real, cruzando todas las funciones que ya escriben a debug_logs (incluida api).
    const cutoff24h = Date.now() - 24 * 3600000;
    const errorStages = new Set(["exception", "fetch_exception", "no_key", "resend_error"]);
    const recentErrorRows = recentErrors.filter((r: any) => {
      if (new Date(r.created_at).getTime() < cutoff24h) return false;
      const stage = r.detail?.stage;
      return errorStages.has(stage) || (stage === "resend_response" && r.detail?.ok === false);
    });
    const errorsBySource = new Map<string, number>();
    for (const r of recentErrorRows) errorsBySource.set(r.source, (errorsBySource.get(r.source) || 0) + 1);

    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#A8C8B0;font-size:13px">${label}</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right">${value}</td></tr>`;

    const alerts: string[] = [];
    if (stillOpen.length) alerts.push(`${stillOpen.length} pedido(s) siguen sin marcarse ENTREGADO`);
    if (pendingPaymentToday) alerts.push(`${pendingPaymentToday} pedido(s) de hoy sin pago confirmado`);
    if (outOfStock.length) alerts.push(`Sin stock: ${outOfStock.map((o: any) => o.product_name || o.product_code).join(", ")}`);
    if (errorsBySource.size) {
      const parts = Array.from(errorsBySource.entries()).map(([src, n]) => `${src} (${n})`);
      alerts.push(`${recentErrorRows.length} error(es) técnico(s) en las últimas 24h: ${parts.join(", ")}`);
    }

    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">CIERRE // DEL DÍA — ${todayKey}</div>
          <table style="width:100%;border-collapse:collapse">
            ${row("Ventas confirmadas hoy", "S/" + revenue)}
            ${row("Pedidos pagados hoy", String(paidToday.length))}
            ${row("Ticket promedio", "S/" + avgTicket)}
            ${row("Clientes nuevos hoy", String(newCustomersToday))}
            ${row("Pedidos activos (sin cerrar)", String(stillOpen.length))}
          </table>
          ${alerts.length
            ? `<div style="margin-top:18px;padding:14px;background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.3);border-radius:8px">
                <div style="font-size:11px;color:#ffa500;letter-spacing:.1em;margin-bottom:6px">ALERTAS //</div>
                ${alerts.map((a) => `<div style="font-size:12px;color:#F2F0EB;margin-bottom:4px">⚠ ${a}</div>`).join("")}
              </div>`
            : `<div style="margin-top:18px;font-size:12px;color:#25D366">✓ Sin pendientes ni alertas.</div>`}
          <p style="font-size:11px;color:#8BAF9A;margin-top:20px">Panel completo → sndwch.app → PUNTOS → PANEL ADMIN → PANEL DE NEGOCIO</p>
        </div>
      </div>
    `;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        subject: `SND//WCH — Cierre del día ${todayKey} (S/${revenue})`,
        html,
      }),
    });
    const data = await r.json().catch(() => ({}));
    await debugLog({ stage: "resend_response", ok: r.ok, statusCode: r.status, data, revenue, paidCount: paidToday.length });
    if (!r.ok) return new Response(JSON.stringify({ error: data?.message || "Resend rechazó el envío" }), { status: 502 });
    return new Response(JSON.stringify({ success: true, revenue, paidCount: paidToday.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    await debugLog({ stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
