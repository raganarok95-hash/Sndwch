// SND//WCH — api / actions/admin
// Puntos manuales, gestión de cuentas admin, inventario, exportación CSV y las métricas
// del panel de negocio.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin, safeCustomer, verifyCronSecret } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { loadCatalogPrices, buildTopProducts, priceCartItem, SIG_DATA, SIG_LABEL } from "../catalog.ts";
import { computeRankName } from "../env.ts";
import { sendPushToPhone, sendPushToAdmins } from "../push.ts";

// Cuando un ingrediente que faltaba vuelve a stock, revisa si eso hace que algún
// Signature que dependía de él (base o proteína) vuelva a estar completo, y si es así
// avisa a quienes pidieron "avísame cuando vuelva" (ver actRequestRestockNotify,
// customer.ts) — sin esto, esa demanda quedaba perdida en silencio: la tarjeta AGOTADO
// ni siquiera dejaba intentar pedirlo.
async function notifyRestockedSignatures(restockedCode: string): Promise<void> {
  const affectedSigIds = Object.entries(SIG_DATA)
    .filter(([, sig]) => sig.base === restockedCode || sig.prot === restockedCode)
    .map(([id]) => id);
  if (!affectedSigIds.length) return;
  for (const sigId of affectedSigIds) {
    const sig = SIG_DATA[sigId];
    const rows = await sbGet(
      "inventory",
      `product_code=in.(${encodeURIComponent(sig.base)},${encodeURIComponent(sig.prot)})&select=product_code,in_stock`,
    );
    const baseRow = rows.find((r: any) => r.product_code === sig.base);
    const protRow = rows.find((r: any) => r.product_code === sig.prot);
    // Sin fila en inventory = nunca se marcó agotado, así que cuenta como disponible.
    const baseOk = !baseRow || baseRow.in_stock !== false;
    const protOk = !protRow || protRow.in_stock !== false;
    if (!baseOk || !protOk) continue;
    const requests = await sbGet("restock_notify_requests", `sig_id=eq.${encodeURIComponent(sigId)}&select=id,customer_phone`);
    if (!requests.length) continue;
    for (const r of requests) {
      try {
        await sendPushToPhone(r.customer_phone, {
          title: "¡Ya volvió!",
          body: (SIG_LABEL[sigId] || "El sabor que pediste") + " ya está disponible de nuevo.",
          url: "./index.html",
          tag: "sndwch-restock-" + sigId,
        });
      } catch {
        // un push fallido no debe bloquear el resto de los avisos
      }
    }
    await sbDelete("restock_notify_requests", `sig_id=eq.${encodeURIComponent(sigId)}`);
  }
}

export async function actAdminManualPoints(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const pts = parseInt(b.pts, 10);
  if (!phone || !pts || pts < 1) throw new ApiError("Ingresa teléfono y puntos válidos.");
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}&select=name`);
  if (!rows.length) throw new ApiError("Cliente no encontrado: " + phone, 404);
  // El RPC que de verdad mueve el saldo va PRIMERO — antes el insert de auditoría
  // (transactions) se hacía antes que esto, así que un fallo entre ambos dejaba un
  // registro de "se otorgaron puntos" sin que el saldo real cambiara. En el orden
  // correcto, si algo falla es al revés: el saldo ya cambió pero falta la línea de
  // historial, que es un problema mucho menor (hallazgo de la auditoría de backend).
  const newPoints = await rpc("increment_customer_points", { p_phone: phone, p_delta: pts });
  await sbInsert("transactions", {
    customer_phone: phone,
    type: "earn_confirmed",
    points: pts,
    description: "Puntos manuales (admin)",
    confirmed: true,
  });
  await logAdminAction(s.phone, "manual-points", phone, { pts });
  return { success: true, name: rows[0].name, newPoints };
}

// Corrección de saldo de crédito interno a mano — no existía ninguna herramienta
// equivalente a actAdminManualPoints para credit_balance (hallazgo de auditoría de
// código, ALTO). Acepta delta positivo o negativo (a diferencia de los puntos
// manuales, que solo suman) porque también sirve para corregir un exceso otorgado por
// error, no solo para dar de más.
export async function actAdminManualCredit(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const delta = Number(b.delta);
  if (!phone || !delta || !isFinite(delta)) throw new ApiError("Ingresa teléfono y un monto válido (puede ser negativo).");
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}&select=name`);
  if (!rows.length) throw new ApiError("Cliente no encontrado: " + phone, 404);
  let updated: any;
  try {
    updated = await rpc("admin_adjust_credit", { p_phone: phone, p_delta: delta });
  } catch (e) {
    if (e instanceof Error && e.message.includes("insufficient_balance")) {
      throw new ApiError("Ese descuento dejaría el saldo del cliente en negativo.", 409);
    }
    throw e;
  }
  await sbInsert("credit_ledger", {
    customer_phone: phone,
    delta,
    reason: "Ajuste manual (admin)",
  });
  await logAdminAction(s.phone, "manual-credit", phone, { delta });
  return { success: true, name: rows[0].name, newBalance: updated.credit_balance };
}

export async function actAdminAccountsList(b: any) {
  await requireAdmin(b.token);
  return { accounts: await sbGet("admin_accounts", "order=created_at.asc") };
}
// Agregar un admin nuevo es tan sensible como quitarle el acceso a uno (otorga acceso
// administrativo total y persistente) — antes solo exigía requireAdmin, sin reconfirmar
// el PIN de quien lo hace, a diferencia de actAdminAccountsDelete que sí lo pide desde
// hace tiempo. Con una sesión admin robada, esto era un backdoor de un solo request que
// sobrevivía a logout-everywhere (hallazgo de auditoría de seguridad, MEDIO).
export async function actAdminAccountsAdd(b: any) {
  const s = await requireAdmin(b.token);
  const pin = String(b.pin || "").trim();
  if (!pin) throw new ApiError("Ingresa tu PIN para confirmar.", 400);
  const ok = await rpc("verify_pin", { p_phone: s.phone, plain: pin });
  if (!ok) throw new ApiError("PIN incorrecto.", 401);
  const phone = String(b.phone || "").trim();
  const name = String(b.name || "").trim();
  if (!phone || !name) throw new ApiError("Ingresa nombre y teléfono.");
  await sbInsert("admin_accounts", { phone, name, role: "admin" });
  await logAdminAction(s.phone, "accounts-add", phone, { name });
  return { success: true };
}
// Quitarle el acceso a otro administrador es irreversible y de mayor impacto
// operativo que borrar la cuenta de un cliente cualquiera (deja a alguien fuera del
// panel a media jornada) — antes esta acción pedía MENOS fricción que borrar la propia
// cuenta de cliente (esa sí exige reingresar el PIN, ver actDeleteAccount). Ahora exige
// el PIN de quien ejecuta la acción, igual criterio que ahí (hallazgo de auditoría UX).
export async function actAdminAccountsDelete(b: any) {
  const s = await requireAdmin(b.token);
  const pin = String(b.pin || "").trim();
  if (!pin) throw new ApiError("Ingresa tu PIN para confirmar.", 400);
  const ok = await rpc("verify_pin", { p_phone: s.phone, plain: pin });
  if (!ok) throw new ApiError("PIN incorrecto.", 401);
  const phone = String(b.phone || "").trim();
  const rows = await sbGet("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  if (rows.length && rows[0].role === "superadmin") throw new ApiError("No se puede eliminar al superadmin.", 403);
  await sbDelete("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  await logAdminAction(s.phone, "accounts-delete", phone);
  return { success: true };
}

export async function actAdminInventoryToggle(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const name = String(b.name || "").trim();
  const inStock = !!b.inStock;
  const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(code)}`);
  if (existing.length) {
    await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(code)}`, { in_stock: inStock });
  } else {
    await sbInsert("inventory", { product_code: code, product_name: name, in_stock: inStock });
  }
  if (inStock) await notifyRestockedSignatures(code);
  // Acciones de config comparable (catalog-set-price, set-store-hours) ya se auditan —
  // esta quedaba afuera por inconsistencia, no por menor sensibilidad real (hallazgo de
  // auditoría de código, BAJO).
  await logAdminAction(s.phone, "inventory-toggle", code, { inStock });
  return { success: true };
}

