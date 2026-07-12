import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — weekly-summary
// Se dispara una vez por semana desde pg_cron (lunes) y le manda al dueño un correo con
// dos cosas que daily-summary no cubre por ser diario: comparativa semana-contra-semana
// (para decisiones, no solo el día a día) y una lista de reabastecimiento — qué productos
// están bajos/agotados AHORA, para comprar antes de que falten en plena semana. No hay un
// registro histórico de consumo por ingrediente (solo el stock_qty actual), así que la
// lista es de estado actual, no una proyección — evita inventar una analítica que no existe.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "raganarok95@gmail.com";

function sbHeaders() {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
}
async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, { method: "POST", headers: { ...sbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ source: "weekly-summary", detail }) });
  } catch (_e) {}
}
async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/verify_cron_secret`, { method: "POST", headers: sbHeaders(), body: JSON.stringify({ p_secret: provided }) });
    if (!r.ok) return false;
    return await r.json();
  } catch {
    return false;
  }
}

function pctDelta(current: number, previous: number): string {
  if (!previous) return current ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return (pct >= 0 ? "+" : "") + pct + "%";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await verifyCronSecret(req.headers.get("x-cron-secret")))) return new Response("No autorizado", { status: 401 });

  if (!RESEND_API_KEY) {
    await debugLog({ stage: "skipped", reason: "RESEND_API_KEY no configurado" });
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurado" }), { status: 500 });
  }

  try {
    const now = Date.now();
    const weekStart = new Date(now - 7 * 24 * 3600000).toISOString();
    const prevWeekStart = new Date(now - 14 * 24 * 3600000).toISOString();

    const [ordersThisWeek, ordersPrevWeek, customersThisWeek, inventory] = await Promise.all([
      sbGet("orders", `created_at=gte.${encodeURIComponent(weekStart)}&select=total,payment_status,created_at&limit=3000`),
      sbGet("orders", `created_at=gte.${encodeURIComponent(prevWeekStart)}&created_at=lt.${encodeURIComponent(weekStart)}&select=total,payment_status&limit=3000`),
      sbGet("customers", `created_at=gte.${encodeURIComponent(weekStart)}&select=phone`),
      sbGet("inventory", "select=product_code,product_name,in_stock,stock_qty,low_stock_threshold"),
    ]);

    const paidThisWeek = ordersThisWeek.filter((o: any) => o.payment_status === "paid");
    const paidPrevWeek = ordersPrevWeek.filter((o: any) => o.payment_status === "paid");
    const revenueThisWeek = paidThisWeek.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const revenuePrevWeek = paidPrevWeek.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const avgTicketThisWeek = paidThisWeek.length ? Math.round(revenueThisWeek / paidThisWeek.length) : 0;

    const needsRestock = inventory.filter((i: any) =>
      i.in_stock === false || (i.stock_qty != null && i.stock_qty <= (i.low_stock_threshold || 5)),
    );

    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#A8C8B0;font-size:13px">${label}</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right">${value}</td></tr>`;

    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">RESUMEN // SEMANAL</div>
          <table style="width:100%;border-collapse:collapse">
            ${row("Ventas esta semana", "S/" + revenueThisWeek + " (" + pctDelta(revenueThisWeek, revenuePrevWeek) + ")")}
            ${row("Pedidos pagados", String(paidThisWeek.length) + " (" + pctDelta(paidThisWeek.length, paidPrevWeek.length) + ")")}
            ${row("Ticket promedio", "S/" + avgTicketThisWeek)}
            ${row("Clientes nuevos", String(customersThisWeek.length))}
          </table>
          ${needsRestock.length
            ? `<div style="margin-top:18px;padding:14px;background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.3);border-radius:8px">
                <div style="font-size:11px;color:#ffa500;letter-spacing:.1em;margin-bottom:6px">PARA COMPRAR ESTA SEMANA //</div>
                ${needsRestock.map((i: any) => `<div style="font-size:12px;color:#F2F0EB;margin-bottom:4px">${i.in_stock === false ? "⛔" : "⚠"} ${i.product_name || i.product_code}${i.stock_qty != null ? " — quedan " + i.stock_qty : ""}</div>`).join("")}
              </div>`
            : `<div style="margin-top:18px;font-size:12px;color:#25D366">✓ Inventario sin alertas.</div>`}
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
        subject: `SND//WCH — Resumen semanal (S/${revenueThisWeek}, ${pctDelta(revenueThisWeek, revenuePrevWeek)})`,
        html,
      }),
    });
    const data = await r.json().catch(() => ({}));
    await debugLog({ stage: "resend_response", ok: r.ok, statusCode: r.status, data, revenueThisWeek, paidCount: paidThisWeek.length });
    if (!r.ok) return new Response(JSON.stringify({ error: data?.message || "Resend rechazó el envío" }), { status: 502 });
    return new Response(JSON.stringify({ success: true, revenueThisWeek, paidCount: paidThisWeek.length, restockCount: needsRestock.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    await debugLog({ stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
