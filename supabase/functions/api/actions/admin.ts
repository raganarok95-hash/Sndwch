// SND//WCH — api / actions/admin
// Puntos manuales, gestión de cuentas admin, inventario, exportación CSV y las métricas
// del panel de negocio.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin, safeCustomer } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { loadCatalogPrices, buildTopProducts, priceCartItem, SIG_DATA, SIG_LABEL } from "../catalog.ts";
import { computeRankName } from "../env.ts";
import { sendPushToPhone } from "../push.ts";

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

export async function actAdminAccountsList(b: any) {
  await requireAdmin(b.token);
  return { accounts: await sbGet("admin_accounts", "order=created_at.asc") };
}
export async function actAdminAccountsAdd(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const name = String(b.name || "").trim();
  if (!phone || !name) throw new ApiError("Ingresa nombre y teléfono.");
  await sbInsert("admin_accounts", { phone, name, role: "admin" });
  await logAdminAction(s.phone, "accounts-add", phone, { name });
  return { success: true };
}
export async function actAdminAccountsDelete(b: any) {
  const s = await requireAdmin(b.token);
  const phone = String(b.phone || "").trim();
  const rows = await sbGet("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  if (rows.length && rows[0].role === "superadmin") throw new ApiError("No se puede eliminar al superadmin.", 403);
  await sbDelete("admin_accounts", `phone=eq.${encodeURIComponent(phone)}`);
  await logAdminAction(s.phone, "accounts-delete", phone);
  return { success: true };
}

export async function actAdminInventoryToggle(b: any) {
  await requireAdmin(b.token);
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
  return { success: true };
}

export async function actAdminInventorySetStock(b: any) {
  await requireAdmin(b.token);
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
  return { success: true };
}

const EXPORT_LIMIT = 5000;
export async function actAdminExportOrders(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "orders",
    `select=ref,date,customer_name,customer_phone,contact_phone,customer_address,customer_email,summary,total,status,payment_status,payment_method,mode,size,eta_minutes,redeemed_reward,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
  return { orders: rows.slice(0, EXPORT_LIMIT), truncated: rows.length > EXPORT_LIMIT };
}
export async function actAdminExportCustomers(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "customers",
    `select=phone,name,email,points,pending_points,total_orders,total_redeemed,created_at&order=created_at.desc&limit=${EXPORT_LIMIT + 1}`,
  );
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

  const [agg, ordersRaw, outOfStock, allInventory] = await Promise.all([
    rpc("dashboard_aggregates", { p_week_start: new Date(weekStart).toISOString(), p_month_start: new Date(monthStart).toISOString() }),
    // Antes traía select=* (hasta 5000 filas x todas las columnas) cuando lo único que se
    // usa más abajo son estas 6 — total/payment_status/created_at para las métricas de
    // período y tendencia, items/product_key/summary para el ranking de productos.
    sbGet(
      "orders",
      `select=total,payment_status,created_at,items,product_key,summary&created_at=gte.${encodeURIComponent(fetchSince)}&order=created_at.desc&limit=${DASHBOARD_WINDOW_LIMIT + 1}`,
    ),
    sbGet("inventory", "in_stock=eq.false&select=product_code,product_name"),
    sbGet("inventory", "stock_qty=not.is.null&select=product_code,product_name,stock_qty,low_stock_threshold"),
  ]);
  // trend/topProducts se calculan sobre esta ventana reciente (no toda la tabla, ver
  // comentario arriba) — si algún día hay más de DASHBOARD_WINDOW_LIMIT pedidos en los
  // últimos ~14-31 días, avisamos en vez de recortar en silencio y mostrar un gráfico
  // incompleto sin que nadie lo note.
  const trendTruncated = ordersRaw.length > DASHBOARD_WINDOW_LIMIT;
  const orders = ordersRaw.slice(0, DASHBOARD_WINDOW_LIMIT);
  const lowStock = allInventory.filter((r: any) => r.stock_qty > 0 && r.stock_qty <= (r.low_stock_threshold || 5));

  const paidOrders = orders.filter((o: any) => o.payment_status === "paid");

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
  };
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
  "DE LA CASA": 2,
  "CÍRCULO INTERNO": 3,
  "MESA FUNDADORA": 4,
};
export async function actAdminAtRiskCustomers(b: any) {
  await requireAdmin(b.token);
  const [customers, orders] = await Promise.all([
    sbGet("customers", "total_orders=gt.0&select=phone,name,total_orders"),
    sbGet("orders", "payment_status=eq.paid&select=customer_phone,created_at&limit=5000"),
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
      `&select=total,payment_status,payment_method,created_at,items,product_key,summary&order=created_at.asc&limit=${RANGE_REPORT_ORDER_LIMIT + 1}`,
  );
  const truncated = rows.length > RANGE_REPORT_ORDER_LIMIT;
  const orders = rows.slice(0, RANGE_REPORT_ORDER_LIMIT);
  const paid = orders.filter((o: any) => o.payment_status === "paid");

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
  const parts: string[] = [];
  if (minStars) parts.push(`stars=gte.${minStars}`);
  if (onlyWithComments) parts.push("comment=not.is.null");
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