export async function actAdminInventorySetStock(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const name = String(b.name || "").trim();
  if (!code) throw new ApiError("Falta el producto.");
  const qty = b.qty === null || b.qty === "" || b.qty === undefined ? null : Math.max(0, parseInt(b.qty, 10) || 0);
  const upd: Record<string, unknown> = { stock_qty: qty };
  if (qty != null) upd.in_stock = qty > 0;
  const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(code)}`);
  if (existing.length) {
    await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(code)}`, upd);
  } else {
    await sbInsert("inventory", { product_code: code, product_name: name, in_stock: qty == null || qty > 0, ...upd });
  }
  if (qty == null || qty > 0) await notifyRestockedSignatures(code);
  await logAdminAction(s.phone, "inventory-set-stock", code, { qty });
  return { success: true };
}

const EXPORT_LIMIT = 5000;
export async function actAdminExportOrders(b: any) {
  const s = await requireAdmin(b.token);
  const rows = await sbGet(
    "orders",
    `select=ref,date,customer_name,customer_phone,contact_phone,customer_address,customer_email,summary,total,status,payment_status,payment_method,mode,size,eta_minutes,redeemed_reward,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
  // Exporta teléfono/dirección/correo de TODOS los pedidos — tan sensible como cualquier
  // otra acción admin que ya se audita, y no quedaba ningún rastro de quién lo descargó
  // (hallazgo de auditoría de código, ALTO).
  await logAdminAction(s.phone, "export-orders", undefined, { count: Math.min(rows.length, EXPORT_LIMIT) });
  return { orders: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}
export async function actAdminExportCustomers(b: any) {
  const s = await requireAdmin(b.token);
  const rows = await sbGet(
    "customers",
    `select=phone,name,email,points,pending_points,total_orders,total_redeemed,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
  await logAdminAction(s.phone, "export-customers", undefined, { count: Math.min(rows.length, EXPORT_LIMIT) });
  return { customers: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}

// Ganancia estimada = ingresos × (1 - costo de insumos). El % viene de lo que el dueño
// reportó (~40-50% del precio de venta) — no hay costo real por receta en el sistema
// (ver env.ts/catalog.ts: solo precios de venta, ningún costo de ingrediente), así que
// esto SIEMPRE se muestra como rango, nunca como cifra exacta, para no aparentar una
// precisión que no existe.
const COGS_LOW = 0.4;
const COGS_HIGH = 0.5;
function estimatedProfitRange(revenue: number): { low: number; high: number } {
  return {
    low: Math.round(revenue * (1 - COGS_HIGH)),
    high: Math.round(revenue * (1 - COGS_LOW)),
  };
}

const DASHBOARD_WINDOW_LIMIT = 5000;
export async function actDashboardStats(b: any) {
  await requireAdmin(b.token);
  // Sin esto, "productos más vendidos" atribuiría ingresos con precios viejos si el
  // dueño cambió alguno desde que se desplegó la función por última vez.
  await loadCatalogPrices();

  const now = Date.now();
  const DAY = 86400000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(new Date(now));
  const weekStart = todayStart - 6 * DAY;
  const monthStart = startOfDay(new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1));
  // Los pedidos solo se necesitan en JS para las métricas de ventana reciente
  // (hoy/semana/mes/tendencia de 14 días/top productos) — todo lo que es una cifra de
  // "toda la tabla" (ingresos históricos, clientes, puntos, ratings) se calcula en SQL
  // vía dashboard_aggregates, así ya no queda acotado por un limit=1000/200 fijo que se
  // quedaría corto silenciosamente al crecer el negocio.
  const fetchSince = new Date(Math.min(monthStart, todayStart - 13 * DAY)).toISOString();

  const [agg, ordersRaw, outOfStock, allInventory, sourceRows] = await Promise.all([
    rpc("dashboard_aggregates", { p_week_start: new Date(weekStart).toISOString(), p_month_start: new Date(monthStart).toISOString() }),
    // Antes traía select=* (hasta 5000 filas x todas las columnas) cuando lo único que se
    // usa más abajo son estas — total/payment_status/created_at para las métricas de
    // período y tendencia, items/product_key/summary para el ranking de productos,
    // payment_method/status para el desglose Yape/Plin confirmados vs. abandonados.
    sbGet(
      "orders",
      // customer_phone se agregó para poder atribuir ingresos de esta misma ventana a
      // acquisition_source más abajo (bySource) — antes bySource solo contaba
      // registros/conversión, nunca cuánto dinero trajo cada canal.
      `select=total,payment_status,created_at,items,product_key,summary,payment_method,status,customer_phone&created_at=gte.${encodeURIComponent(fetchSince)}&order=created_at.desc&limit=${DASHBOARD_WINDOW_LIMIT + 1}`,
    ),
    sbGet("inventory", "in_stock=eq.false&select=product_code,product_name"),
    sbGet("inventory", "stock_qty=not.is.null&select=product_code,product_name,stock_qty,low_stock_threshold"),
    // Para medir si una campaña paga (?src=... en el link del anuncio) se está pagando
    // sola — agrupado en JS en vez de SQL porque el volumen de clientes de un negocio así
    // nunca justifica una función RPC nueva solo para este conteo. `phone` se agregó para
    // poder cruzar contra `orders` y calcular ingresos/ticket promedio por fuente.
    sbGet("customers", "select=phone,acquisition_source,total_orders&acquisition_source=not.is.null"),
  ]);
  // trend/topProducts se calculan sobre esta ventana reciente (no toda la tabla, ver
  // comentario arriba) — si algún día hay más de DASHBOARD_WINDOW_LIMIT pedidos en los
  // últimos ~14-31 días, avisamos en vez de recortar en silencio y mostrar un gráfico
  // incompleto sin que nadie lo note.
  const trendTruncated = ordersRaw.length > DASHBOARD_WINDOW_LIMIT;
  const orders = ordersRaw.slice(0, DASHBOARD_WINDOW_LIMIT);
  const lowStock = allInventory.filter((r: any) => r.stock_qty > 0 && r.stock_qty <= (r.low_stock_threshold || 5));

  // status !== "CANCELADO" agregado (auditoría de análisis de negocio, ALTO) — un pedido
  // cancelado sigue payment_status:'paid' (el reembolso se coordina manualmente fuera del
  // sistema, ver needsManualRefund en orders.ts) y sin este filtro se seguía contando como
  // ingreso real en todas las métricas de este período (confirmado con datos de prueba
  // reales: 2 de 5 pedidos CANCELADO+paid inflaban el "ingreso" mostrado).
  const paidOrders = orders.filter((o: any) => o.payment_status === "paid" && o.status !== "CANCELADO");

  function periodStats(sinceMs: number) {
    const inRange = paidOrders.filter((o: any) => new Date(o.created_at).getTime() >= sinceMs);
    const revenue = inRange.reduce((s: number, o: any) => s + (o.total || 0), 0);
    return { revenue, count: inRange.length, avgTicket: inRange.length ? Math.round((revenue / inRange.length) * 100) / 100 : 0 };
  }

  const todayStats = periodStats(todayStart);
  const weekStats = periodStats(weekStart);
  const monthStats = periodStats(monthStart);
  const allTimeStats = {
    revenue: agg.allTime.revenue,
    count: agg.allTime.count,
    avgTicket: agg.allTime.count ? Math.round((agg.allTime.revenue / agg.allTime.count) * 100) / 100 : 0,
  };

  const trend: { date: string; revenue: number; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = todayStart - i * DAY;
    const dayEnd = dayStart + DAY;
    const inDay = paidOrders.filter((o: any) => {
      const t = new Date(o.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    });
    trend.push({
      date: new Date(dayStart).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
      revenue: inDay.reduce((s: number, o: any) => s + (o.total || 0), 0),
      count: inDay.length,
    });
  }

  // statusCounts/pendingPayment/codPending ahora vienen de dashboard_aggregates (calculados
  // sobre TODA la tabla orders en SQL), no del array `orders` que aquí solo cubre la ventana
  // reciente (mes actual + tendencia de 14 días).
  const statusCounts = agg.statusCounts as Record<string, number>;
  const pendingPayment = agg.pendingPayment as number;
  const codPending = agg.codPending as { count: number; total: number };

  // Top productos del mes en curso (misma ventana que arriba) — una vista "reciente" es más
  // útil operativamente que un ranking histórico que nunca cambia, y evita tener que replicar
  // la lógica de precio/etiqueta por ítem (statItemLabel/statUnitPrice) en SQL.
  const topProducts = buildTopProducts(paidOrders, 6);

  // Por fuente: cuántos se registraron y cuántos de esos llegaron a pagar al menos un
  // pedido — la diferencia entre ambos números es lo que separa un anuncio que solo trae
  // curiosos de uno que trae clientes reales.
  const sourceMap = new Map<string, { signups: number; converted: number }>();
  const phoneToSource = new Map<string, string>();
  for (const c of sourceRows as any[]) {
    const key = c.acquisition_source;
    const entry = sourceMap.get(key) || { signups: 0, converted: 0 };
    entry.signups++;
    if ((c.total_orders || 0) > 0) entry.converted++;
    sourceMap.set(key, entry);
    if (c.phone) phoneToSource.set(c.phone, key);
  }
  // Ingresos/ticket promedio por fuente — a diferencia de signups/converted (toda la
  // historia del cliente), esto solo cubre la MISMA ventana reciente que topProducts/trend
  // (`paidOrders`, ~14-31 días), no ingresos históricos totales por fuente. Suficiente para
  // saber si una campaña activa "se paga sola" sin necesitar un agregado SQL nuevo.
  const revenueBySource = new Map<string, number>();
  const countBySource = new Map<string, number>();
  for (const o of paidOrders as any[]) {
    const source = o.customer_phone ? phoneToSource.get(o.customer_phone) : undefined;
    if (!source) continue;
    revenueBySource.set(source, (revenueBySource.get(source) || 0) + (o.total || 0));
    countBySource.set(source, (countBySource.get(source) || 0) + 1);
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, v]) => {
      const revenue = revenueBySource.get(source) || 0;
      const count = countBySource.get(source) || 0;
      return {
        source,
        signups: v.signups,
        converted: v.converted,
        recentRevenue: revenue,
        recentAvgTicket: count ? Math.round((revenue / count) * 100) / 100 : 0,
      };
    })
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 8);

  // Confirmados vs. abandonados por Yape/Plin (misma ventana reciente que topProducts,
  // no toda la tabla) — antes no había ninguna forma de ver, de un vistazo, qué tan
  // seguido un cliente que elige Yape/Plin de verdad termina transfiriendo vs. cuántos
  // pedidos terminan cancelándose por falta de confirmación a tiempo (hallazgo de esta
  // ronda de mejoras de fricción Yape/Plin).
  const manualOrders = orders.filter((o: any) => o.payment_method === "yape" || o.payment_method === "plin");
  const yapePlin = {
    confirmed: manualOrders.filter((o: any) => o.payment_status === "paid").length,
    abandoned: manualOrders.filter((o: any) => o.status === "CANCELADO").length,
    total: manualOrders.length,
  };

  // % de cambio vs. el período anterior de igual duración — el dato de "antes" ya viene
  // calculado en SQL (dashboard_aggregates), acá solo se arma el porcentaje; null cuando el
  // período anterior fue 0 (evita un Infinity/NaN sin sentido en vez de "+100%").
  function pctDelta(current: number, prev: number): number | null {
    if (!prev) return current > 0 ? null : 0;
    return Math.round(((current - prev) / prev) * 1000) / 10;
  }
  const weekPrev = agg.weekPrev as { revenue: number; count: number };
  const monthPrev = agg.monthPrev as { revenue: number; count: number };

  // Se dejó de traer 5 calificaciones recientes en cada carga del dashboard — el panel de
  // admin nunca las leía de esta respuesta (ese detalle vive en admin-ratings-list, su
  // propia pantalla), así que era una consulta y bytes de payload desperdiciados en CADA
  // apertura del dashboard (hallazgo de la re-auditoría de rendimiento).
  return {
    revenue: { today: todayStats, week: weekStats, month: monthStats, allTime: allTimeStats },
    estimatedProfit: {
      today: estimatedProfitRange(todayStats.revenue),
      week: estimatedProfitRange(weekStats.revenue),
      month: estimatedProfitRange(monthStats.revenue),
      allTime: estimatedProfitRange(allTimeStats.revenue),
    },
    trend,
    ordersByStatus: statusCounts,
    pendingPayment,
    codPending,
    topProducts,
    customers: {
      total: agg.customersTotal,
      newThisWeek: agg.newThisWeek,
      newThisMonth: agg.newThisMonth,
      returning: agg.returning,
      tiers: agg.tierCounts,
    },
    points: { issued: agg.pointsIssued, redeemed: agg.pointsRedeemed, outstanding: agg.pointsIssued - agg.pointsRedeemed },
    avgEtaMinutes: agg.avgEtaMinutes,
    outOfStock,
    lowStock,
    ratings: { avg: agg.ratingsAvg, count: agg.ratingsCount },
    trendTruncated,
    referrals: agg.referrals,
    deltas: {
      weekRevenuePct: pctDelta(weekStats.revenue, weekPrev.revenue),
      monthRevenuePct: pctDelta(monthStats.revenue, monthPrev.revenue),
    },
    peakHours: agg.peakHours,
    peakDays: agg.peakDays,
    bySource,
    yapePlin,
  };
}

