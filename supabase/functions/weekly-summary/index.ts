import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — weekly-summary
// Se dispara una vez por semana desde pg_cron (lunes) y le manda al dueño un correo con
// dos cosas que daily-summary no cubre por ser diario: comparativa semana-contra-semana
// (para decisiones, no solo el día a día) y una lista de reabastecimiento — qué productos
// están bajos/agotados AHORA, para comprar antes de que falten en plena semana. No hay un
// registro histórico de consumo por ingrediente (solo el stock_qty actual), así que la
// lista es de estado actual, no una proyección — evita inventar una analítica que no existe.

import { sbGet, debugLog, verifyCronSecret } from "../_shared/sb.ts";
import { emailShell } from "../_shared/email-shell.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "raganarok95@gmail.com";
const SOURCE = "weekly-summary";

function pctDelta(current: number, previous: number): string {
  if (!previous) return current ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return (pct >= 0 ? "+" : "") + pct + "%";
}

// Debe reflejar el mismo rango que ve el cliente antes de pagar (src/app.ts,
// ESTIMATED_DELIVERY_RANGE) — si el promedio real se desvía, es una promesa que se
// está rompiendo, no solo un número curioso.
const ESTIMATED_DELIVERY_RANGE = [25, 40];

// Heurística de stock, no de ventas: no hay historial de consumo por producto, solo
// stock_qty actual. Un stock varias veces por encima del umbral de "bajo" puede ser
// sobre-compra o un producto que ya no rota — vale la pena que el dueño lo revise
// (fecha de vencimiento, rotación), pero esto NO mide velocidad de venta real.
const OVERSTOCK_MULTIPLIER = 5;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await verifyCronSecret(req.headers.get("x-cron-secret")))) return new Response("No autorizado", { status: 401 });

  if (!RESEND_API_KEY) {
    await debugLog(SOURCE, { stage: "skipped", reason: "RESEND_API_KEY no configurado" });
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurado" }), { status: 500 });
  }

  try {
    const now = Date.now();
    const weekStart = new Date(now - 7 * 24 * 3600000).toISOString();
    const prevWeekStart = new Date(now - 14 * 24 * 3600000).toISOString();

    const [ordersThisWeek, ordersPrevWeek, customersThisWeek, inventory, cancelledThisWeek] = await Promise.all([
      sbGet("orders", `created_at=gte.${encodeURIComponent(weekStart)}&select=total,payment_status,created_at&limit=3000`),
      sbGet("orders", `created_at=gte.${encodeURIComponent(prevWeekStart)}&created_at=lt.${encodeURIComponent(weekStart)}&select=total,payment_status&limit=3000`),
      sbGet("customers", `created_at=gte.${encodeURIComponent(weekStart)}&select=phone`),
      sbGet("inventory", "select=product_code,product_name,in_stock,stock_qty,low_stock_threshold"),
      sbGet("orders", `created_at=gte.${encodeURIComponent(weekStart)}&status=eq.CANCELADO&select=cancel_reason&limit=3000`),
    ]);
    const deliveredThisWeek = await sbGet(
      "orders",
      `created_at=gte.${encodeURIComponent(weekStart)}&delivered_at=not.is.null&select=created_at,delivered_at&limit=3000`,
    );

    const paidThisWeek = ordersThisWeek.filter((o: any) => o.payment_status === "paid");
    const paidPrevWeek = ordersPrevWeek.filter((o: any) => o.payment_status === "paid");
    const revenueThisWeek = paidThisWeek.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const revenuePrevWeek = paidPrevWeek.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const avgTicketThisWeek = paidThisWeek.length ? Math.round(revenueThisWeek / paidThisWeek.length) : 0;

    const needsRestock = inventory.filter((i: any) =>
      i.in_stock === false || (i.stock_qty != null && i.stock_qty <= (i.low_stock_threshold || 5)),
    );
    const possibleOverstock = inventory.filter((i: any) =>
      i.in_stock !== false && i.stock_qty != null && i.stock_qty >= OVERSTOCK_MULTIPLIER * (i.low_stock_threshold || 5),
    );

    const deliveryMinutes = deliveredThisWeek
      .map((o: any) => (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 60000)
      .filter((m: number) => m > 0 && m < 240);
    const avgDeliveryMin = deliveryMinutes.length
      ? Math.round(deliveryMinutes.reduce((s: number, m: number) => s + m, 0) / deliveryMinutes.length)
      : null;
    const deliveryOffPromise = avgDeliveryMin != null &&
      (avgDeliveryMin < ESTIMATED_DELIVERY_RANGE[0] - 5 || avgDeliveryMin > ESTIMATED_DELIVERY_RANGE[1] + 5);

    const cancelReasons = new Map<string, number>();
    for (const o of cancelledThisWeek) {
      const reason = o.cancel_reason || "Sin especificar";
      cancelReasons.set(reason, (cancelReasons.get(reason) || 0) + 1);
    }
    const cancelReasonRows = [...cancelReasons.entries()].sort((a, b) => b[1] - a[1]);

    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#A8C8B0;font-size:13px">${label}</td><td style="padding:6px 0;color:#fff;font-size:15px;font-weight:700;text-align:right">${value}</td></tr>`;

    const html = emailShell("RESUMEN // SEMANAL", `
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
      ${possibleOverstock.length
        ? `<div style="margin-top:14px;padding:14px;background:rgba(58,134,255,.1);border:1px solid rgba(58,134,255,.3);border-radius:8px">
            <div style="font-size:11px;color:#3A86FF;letter-spacing:.1em;margin-bottom:6px">POSIBLE SOBRE-STOCK (revisa vencimiento) //</div>
            ${possibleOverstock.map((i: any) => `<div style="font-size:12px;color:#F2F0EB;margin-bottom:4px">📦 ${i.product_name || i.product_code} — ${i.stock_qty} unidades</div>`).join("")}
            <div style="font-size:10px;color:#8BAF9A;margin-top:6px">Basado en nivel de stock, no en velocidad de venta real.</div>
          </div>`
        : ""}
      ${avgDeliveryMin != null
        ? `<div style="margin-top:14px;padding:14px;background:${deliveryOffPromise ? "rgba(255,71,87,.12)" : "rgba(37,211,102,.1)"};border:1px solid ${deliveryOffPromise ? "rgba(255,71,87,.3)" : "rgba(37,211,102,.3)"};border-radius:8px">
            <div style="font-size:11px;color:${deliveryOffPromise ? "#ff4757" : "#25D366"};letter-spacing:.1em;margin-bottom:4px">TIEMPO REAL DE ENTREGA //</div>
            <div style="font-size:13px;color:#F2F0EB">Promedio: <b>${avgDeliveryMin} min</b> (prometemos ${ESTIMATED_DELIVERY_RANGE[0]}-${ESTIMATED_DELIVERY_RANGE[1]} min)</div>
            ${deliveryOffPromise ? `<div style="font-size:11px;color:#ff4757;margin-top:4px">⚠ Se está desviando de lo prometido — considera ajustar el rango o el proceso.</div>` : ""}
          </div>`
        : ""}
      ${cancelReasonRows.length
        ? `<div style="margin-top:14px;padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px">
            <div style="font-size:11px;color:#A8C8B0;letter-spacing:.1em;margin-bottom:6px">MOTIVOS DE CANCELACIÓN ESTA SEMANA //</div>
            ${cancelReasonRows.map(([reason, count]) => `<div style="font-size:12px;color:#F2F0EB;margin-bottom:4px">${reason} — <b>${count}</b></div>`).join("")}
          </div>`
        : ""}
      <p style="font-size:11px;color:#8BAF9A;margin-top:20px">Panel completo → sndwch.app → PUNTOS → PANEL ADMIN → PANEL DE NEGOCIO</p>
    `);

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
    await debugLog(SOURCE, {
      stage: "resend_response", ok: r.ok, statusCode: r.status, data, revenueThisWeek, paidCount: paidThisWeek.length,
      avgDeliveryMin, deliveryOffPromise, overstockCount: possibleOverstock.length, cancelledCount: cancelledThisWeek.length,
    });
    if (!r.ok) return new Response(JSON.stringify({ error: data?.message || "Resend rechazó el envío" }), { status: 502 });
    return new Response(JSON.stringify({
      success: true, revenueThisWeek, paidCount: paidThisWeek.length, restockCount: needsRestock.length,
      overstockCount: possibleOverstock.length, avgDeliveryMin, cancelledCount: cancelledThisWeek.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    await debugLog(SOURCE, { stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