// Rendimiento de las campañas de re-enganche automático (marketing_touches, ver
// logMarketingTouch en customer.ts y los inserts equivalentes en winback-campaign/
// birthday-bonus) — antes ningún cron dejaba rastro de a quién se le avisó qué, así que
// era imposible saber si un recordatorio de verdad trae de vuelta al cliente o si es
// ruido. "Convertido" = pagó al menos un pedido dentro de CONVERSION_WINDOW_DAYS después
// de CUALQUIER touch de esa campaña — si el mismo cliente recibió varios touches del
// mismo tipo, la conversión/ingreso solo se cuenta una vez (nunca se le atribuye el mismo
// pedido dos veces a la misma campaña).
const CAMPAIGN_CONVERSION_WINDOW_DAYS = 7;
const CAMPAIGN_LOOKBACK_DAYS = 60;
export async function actAdminCampaignPerformance(b: any) {
  await requireAdmin(b.token);
  const since = new Date(Date.now() - CAMPAIGN_LOOKBACK_DAYS * 86400000).toISOString();
  const touches = await sbGet(
    "marketing_touches",
    `sent_at=gte.${encodeURIComponent(since)}&select=customer_phone,campaign_type,sent_at&order=sent_at.asc`,
  );
  if (!touches.length) return { campaigns: [], windowDays: CAMPAIGN_CONVERSION_WINDOW_DAYS, lookbackDays: CAMPAIGN_LOOKBACK_DAYS };

  const phones = [...new Set(touches.map((t: any) => t.customer_phone))];
  // Escapar comillas/backslash del phone antes de interpolarlo en un literal de lista in.()
  // de PostgREST (hallazgo de auditoría 2026-08-07) — mismo criterio que customer.ts.
  const phonesList = phones.map((p) => `"${String(p).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  const orders = await sbGet(
    "orders",
    // status=neq.CANCELADO agregado — mismo hallazgo que actDashboardStats/
    // actAdminRangeReport: un pedido cancelado sigue payment_status:'paid' y sin este
    // filtro inflaba el "revenue" atribuido a cada campaña de marketing.
    `customer_phone=in.(${phonesList})&payment_status=eq.paid&status=neq.CANCELADO&created_at=gte.${encodeURIComponent(since)}&select=customer_phone,created_at,total`,
  );
  const ordersByPhone = new Map<string, { createdAt: number; total: number }[]>();
  for (const o of orders as any[]) {
    const list = ordersByPhone.get(o.customer_phone) || [];
    list.push({ createdAt: new Date(o.created_at).getTime(), total: o.total || 0 });
    ordersByPhone.set(o.customer_phone, list);
  }

  const windowMs = CAMPAIGN_CONVERSION_WINDOW_DAYS * 86400000;
  const byCampaign = new Map<string, { touches: number; customers: Set<string>; converted: Set<string>; revenue: number }>();
  for (const t of touches as any[]) {
    const agg = byCampaign.get(t.campaign_type) || { touches: 0, customers: new Set<string>(), converted: new Set<string>(), revenue: 0 };
    agg.touches++;
    agg.customers.add(t.customer_phone);
    const sentAt = new Date(t.sent_at).getTime();
    if (!agg.converted.has(t.customer_phone)) {
      const convertingOrder = (ordersByPhone.get(t.customer_phone) || []).find(
        (o) => o.createdAt >= sentAt && o.createdAt <= sentAt + windowMs,
      );
      if (convertingOrder) {
        agg.converted.add(t.customer_phone);
        agg.revenue += convertingOrder.total;
      }
    }
    byCampaign.set(t.campaign_type, agg);
  }

  const campaigns = Array.from(byCampaign.entries())
    .map(([campaignType, agg]) => ({
      campaignType,
      touches: agg.touches,
      customersReached: agg.customers.size,
      converted: agg.converted.size,
      conversionRate: agg.customers.size ? Math.round((agg.converted.size / agg.customers.size) * 1000) / 10 : 0,
      revenue: Math.round(agg.revenue * 100) / 100,
    }))
    .sort((a, b) => b.touches - a.touches);

  return { campaigns, windowDays: CAMPAIGN_CONVERSION_WINDOW_DAYS, lookbackDays: CAMPAIGN_LOOKBACK_DAYS };
}

// Gestión de códigos promocionales (promo_codes/promo_code_redemptions, ver migración y
// computePromoDiscount/redeemPromoBestEffort en orders.ts, que son quienes de verdad
// aplican/redimen el descuento — estas 3 acciones son solo el CRUD admin).
const PROMO_LIST_LIMIT = 100;
export async function actAdminPromoList(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("promo_codes", `select=*&order=created_at.desc&limit=${PROMO_LIST_LIMIT}`);
  return { promoCodes: rows };
}

const PROMO_DISCOUNT_TYPES = new Set(["percent", "fixed"]);
export async function actAdminPromoCreate(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim().toUpperCase();
  const discountType = String(b.discountType || "");
  const value = Number(b.value);
  if (!code || !/^[A-Z0-9_-]{3,20}$/.test(code)) throw new ApiError("El código debe tener 3-20 caracteres (letras, números, - o _).", 400);
  if (!PROMO_DISCOUNT_TYPES.has(discountType)) throw new ApiError("Tipo de descuento inválido.", 400);
  if (!(value > 0)) throw new ApiError("El valor del descuento debe ser mayor a 0.", 400);
  if (discountType === "percent" && value > 100) throw new ApiError("Un descuento porcentual no puede pasar de 100%.", 400);
  const maxDiscount = b.maxDiscount !== undefined && b.maxDiscount !== null && b.maxDiscount !== "" ? Number(b.maxDiscount) : null;
  const maxUses = b.maxUses !== undefined && b.maxUses !== null && b.maxUses !== "" ? Math.max(1, parseInt(b.maxUses, 10) || 0) : null;
  const minOrderTotal = b.minOrderTotal !== undefined && b.minOrderTotal !== null && b.minOrderTotal !== "" ? Math.max(0, Number(b.minOrderTotal)) : 0;
  const validFrom = b.validFrom ? String(b.validFrom) : null;
  const validUntil = b.validUntil ? String(b.validUntil) : null;
  const campaignTag = b.campaignTag ? String(b.campaignTag).trim().slice(0, 60) : null;
  let row;
  try {
    const rows = await sbInsert("promo_codes", {
      code,
      discount_type: discountType,
      value,
      max_discount: maxDiscount,
      max_uses: maxUses,
      min_order_total: minOrderTotal,
      valid_from: validFrom,
      valid_until: validUntil,
      campaign_tag: campaignTag,
      created_by: s.phone,
    });
    row = rows[0];
  } catch (e) {
    if (e instanceof Error && e.message.includes("23505")) throw new ApiError("Ya existe un código con ese nombre.", 409);
    throw e;
  }
  await logAdminAction(s.phone, "promo-create", code, { discountType, value, maxUses, minOrderTotal });
  return { success: true, promoCode: row };
}

export async function actAdminPromoToggle(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  const active = !!b.active;
  if (!id) throw new ApiError("Falta el código.", 400);
  const rows = await sbUpdate("promo_codes", `id=eq.${encodeURIComponent(id)}`, { active });
  if (!rows.length) throw new ApiError("Código no encontrado.", 404);
  await logAdminAction(s.phone, "promo-toggle", rows[0].code, { active });
  return { success: true, promoCode: rows[0] };
}

// Antes, ver el historial completo de un cliente exigía cruzar 3 pantallas distintas
// (pedidos, puntos, admin_action_log) o consultar la DB a mano — esto lo junta en una
// sola llamada para la ficha de cliente del panel admin.
const CUSTOMER_DETAIL_LIMIT = 30;
export async function actAdminCustomerDetail(b: any) {
  await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  if (!phone) throw new ApiError("Falta el teléfono.", 400);
  const [custRows, orders, transactions, ratings, creditLedger] = await Promise.all([
    sbGet("customers", `phone=eq.${encodeURIComponent(phone)}`),
    sbGet("orders", `customer_phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&limit=${CUSTOMER_DETAIL_LIMIT}`),
    sbGet("transactions", `customer_phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&limit=${CUSTOMER_DETAIL_LIMIT}`),
    sbGet("ratings", `customer_phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&limit=${CUSTOMER_DETAIL_LIMIT}`),
    sbGet("credit_ledger", `customer_phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&limit=${CUSTOMER_DETAIL_LIMIT}`),
  ]);
  if (!custRows.length) throw new ApiError("Cliente no encontrado.", 404);
  return { customer: safeCustomer(custRows[0]), orders, transactions, ratings, creditLedger };
}

// Puntaje de riesgo de fuga: no es solo "días sin pedir" — pondera por rango, porque
// perder a alguien de MESA FUNDADORA (30+ pedidos) importa mucho más que perder a
// alguien NUEVO que recién probó una vez. remind-second-order y remind-high-rank-winback
// (customer.ts) ya cubren 2 casos puntuales con un corte fijo de días; esto le da al
// dueño una lista priorizada de TODOS los clientes para decidir a quién contactar
// personalmente primero, no solo esos 2 casos automáticos.
const AT_RISK_MIN_DAYS = 14;
const AT_RISK_LIMIT = 30;
const RANK_RISK_WEIGHT: Record<string, number> = {
  "NUEVO": 1,
  "REGULAR": 1.5,
  "INICIADO": 2,
  "CÍRCULO INTERNO": 3,
  "MESA FUNDADORA": 4,
};
export async function actAdminAtRiskCustomers(b: any) {
  await requireAdmin(b.token);
  const [customers, orders] = await Promise.all([
    sbGet("customers", "total_orders=gt.0&select=phone,name,total_orders&limit=5000"),
    // status=neq.CANCELADO (hallazgo de la re-auditoría de 10 agentes, MEDIO): a diferencia
    // del resto del dashboard (dashboard_aggregates y las demás métricas de admin.ts), esta
    // consulta no excluía pedidos cancelados — un pedido pagado-y-luego-cancelado contaba
    // como "última compra real", subestimando o directamente ocultando de la lista a un
    // cliente que en los hechos no ha comprado de verdad hace tiempo.
    sbGet("orders", "payment_status=eq.paid&status=neq.CANCELADO&select=customer_phone,created_at&limit=5000"),
  ]);

  const lastOrderMs = new Map<string, number>();
  for (const o of orders) {
    if (!o.customer_phone) continue;
    const t = new Date(o.created_at).getTime();
    const prev = lastOrderMs.get(o.customer_phone);
    if (prev == null || t > prev) lastOrderMs.set(o.customer_phone, t);
  }

  const now = Date.now();
  const scored = customers
    .map((c: any) => {
      const last = lastOrderMs.get(c.phone);
      const daysSinceLastOrder = last != null ? Math.floor((now - last) / 86400000) : null;
      const rank = computeRankName(c.total_orders || 0);
      const weight = RANK_RISK_WEIGHT[rank] || 1;
      const riskScore = Math.round((daysSinceLastOrder ?? 999) * weight);
      return { phone: c.phone, name: c.name, rank, totalOrders: c.total_orders || 0, daysSinceLastOrder, riskScore };
    })
    .filter((c) => c.daysSinceLastOrder == null || c.daysSinceLastOrder >= AT_RISK_MIN_DAYS)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, AT_RISK_LIMIT);

  return { customers: scored };
}

// Búsqueda libre de pedidos — antes la cola admin solo mostraba los últimos pedidos
// activos (actAdminOrders), sin forma de encontrar uno viejo/entregado salvo el link de
// seguimiento del propio cliente. `q` busca por ref, teléfono o nombre a la vez.
const SEARCH_ORDERS_LIMIT = 50;
export async function actAdminSearchOrders(b: any) {
  await requireAdmin(b.token);
  const q = String(b.q || "").trim().slice(0, 60);
  const status = b.status ? String(b.status) : null;
  const dateFrom = b.dateFrom ? String(b.dateFrom) : null;
  const dateTo = b.dateTo ? String(b.dateTo) : null;
  if (!q && !status && !dateFrom && !dateTo) throw new ApiError("Ingresa al menos un criterio de búsqueda.", 400);

  const parts: string[] = [];
  if (q) {
    // Nombrado qSafe (no esc) para no confundirlo con el escHtml de email.ts — esto no
    // escapa HTML, solo quita caracteres que romperían la sintaxis or=(...) de PostgREST.
    const qSafe = q.replace(/[,()]/g, "");
    parts.push(`or=(ref.ilike.*${encodeURIComponent(qSafe)}*,customer_phone.ilike.*${encodeURIComponent(qSafe)}*,customer_name.ilike.*${encodeURIComponent(qSafe)}*)`);
  }
  if (status) parts.push(`status=eq.${encodeURIComponent(status)}`);
  if (dateFrom) parts.push(`created_at=gte.${encodeURIComponent(dateFrom)}`);
  if (dateTo) parts.push(`created_at=lte.${encodeURIComponent(dateTo)}`);
  parts.push(`order=created_at.desc&limit=${SEARCH_ORDERS_LIMIT + 1}`);

  const rows = await sbGet("orders", parts.join("&"));
  return { orders: rows.slice(0, SEARCH_ORDERS_LIMIT), truncated: rows.length > SEARCH_ORDERS_LIMIT };
}

// Visor del registro de auditoría (admin_action_log) — hasta ahora esa tabla solo se
// podía revisar directo desde el dashboard de Supabase, no desde el panel del negocio.
const AUDIT_LOG_LIMIT = 100;
export async function actAdminAuditLog(b: any) {
  await requireAdmin(b.token);
  const limit = Math.min(AUDIT_LOG_LIMIT, Math.max(1, parseInt(b.limit, 10) || 50));
  const actorPhone = b.actorPhone ? String(b.actorPhone).trim() : null;
  const query = actorPhone
    ? `actor_phone=eq.${encodeURIComponent(actorPhone)}&order=created_at.desc&limit=${limit}`
    : `order=created_at.desc&limit=${limit}`;
  return { log: await sbGet("admin_action_log", query) };
}

// Reporte de ingresos/pedidos por rango de fechas libre — el dashboard normal solo cubre
// hoy/semana/mes fijos; esto deja al dueño elegir cualquier rango (ej. para comparar un
// fin de semana largo contra uno normal).
const RANGE_REPORT_ORDER_LIMIT = 5000;
export async function actAdminRangeReport(b: any) {
  await requireAdmin(b.token);
  const from = b.from ? new Date(String(b.from)) : null;
  const to = b.to ? new Date(String(b.to)) : null;
  if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    throw new ApiError("Rango de fechas inválido.", 400);
  }
  await loadCatalogPrices();
  const rows = await sbGet(
    "orders",
    `created_at=gte.${encodeURIComponent(from.toISOString())}&created_at=lte.${encodeURIComponent(to.toISOString())}` +
      `&select=total,payment_status,payment_method,created_at,items,product_key,summary,status&order=created_at.asc&limit=${RANGE_REPORT_ORDER_LIMIT + 1}`,
  );
  const truncated = rows.length > RANGE_REPORT_ORDER_LIMIT;
  const orders = rows.slice(0, RANGE_REPORT_ORDER_LIMIT);
  // status !== "CANCELADO" — mismo hallazgo/criterio que actDashboardStats arriba.
  const paid = orders.filter((o: any) => o.payment_status === "paid" && o.status !== "CANCELADO");

  const revenue = paid.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const byMethod: Record<string, { count: number; revenue: number }> = {};
  paid.forEach((o: any) => {
    const m = o.payment_method || "otro";
    if (!byMethod[m]) byMethod[m] = { count: 0, revenue: 0 };
    byMethod[m].count++;
    byMethod[m].revenue += o.total || 0;
  });

  const byDayMap: Record<string, { count: number; revenue: number }> = {};
  paid.forEach((o: any) => {
    const day = String(o.created_at).slice(0, 10);
    if (!byDayMap[day]) byDayMap[day] = { count: 0, revenue: 0 };
    byDayMap[day].count++;
    byDayMap[day].revenue += o.total || 0;
  });
  const byDay = Object.entries(byDayMap).map(([date, v]) => ({ date, ...v })).sort((a, b2) => a.date.localeCompare(b2.date));

  const topProducts = buildTopProducts(paid, 10);

  return {
    revenue,
    count: paid.length,
    avgTicket: paid.length ? Math.round((revenue / paid.length) * 100) / 100 : 0,
    byMethod,
    byDay,
    topProducts,
    truncated,
  };
}

// Antes las calificaciones solo se veían resumidas (promedio + últimos 5 comentarios) en
// el dashboard — esto expone el listado completo con filtros para revisar reclamos o
// buscar sándwiches con mala nota de forma sistemática.
const RATINGS_LIST_LIMIT = 200;
export async function actAdminRatingsList(b: any) {
  await requireAdmin(b.token);
  const limit = Math.min(RATINGS_LIST_LIMIT, Math.max(1, parseInt(b.limit, 10) || 50));
  const minStars = b.minStars ? Math.max(1, Math.min(5, parseInt(b.minStars, 10) || 1)) : null;
  const onlyWithComments = !!b.onlyWithComments;
  const onlyConsented = !!b.onlyConsented;
  const parts: string[] = [];
  if (minStars) parts.push(`stars=gte.${minStars}`);
  if (onlyWithComments) parts.push("comment=not.is.null");
  if (onlyConsented) parts.push("testimonial_consent=eq.true");
  parts.push(`order=created_at.desc&limit=${limit}`);
  return { ratings: await sbGet("ratings", parts.join("&")) };
}

// Lista de preparación anticipada — agrega en un solo resumen los ingredientes de TODOS
// los pedidos programados ("para más tarde") de las próximas horas, para que la cocina
// prepare antes de que entren en cola. Antes cada pedido programado se preparaba recién
// cuando llegaba su hora, sin ninguna vista agregada de cuánto se viene.
const PREP_LIST_WINDOW_HOURS = 24;
export async function actAdminPrepList(b: any) {
  await requireAdmin(b.token);
  await loadCatalogPrices();
  const nowIso = new Date().toISOString();
  const windowEndIso = new Date(Date.now() + PREP_LIST_WINDOW_HOURS * 3600000).toISOString();
  const rows = await sbGet(
    "orders",
    `delivery_time=not.is.null&delivery_time=gte.${encodeURIComponent(nowIso)}&delivery_time=lte.${encodeURIComponent(windowEndIso)}` +
      `&status=neq.CANCELADO&status=neq.ENTREGADO&select=ref,customer_name,delivery_time,items&order=delivery_time.asc&limit=500`,
  );
  const ingredientCounts = new Map<string, number>();
  const orders: { ref: string; customerName: string; deliveryTime: string }[] = [];
  for (const o of rows) {
    orders.push({ ref: o.ref, customerName: o.customer_name, deliveryTime: o.delivery_time });
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items) {
      try {
        const priced = priceCartItem(it);
        for (const code of priced.ingredientsPerUnit) {
          ingredientCounts.set(code, (ingredientCounts.get(code) || 0) + priced.qty);
        }
      } catch {
        // Ítem legado que ya no encaja en el catálogo actual — se omite solo ese ítem,
        // el resto de la lista de preparación sigue siendo útil.
      }
    }
  }
  const codes = [...ingredientCounts.keys()];
  // stock_qty/in_stock también, para poder avisar ANTES de que llegue la hora si lo que
  // hay no va a alcanzar para los pedidos ya programados — antes esto solo se descubría
  // cuando ya era tarde para comprar más.
  const invRows = codes.length
    ? await sbGet("inventory", `product_code=in.(${codes.map((c) => encodeURIComponent(c)).join(",")})&select=product_code,product_name,in_stock,stock_qty`)
    : [];
  const invMap = new Map(invRows.map((r: any) => [r.product_code, r]));
  const ingredients = codes
    .map((code) => {
      const inv = invMap.get(code);
      const qty = ingredientCounts.get(code)!;
      const stockQty = inv?.stock_qty ?? null;
      // Sin fila en inventory = nunca se marcó agotado ni se le puso cantidad — no hay
      // forma de saber si alcanza, así que no se marca como faltante.
      const shortfall = inv?.in_stock === false || (stockQty != null && stockQty < qty);
      return { code, label: inv?.product_name || code, qty, stockQty, shortfall };
    })
    .sort((a, b) => (a.shortfall === b.shortfall ? b.qty - a.qty : a.shortfall ? -1 : 1));
  return { orders, ingredients, windowHours: PREP_LIST_WINDOW_HOURS };
}

// Rendimiento por franja horaria — no hay turnos de cocina distintos (una sola persona
// atiende), así que esto no mide personal: agrupa pedidos por hora del día (hora Lima)
// para detectar si hay una franja con más cancelaciones o entregas más lentas que otras,
// sin importar quién esté atendiendo.
const TIME_WINDOW_REPORT_DAYS = 30;
export async function actAdminTimeWindowReport(b: any) {
  await requireAdmin(b.token);
  const sinceIso = new Date(Date.now() - TIME_WINDOW_REPORT_DAYS * 86400000).toISOString();
  const rows = await sbGet("orders", `created_at=gte.${encodeURIComponent(sinceIso)}&select=created_at,status,delivered_at&limit=5000`);
  const buckets: Record<number, { total: number; cancelled: number; deliveredCount: number; deliveryMinutesSum: number }> = {};
  for (let h = 0; h < 24; h++) buckets[h] = { total: 0, cancelled: 0, deliveredCount: 0, deliveryMinutesSum: 0 };
  for (const o of rows) {
    const limaHour = new Date(new Date(o.created_at).getTime() - 5 * 3600000).getUTCHours();
    const bucket = buckets[limaHour];
    bucket.total++;
    if (o.status === "CANCELADO") bucket.cancelled++;
    if (o.delivered_at) {
      const mins = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 60000;
      if (mins > 0 && mins < 240) {
        bucket.deliveredCount++;
        bucket.deliveryMinutesSum += mins;
      }
    }
  }
  const hours = Object.entries(buckets)
    .map(([h, v]) => ({
      hour: Number(h),
      total: v.total,
      cancelled: v.cancelled,
      cancelRatePct: v.total ? Math.round((v.cancelled / v.total) * 1000) / 10 : 0,
      avgDeliveryMin: v.deliveredCount ? Math.round(v.deliveryMinutesSum / v.deliveredCount) : null,
    }))
    .filter((h) => h.total > 0)
    .sort((a, b) => b.cancelRatePct - a.cancelRatePct);
  return { hours, windowDays: TIME_WINDOW_REPORT_DAYS };
}

// Direcciones con entregas fallidas repetidas — si una dirección acumula 2+
// cancelaciones (cualquier motivo), vale la pena que el dueño la revise antes del
// próximo pedido a ese mismo lugar en vez de descubrir el patrón recién a la tercera vez.
const PROBLEM_ADDRESS_MIN_CANCELS = 2;
const PROBLEM_ADDRESS_SCAN_LIMIT = 2000;
export async function actAdminProblemAddresses(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "orders",
    `status=eq.CANCELADO&customer_address=not.is.null&select=customer_address,cancel_reason,created_at&order=created_at.desc&limit=${PROBLEM_ADDRESS_SCAN_LIMIT}`,
  );
  const map = new Map<string, { count: number; reasons: string[]; lastAt: string }>();
  for (const o of rows) {
    const addr = String(o.customer_address || "").trim();
    if (!addr) continue;
    const entry = map.get(addr) || { count: 0, reasons: [], lastAt: o.created_at };
    entry.count++;
    if (o.cancel_reason && entry.reasons.length < 5) entry.reasons.push(o.cancel_reason);
    map.set(addr, entry);
  }
  const addresses = [...map.entries()]
    .filter(([, v]) => v.count >= PROBLEM_ADDRESS_MIN_CANCELS)
    .map(([address, v]) => ({ address, cancelCount: v.count, reasons: v.reasons, lastAt: v.lastAt }))
    .sort((a, b) => b.cancelCount - a.cancelCount);
  return { addresses };
}

// Contenido de marketing listo para copiar y pegar — no publicamos nada por el dueño (no
// hay ninguna cuenta de redes sociales conectada a este sistema), pero le ahorramos la
// parte de redactar: un texto corto para WhatsApp/historia, un caption más largo para
// feed, y una idea de foto, uno distinto cada semana. Las primeras 4 semanas siguen la
// secuencia real de lanzamiento (recién abre → prueba social → referidos → menú secreto);
// de ahí en adelante rota entre las promociones que ya existen en la app.
const MARKETING_CONTENT: { theme: string; whatsapp: string; caption: string; photoIdea: string }[] = [
  {
    theme: "LANZAMIENTO",
    whatsapp: "🥪 SND//WCH ya está abierto — pide por la app, arma tu Signature o el tuyo desde cero. Tu primer pedido te regala 40 puntos.",
    caption: "Ya abrimos // SND//WCH llega a tu zona. Sandwiches armados al momento, Signature builds curados o arma el tuyo desde cero. Pide directo desde la app — tu primer pedido te regala 40 puntos para canjear después.",
    photoIdea: "Tu Signature más vendido, foto cercana con buena luz natural, o el equipo preparando el primer pedido real.",
  },
  {
    theme: "PRUEBA SOCIAL",
    whatsapp: "¿Ya probaste SND//WCH? Calificar tu pedido te toma 10 segundos y nos ayuda un montón 🙏",
    caption: "La mejor publicidad la hacen ustedes // Si ya pediste con nosotros, califica tu experiencia desde la app (PUNTOS → MIS PEDIDOS). Cada reseña le muestra a más gente por qué vale la pena.",
    photoIdea: "Captura de una calificación de 5 estrellas (con permiso del cliente), o foto de alguien recibiendo su pedido.",
  },
  {
    theme: "REFERIDOS",
    whatsapp: "Invita a un amigo a SND//WCH y ambos ganan 50 puntos en su primer pedido. Tu código está en tu perfil de la app.",
    caption: "Comparte y gana // Cada amigo que invitas con tu código les da 50 puntos a ambos en su primer pedido. Entre más compartes, más rápido subes de rango.",
    photoIdea: "Gráfico simple '50 + 50 puntos' sobre el verde/dorado de la marca, o dos sandwiches juntos.",
  },
  {
    theme: "MENÚ SECRETO",
    whatsapp: "Hay un Signature que no está en el menú público. Se desbloquea desde tu 5to pedido 👀",
    caption: "Lo que no ves en el menú // Después de cierta cantidad de pedidos se desbloquea un Signature que no aparece para nadie más. No decimos cuál — te lo tienes que ganar.",
    photoIdea: "Nada del producto en sí (es secreto) — una imagen oscura/misteriosa o solo texto sobre el fondo de marca.",
  },
  {
    theme: "COMBO / HORA VALLE",
    whatsapp: "En hora valle tu bebida sale gratis con cualquier sándwich. Se aplica solo, sin código.",
    caption: "Combo inteligente // Agrega una bebida a tu sándwich y ahorra automático — en hora valle, hasta gratis. Válido solo desde la app.",
    photoIdea: "Sándwich + bebida juntos, estilo flat lay.",
  },
  {
    theme: "PEDIDOS GRUPALES",
    whatsapp: "¿Pedido de oficina? Organiza un pedido grupal en SND//WCH — cada quien agrega el suyo, se paga todo junto.",
    caption: "Para la oficina o la reunión // Comparte un link, cada quien arma su sándwich, se paga todo en un solo pedido. Perfecto para el almuerzo de equipo.",
    photoIdea: "Varios sandwiches distintos en fila, sugiriendo variedad para un grupo.",
  },
  {
    theme: "PLAN SEMANAL",
    whatsapp: "Paga S/95 hoy, recibe S/100 en saldo para pedir cuando quieras esta semana. El saldo no vence.",
    caption: "Plan Semanal // Paga por adelantado y recibe más de lo que pusiste. Pide cuando quieras durante la semana, sin compromiso de horario fijo.",
    photoIdea: "Gráfico 'S/95 → S/100', o varios pedidos de la semana juntos.",
  },
  {
    theme: "RECORDATORIO",
    whatsapp: "SND//WCH — pedidos todos los días. Arma el tuyo o elige un Signature curado por nosotros.",
    caption: "Por si se te olvidó que existimos // Seguimos aquí, armando sandwiches todos los días. Pide por la app cuando se te antoje.",
    photoIdea: "Cualquier foto de producto que no hayas usado en semanas anteriores.",
  },
];
function marketingWeekIndex(offset = 0): number {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const weekNumber = Math.floor(daysSinceEpoch / 7) + offset;
  return ((weekNumber % MARKETING_CONTENT.length) + MARKETING_CONTENT.length) % MARKETING_CONTENT.length;
}
export async function actAdminMarketingContent(b: any) {
  await requireAdmin(b.token);
  return {
    current: MARKETING_CONTENT[marketingWeekIndex()],
    next: MARKETING_CONTENT[marketingWeekIndex(1)],
  };
}
// Cron semanal — no publica nada (ninguna red social está conectada a este sistema), solo
// avisa que el contenido de la semana ya está listo para copiar en el panel admin.
export async function actRemindMarketingContent(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const theme = MARKETING_CONTENT[marketingWeekIndex()].theme;
  await sendPushToAdmins({
    title: "Contenido de esta semana listo 📣",
    body: "Tema: " + theme + ". Copia el texto listo desde el panel admin → MARKETING.",
    url: "./index.html",
    tag: "sndwch-weekly-marketing",
    renotify: true,
  });
  return { success: true, theme };
}

// Calendario de contenido real (marketing_calendar) — reemplaza depender solo del rotador
// estático de arriba (MARKETING_CONTENT) para "qué publicar hoy": el dueño puede planear
// fechas concretas, por canal, con estado real (borrador/programado/publicado). Nada de
// esto publica solo (mismo límite que el resto del sistema de marketing — no hay conector
// real a Instagram/TikTok/Meta en este entorno) — es la lista de acción que el dueño copia
// a mano, igual que ya hacía con MARKETING_CONTENT, pero con fechas y estado reales en vez
// de un rotador de 2 semanas sin memoria de qué ya se publicó.
const CALENDAR_CHANNELS = new Set(["instagram", "tiktok", "whatsapp", "facebook", "google_business", "otro"]);
const CALENDAR_STATUSES = new Set(["draft", "scheduled", "posted"]);
const CALENDAR_LIST_LIMIT = 200;

export async function actAdminCalendarList(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("marketing_calendar", `select=*&order=scheduled_date.asc&limit=${CALENDAR_LIST_LIMIT}`);
  return { entries: rows };
}

export async function actAdminCalendarCreate(b: any) {
  const s = await requireAdmin(b.token);
  const scheduledDate = String(b.scheduledDate || "").trim();
  const channel = String(b.channel || "").trim();
  const title = String(b.title || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) throw new ApiError("Fecha inválida.", 400);
  if (!CALENDAR_CHANNELS.has(channel)) throw new ApiError("Canal inválido.", 400);
  if (!title) throw new ApiError("El título/tema es obligatorio.", 400);
  const status = CALENDAR_STATUSES.has(b.status) ? b.status : "draft";
  const row = (await sbInsert("marketing_calendar", {
    scheduled_date: scheduledDate,
    channel,
    status,
    title,
    caption_text: b.captionText ? String(b.captionText).slice(0, 2000) : null,
    whatsapp_text: b.whatsappText ? String(b.whatsappText).slice(0, 2000) : null,
    photo_idea: b.photoIdea ? String(b.photoIdea).slice(0, 500) : null,
    campaign_tag: b.campaignTag ? String(b.campaignTag).trim().slice(0, 60) : null,
    created_by: s.phone,
    posted_at: status === "posted" ? new Date().toISOString() : null,
  }))[0];
  await logAdminAction(s.phone, "calendar-create", title, { scheduledDate, channel, status });
  return { success: true, entry: row };
}

export async function actAdminCalendarUpdate(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  if (!id) throw new ApiError("Falta el id.", 400);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.scheduledDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.scheduledDate))) throw new ApiError("Fecha inválida.", 400);
    patch.scheduled_date = b.scheduledDate;
  }
  if (b.channel !== undefined) {
    if (!CALENDAR_CHANNELS.has(b.channel)) throw new ApiError("Canal inválido.", 400);
    patch.channel = b.channel;
  }
  if (b.title !== undefined) {
    const title = String(b.title).trim();
    if (!title) throw new ApiError("El título/tema es obligatorio.", 400);
    patch.title = title;
  }
  if (b.captionText !== undefined) patch.caption_text = b.captionText ? String(b.captionText).slice(0, 2000) : null;
  if (b.whatsappText !== undefined) patch.whatsapp_text = b.whatsappText ? String(b.whatsappText).slice(0, 2000) : null;
  if (b.photoIdea !== undefined) patch.photo_idea = b.photoIdea ? String(b.photoIdea).slice(0, 500) : null;
  if (b.campaignTag !== undefined) patch.campaign_tag = b.campaignTag ? String(b.campaignTag).trim().slice(0, 60) : null;
  if (b.status !== undefined) {
    if (!CALENDAR_STATUSES.has(b.status)) throw new ApiError("Estado inválido.", 400);
    patch.status = b.status;
    if (b.status === "posted") patch.posted_at = new Date().toISOString();
  }
  const rows = await sbUpdate("marketing_calendar", `id=eq.${encodeURIComponent(id)}`, patch);
  if (!rows.length) throw new ApiError("No encontrado.", 404);
  await logAdminAction(s.phone, "calendar-update", rows[0].title, { id, patch: Object.keys(patch) });
  return { success: true, entry: rows[0] };
}

export async function actAdminCalendarDelete(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  if (!id) throw new ApiError("Falta el id.", 400);
  const existing = await sbGet("marketing_calendar", `id=eq.${encodeURIComponent(id)}&select=title`);
  if (!existing.length) throw new ApiError("No encontrado.", 404);
  await sbDelete("marketing_calendar", `id=eq.${encodeURIComponent(id)}`);
  await logAdminAction(s.phone, "calendar-delete", existing[0].title, { id });
  return { success: true };
}

// Lista de espera pre-lanzamiento (waitlist_signups) — ver actWaitlistJoin en customer.ts
// para el lado público. Esto es solo la vista/export admin.
const WAITLIST_LIST_LIMIT = 1000;
export async function actAdminWaitlistList(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("waitlist_signups", `select=*&order=created_at.desc&limit=${WAITLIST_LIST_LIMIT}`);
  return { waitlist: rows };
}
