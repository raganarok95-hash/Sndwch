// SND//WCH — api / actions/admin
// Puntos manuales, gestión de cuentas admin, inventario, exportación CSV y las métricas
// del panel de negocio.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin, safeCustomer, verifyCronSecret } from "../session.ts";
import { logAdminAction, debugLog } from "../logging.ts";
import { loadCatalogPrices, loadSecretSignature, buildTopProducts, priceCartItem, SIG_DATA, SIG_CONTENT, SIG_LABEL, SIG_GATES, VALID_BASES, VALID_TOPS, VALID_SAUCES, PROT_PRICE, SIG_ONLY_PROTS, SIG_ONLY_TOPS, SIG_ONLY_SAUCES, ORGANIZER_FREE_MIN_SANDWICHES } from "../catalog.ts";
import { computeRankName, limaDayStartIso, limaMonthStartIso, REFERRER_REWARD_POINTS, REFERRAL_BONUS_POINTS, WELCOME_BONUS_POINTS, QUEUE_MINUTES_PER_ORDER, CULQI_FEE_RATE, MAX_LOGIN_ATTEMPTS } from "../env.ts";
import { WEEKLY_PLAN_PRICE, WEEKLY_PLAN_CREDIT } from "./customer.ts";
import { businessDaysSince, COMPLAINT_DEADLINE_BUSINESS_DAYS, DEADLINE_WARNING_BUSINESS_DAYS } from "./complaints.ts";
import { sendPushToPhone, sendPushToAdmins } from "../push.ts";
import { sendRetentionEmail } from "../email.ts";
import { batchExpiryStatus, BATCH_EXPIRY_WARN_HOURS, BATCH_SHELF_LIFE_DEFAULT_DAYS, orderMargin } from "./orders.ts";

// Cuando un ingrediente que faltaba vuelve a stock, revisa si eso hace que algún
// Signature que dependía de él (base o proteína) vuelva a estar completo, y si es así
// avisa a quienes pidieron "avísame cuando vuelva" (ver actRequestRestockNotify,
// customer.ts) — sin esto, esa demanda quedaba perdida en silencio: la tarjeta AGOTADO
// ni siquiera dejaba intentar pedirlo.
// Los códigos que un Signature consume de verdad. El servidor reserva la receta COMPLETA
// (`priceSigBuild` arma [base, prot, ...tops, ...sauces] más el queso fijo), así que
// preguntar solo por pan y proteína —como se hacía acá— podía anunciar "¡Ya volvió!" con un
// topping todavía agotado, mandando al cliente a un producto que el checkout va a rechazar.
// Mismo defecto que la disponibilidad en la tarjeta del cliente (#11).
function sigIngredientCodes(sig: any): string[] {
  const codes = [sig.base, sig.prot, ...(sig.tops || []), ...(sig.sauces || [])];
  if (sig.fixedCheese) codes.push(sig.fixedCheese);
  return [...new Set(codes.filter(Boolean).map(String))];
}

async function notifyRestockedSignatures(restockedCode: string): Promise<void> {
  const affectedSigIds = Object.entries(SIG_DATA)
    .filter(([, sig]) => sigIngredientCodes(sig).includes(restockedCode))
    .map(([id]) => id);
  if (!affectedSigIds.length) return;
  for (const sigId of affectedSigIds) {
    const sig = SIG_DATA[sigId];
    const codes = sigIngredientCodes(sig);
    const rows = await sbGet(
      "inventory",
      `product_code=in.(${codes.map((c) => encodeURIComponent(c)).join(",")})&select=product_code,in_stock&limit=100`,
    );
    // Sin fila en inventory = nunca se marcó agotado, así que cuenta como disponible.
    const agotado = codes.some((c) => rows.find((r: any) => r.product_code === c)?.in_stock === false);
    if (agotado) continue;

    // Quien lo PIDIÓ explícitamente ("avísame cuando vuelva") y quien lo tiene guardado como
    // FAVORITO (#61) son dos poblaciones distintas: la segunda nunca pidió el aviso, pero ya
    // demostró que le interesa ese sándwich guardándolo. Se juntan en un solo envío para no
    // mandarle dos push a quien está en las dos listas.
    const [requests, favoritos] = await Promise.all([
      sbGet("restock_notify_requests", `sig_id=eq.${encodeURIComponent(sigId)}&select=id,customer_phone&limit=1000`),
      sbGet("favorites", `build->>sigId=eq.${encodeURIComponent(sigId)}&select=customer_phone&limit=1000`),
    ]);
    const phones = [...new Set([
      ...requests.map((r: any) => String(r.customer_phone)),
      ...favoritos.map((f: any) => String(f.customer_phone)),
    ].filter(Boolean))];
    if (!phones.length) continue;
    const pidieronAviso = new Set(requests.map((r: any) => String(r.customer_phone)));
    for (const phone of phones) {
      try {
        await sendPushToPhone(phone, {
          title: "¡Ya volvió!",
          // A quien lo pidió se le contesta lo que pidió; a quien no, se le explica por qué
          // le llega — un aviso sin motivo aparente se lee como spam.
          body: (SIG_LABEL[sigId] || "El sabor que pediste") +
            (pidieronAviso.has(phone) ? " ya está disponible de nuevo." : " —uno de tus guardados— ya está disponible de nuevo."),
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
  return { accounts: await sbGet("admin_accounts", "order=created_at.asc&limit=200") };
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

// ── Tandas: qué se cocinó cuándo, y cuánto aguanta (#5) ─────────────────────────────────
//
// Va por una acción propia de admin y no dentro de `get-catalog` a propósito: get-catalog es
// PÚBLICO, y las fechas de producción de la cocina no tienen por qué viajar a cualquiera que
// abra la app.
export async function actAdminInventoryBatches(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet(
    "inventory",
    "select=product_code,product_name,stock_qty,in_stock,batch_cooked_at,shelf_life_days&limit=500",
  );
  const now = Date.now();
  const { vencidos, porVencer } = batchExpiryStatus(rows as any[], now);
  const estado: Record<string, string> = {};
  for (const v of vencidos) estado[v.code] = "vencida";
  for (const v of porVencer) estado[v.code] = "por-vencer";
  const batches: Record<string, unknown> = {};
  for (const r of rows as any[]) {
    batches[String(r.product_code)] = {
      cookedAt: r.batch_cooked_at || null,
      shelfLifeDays: r.shelf_life_days == null ? BATCH_SHELF_LIFE_DEFAULT_DAYS : Number(r.shelf_life_days),
      estado: r.batch_cooked_at ? estado[String(r.product_code)] || "ok" : "sin-tanda",
    };
  }
  return { batches, warnHours: BATCH_EXPIRY_WARN_HOURS, defaultDays: BATCH_SHELF_LIFE_DEFAULT_DAYS };
}

// Tope alto a propósito: hay insumos secos o encurtidos que aguantan semanas. Lo que no
// puede pasar es que quede en 0 o negativo, que dejaría todo vencido desde que se cocina y
// convertiría la alerta en ruido permanente — la forma en que una alarma deja de mirarse.
const SHELF_LIFE_MAX_DAYS = 90;

export async function actAdminInventorySetShelfLife(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  if (!code) throw new ApiError("Falta el producto.");
  const dias = Math.floor(Number(b.days));
  if (!Number.isFinite(dias) || dias < 1 || dias > SHELF_LIFE_MAX_DAYS) {
    throw new ApiError(`La vida útil debe estar entre 1 y ${SHELF_LIFE_MAX_DAYS} días.`);
  }
  const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(code)}&select=product_code`);
  if (!existing.length) throw new ApiError("Ese insumo todavía no existe en el inventario: regístrale stock o una tanda primero.");
  await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(code)}`, { shelf_life_days: dias });
  await logAdminAction(s.phone, "inventory-set-shelf-life", code, { days: dias });
  return { success: true, days: dias };
}

// C7 — Reposición de una TANDA. El dueño cocina por tandas 1-2 veces por semana: cuando
// termina no sabe (ni tiene por qué calcular) el total nuevo de cada insumo, sabe cuánto
// PRODUJO. Hasta ahora el único endpoint de stock fijaba un valor absoluto, así que
// después de cada tanda había que hacer a mano "lo que quedaba + lo que cociné" por cada
// insumo, que es justo donde se equivoca alguien que acaba de cocinar 4 horas — y un
// número de stock mal puesto apaga un producto en la tienda o vende algo que ya no hay.
//
// Acá se manda cuánto se AGREGÓ y el servidor hace la suma leyendo la fila fresca. La
// lectura y la escritura no son una transacción única (PostgREST no expone un incremento
// atómico sin una RPC dedicada), pero el hueco pasa de "todo el rato que el panel estuvo
// abierto" a los milisegundos de esta llamada, con un solo operador de por medio.
//
// Un insumo sin fila en `inventory` nunca se marcó agotado: arranca de 0 y queda con lo
// que se acaba de producir, que es lo correcto — antes de la tanda no había nada.
// C1 + C2 — Vigilancia del propio sistema, en un solo cron horario.
//
// Los dos chequeos comparten un mismo agujero: cuando algo se rompe DENTRO de la
// automatización, no hay nadie mirando. La app no deja de responder, el cliente no se
// queja, y el dueño está cocinando — así que un cron muerto o un pico de errores puede
// durar días sin que nadie lo note. Todo lo que hay hoy son los logs del panel de
// Supabase, que solo miras si ya sospechas que algo anda mal.
//
// C1 — CRONS MUERTOS. pg_cron guarda si DISPARÓ cada job, pero net.http_post() vuelve al
// instante: "succeeded" ahí significa "se encoló la petición", no "la edge function hizo
// su trabajo". Si el secreto de cron rota, o `api` empieza a responder 500, los 20 jobs
// siguen marcando "succeeded" para siempre mientras nada de lo automatizado ocurre.
// dead_cron_jobs() cruza los disparos de pg_cron con los latidos que anota `api`
// (record_cron_heartbeat, ver index.ts) y devuelve los que dispararon 3+ veces sin un solo
// latido bueno. El umbral es proporcional por construcción: un job de cada 3 minutos avisa
// a los ~9 minutos, uno diario recién al tercer día — sin escribir un plazo por job.
//
// C2 — PICO DE ERRORES. debug_logs recibe todo fallo interno de `api`; en operación normal
// son unos pocos por día. error_spike() compara la última hora contra el promedio horario
// de los 7 días previos (excluyendo esa misma hora, para que el pico no se diluya solo) y
// exige además un piso absoluto: con un promedio cercano a cero, cualquier factor se
// dispara con 2 errores sueltos y la alerta deja de significar algo.
//
// Cada job muerto se avisa UNA vez (mark_cron_alerted); el aviso se rearma solo cuando ese
// job vuelve a latir bien. Sin eso, un cron roto un fin de semana manda 48 notificaciones
// idénticas y el dueño aprende a ignorarlas — que es peor que no tener alerta.
export async function actAlertSystemHealth(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);

  let deadAlerted = 0;
  const dead: any[] = await rpc("dead_cron_jobs", { p_min_misses: 3 });
  for (const job of dead || []) {
    if (job.alerted_at) continue; // ya se avisó y todavía no volvió a latir
    try {
      const desde = job.last_ok_at
        ? "Último latido: " + new Date(job.last_ok_at).toISOString().slice(0, 16).replace("T", " ") + " UTC."
        : "Nunca ha latido.";
      await sendPushToAdmins({
        title: "Automatización caída ⚠️",
        body: job.jobname + " disparó " + job.fired_since + " veces sin responder. " + desde
          + (job.last_error ? " Último error: " + String(job.last_error).slice(0, 120) : ""),
        url: "./index.html",
        tag: "sndwch-deadcron-" + job.action,
      });
      await rpc("mark_cron_alerted", { p_action: job.action });
      deadAlerted++;
    } catch (e) {
      console.error("alert-system-health: fallo avisando cron muerto", job.action, e);
    }
  }

  let spikeAlerted = 0;
  const spike: any[] = await rpc("error_spike", { p_min_errors: 10, p_factor: 4 });
  if (spike && spike.length) {
    try {
      await sendPushToAdmins({
        title: "Pico de errores 🔴",
        body: spike[0].last_hour + " errores en la última hora (lo normal es ~"
          + spike[0].baseline_per_hour + " por hora). Algo se rompió recién.",
        url: "./index.html",
        // Sin id en el tag a propósito: si el pico sigue una hora después, el aviso nuevo
        // REEMPLAZA al anterior en la bandeja en vez de apilarse.
        tag: "sndwch-error-spike",
      });
      spikeAlerted = 1;
    } catch (e) {
      console.error("alert-system-health: fallo avisando pico de errores", e);
    }
  }

  return { checked: (dead || []).length, deadAlerted, spikeAlerted };
}

const RESTOCK_MAX_ITEMS = 100;
export async function actAdminInventoryRestock(b: any) {
  const s = await requireAdmin(b.token);
  const raw = Array.isArray(b.items) ? b.items : [];
  if (!raw.length) throw new ApiError("No hay insumos que reponer.");
  if (raw.length > RESTOCK_MAX_ITEMS) throw new ApiError("Demasiados insumos en una sola reposición.");

  const items = raw.map((it: any) => {
    const code = String(it?.code || "").trim();
    if (!code) throw new ApiError("Falta el código de un insumo.");
    const add = Math.floor(Number(it?.add));
    // Solo suma: para corregir un número hacia abajo está la edición normal de stock, que
    // fija el valor exacto. Aceptar negativos acá convertiría "reponer una tanda" en una
    // forma silenciosa de descontar.
    if (!Number.isFinite(add) || add <= 0) throw new ApiError("La cantidad producida debe ser un número mayor a 0.");
    return { code, name: String(it?.name || "").trim(), add };
  });

  const applied: { code: string; from: number; to: number }[] = [];
  for (const it of items) {
    const existing = await sbGet("inventory", `product_code=eq.${encodeURIComponent(it.code)}&select=stock_qty`);
    const from = existing.length && existing[0].stock_qty != null ? Number(existing[0].stock_qty) : 0;
    const to = from + it.add;
    // Reponer es EXACTAMENTE el momento en que se cocinó una tanda, y es el único momento
    // en que el sistema puede saberlo. De acá cuelga toda la alerta de caducidad (#5): sin
    // esta fecha, una tanda de hace cinco días y una de hoy son el mismo número de stock.
    // La edición normal de stock NO la toca a propósito — corregir un número a mano es una
    // corrección, no cocinar de nuevo, y refrescar la fecha ahí borraría la caducidad real.
    const cookedAt = new Date().toISOString();
    if (existing.length) {
      await sbUpdate("inventory", `product_code=eq.${encodeURIComponent(it.code)}`, { stock_qty: to, in_stock: true, batch_cooked_at: cookedAt });
    } else {
      await sbInsert("inventory", { product_code: it.code, product_name: it.name, stock_qty: to, in_stock: true, batch_cooked_at: cookedAt });
    }
    // Una tanda es exactamente el momento en que vuelve lo que faltaba: quien pidió
    // "avísame cuando vuelva" se entera ahora, no cuando alguien se acuerde de mirar.
    await notifyRestockedSignatures(it.code);
    applied.push({ code: it.code, from, to });
  }
  // Una sola entrada de auditoría por tanda, no una por insumo: el log se lee para
  // reconstruir qué pasó, y 20 líneas idénticas del mismo minuto lo entierran.
  await logAdminAction(s.phone, "inventory-restock", undefined, { items: applied });
  return { success: true, applied };
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
  // Los cortes de "hoy" y "este mes" se calculan en HORA LIMA, no en la del servidor.
  // `new Date(y, m, d)` usa la zona local del proceso, que en Deno Deploy es UTC: toda
  // venta entre las 19:00 y las 24:00 de Lima caía en el día siguiente — justo la cena,
  // que es el pico. El RPC dashboard_aggregates ya usaba `at time zone 'America/Lima'`;
  // el desalineado era solo de este lado. limaDayStartIso/limaMonthStartIso ya existían
  // en env.ts y las usa el recordatorio de hora pico, pero acá nadie las había traído.
  const todayStart = new Date(limaDayStartIso(new Date(now))).getTime();
  const weekStart = todayStart - 6 * DAY;
  const monthStart = new Date(limaMonthStartIso(new Date(now))).getTime();
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
    sbGet("inventory", "in_stock=eq.false&select=product_code,product_name&limit=500"),
    sbGet("inventory", "stock_qty=not.is.null&select=product_code,product_name,stock_qty,low_stock_threshold&limit=500"),
    // Para medir si una campaña paga (?src=... en el link del anuncio) se está pagando
    // sola — agrupado en JS en vez de SQL porque el volumen de clientes de un negocio así
    // nunca justifica una función RPC nueva solo para este conteo. `phone` se agregó para
    // poder cruzar contra `orders` y calcular ingresos/ticket promedio por fuente.
    sbGet("customers", "select=phone,acquisition_source,total_orders&acquisition_source=not.is.null&limit=20000"),
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
    .filter((c: any) => c.daysSinceLastOrder == null || c.daysSinceLastOrder >= AT_RISK_MIN_DAYS)
    .sort((a: any, b: any) => b.riskScore - a.riskScore)
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
    // slice(0,10) sobre el ISO da el día UTC, no el de Lima: un pedido de las 20:00 de
    // Lima (01:00 UTC del día siguiente) se contaba en el día equivocado, así que la
    // tendencia de 14 días partía la cena de cada noche entre dos barras.
    const day = new Date(o.created_at).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
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
  const ingredients = prepShortfall(ingredientCounts, invRows);
  return {
    orders,
    ingredients,
    windowHours: PREP_LIST_WINDOW_HOURS,
    // #12 — Cuándo empezar cada uno, no solo en qué orden. Es secuencial porque cocina una
    // sola persona: el tercero de las 8pm hay que empezarlo 15 minutos antes, no 5.
    assembly: assemblyOrder(orders, Date.now(), QUEUE_MINUTES_PER_ORDER),
    // #10 — Los mismos ingredientes agrupados por dónde están, para armar el mise en place
    // sin volver a la refri seis veces. Es la MISMA lista, presentada para usarse en la
    // cocina en vez de para leerse — dos consultas distintas darían dos verdades distintas.
    miseEnPlace: miseEnPlaceGroups(ingredients),
    minutesPerOrder: QUEUE_MINUTES_PER_ORDER,
  };
}

// Cruce de lo que hace falta contra lo que hay. Se extrajo de actAdminPrepList para que la
// ALERTA (#26) use exactamente el mismo criterio que la pantalla, en vez de una segunda
// copia que con el tiempo diverge — el mismo motivo por el que `cancellationDeltas` salió
// de las dos cancelaciones. Y porque así se puede probar: decidir mal acá no produce un
// error, produce una alerta que no sale.
export type PrepIngredient = { code: string; label: string; qty: number; stockQty: number | null; shortfall: boolean };

export function prepShortfall(
  ingredientCounts: Map<string, number>,
  invRows: { product_code: string; product_name?: string | null; in_stock?: boolean | null; stock_qty?: number | null }[],
): PrepIngredient[] {
  const invMap = new Map<string, any>((invRows || []).map((r) => [r.product_code, r]));
  return [...ingredientCounts.keys()]
    .map((code) => {
      const inv = invMap.get(code);
      const qty = ingredientCounts.get(code)!;
      const stockQty = inv?.stock_qty ?? null;
      // Sin fila en inventory = nunca se marcó agotado ni se le puso cantidad — no hay
      // forma de saber si alcanza, así que no se marca como faltante. Inventar un faltante
      // acá haría sonar la alarma por insumos que el dueño nunca quiso rastrear.
      const shortfall = inv?.in_stock === false || (stockQty != null && stockQty < qty);
      return { code, label: inv?.product_name || code, qty, stockQty, shortfall };
    })
    .sort((a, b) => (a.shortfall === b.shortfall ? b.qty - a.qty : a.shortfall ? -1 : 1));
}

// #26 — ALERTA de pedido programado sin insumo.
//
// La pantalla de arriba ya calcula el faltante, pero solo lo ve quien la abre. El caso que
// importa es el contrario: el pedido es para las 8pm, algo se marcó agotado a las 5pm, y
// nadie va a abrir esa pantalla en el medio. Avisar mientras todavía se puede cocinar o
// llamar al cliente es la diferencia entre resolverlo y cancelar a la hora de entregar.
//
// Por qué esto NO es redundante con la reserva de inventario: `reserve_inventory` descuenta
// al reservar, así que un pedido programado ya tiene sus porciones apartadas. El hueco real
// son los insumos SIN cantidad rastreada (stock_qty nulo: la reserva no los toca, solo
// existe el interruptor in_stock) y las correcciones manuales de stock hacia abajo, que
// pueden dejar el número por debajo de lo ya comprometido. Ninguno de los dos casos avisa
// solo hoy.
const SHORTFALL_ALERT_WINDOW_HOURS = 12;

export async function actAlertScheduledShortfall(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  await loadCatalogPrices();
  const nowIso = new Date().toISOString();
  const windowEndIso = new Date(Date.now() + SHORTFALL_ALERT_WINDOW_HOURS * 3600000).toISOString();
  const rows = await sbGet(
    "orders",
    `delivery_time=not.is.null&delivery_time=gte.${encodeURIComponent(nowIso)}&delivery_time=lte.${encodeURIComponent(windowEndIso)}` +
      `&status=neq.CANCELADO&status=neq.ENTREGADO&select=ref,delivery_time,items&order=delivery_time.asc&limit=500`,
  );
  if (!rows.length) return { success: true, alerted: false, orders: 0 };

  const ingredientCounts = new Map<string, number>();
  for (const o of rows) {
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items) {
      try {
        const priced = priceCartItem(it);
        for (const code of priced.ingredientsPerUnit) {
          ingredientCounts.set(code, (ingredientCounts.get(code) || 0) + priced.qty);
        }
      } catch {
        // Ítem legado fuera del catálogo actual: se omite ese ítem, no la alerta entera.
      }
    }
  }
  const codes = [...ingredientCounts.keys()];
  const invRows = codes.length
    ? await sbGet("inventory", `product_code=in.(${codes.map((c) => encodeURIComponent(c)).join(",")})&select=product_code,product_name,in_stock,stock_qty&limit=500`)
    : [];
  const faltantes = prepShortfall(ingredientCounts, invRows).filter((i) => i.shortfall);
  if (!faltantes.length) return { success: true, alerted: false, orders: rows.length };

  // Una vez cada 3 horas como mucho: el cron corre seguido a propósito (para enterarse
  // pronto), pero repetir el mismo aviso cada hora lo vuelve ruido y el ruido se ignora.
  const clave = "scheduled-shortfall:" + faltantes.map((f) => f.code).sort().join(",");
  if (!(await rpc("check_rate_limit", { p_key: clave, p_limit: 1, p_window_minutes: 180 }))) {
    return { success: true, alerted: false, throttled: true, orders: rows.length };
  }

  const detalle = faltantes
    .slice(0, 4)
    .map((f) => f.label + " (hacen falta " + f.qty + (f.stockQty == null ? ", marcado agotado" : ", hay " + f.stockQty) + ")")
    .join(", ");
  const proximo = new Date(rows[0].delivery_time).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
  await sendPushToAdmins({
    title: "⚠️ Pedido programado sin insumo",
    body: `${rows.length} pedido(s) programado(s), el primero a las ${proximo}. Falta: ${detalle}${faltantes.length > 4 ? "…" : ""}. Todavía hay tiempo de cocinar o de llamar al cliente.`,
    url: "./index.html",
    tag: "sndwch-scheduled-shortfall",
    renotify: true,
  });
  return { success: true, alerted: true, orders: rows.length, faltantes: faltantes.length };
}

// ── #32: rechazo de tarjeta alto ────────────────────────────────────────────────────────
//
// Si de golpe la mitad de los cobros falla, algo se rompió del lado de los pagos: Culqi, el
// 3DS, la cuenta del comercio, o una llave mal puesta tras un deploy. Hoy el dueño se
// enteraría por un cliente escribiendo "no me deja pagar" — es decir, después de perder
// varias ventas y sin saber que fueron varias.
//
// El dato ya existe: `claimAndChargeCulqi` escribe en `debug_logs` un evento
// 'culqi-rejected' por cada rechazo y 'charge-succeeded' por cada cobro. Nadie los cruzaba.
const DECLINE_WINDOW_HOURS = 3;
// Con pocos intentos, el porcentaje no significa nada: 1 rechazo de 1 es 100% y puede ser
// simplemente una tarjeta sin fondos. El mínimo evita que la alarma suene el primer día.
const DECLINE_MIN_CHARGES = 5;
// La mitad. No es un umbral fino: por debajo de eso hay rechazos normales (fondos, límites,
// tarjetas vencidas) y afinar el número sin datos reales sería inventar precisión.
const DECLINE_RATE_THRESHOLD = 0.5;

export type DeclineStats = { total: number; rejected: number; rate: number; alert: boolean; reasons: string[] };

// Cálculo puro, extraído para poder probarlo: su modo de fallo es una alarma que suena por
// nada (y entonces se ignora) o que no suena mientras se pierden ventas. Ninguno de los dos
// se ve como un error.
export function declineStats(
  rows: { detail?: { event?: string; culqi?: { user_message?: string; merchant_message?: string } } | null }[],
  opts?: { minCharges?: number; threshold?: number },
): DeclineStats {
  const minCharges = opts?.minCharges ?? DECLINE_MIN_CHARGES;
  const threshold = opts?.threshold ?? DECLINE_RATE_THRESHOLD;
  let rejected = 0;
  let succeeded = 0;
  const reasons: string[] = [];
  for (const r of rows || []) {
    const ev = r?.detail?.event;
    if (ev === "culqi-rejected") {
      rejected++;
      const m = r.detail?.culqi?.user_message || r.detail?.culqi?.merchant_message;
      if (m && !reasons.includes(m)) reasons.push(String(m).slice(0, 120));
    } else if (ev === "charge-succeeded") {
      succeeded++;
    }
    // 'culqi-fetch-failed' NO cuenta como rechazo: es la red entre nosotros y Culqi, no una
    // tarjeta rechazada. Mezclarlos convertiría un corte de red en "tus clientes no pueden
    // pagar con tarjeta", que manda a revisar el lugar equivocado.
  }
  const total = rejected + succeeded;
  const rate = total ? rejected / total : 0;
  return { total, rejected, rate, alert: total >= minCharges && rate >= threshold, reasons: reasons.slice(0, 3) };
}

export async function actAlertCardDeclines(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const desde = new Date(Date.now() - DECLINE_WINDOW_HOURS * 3600000).toISOString();
  const rows = await sbGet(
    "debug_logs",
    `source=in.(create-charge,create-credit-charge)&created_at=gte.${encodeURIComponent(desde)}&select=detail&limit=1000`,
  );
  const stats = declineStats(rows as any[]);
  if (!stats.alert) return { success: true, alerted: false, ...stats };

  // Una vez cada 3 horas: mientras el problema siga, el cron lo va a seguir viendo, y
  // repetir el mismo aviso cada hora lo vuelve ruido.
  if (!(await rpc("check_rate_limit", { p_key: "card-declines", p_limit: 1, p_window_minutes: 180 }))) {
    return { success: true, alerted: false, throttled: true, ...stats };
  }
  await sendPushToAdmins({
    title: "💳 Muchos pagos rechazados",
    body: `${stats.rejected} de ${stats.total} cobros con tarjeta fallaron en las últimas ${DECLINE_WINDOW_HOURS} h`
      + (stats.reasons.length ? `. Motivo más común: ${stats.reasons[0]}` : "")
      + ". Revisa Culqi antes de perder más ventas.",
    url: "./index.html",
    tag: "sndwch-card-declines",
    renotify: true,
  });
  return { success: true, alerted: true, ...stats };
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
    const entry = map.get(addr) || { count: 0, reasons: [] as string[], lastAt: o.created_at };
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
// #50 — El contenido semanal deja de ser un literal con números escritos a mano.
//
// TRES NÚMEROS DE ESTE TEXTO ESTABAN MAL, y no es un detalle: esto es lo que el dueño COPIA
// Y PEGA a Instagram y WhatsApp, o sea una promesa pública.
//   · "ambos ganan 50 puntos" por referir — falso desde el 2026-08-15: quien invita se lleva
//     400 (un 15CM) y el invitado 120 (una bebida). El post prometía menos de la décima parte.
//   · "se desbloquea desde tu 5to pedido" para el menú secreto — falso desde el 2026-08-26,
//     cuando bajó a 3. Dos pedidos de más para algo que la app ya le habría dado.
//   · "S/95 → S/100" del Plan Semanal, escrito a mano al lado de las constantes reales.
// Ninguno de los tres iba a avisar nunca: son texto, no cálculo.
//
// Por eso ahora es una FUNCIÓN y no un array: cada número sale de la constante que de verdad
// lo manda (REFERRER_REWARD_POINTS, SIG_GATES.SIG05.minOrders, WEEKLY_PLAN_PRICE...), leída
// en el momento de armar el texto. El umbral del menú secreto además es editable desde el
// panel, así que un literal se desincronizaría otra vez el día que el dueño lo mueva.
//
// Llamar a loadCatalogPrices() antes (que arrastra loadSecretSignature) es lo que hace que
// SIG_GATES.SIG05.minOrders sea el valor vigente y no la semilla del código.
//
// ── EL GUION DE VIDEO NO ES UN EXTRA: ES EL FORMATO QUE DE VERDAD SE PAUTA ──────────────
//
// Hasta el 2026-09-04 los 8 temas proponían una FOTO y ninguno un video, mientras
// `marketing_calendar` ya soportaba `media_type='video'` y la publicación automática a
// IG/FB ya estaba construida. O sea que la única parte que costaba trabajo —decidir qué
// grabar— seguía sin resolverse justo para el formato que la pauta necesita.
//
// Cada `videoIdea` es un guion RODABLE, no una idea: formato, duración, y qué pasa en cada
// tramo. Los formatos (A..E) y las reglas que llevan dentro salen de `FLUJO_VIDEO_ANUNCIOS.md`
// y cada una tiene fuente de plataforma o de estudio:
//   · 9:16 y 12-18 s — 9:16 con audio dio 34.5% menor costo por resultado que imagen en Reels.
//   · El gancho va en el fotograma 1 y el logo AL FINAL — abrir con marca tira el video.
//   · El "//" y el sándwich en el mismo plano que la cara — es la mitigación medida del
//     efecto vampiro (que el personaje se robe el recuerdo de la marca).
// Los hermanos casi nunca comparten plano cerrado: está reportado que la identidad de los
// personajes se degrada en Flow cuando dos comparten primer plano.
//
// Las cifras se interpolan igual que en los otros tres campos, por la misma razón: un número
// escrito a mano en un texto que el dueño copia y pega es una promesa que se rompe sola.
export function marketingContent(): { theme: string; whatsapp: string; caption: string; photoIdea: string; videoIdea: string }[] {
  const secretoMin = SIG_GATES.SIG05?.minOrders ?? 3;
  return [
  {
    theme: "LANZAMIENTO",
    whatsapp: `🥪 SND//WCH ya está abierto — pide por la app, arma tu Signature o el tuyo desde cero. Crear tu cuenta te regala ${WELCOME_BONUS_POINTS} puntos.`,
    caption: `Ya abrimos // SND//WCH llega a tu zona. Sándwiches armados al momento, Signature builds curados o arma el tuyo desde cero. Pide directo desde la app — crear tu cuenta te regala ${WELCOME_BONUS_POINTS} puntos para canjear después.`,
    photoIdea: "Tu Signature más vendido, foto cercana con buena luz natural, o el equipo preparando el primer pedido real.",
    videoIdea: `A · EL PLEITO — 9:16, 15 s. 0-2s plano dividido, sin música: el calmado pone UNA salsa con cuidado, el alocado echa cinco de golpe. 2-6s CALMADO: "Está terminado." ALOCADO: "Le falta." 6-12s los dos sándwiches al centro, los dos se ven bien (ninguno es el chiste). 12-15s el "//" entra entre ambos: "Los dos están en la carta. Ya abrimos." Sobreimpreso al cierre: crear tu cuenta te da ${WELCOME_BONUS_POINTS} puntos.`,
  },
  // ⚠ EL ORDEN DE ESTE ARRAY NO ES COSMÉTICO: ES LA ROTACIÓN DE FORMATOS DE VIDEO.
  //
  // `marketingWeekIndex()` avanza una posición por semana y la pantalla de MARKETING enseña
  // SIEMPRE dos temas seguidos ("esta semana" y "próxima semana"). Con LANZAMIENTO y PRUEBA
  // SOCIAL juntos —los dos EL PLEITO— el panel mostraba el mismo formato dos veces y parecía
  // que el sistema entero era un solo formato. REFERIDOS (LA MESA LARGA) va en el medio para
  // romper eso.
  //
  // La regla la fija `tests-api/guion-de-video.test.ts`: **dos temas consecutivos nunca
  // comparten formato, contando el salto del último al primero** (la rotación es circular, así
  // que RECORDATORIO → LANZAMIENTO también es un par consecutivo). Si mueves, agregas o
  // quitas un tema, esa prueba te avisa; sin ella el defecto vuelve en silencio, porque
  // reordenar no rompe nada que compile.
  {
    theme: "REFERIDOS",
    whatsapp: `Invita a un amigo a SND//WCH: cuando haga su primer pedido, tú te ganas un sándwich 15CM gratis (${REFERRER_REWARD_POINTS} puntos) y él una bebida (${REFERRAL_BONUS_POINTS}). Tu código está en tu perfil de la app.`,
    caption: `Comparte y gana // Cada amigo que invitas con tu código te deja un sándwich 15CM gratis cuando hace su primer pedido, y él arranca con una bebida de regalo. Y hay premios extra al 3.º, 5.º y 10.º amigo — la escalera completa está en tu perfil.`,
    photoIdea: "Gráfico simple de la escalera (3 · 5 · 10 amigos) sobre el verde/dorado de la marca, o dos sándwiches juntos.",
    videoIdea: `E · LA MESA LARGA — 9:16, 16 s. Único formato donde colaboran. 0-2s el alocado arrastra a alguien fuera de cuadro hacia la mesa. 2-8s el calmado le sirve un sándwich al recién llegado, sin decir nada. 8-13s los dos sándwiches y el "//" en cuadro. 13-16s cierre: quien invita se gana un 15CM (${REFERRER_REWARD_POINTS} pts) y el invitado una bebida (${REFERRAL_BONUS_POINTS} pts).`,
  },
  {
    theme: "PRUEBA SOCIAL",
    whatsapp: "¿Ya probaste SND//WCH? Calificar tu pedido te toma 10 segundos y nos ayuda un montón 🙏",
    caption: "La mejor publicidad la hacen ustedes // Si ya pediste con nosotros, califica tu experiencia desde la app (PUNTOS → MIS PEDIDOS). Cada reseña le muestra a más gente por qué vale la pena.",
    photoIdea: "Captura de una calificación de 5 estrellas (con permiso del cliente), o foto de alguien recibiendo su pedido.",
    videoIdea: "A · EL PLEITO — 9:16, 14 s. 0-2s los dos miran el mismo celular. 2-7s ALOCADO: \"Cinco estrellas. Fue el mío.\" CALMADO, sin mirarlo: \"No dice cuál.\" 7-11s los dos sándwiches en el mismo plano que sus caras. 11-14s cierre: \"Califica el tuyo desde la app y dinos de quién fue.\" Ojo: si usas una reseña real necesitas permiso del cliente.",
  },
  {
    theme: "MENÚ SECRETO",
    whatsapp: `Hay un Signature que no está en el menú público. Se desbloquea a partir de tu pedido número ${secretoMin} 👀`,
    caption: `Lo que no ves en el menú // A partir de tu pedido número ${secretoMin} se desbloquea un Signature que no aparece para nadie más, y cambia cada mes. No decimos cuál — te lo tienes que ganar.`,
    photoIdea: "Nada del producto en sí (es secreto) — una imagen oscura/misteriosa o solo texto sobre el fondo de marca.",
    videoIdea: `D · EL SECRETO — 9:16, 12 s. Oscuro, el más corto de los cinco. 0-2s el alocado se acerca a cámara: "Hay uno que no está en el—". 2-5s el calmado le tapa la boca. 5-9s silencio, solo el "//" iluminado. 9-12s texto en pantalla: se desbloquea en tu pedido número ${secretoMin}. NO se muestra el producto: no se puede. ⚠ Usa este formato POCO — lo "interesante" da un pico de conversación y no lo sostiene.`,
  },
  {
    theme: "COMBO / HORA VALLE",
    whatsapp: "En hora valle tu bebida sale gratis con cualquier sándwich. Se aplica solo, sin código.",
    caption: "Combo inteligente // Agrega una bebida a tu sándwich y ahorra automático — en hora valle, hasta gratis. Válido solo desde la app.",
    photoIdea: "Sándwich + bebida juntos, estilo flat lay.",
    videoIdea: "A · EL PLEITO — 9:16, 14 s. 0-2s el alocado pone la bebida al lado del sándwich de un golpe. 2-6s CALMADO: \"No la pediste.\" ALOCADO: \"No la pagué.\" 6-11s sándwich + bebida + el \"//\" en cuadro con las dos caras. 11-14s cierre: en hora valle la bebida va gratis, se aplica sola y sin código.",
  },
  {
    theme: "PEDIDOS GRUPALES",
    whatsapp: "¿Almuerzo con la oficina, los amigos o la familia? Organiza un pedido grupal en SND//WCH — cada quien agrega el suyo desde tu link, se paga todo junto. Desde 5 sándwiches, el 15CM más barato va gratis.",
    caption: "Para el grupo // Comparte un link, cada quien arma su sándwich, se paga todo en un solo pedido. Desde 5 sándwiches invitamos el 15CM más barato del grupo.",
    photoIdea: "Varios sandwiches distintos en fila, sugiriendo variedad para un grupo.",
    videoIdea: `E · LA MESA LARGA — 9:16, 16 s. 0-2s manos distintas entrando en cuadro por los dos lados. 2-9s los hermanos reparten sándwiches distintos sin pelearse — cada uno entrega los suyos. 9-13s plano cenital de la mesa llena, el "//" al centro. 13-16s cierre: un link, cada quien arma el suyo, y desde ${ORGANIZER_FREE_MIN_SANDWICHES} sándwiches invitamos el 15CM más barato.`,
  },
  {
    theme: "PLAN SEMANAL",
    whatsapp: `Paga S/${WEEKLY_PLAN_PRICE} hoy y recibe S/${WEEKLY_PLAN_CREDIT} en saldo para pedir cuando quieras. El saldo no vence.`,
    caption: "Plan Semanal // Paga por adelantado y recibe más de lo que pusiste. Pide cuando quieras durante la semana, sin compromiso de horario fijo.",
    photoIdea: `Gráfico 'S/${WEEKLY_PLAN_PRICE} → S/${WEEKLY_PLAN_CREDIT}', o varios pedidos de la semana juntos.`,
    videoIdea: `C · LA RECETA DEL CALMADO — 9:16, 15 s. Casi sin diálogo, es el formato de textura. 0-3s sonido real del pan y el cuchillo, sin música. 3-10s el calmado arma un Signature en orden, plano cerrado de las manos. 10-13s el alocado asoma al fondo y no toca nada. 13-15s cierre: paga S/${WEEKLY_PLAN_PRICE} y recibe S/${WEEKLY_PLAN_CREDIT} de saldo, que no vence. Un Signature distinto cada vez que uses este formato.`,
  },
  {
    theme: "RECORDATORIO",
    whatsapp: "SND//WCH — pedidos todos los días. Arma el tuyo o elige un Signature curado por nosotros.",
    caption: "Por si se te olvidó que existimos // Seguimos aquí, armando sandwiches todos los días. Pide por la app cuando se te antoje.",
    photoIdea: "Cualquier foto de producto que no hayas usado en semanas anteriores.",
    videoIdea: "B · EL RETO DEL ALOCADO — 9:16, 15 s. 0-2s el alocado ya está agregando cosas, arranca a media acción. 2-9s sigue apilando, el calmado lo mira sin decir una palabra. 9-13s el sándwich terminado en el mismo plano que su cara y el \"//\". 13-15s cierre: \"Y sí, puedes pedirlo así.\" ⚠ Excesivo pero RECONOCIBLE como sándwich: la comida que se ve típica genera más engagement que la rara.",
  },
  ];
}
function marketingWeekIndex(offset = 0): number {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const weekNumber = Math.floor(daysSinceEpoch / 7) + offset;
  const n = marketingContent().length;
  return ((weekNumber % n) + n) % n;
}
export async function actAdminMarketingContent(b: any) {
  await requireAdmin(b.token);
  // Sin esto, SIG_GATES.SIG05.minOrders sería la semilla del código y no el umbral que el
  // dueño tenga puesto hoy en el panel — justo el número que este texto promete en público.
  await loadCatalogPrices();
  const temas = marketingContent();
  return {
    current: temas[marketingWeekIndex()],
    next: temas[marketingWeekIndex(1)],
  };
}

// ── #50: GENERAR EL CALENDARIO, NO SOLO RECORDARLO ─────────────────────────────────────
//
// Hasta hoy el cron semanal solo avisaba "toca publicar" y el rotador enseñaba el texto de
// la semana. El calendario real (marketing_calendar) existía desde antes, con fechas y
// estado — pero había que llenarlo A MANO, entrada por entrada. O sea que la parte que
// costaba trabajo seguía siendo trabajo, y un recordatorio sin el borrador hecho es
// exactamente el tipo de aviso que se termina ignorando.
//
// Ahora el cron ADELANTA los borradores: deja las próximas semanas ya escritas en estado
// `draft`, con caption, texto de WhatsApp e idea de foto. El dueño edita o borra, que es
// mucho más barato que escribir desde cero.
//
// Sigue sin publicar nada solo: no hay conector real a Instagram/TikTok en este sistema
// (ver la sección de publicación automática en CLAUDE.md), y fingir que sí lo hay sería
// peor que no tenerlo.
const CALENDAR_GENERATE_WEEKS = 4;
const CALENDAR_GENERATE_MAX_WEEKS = 12;

// Cálculo puro (probado en tests-api/calendario-contenido.test.ts). Lo que decide es qué
// fechas se van a ESCRIBIR en la base, y el modo de fallo que importa es la duplicación:
// este generador corre cada semana sobre la misma tabla, así que sin el filtro de fechas ya
// ocupadas la cuarta corrida dejaría cuatro borradores encima del mismo día y el calendario
// —cuyo único valor es decir qué toca publicar hoy— se volvería ilegible.
export function planContentCalendar(
  desdeFecha: string,
  semanas: number,
  temas: { theme: string; whatsapp: string; caption: string; photoIdea: string; videoIdea: string }[],
  indiceInicial: number,
  yaOcupadas: Set<string>,
): { scheduled_date: string; title: string; caption_text: string; whatsapp_text: string; photo_idea: string; video_idea: string }[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desdeFecha) || !Array.isArray(temas) || temas.length === 0) return [];
  const n = Math.max(0, Math.min(Math.floor(Number(semanas) || 0), CALENDAR_GENERATE_MAX_WEEKS));
  const [y, m, d] = desdeFecha.split("-").map(Number);
  const salida = [];
  for (let k = 0; k < n; k++) {
    // Aritmética en UTC y no con `new Date(str)`: sumar días sobre una fecha local hace que
    // un cambio de mes o de año corra la fecha un día según la zona horaria del runtime.
    const fecha = new Date(Date.UTC(y, m - 1, d + k * 7)).toISOString().slice(0, 10);
    if (yaOcupadas.has(fecha)) continue;
    const tema = temas[(((indiceInicial + k) % temas.length) + temas.length) % temas.length];
    salida.push({
      scheduled_date: fecha,
      title: tema.theme,
      caption_text: tema.caption,
      whatsapp_text: tema.whatsapp,
      photo_idea: tema.photoIdea,
      video_idea: tema.videoIdea,
    });
  }
  return salida;
}

async function generarBorradores(semanas: number, creadoPor: string): Promise<{ creados: number; fechas: string[] }> {
  await loadCatalogPrices();
  const hoy = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10); // hora Lima
  // Se leen las fechas que YA tienen entrada —cualquiera, no solo las generadas— para no
  // pisar lo que el dueño planeó a mano. Su plan manda sobre el borrador automático.
  const existentes = await sbGet(
    "marketing_calendar",
    `scheduled_date=gte.${hoy}&select=scheduled_date&limit=${CALENDAR_LIST_LIMIT}`,
  );
  const ocupadas = new Set<string>(existentes.map((r: any) => String(r.scheduled_date).slice(0, 10)));
  const nuevas = planContentCalendar(hoy, semanas, marketingContent(), marketingWeekIndex(), ocupadas);
  if (!nuevas.length) return { creados: 0, fechas: [] };
  await sbInsert(
    "marketing_calendar",
    nuevas.map((e) => ({ ...e, channel: "instagram", status: "draft", created_by: creadoPor })),
  );
  return { creados: nuevas.length, fechas: nuevas.map((e) => e.scheduled_date) };
}

export async function actAdminCalendarGenerate(b: any) {
  const s = await requireAdmin(b.token);
  const semanas = Number(b.weeks) > 0 ? Number(b.weeks) : CALENDAR_GENERATE_WEEKS;
  const res = await generarBorradores(semanas, s.phone);
  await logAdminAction(s.phone, "calendar-generate", `${res.creados} borradores`, { semanas, fechas: res.fechas });
  return { success: true, ...res };
}

// Cron semanal — no publica nada (ninguna red social está conectada a este sistema). Desde
// #50 además de avisar DEJA LOS BORRADORES HECHOS para las próximas semanas.
export async function actRemindMarketingContent(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  await loadCatalogPrices();
  const theme = marketingContent()[marketingWeekIndex()].theme;
  // Best-effort: si la generación falla, el aviso de la semana igual tiene que salir. Al
  // revés —dejar que un error de la tabla se coma el recordatorio— el dueño se quedaría sin
  // las dos cosas.
  let creados = 0;
  try {
    creados = (await generarBorradores(CALENDAR_GENERATE_WEEKS, "cron")).creados;
  } catch (e) {
    console.error("calendar auto-generate failed:", e);
  }
  await sendPushToAdmins({
    title: "Contenido de esta semana listo 📣",
    body: `Tema: ${theme}.` + (creados ? ` Dejé ${creados} ${creados === 1 ? "borrador nuevo" : "borradores nuevos"} en el calendario.` : "") +
      " Panel admin → MARKETING.",
    url: "./index.html",
    tag: "sndwch-weekly-marketing",
    renotify: true,
  });
  return { success: true, theme, borradoresCreados: creados };
}

// Calendario de contenido real (marketing_calendar) — reemplaza depender solo del rotador
// estático de arriba (marketingContent()) para "qué publicar hoy": el dueño puede planear
// fechas concretas, por canal, con estado real (borrador/programado/publicado). Nada de
// esto publica solo (mismo límite que el resto del sistema de marketing — no hay conector
// real a Instagram/TikTok/Meta en este entorno) — es la lista de acción que el dueño copia
// a mano, igual que ya hacía con marketingContent(), pero con fechas y estado reales en vez
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
    // 1500 y no 500: un guion por tramos (formato, duración, qué pasa en cada tramo) no
    // entra en el mismo tope que "sándwich + bebida, flat lay". Cortarlo a 500 dejaría el
    // cierre —que es justo donde va la oferta— fuera del texto guardado.
    video_idea: b.videoIdea ? String(b.videoIdea).slice(0, 1500) : null,
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
  if (b.videoIdea !== undefined) patch.video_idea = b.videoIdea ? String(b.videoIdea).slice(0, 1500) : null;
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

// Sándwich secreto con rotación mensual (decisión del dueño, 2026-08-10 — ver
// loadSecretSignature en ../catalog.ts). Publicar un cambio siempre INSERTA una fila
// nueva en vez de actualizar in-place — la fila vigente es la de mayor id, así el
// historial de sándwiches secretos anteriores queda gratis para revisión/marketing
// futura, sin una tabla de auditoría aparte.
const SECRET_SIGNATURE_HISTORY_LIMIT = 12;
export async function actAdminSecretSignatureGet(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("secret_signature", `select=*&order=id.desc&limit=${SECRET_SIGNATURE_HISTORY_LIMIT}`);
  return { current: rows[0] || null, history: rows.slice(1) };
}
export async function actAdminSecretSignatureSet(b: any) {
  const s = await requireAdmin(b.token);
  const name = String(b.name || "").trim();
  if (!name) throw new ApiError("Falta el nombre del sándwich del mes.", 400);
  const base = String(b.base || "").trim();
  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.", 400);
  // Los ingredientes exclusivos de OTRO Signature (SIG_ONLY_*) se rechazan acá, no solo en
  // la UI del panel: el filtro del cliente evita elegirlos en pantalla, pero una llamada
  // directa a la API (o un cambio futuro de esa UI) podría publicar un menú secreto que
  // usara la proteína/topping/salsa exclusiva de otro Signature, rompiendo en silencio esa
  // exclusividad — que es justo lo que hace distinto a ese Signature (hallazgo de
  // auditoría). El servidor es quien manda.
  // Los 3 Sets están VACÍOS desde que se retiró THE CHICAGO (2026-08-22, era el único
  // Signature público con ingredientes propios), así que hoy estas guardas no rechazan
  // nada. Se quedan a propósito: vuelven a tener efecto solo, sin tocar este archivo, en
  // cuanto SIG_ONLY_* deje de estar vacío.
  const proteinId = String(b.proteinId || "").trim();
  if (!PROT_PRICE[proteinId]) throw new ApiError("Proteína inválida.", 400);
  if (SIG_ONLY_PROTS.has(proteinId)) throw new ApiError("Esa proteína es exclusiva de otro Signature — elige otra.", 400);
  const tops = Array.isArray(b.tops) ? b.tops.map(String) : [];
  if (tops.length > 3 || new Set(tops).size !== tops.length || tops.some((t: string) => !VALID_TOPS.has(t))) {
    throw new ApiError("Toppings inválidos (máximo 3, sin repetir, de la lista real).", 400);
  }
  if (tops.some((t: string) => SIG_ONLY_TOPS.has(t))) {
    throw new ApiError("Uno de esos toppings es exclusivo de otro Signature — elige otro.", 400);
  }
  const sauces = Array.isArray(b.sauces) ? b.sauces.map(String) : [];
  if (sauces.length > 2 || new Set(sauces).size !== sauces.length || sauces.some((sc: string) => !VALID_SAUCES.has(sc))) {
    throw new ApiError("Salsas inválidas (máximo 2, sin repetir, de la lista real).", 400);
  }
  if (sauces.some((sc: string) => SIG_ONLY_SAUCES.has(sc))) {
    throw new ApiError("Una de esas salsas es exclusiva de otro Signature — elige otra.", 400);
  }
  // Al menos una salsa: priceSigBuild usa la última salsa de la receta como la porción
  // que se duplica al pedir SALSA EXTRA. Sin ninguna, ese extra no mapea a ningún
  // ingrediente real (ver el comentario de canExtraSauce en catalog.ts).
  if (!sauces.length) throw new ApiError("Elige al menos una salsa para la receta.", 400);
  const price15 = Number(b.price15);
  const price30 = Number(b.price30);
  if (!(price15 > 0) || !(price30 > 0)) throw new ApiError("Precio inválido.", 400);
  const minOrders = Number(b.minOrders);
  if (!Number.isInteger(minOrders) || minOrders < 0) throw new ApiError("Pedidos mínimos inválidos.", 400);
  // vaultOnlyIds: qué ingredientes de ESTA receta quedan reservados solo al menú
  // secreto (no se pueden armar más barato por ARMA EL TUYO) — debe ser subconjunto de
  // los ingredientes reales elegidos arriba, nunca un id ajeno a la receta.
  const vaultOnlyIds = Array.isArray(b.vaultOnlyIds) ? b.vaultOnlyIds.map(String) : [];
  const allowedIds = new Set([proteinId, ...tops, ...sauces]);
  if (vaultOnlyIds.some((id: string) => !allowedIds.has(id))) {
    throw new ApiError("Solo puedes marcar como exclusivo un ingrediente que sea parte de esta receta.", 400);
  }
  // GUARDA SIMÉTRICA (2026-08-28). El panel de Signatures ya impide publicar uno público
  // con un ingrediente reservado al menú secreto, pero la comprobación INVERSA no existía:
  // se podía reservar como exclusivo un ingrediente que un Signature público ya usa (por
  // ejemplo T01 Tomate, que lleva The Original). El efecto no es visible desde este panel
  // pero sí para el cliente: priceByoBuild empieza a rechazar ese ingrediente en ARMA EL
  // TUYO mientras el Signature público lo sigue llevando, así que se le quita un topping
  // base al catálogo sin que nadie lo haya decidido.
  const usadosEnPublicos = new Set<string>();
  for (const code of Object.keys(SIG_DATA)) {
    if (code === "SIG05") continue;
    if (SIG_CONTENT[code] && SIG_CONTENT[code].active === false) continue;
    const d = SIG_DATA[code];
    usadosEnPublicos.add(d.prot);
    for (const t of d.tops) usadosEnPublicos.add(t);
    for (const sa of d.sauces) usadosEnPublicos.add(sa);
  }
  const enConflicto = vaultOnlyIds.filter((id: string) => usadosEnPublicos.has(id));
  if (enConflicto.length) {
    throw new ApiError(
      "No puedes reservar al menú secreto un ingrediente que un Signature de la carta ya usa (" +
        enConflicto.join(", ") + "). Retíralo de esa receta primero, o elige otro.",
      400,
    );
  }
  const imagePath = b.imagePath ? String(b.imagePath).trim().slice(0, 300) : null;
  await sbInsert("secret_signature", {
    name,
    base,
    protein_id: proteinId,
    tops,
    sauces,
    price_15: price15,
    price_30: price30,
    vault_only_ids: vaultOnlyIds,
    min_orders: minOrders,
    image_path: imagePath,
    created_by: s.phone,
  });
  await logAdminAction(s.phone, "secret-signature-set", name, { proteinId, tops, sauces, price15, price30, minOrders, vaultOnlyIds });
  await loadSecretSignature();
  // C3 — El menú secreto rota cada mes y el cliente que ya lo desbloqueó no tiene forma de
  // enterarse: hay que abrir la app y mirar. Un sándwich que solo existe un mes y que solo
  // ve quien se lo ganó pierde todo su efecto si nadie sabe que cambió.
  const announced = await announceSecretDrop(name, minOrders, b.announce !== false);
  return { success: true, announced };
}

// Aviso del sándwich secreto del mes a quienes YA lo desbloquearon.
//
// Tres reglas que no se pueden aflojar:
// · Solo a quien alcanzó el umbral de pedidos. Avisarle a alguien que todavía no puede
//   pedirlo convierte el mecanismo en publicidad de algo que no puede comprar, que es lo
//   contrario de una recompensa.
// · NUNCA se nombra un ingrediente. La composición no revelada es el mecanismo entero; el
//   push lleva el nombre del sándwich y nada más.
// · Un solo aviso por rotación. Publicar es append-only, así que corregir un typo inserta
//   otra fila: sin esta guarda, arreglar una tilde manda un segundo push a todo el mundo.
//   Se mira `marketing_touches` (la misma tabla que ya deduplica los crons de re-enganche)
//   en vez de agregar una columna nueva.
const SECRET_DROP_CAMPAIGN = "secret-menu-drop";
const SECRET_DROP_COOLDOWN_HOURS = 12;
const SECRET_DROP_MAX_RECIPIENTS = 2000;
async function announceSecretDrop(name: string, minOrders: number, wanted: boolean): Promise<number> {
  if (!wanted) return 0;
  try {
    // Antes de abrir no hay a quién avisarle y sí hay mucho que ensayar: mismo criterio
    // que customerRemindersEnabled usa para todos los crons de marketing.
    const settings = await sbGet("app_settings", "select=business_launched&id=eq.true");
    if (settings?.[0]?.business_launched !== true) return 0;

    const since = new Date(Date.now() - SECRET_DROP_COOLDOWN_HOURS * 3600000).toISOString();
    const reciente = await sbGet(
      "marketing_touches",
      `campaign_type=eq.${SECRET_DROP_CAMPAIGN}&sent_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
    );
    if (reciente.length) return 0;

    const destinatarios = await sbGet(
      "customers",
      `total_orders=gte.${minOrders}&select=phone&limit=${SECRET_DROP_MAX_RECIPIENTS}`,
    );
    let enviados = 0;
    for (const c of destinatarios) {
      try {
        await sendPushToPhone(String(c.phone), {
          title: "Menú secreto nuevo 🔓",
          body: name + " ya está disponible este mes. Solo para quienes lo desbloquearon.",
          url: "./index.html",
          // Mismo tag para toda la rotación: si por lo que sea llegaran dos, el segundo
          // reemplaza al primero en la bandeja en vez de apilarse.
          tag: "sndwch-secret-drop",
        });
        await sbInsert("marketing_touches", { customer_phone: c.phone, campaign_type: SECRET_DROP_CAMPAIGN, channel: "push" });
        enviados++;
      } catch (e) {
        console.error("announceSecretDrop: fallo avisando a", c.phone, e);
      }
    }
    return enviados;
  } catch (e) {
    // El aviso NUNCA vale más que la publicación en sí: el sándwich ya quedó publicado y
    // visible en la app, esto es solo el empujón para que se enteren antes.
    console.error("announceSecretDrop failed:", e);
    return 0;
  }
}

// C6 — PLAN DE TANDA. El dueño cocina por tandas 1-2 veces por semana y hoy decide
// cuánto hacer de memoria. Esto proyecta el consumo real de cada insumo y dice cuánto
// cocinar para cubrir los próximos N días.
//
// ⚠ ADVERTENCIA QUE VIAJA EN LA PROPIA RESPUESTA, no solo en este comentario. Una
// proyección sobre 3 días de ventas no es una proyección, es un número inventado con
// aspecto de dato — y el aspecto de dato es justamente lo que hace que se le crea. Por eso
// la respuesta trae `daysOfData`, `ordersConsidered` y `reliable`, y la pantalla muestra
// el aviso cuando `reliable` es falso en vez de mostrar las cantidades a secas. Con el
// negocio recién abierto esto va a ser poco fiable durante unas 3-4 semanas; sirve igual
// desde el día uno porque va acumulando, pero se lee como referencia, no como orden.
//
// El cálculo, entero: consumo por insumo en la ventana de historial ÷ días transcurridos
// = consumo diario; × días a cubrir × margen = lo que hace falta; menos el stock que ya
// hay = lo que toca cocinar. Los pedidos ya PROGRAMADOS dentro del horizonte se toman como
// piso: son demanda comprometida, no un promedio.
const BATCH_LOOKBACK_DAYS = 28;
const BATCH_MIN_DAYS_OF_DATA = 14;
const BATCH_MIN_ORDERS = 20;
// Cocinar exactamente el promedio significa quedarse corto la mitad de los días. Este
// margen es un colchón, no una predicción: con datos reales de varianza se puede afinar.
const BATCH_SAFETY_FACTOR = 1.25;
// ── #2: AVISO DE "TOCA COCINAR" ────────────────────────────────────────────────────────
//
// El plan de tanda ya dice cuánto cocinar, pero solo si el dueño ABRE la pantalla. El caso
// que importa es el contrario: está cocinando otra cosa, o repartiendo, o es martes y no
// piensa en el jueves. Cocinar por tandas significa que enterarse tarde no se arregla con
// una compra rápida — hay que descongelar, limpiar, cocinar y enfriar.
//
// Por eso el umbral NO es "te quedaste sin stock" (eso ya lo avisa la alerta de stock bajo)
// sino "al ritmo actual te queda menos de lo que tardas en producir". Ese margen es el
// único número que hace la diferencia entre un aviso útil y una autopsia.
const COOK_LEAD_DAYS = 2;

export type CookNowItem = { code: string; name: string; daysLeft: number; toCook: number | null };

// Qué insumos hay que cocinar YA. Puro y probado (tests-api/toca-cocinar.test.ts): su modo
// de fallo no es un error visible, es el SILENCIO — la alerta que no salió el día que se
// necesitaba.
export function cookNowItems(items: BatchPlanItem[], leadDays: number = COOK_LEAD_DAYS): CookNowItem[] {
  if (!Array.isArray(items)) return [];
  return items
    // `daysLeft === null` queda fuera a propósito: significa que no hay cantidad rastreada
    // o que no hay consumo medido, y en ninguno de los dos casos se puede afirmar que se
    // esté acabando. Inventar una alerta ahí enseña a ignorar las siguientes.
    .filter((i) => i && i.daysLeft !== null && i.daysLeft <= leadDays)
    .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number))
    .map((i) => ({ code: i.code, name: i.name, daysLeft: i.daysLeft as number, toCook: i.toCook }));
}

export async function actAlertCookNow(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const plan = await computeBatchPlan(BATCH_DEFAULT_COVER_DAYS);
  // Sin historial suficiente el "por día" es ruido, y una alerta construida sobre ruido
  // manda a cocinar de más. Es el mismo freno que la pantalla del plan de tanda ya muestra
  // ANTES que las cantidades.
  if (!plan.reliable) return { success: true, alerted: false, reason: "sin historial suficiente" };

  const urgentes = cookNowItems(plan.items);
  if (!urgentes.length) return { success: true, alerted: false };

  // Una vez al día por combinación de insumos: el cron corre a diario y repetir el mismo
  // aviso mientras el dueño todavía no cocina lo vuelve ruido.
  const clave = "cook-now:" + urgentes.map((u) => u.code).sort().join(",");
  if (!(await rpc("check_rate_limit", { p_key: clave, p_limit: 1, p_window_minutes: 60 * 20 }))) {
    return { success: true, alerted: false, throttled: true };
  }
  const detalle = urgentes.slice(0, 3)
    .map((u) => `${u.name} (${u.daysLeft <= 0 ? "ya" : u.daysLeft + "d"})`)
    .join(", ");
  await sendPushToAdmins({
    title: "🍳 Toca cocinar",
    body: `Se acaba: ${detalle}${urgentes.length > 3 ? ` y ${urgentes.length - 3} más` : ""}. Panel → Plan de tanda.`,
    url: "./index.html",
    tag: "sndwch-cook-now",
    renotify: true,
  });
  return { success: true, alerted: true, items: urgentes.length };
}

// ── #12: ORDEN DE ARMADO ───────────────────────────────────────────────────────────────
//
// "Orden de cocción" en el plan; en la práctica de este negocio es orden de ARMADO: el
// dueño cocina por tandas 1-2 veces por semana y en hora de servicio solo arma (ver el
// método de trabajo real en CLAUDE.md). Lo que se le puede decir de verdad no es "cocina
// esto primero" sino "empieza este a las 19:05 o no llega".
//
// El valor está en el caso feo: tres pedidos programados para la misma hora. Ordenarlos por
// hora de entrega no alcanza — hay que restar hacia atrás el tiempo de armado ACUMULADO,
// porque son secuenciales (una persona sola). Sin eso, el tercero se empieza tarde siempre.
export type AssemblySlot = { ref: string; customerName: string; deliveryTime: string; startBy: string; late: boolean };

export function assemblyOrder(
  orders: { ref: string; customerName?: string | null; deliveryTime: string }[],
  nowMs: number,
  minutesPerOrder: number,
): AssemblySlot[] {
  if (!Array.isArray(orders)) return [];
  const validos = orders
    .filter((o) => o && o.deliveryTime && !Number.isNaN(new Date(o.deliveryTime).getTime()))
    .sort((a, b) => new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime());
  const mins = Math.max(1, Number(minutesPerOrder) || 1);
  return validos.map((o, i) => {
    // El i-ésimo pedido tiene (i+1) armados por delante contándose a sí mismo: el primero
    // se empieza `mins` antes de su hora, el segundo `2*mins`, y así. Restar solo `mins`
    // para todos es exactamente el error que hace que el último salga tarde.
    const startBy = new Date(new Date(o.deliveryTime).getTime() - (i + 1) * mins * 60000);
    return {
      ref: o.ref,
      customerName: o.customerName || "",
      deliveryTime: o.deliveryTime,
      startBy: startBy.toISOString(),
      // `late` no es decorativo: es la única señal de que un pedido YA no llega a tiempo, y
      // saberlo ahora permite avisarle al cliente en vez de que se entere por el retraso.
      late: startBy.getTime() < nowMs,
    };
  });
}

// ── #10: MISE EN PLACE DEL DÍA ─────────────────────────────────────────────────────────
//
// La lista de preparación (#26) ya agrega los ingredientes de las próximas 24 h, pero como
// una lista plana ordenada por faltante. Para USARLA en la cocina hace falta otra cosa:
// agrupada por dónde está cada cosa, para no volver a la refri seis veces.
//
// Los grupos salen del prefijo del código, que es el mismo esquema que usa todo el catálogo
// (B=pan, P=proteína, T=topping, S=salsa, D=bebida). Derivarlo así y no con una lista
// escrita a mano es lo que hace que un ingrediente nuevo aparezca solo en su grupo.
const MISE_GROUPS: { key: string; label: string; prefix: string }[] = [
  { key: "prot", label: "Proteínas", prefix: "P" },
  { key: "base", label: "Panes", prefix: "B" },
  { key: "top", label: "Toppings", prefix: "T" },
  { key: "sauce", label: "Salsas", prefix: "S" },
  { key: "drink", label: "Bebidas", prefix: "D" },
];

export function miseEnPlaceGroups(
  ingredients: PrepIngredient[],
): { key: string; label: string; items: PrepIngredient[] }[] {
  const lista = Array.isArray(ingredients) ? ingredients : [];
  const usados = new Set<string>();
  const grupos = MISE_GROUPS.map((g) => {
    const items = lista.filter((i) => i && typeof i.code === "string" && i.code.startsWith(g.prefix));
    items.forEach((i) => usados.add(i.code));
    // Dentro de cada grupo mandan los faltantes: es lo que hay que resolver antes de abrir.
    items.sort((a, b) => (Number(b.shortfall) - Number(a.shortfall)) || (b.qty - a.qty));
    return { key: g.key, label: g.label, items };
  }).filter((g) => g.items.length);
  // Un código que no encaja en ningún prefijo NO se descarta: se pone en "Otros". Perderlo
  // en silencio sería peor que mostrarlo mal — es un insumo que igual hay que preparar.
  const otros = lista.filter((i) => i && !usados.has(i.code));
  if (otros.length) grupos.push({ key: "otros", label: "Otros", items: otros });
  return grupos;
}

// ── #31 / #34: CONCILIACIÓN Y COMISIONES DE CULQI ──────────────────────────────────────
//
// El cron horario ya concilia cargos HUÉRFANOS (un cobro real sin pedido detrás), que es el
// caso catastrófico. Lo que faltaba es lo aburrido y constante: cuánto cobró Culqi contra
// cuánto se facturó, y cuánto se llevó de comisión.
//
// La comisión de Culqi es un costo REAL que hoy no aparece en ningún reporte. A 5.5% sobre
// un mes de S/6 000 en tarjeta son S/330 — más que los costos fijos del negocio, que están
// por debajo de S/500. No verlo no lo hace desaparecer.
export type CulqiReconciliation = {
  orders: number;
  invoiced: number;
  fees: number;
  netExpected: number;
  declines: number;
  declineRate: number | null;
  orphanCharges: number;
};

// Cálculo puro (tests-api/conciliacion-culqi.test.ts). No consulta a Culqi: cruza lo que la
// propia base ya sabe — los pedidos cobrados con tarjeta y los eventos que `claimAndChargeCulqi`
// escribe en `debug_logs`. Un reporte que dependiera de la API de Culqi fallaría justo los
// días en que Culqi tiene problemas, que son los días en que hay que mirarlo.
export function culqiReconciliation(
  orders: { payment_method?: string | null; payment_status?: string | null; status?: string | null; total?: number | null }[],
  logs: { detail?: { stage?: string } | null }[],
  feeRate: number,
  orphanCharges = 0,
): CulqiReconciliation {
  const cobrados = (Array.isArray(orders) ? orders : []).filter(
    (o) => o && o.payment_method === "card" && o.payment_status === "paid" && o.status !== "CANCELADO",
  );
  const invoiced = cobrados.reduce((a, o) => {
    const n = Number(o.total);
    return a + (Number.isFinite(n) ? n : 0);
  }, 0);
  const eventos = (Array.isArray(logs) ? logs : []).map((l) => l?.detail?.stage);
  const declines = eventos.filter((e) => e === "culqi-rejected").length;
  const exitos = eventos.filter((e) => e === "charge-succeeded").length;
  const intentos = declines + exitos;
  const fees = invoiced * feeRate;
  return {
    orders: cobrados.length,
    invoiced: Math.round(invoiced * 100) / 100,
    fees: Math.round(fees * 100) / 100,
    // Lo que de verdad debería llegar a la cuenta. Es el número contra el que se compara el
    // depósito de Culqi: si no cuadra, hay algo que revisar.
    netExpected: Math.round((invoiced - fees) * 100) / 100,
    declines,
    // `null` sin intentos: 0% con cero cobros sugeriría que todo salió bien cuando en
    // realidad no pasó nada.
    declineRate: intentos > 0 ? Math.round((declines / intentos) * 1000) / 1000 : null,
    orphanCharges,
  };
}

export async function actAdminCulqiReport(b: any) {
  await requireAdmin(b.token);
  // Por defecto el MES en curso en hora Lima: la comisión se mira contra la liquidación
  // mensual, no día a día.
  const desde = typeof b.since === "string" && b.since ? b.since : limaMonthStartIso(new Date());
  const hasta = typeof b.until === "string" && b.until ? b.until : new Date().toISOString();
  const [orders, logs, huerfanos] = await Promise.all([
    sbGet("orders", `created_at=gte.${encodeURIComponent(desde)}&created_at=lte.${encodeURIComponent(hasta)}&payment_method=eq.card&select=payment_method,payment_status,status,total&limit=5000`),
    sbGet("debug_logs", `created_at=gte.${encodeURIComponent(desde)}&created_at=lte.${encodeURIComponent(hasta)}&select=detail&limit=5000`),
    sbGet("debug_logs", `created_at=gte.${encodeURIComponent(desde)}&select=detail&limit=1000`),
  ]);
  const orphan = huerfanos.filter((l: any) => l?.detail?.stage === "orphan-charge-refunded" || l?.detail?.stage === "orphan-charge-found").length;
  return { since: desde, until: hasta, feeRate: CULQI_FEE_RATE, ...culqiReconciliation(orders, logs, CULQI_FEE_RATE, orphan) };
}

// ── LOTE E6: HIGIENE TÉCNICA Y CUMPLIMIENTO ────────────────────────────────────────────

// #78 — Tiempo real de entrega contra el prometido.
//
// `delivered_at` se llena desde hace tiempo y desde #19 la escribe quien entrega, no quien
// se acuerda de tocar el botón. Faltaba el reporte, que es el único dato que dice si el ETA
// que se le muestra al cliente ANTES de pagar es verdad o marketing.
//
// Un ETA que miente es la causa directa de una calificación de 1 estrella, y el negocio se
// enteraría por la reseña en vez de por el reloj.
export type DeliveryPerformance = {
  delivered: number;
  measured: number;
  onTime: number;
  onTimePct: number | null;
  avgMinutes: number | null;
  p90Minutes: number | null;
  worst: { ref: string; minutes: number; promised: number }[];
};

export function deliveryPerformance(
  orders: { ref?: string | null; created_at?: string | null; delivered_at?: string | null; eta_minutes?: number | null }[],
  fallbackPromise: number,
): DeliveryPerformance {
  const lista = Array.isArray(orders) ? orders : [];
  const medidos: { ref: string; minutes: number; promised: number }[] = [];
  for (const o of lista) {
    const inicio = new Date(String(o?.created_at || "")).getTime();
    const fin = new Date(String(o?.delivered_at || "")).getTime();
    // Sin las dos horas no se puede medir NADA. Rellenar con la hora actual o con el
    // promedio metería pedidos inventados en el número que mide la promesa.
    if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) continue;
    const minutes = Math.round((fin - inicio) / 60000);
    const promised = Number(o?.eta_minutes) > 0 ? Number(o.eta_minutes) : fallbackPromise;
    medidos.push({ ref: String(o?.ref || ""), minutes, promised });
  }
  if (!medidos.length) {
    return { delivered: lista.length, measured: 0, onTime: 0, onTimePct: null, avgMinutes: null, p90Minutes: null, worst: [] };
  }
  const onTime = medidos.filter((m) => m.minutes <= m.promised).length;
  const ordenados = [...medidos].sort((a, b) => a.minutes - b.minutes);
  // p90 y no solo el promedio: el promedio esconde la cola. Con 9 entregas de 30 min y una
  // de 3 horas el promedio dice 47 y el cliente de las 3 horas ya no vuelve.
  const idx = Math.min(ordenados.length - 1, Math.floor(ordenados.length * 0.9));
  return {
    delivered: lista.length,
    measured: medidos.length,
    onTime,
    onTimePct: Math.round((onTime / medidos.length) * 1000) / 1000,
    avgMinutes: Math.round(medidos.reduce((a, m) => a + m.minutes, 0) / medidos.length),
    p90Minutes: ordenados[idx].minutes,
    // Los peores, que son los que hay que mirar uno por uno.
    worst: [...medidos].sort((a, b) => (b.minutes - b.promised) - (a.minutes - a.promised)).slice(0, 5),
  };
}

// #77 — Detección de queja repetida.
//
// El mismo cliente reclamando dos veces no es un cliente difícil: es un problema de proceso
// que ya se manifestó dos veces. Verlo agregado es lo que convierte dos reclamos sueltos en
// una causa.
export function repeatComplaints(
  complaints: { consumer_phone?: string | null; consumer_name?: string | null; kind?: string | null; created_at?: string | null; claim_code?: string | null }[],
): { phone: string; name: string; count: number; kinds: string[]; codes: string[]; lastAt: string }[] {
  const porCliente = new Map<string, { phone: string; name: string; kinds: Set<string>; codes: string[]; lastAt: string; count: number }>();
  for (const c of Array.isArray(complaints) ? complaints : []) {
    const phone = String(c?.consumer_phone || "").trim();
    // Sin teléfono no hay forma de saber si es la misma persona. Agrupar por nombre sería
    // peor: dos "Juan Pérez" distintos aparecerían como un reincidente.
    if (!phone) continue;
    const acc = porCliente.get(phone) || { phone, name: String(c?.consumer_name || ""), kinds: new Set<string>(), codes: [], lastAt: "", count: 0 };
    acc.count++;
    if (c?.kind) acc.kinds.add(String(c.kind));
    if (c?.claim_code) acc.codes.push(String(c.claim_code));
    const fecha = String(c?.created_at || "");
    if (fecha > acc.lastAt) acc.lastAt = fecha;
    porCliente.set(phone, acc);
  }
  return [...porCliente.values()]
    .filter((x) => x.count > 1)
    .map((x) => ({ phone: x.phone, name: x.name, count: x.count, kinds: [...x.kinds], codes: x.codes, lastAt: x.lastAt }))
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
}

// #88 — Cuentas admin que llevan mucho sin entrar.
//
// Una cuenta admin viva de alguien que ya no trabaja acá es la puerta abierta que nadie
// mira. `null` en lastLoginAt significa "nunca entró desde que se empezó a registrar",
// que es una señal MÁS fuerte que una fecha vieja, no más débil.
const ADMIN_STALE_DAYS = 60;
export function staleAdmins(
  admins: { phone?: string | null; name?: string | null; last_login_at?: string | null; created_at?: string | null }[],
  nowMs: number,
  staleDays = ADMIN_STALE_DAYS,
): { phone: string; name: string; daysSince: number | null; neverLoggedIn: boolean }[] {
  return (Array.isArray(admins) ? admins : [])
    .map((a) => {
      const t = new Date(String(a?.last_login_at || "")).getTime();
      const valido = Number.isFinite(t);
      return {
        phone: String(a?.phone || ""),
        name: String(a?.name || ""),
        daysSince: valido ? Math.floor((nowMs - t) / 86400000) : null,
        neverLoggedIn: !valido,
      };
    })
    .filter((a) => a.phone && (a.neverLoggedIn || (a.daysSince as number) >= staleDays))
    .sort((a, b) => (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER));
}

// #94 — Envío automático del reporte de cohortes.
//
// El RPC `retention_report` existe desde hace tiempo y es el mejor dato del panel: mide si
// los clientes VUELVEN, que es lo que decide si el negocio funciona, mientras el resto del
// dashboard mide cuánto entró. El problema no era el cálculo, era que **hay que acordarse de
// abrir la pantalla**. Una cifra que solo existe cuando alguien va a buscarla no cambia
// ninguna decisión.
//
// Va MENSUAL y no semanal a propósito: una cohorte se mueve en meses. Un correo semanal con
// el mismo número movido dos décimas es el camino más corto a que se deje de abrir, y
// entonces se pierde también el mes en que sí cambió.
//
// LA SALVAGUARDA DE FIABILIDAD VA PRIMERO, antes de las cifras — mismo criterio que el plan
// de tanda. Con 12 clientes, "el 33% volvió" son 4 personas: mover una cambia el número 8
// puntos. Un porcentaje así no es una medición, es ruido con aspecto de dato, y el aspecto
// de dato es exactamente lo que hace que se le crea y se decida un precio con él.
const RETENTION_DIGEST_MIN_CUSTOMERS = 30;
export function retentionDigest(
  report: any,
  minCustomers = RETENTION_DIGEST_MIN_CUSTOMERS,
): {
  reliable: boolean;
  reason: string | null;
  customers: number;
  repeatRatePct: number | null;
  rolling30Pct: number | null;
  daysToSecondMedian: number | null;
  contributionPerOrder: number | null;
  atRisk: number;
  headline: string;
} {
  const overall = report?.overall || {};
  const customers = Number(overall.customers) || 0;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const gap = report?.daysToSecond || {};
  const reliable = customers >= minCustomers;
  const repeatRatePct = customers > 0 ? num(overall.repeatRatePct) : null;
  return {
    reliable,
    reason: reliable ? null : `Solo hay ${customers} clientes con al menos un pedido pagado; hacen falta ${minCustomers} para que estos porcentajes signifiquen algo.`,
    customers,
    repeatRatePct,
    rolling30Pct: Number(report?.rolling30?.active) > 0 ? num(report?.rolling30?.returningPct) : null,
    // La mediana de días al segundo pedido solo se manda si hay segundos pedidos que medir:
    // con n=0 el RPC devuelve 0, y "vuelven a los 0 días" diría lo contrario de la verdad.
    daysToSecondMedian: Number(gap.n) > 0 ? num(gap.median) : null,
    contributionPerOrder: Number(report?.margin?.orders) > 0 ? num(report?.margin?.perOrder) : null,
    atRisk: Number(report?.segments?.enRiesgo) || 0,
    headline: !reliable
      ? "Todavía no hay clientes suficientes para medir retención."
      : repeatRatePct === null
      ? "Sin datos de repetición este mes."
      : `${repeatRatePct}% de tus clientes hizo un segundo pedido.`,
  };
}

export async function actSendRetentionReport(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const report = await rpc("retention_report", { p_cohort_months: RETENTION_COHORT_MONTHS });
  const digest = retentionDigest(report);
  await sendRetentionEmail(digest, report?.cohorts || []);
  // El push lleva SOLO el titular. El detalle es para sentarse a leerlo, y una notificación
  // con seis cifras no se lee en el celular ni se vuelve a abrir después.
  await sendPushToAdmins({
    title: "📈 Tu reporte de retención del mes",
    body: digest.headline + (digest.reliable ? " Te lo mandamos por correo con el detalle." : ""),
    url: "./index.html",
    tag: "sndwch-retention-report",
    renotify: false,
  });
  return { success: true, ...digest };
}

// #89 — Intentos de acceso fallidos contra la cuenta admin.
//
// El bloqueo por intentos fallidos ya existe desde hace tiempo y ya frena el ataque. Lo que
// no existía es que alguien se ENTERE de que ocurrió: `login_attempts` borra la fila al
// primer acceso correcto, así que el peor caso —veinte intentos y al veintiuno entró— no
// dejaba huella. El rastro durable lo escribe `recordAdminLoginFailure` en debug_logs.
//
// EXIGE UN MÍNIMO, igual que la alerta de rechazos de tarjeta. Un aviso que suena porque el
// dueño se equivocó de PIN tres veces deja de mirarse antes del día que importa. El bloqueo
// corta a los MAX_LOGIN_ATTEMPTS (5) intentos y obliga a esperar LOCKOUT_MINUTES (15), así
// que pasar de 10 en una hora significa haberse comido dos bloqueos enteros a propósito —
// cosa que quien recupera su propio PIN no hace: usa la recuperación.
//
// El otro disparador es la FORMA, no el volumen: los mismos intentos repartidos entre varias
// fuentes distintas no son alguien olvidadizo, son alguien rotando de conexión. Se piden 3
// fuentes y no 2 porque pasar de wifi a datos móviles ya da dos huellas por sí solo.
export const ADMIN_ACCESS_WINDOW_HOURS = 1;
const ADMIN_ACCESS_MIN_ATTEMPTS = 10;
const ADMIN_ACCESS_MIN_SOURCES = 3;
export function adminAccessAttempts(
  rows: { detail?: { stage?: string; phone?: string; src?: string; reason?: string } | null; created_at?: string | null }[],
  minAttempts = ADMIN_ACCESS_MIN_ATTEMPTS,
  minSources = ADMIN_ACCESS_MIN_SOURCES,
): {
  total: number;
  sources: { src: string; count: number; phones: string[] }[];
  phones: string[];
  alert: boolean;
  reason: string | null;
} {
  const porFuente = new Map<string, { src: string; count: number; phones: Set<string> }>();
  const telefonos = new Set<string>();
  let total = 0;
  for (const r of Array.isArray(rows) ? rows : []) {
    const d = r?.detail;
    if (!d || d.stage !== "admin-login-failed") continue;
    total++;
    const src = String(d.src || "desconocida");
    const acc = porFuente.get(src) || { src, count: 0, phones: new Set<string>() };
    acc.count++;
    if (d.phone) {
      acc.phones.add(String(d.phone));
      telefonos.add(String(d.phone));
    }
    porFuente.set(src, acc);
  }
  const sources = [...porFuente.values()]
    .map((f) => ({ src: f.src, count: f.count, phones: [...f.phones] }))
    .sort((a, b) => b.count - a.count);
  const porVolumen = total >= minAttempts;
  const porDispersion = sources.length >= minSources && total >= MAX_LOGIN_ATTEMPTS;
  return {
    total,
    sources,
    phones: [...telefonos],
    alert: porVolumen || porDispersion,
    // El motivo va en el aviso: "muchos intentos" y "muchas fuentes" se revisan distinto.
    reason: porDispersion ? "varias-fuentes" : porVolumen ? "muchos-intentos" : null,
  };
}

export async function actAlertAdminAccess(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const desde = new Date(Date.now() - ADMIN_ACCESS_WINDOW_HOURS * 3600000).toISOString();
  const rows = await sbGet(
    "debug_logs",
    `source=eq.api&created_at=gte.${encodeURIComponent(desde)}&select=detail,created_at&limit=2000`,
  );
  const stats = adminAccessAttempts(rows as any[]);
  if (!stats.alert) return { success: true, alerted: false, ...stats };
  // Mientras el intento siga, el cron lo va a seguir viendo cada hora. Repetirlo cada hora
  // lo vuelve ruido; cada 3 sigue siendo a tiempo para cambiar el PIN.
  if (!(await rpc("check_rate_limit", { p_key: "admin-access", p_limit: 1, p_window_minutes: 180 }))) {
    return { success: true, alerted: false, throttled: true, ...stats };
  }
  await sendPushToAdmins({
    title: "🔐 Intentos de entrar a tu panel",
    body: stats.reason === "varias-fuentes"
      ? `${stats.total} intentos fallidos contra tu cuenta admin desde ${stats.sources.length} conexiones distintas en la última hora. Cambia tu PIN.`
      : `${stats.total} intentos fallidos contra tu cuenta admin en la última hora. Cambia tu PIN.`,
    url: "./index.html",
    tag: "sndwch-admin-access",
    renotify: true,
  });
  return { success: true, alerted: true, ...stats };
}

// #97 — Cuánto espacio queda antes de topar el plan.
//
// El plan `free` de Supabase da 500 MB, y topar ese límite no degrada nada con aviso: la
// base pasa a solo-lectura y el negocio deja de tomar pedidos.
const DB_LIMIT_BYTES = 500 * 1024 * 1024;
const DB_WARN_PCT = 0.7;
export function dbGrowth(
  sizeBytes: number,
  limitBytes = DB_LIMIT_BYTES,
  warnPct = DB_WARN_PCT,
): { usedBytes: number; limitBytes: number; usedPct: number; warn: boolean } {
  const used = Number(sizeBytes);
  const limite = Number(limitBytes) > 0 ? Number(limitBytes) : DB_LIMIT_BYTES;
  const seguro = Number.isFinite(used) && used >= 0 ? used : 0;
  return {
    usedBytes: seguro,
    limitBytes: limite,
    usedPct: Math.round((seguro / limite) * 1000) / 1000,
    warn: seguro / limite >= warnPct,
  };
}

// #98 — Latencia de la edge function.
//
// Si `api` empieza a responder lento, se nota en la conversión antes que en cualquier otro
// sitio: el cliente abandona el checkout y nadie registra un error. Se mide con lo que la
// función ya escribe en `debug_logs` (ver el registro de duración en index.ts).
//
// Se usa el p95 y no el promedio: una petición de 8 segundos entre 99 rápidas no mueve el
// promedio y es exactamente la que hace abandonar un carrito.
const LATENCY_P95_WARN_MS = 3000;
export function latencyStats(
  rows: { detail?: { ms?: number } | null }[],
  warnMs = LATENCY_P95_WARN_MS,
): { samples: number; p50: number | null; p95: number | null; worst: number | null; warn: boolean } {
  const ms = (Array.isArray(rows) ? rows : [])
    .map((r) => Number(r?.detail?.ms))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b);
  if (!ms.length) return { samples: 0, p50: null, p95: null, worst: null, warn: false };
  const pick = (p: number) => ms[Math.min(ms.length - 1, Math.floor(ms.length * p))];
  const p95 = pick(0.95);
  return { samples: ms.length, p50: pick(0.5), p95, worst: ms[ms.length - 1], warn: p95 >= warnMs };
}

// Una sola pantalla para todo el bloque técnico: el dueño no va a entrar a seis pantallas
// distintas a revisar salud. Las señales de negocio (#77, #78, #86) van aparte porque se
// miran en otro momento y con otra cabeza.
export async function actAdminTechHealth(b: any) {
  await requireAdmin(b.token);
  const desde = new Date(Date.now() - 7 * 86400000).toISOString();
  const [size, tablas, admins, lat] = await Promise.all([
    rpc("db_size_bytes", {}).catch(() => 0),
    rpc("table_sizes", { p_limit: 6 }).catch(() => []),
    sbGet("admin_accounts", "select=phone,name,last_login_at,created_at&limit=200"),
    sbGet("debug_logs", `created_at=gte.${encodeURIComponent(desde)}&select=detail&limit=5000`),
  ]);
  const latRows = (lat || []).filter((r: any) => r?.detail?.stage === "request-timing");
  return {
    db: { ...dbGrowth(Number(size) || 0), tables: tablas || [] },
    latency: latencyStats(latRows),
    staleAdmins: staleAdmins(admins || [], Date.now()),
    adminCount: (admins || []).length,
    staleDays: ADMIN_STALE_DAYS,
  };
}

// #78 / #77 / #86 — Las tres señales de cumplimiento y promesa, en una sola lectura.
const COMPLIANCE_WINDOW_DAYS = 90;
export async function actAdminCompliance(b: any) {
  await requireAdmin(b.token);
  const desde = new Date(Date.now() - COMPLIANCE_WINDOW_DAYS * 86400000).toISOString();
  const [entregados, quejas] = await Promise.all([
    sbGet(
      "orders",
      `status=eq.ENTREGADO&created_at=gte.${encodeURIComponent(desde)}&select=ref,created_at,delivered_at,eta_minutes&limit=5000`,
    ),
    // #86 — El consolidado para Indecopi: TODOS los campos del Libro, sin recortar. Un
    // reporte al que le falta un campo obligatorio no sirve el día que lo piden.
    sbGet("complaints", `created_at=gte.${encodeURIComponent(desde)}&select=*&order=created_at.desc&limit=2000`),
  ]);
  return {
    windowDays: COMPLIANCE_WINDOW_DAYS,
    delivery: deliveryPerformance(entregados || [], DEFAULT_ETA_FALLBACK_MINUTES),
    repeatComplaints: repeatComplaints(quejas || []),
    complaints: (quejas || []).map((c: any) => ({
      claimCode: c.claim_code,
      createdAt: c.created_at,
      kind: c.kind,
      consumerName: c.consumer_name,
      consumerDni: c.consumer_dni,
      orderRef: c.order_ref,
      claimedAmount: c.claimed_amount,
      status: c.status,
      respondedAt: c.responded_at,
    })),
  };
}

// La promesa por defecto cuando un pedido no llegó a tener ETA propia. Es el techo del rango
// que ve el cliente antes de pagar (25-40 min), no el piso: medir contra el piso marcaría
// como tarde entregas que el cliente vivió como puntuales.
const DEFAULT_ETA_FALLBACK_MINUTES = 40;

// ── #38: PRECIO DE INSUMO POR COMPRA ───────────────────────────────────────────────────
//
// Todo el costeo del menú corre hoy sobre literales de markdown que nadie actualiza cuando
// sube la carne. Cada compra registrada convierte eso en un número derivado de boletas
// reales — y, cruzándolo con las recetas (que desde #9 también son dato), da el costo por
// porción sin que nadie lo calcule a mano.
//
// Cuántas compras entran en el promedio. Tres y no una: una sola compra rara (un día que
// pagaste de más por urgencia) movería el costo del menú entero. Tampoco muchas: con
// inflación, promediar seis meses da un costo que ya no existe.
const PURCHASE_AVG_WINDOW = 3;
// A partir de cuánto una subida deja de ser ruido de mercado y merece decirse.
const PURCHASE_SPIKE_PCT = 0.15;

export type PurchaseRow = { product_code: string; qty: number; unit: string; total_paid: number; purchased_at: string; supplier?: string | null };
export type IngredientCost = {
  code: string;
  unit: string;
  lastUnitCost: number;
  avgUnitCost: number;
  purchases: number;
  lastPurchasedAt: string;
  spikePct: number | null;
};

// Costo unitario vigente por insumo. Puro y probado (tests-api/costo-insumos.test.ts):
// alimenta el costo del menú, así que un error acá se propaga a toda decisión de precio.
export function ingredientCosts(rows: PurchaseRow[]): Map<string, IngredientCost> {
  const salida = new Map<string, IngredientCost>();
  const porCodigo = new Map<string, PurchaseRow[]>();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || !r.product_code) continue;
    const qty = Number(r.qty);
    const pagado = Number(r.total_paid);
    // Una compra sin cantidad no permite derivar ningún precio unitario; incluirla daría
    // Infinity y ese número se propagaría al costo de todo el menú.
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(pagado) || pagado < 0) continue;
    if (!porCodigo.has(r.product_code)) porCodigo.set(r.product_code, []);
    porCodigo.get(r.product_code)!.push(r);
  }
  for (const [code, compras] of porCodigo) {
    // Más reciente primero. Se ordena acá y no se confía en el orden de la consulta: esta
    // función se prueba con listas armadas a mano y tiene que dar lo mismo.
    compras.sort((a, b) => String(b.purchased_at).localeCompare(String(a.purchased_at)));
    const unitario = (r: PurchaseRow) => Number(r.total_paid) / Number(r.qty);
    const ultima = compras[0];
    const ventana = compras.slice(0, PURCHASE_AVG_WINDOW);
    // Promedio PONDERADO por cantidad, no promedio de precios unitarios: comprar 6 kg a S/20
    // y 0.5 kg a S/30 no cuesta S/25 el kilo en promedio, cuesta S/20.77.
    const totalQty = ventana.reduce((a, r) => a + Number(r.qty), 0);
    const totalPagado = ventana.reduce((a, r) => a + Number(r.total_paid), 0);
    const anterior = compras[1];
    const previo = anterior ? unitario(anterior) : null;
    const actual = unitario(ultima);
    salida.set(code, {
      code,
      unit: String(ultima.unit || ""),
      lastUnitCost: Math.round(actual * 10000) / 10000,
      avgUnitCost: totalQty > 0 ? Math.round((totalPagado / totalQty) * 10000) / 10000 : actual,
      purchases: compras.length,
      lastPurchasedAt: String(ultima.purchased_at || ""),
      // Cuánto subió respecto de la compra anterior. `null` con una sola compra: no hay
      // contra qué comparar, y mostrar 0% ahí sugeriría que el precio está estable.
      spikePct: previo && previo > 0 ? Math.round(((actual - previo) / previo) * 1000) / 1000 : null,
    });
  }
  return salida;
}

export type RecipeCost = {
  recipeCode: string;
  name: string;
  yieldPortions: number;
  known: number;
  total: number;
  costPerPortion: number | null;
  missing: string[];
};

// Costo por porción de una receta, a partir de las compras reales.
//
// LA PARTE QUE IMPORTA: si falta el precio de UN solo ingrediente, `costPerPortion` es
// `null`. Un total parcial que se ve completo es exactamente el "dato con aspecto de
// medición" que este proyecto ya decidió no producir — y sobre un costo por porción se
// toman decisiones de precio. Se devuelve además QUÉ falta, para que la pantalla diga cómo
// completarlo en vez de solo negarse.
//
// Las unidades tienen que coincidir entre la receta y la compra: comprar en kg y pedir en g
// daría un costo mil veces menor. Cuando no coinciden, el ingrediente cuenta como faltante,
// que es la lectura conservadora.
export function recipeCost(
  recipe: { recipe_code: string; name: string; yield_portions: number; ingredients?: { item: string; qty: number; unit: string; code?: string }[] },
  costs: Map<string, IngredientCost>,
): RecipeCost {
  const ingredientes = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const rendimiento = Number(recipe?.yield_portions);
  let total = 0;
  let known = 0;
  const missing: string[] = [];
  for (const ing of ingredientes) {
    // El código del insumo puede venir explícito; si no, se usa el propio nombre como clave,
    // que es lo que el dueño escribe al registrar la compra.
    const clave = String(ing?.code || ing?.item || "").trim();
    const costo = costs.get(clave);
    const qty = Number(ing?.qty);
    if (!costo || !Number.isFinite(qty) || qty <= 0) { missing.push(String(ing?.item || clave)); continue; }
    if (String(ing?.unit || "").toLowerCase() !== String(costo.unit || "").toLowerCase()) {
      // Mezclar kg con g daría un costo mil veces menor sin ningún error visible.
      missing.push(`${ing.item} (compraste en ${costo.unit}, la receta pide ${ing.unit})`);
      continue;
    }
    total += qty * costo.avgUnitCost;
    known++;
  }
  const completo = known === ingredientes.length && ingredientes.length > 0;
  return {
    recipeCode: String(recipe?.recipe_code || ""),
    name: String(recipe?.name || ""),
    yieldPortions: Number.isFinite(rendimiento) && rendimiento > 0 ? rendimiento : 0,
    known,
    total: Math.round(total * 100) / 100,
    costPerPortion: completo && rendimiento > 0 ? Math.round((total / rendimiento) * 100) / 100 : null,
    missing,
  };
}

const PURCHASES_LIST_LIMIT = 500;

export async function actAdminPurchases(b: any) {
  await requireAdmin(b.token);
  const [compras, recetas] = await Promise.all([
    sbGet("ingredient_purchases", `select=*&order=purchased_at.desc,id.desc&limit=${PURCHASES_LIST_LIMIT}`),
    sbGet("production_recipes", "select=*&order=id.desc&limit=500"),
  ]);
  const costos = ingredientCosts(compras);
  // Solo la receta vigente de cada código (append-only, ver #9).
  const vigentes = new Map<string, any>();
  for (const r of recetas) if (!vigentes.has(r.recipe_code)) vigentes.set(r.recipe_code, r);
  return {
    purchases: compras.slice(0, 100),
    costs: [...costos.values()].sort((a, b) => a.code.localeCompare(b.code)),
    recipeCosts: [...vigentes.values()]
      .filter((r) => r.active !== false)
      .map((r) => recipeCost(r, costos)),
    avgWindow: PURCHASE_AVG_WINDOW,
    spikeThreshold: PURCHASE_SPIKE_PCT,
  };
}

export async function actAdminPurchaseAdd(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.productCode || "").trim().toUpperCase().slice(0, 20);
  const qty = Number(b.qty);
  const totalPaid = Number(b.totalPaid);
  const unit = String(b.unit || "").trim().slice(0, 20);
  if (!code) throw new ApiError("Falta el código del insumo.", 400);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("La cantidad tiene que ser mayor que cero.", 400);
  if (!Number.isFinite(totalPaid) || totalPaid < 0) throw new ApiError("Lo pagado no puede ser negativo.", 400);
  if (!unit) throw new ApiError("Falta la unidad (kg, g, unidades...).", 400);

  const row = (await sbInsert("ingredient_purchases", {
    product_code: code,
    supplier: b.supplier ? String(b.supplier).trim().slice(0, 120) : null,
    qty,
    unit,
    total_paid: totalPaid,
    purchased_at: /^\d{4}-\d{2}-\d{2}$/.test(String(b.purchasedAt || "")) ? b.purchasedAt : undefined,
    notes: b.notes ? String(b.notes).slice(0, 500) : null,
    created_by: s.phone,
  }))[0];

  // Si el precio subió fuerte respecto de la compra anterior, se dice AHORA — el dueño
  // acaba de pagar y todavía se acuerda de por qué. Enterarse un mes después, cuando el
  // margen ya bajó, no permite hacer nada al respecto.
  let spike: { pct: number; previous: number; current: number } | null = null;
  try {
    const previas = await sbGet(
      "ingredient_purchases",
      `product_code=eq.${encodeURIComponent(code)}&select=qty,total_paid,purchased_at,unit,product_code&order=purchased_at.desc,id.desc&limit=5`,
    );
    const info = ingredientCosts(previas).get(code);
    if (info && info.spikePct !== null && info.spikePct >= PURCHASE_SPIKE_PCT) {
      const anterior = info.lastUnitCost / (1 + info.spikePct);
      spike = { pct: info.spikePct, previous: Math.round(anterior * 100) / 100, current: info.lastUnitCost };
    }
  } catch (e) {
    // El aviso es un plus: nunca puede impedir que la compra quede registrada.
    await debugLog({ stage: "purchase_spike_check_failed", code, error: String(e) });
  }

  await logAdminAction(s.phone, "purchase-add", code, { qty, unit, totalPaid });
  return { success: true, purchase: row, spike };
}

// ── #39: PASIVO DE CRÉDITO EMITIDO ─────────────────────────────────────────────────────
//
// El crédito interno (Plan Semanal, tarjetas de regalo, saldo regalado) es plata que el
// negocio YA COBRÓ y todavía debe en comida. Nadie lo miraba: no aparece en el dashboard ni
// en el cierre de caja, y por diseño no puede aparecer ahí — el cierre de caja habla del
// día, y esto es un saldo acumulado.
//
// Importa por dos razones distintas. La obvia: es deuda, y en un mes flojo puede ser una
// parte grande de los pedidos que "no dejan caja". La menos obvia: crédito que nadie usa es
// una promesa que el cliente no está cobrando, y eso ya tiene su propio recordatorio.
export function creditLiability(
  customers: { credit_balance?: number | null }[],
): { customers: number; total: number; average: number; largest: number } {
  const saldos = (Array.isArray(customers) ? customers : [])
    .map((c) => Number(c?.credit_balance))
    .filter((n) => Number.isFinite(n) && n > 0);
  const total = saldos.reduce((a, n) => a + n, 0);
  return {
    customers: saldos.length,
    total: Math.round(total * 100) / 100,
    average: saldos.length ? Math.round((total / saldos.length) * 100) / 100 : 0,
    largest: saldos.length ? Math.round(Math.max(...saldos) * 100) / 100 : 0,
  };
}

// ── #40: CIERRE DE CAJA DIARIO ─────────────────────────────────────────────────────────
//
// El correo de resumen diario ya manda "ingresos del día", y ese número miente por omisión
// para ESTE negocio en tres formas distintas:
//
//   1. **El delivery no es plata del negocio.** Es pass-through: el cliente lo paga dentro
//      del mismo cobro y el dueño se lo entrega al motorizado. Sumarlo al ingreso hace
//      creer que se ganó entre S/6 y S/15 más por pedido de los que se ganaron.
//   2. **Un pedido pagado con crédito interno no trae plata hoy.** Ese dinero entró cuando
//      se compró el Plan Semanal o la tarjeta de regalo, quizá semanas antes. Contarlo como
//      caja del día lo cuenta dos veces.
//   3. **La tarjeta no llega entera.** Culqi se queda su comisión, y a 5.5% sobre un día de
//      S/400 son S/22 que nunca van a estar en la cuenta.
//
// Cuadrar la caja es exactamente separar esas cuatro cosas. Cálculo puro y probado
// (tests-api/cierre-caja.test.ts) porque decide un número que el dueño va a usar para saber
// si el día le alcanzó — y equivocarlo no produce ningún error, produce una decisión mala.
export type CashClose = {
  orders: number;
  gross: number;
  deliveryPassThrough: number;
  byMethod: { method: string; label: string; orders: number; gross: number; net: number }[];
  cardFees: number;
  creditUsed: number;
  cashIn: number;
  businessRevenue: number;
  pendingConfirmation: { orders: number; amount: number };
};

const METHOD_LABELS: Record<string, string> = {
  card: "Tarjeta (Culqi)",
  yape: "Yape",
  plin: "Plin",
  credit: "Crédito interno",
  cod: "Contra entrega",
  reward: "Recompensa (gratis)",
};

export function cashClose(
  orders: { payment_method?: string | null; payment_status?: string | null; status?: string | null; total?: number | null; delivery_fee?: number | null }[],
  culqiFeeRate: number,
): CashClose {
  const lista = (Array.isArray(orders) ? orders : []).filter((o) => o && o.status !== "CANCELADO");
  const pagados = lista.filter((o) => o.payment_status === "paid");
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const porMetodo = new Map<string, { orders: number; gross: number; net: number }>();
  let gross = 0, delivery = 0, cardFees = 0, creditUsed = 0;
  for (const o of pagados) {
    const metodo = String(o.payment_method || "desconocido");
    const total = num(o.total);
    const fee = num(o.delivery_fee);
    // La comida es el total MENOS el reparto. Es el único número que de verdad es venta.
    const comida = Math.max(0, total - fee);
    gross += total;
    delivery += fee;
    if (metodo === "credit") creditUsed += total;
    // La comisión se calcula solo sobre lo que pasó por Culqi. Aplicarla a todo restaría
    // 5.5% de los pagos por Yape, que no la pagan — y el error va en contra del dueño.
    if (metodo === "card") cardFees += total * culqiFeeRate;
    const acc = porMetodo.get(metodo) || { orders: 0, gross: 0, net: 0 };
    acc.orders += 1;
    acc.gross += total;
    acc.net += comida;
    porMetodo.set(metodo, acc);
  }

  // Lo que de verdad entró HOY: todo lo cobrado, menos lo que se pagó con crédito (esa plata
  // entró otro día), menos lo que Culqi se queda.
  const cashIn = gross - creditUsed - cardFees;
  // Lo que le queda al negocio: lo anterior menos TODO el reparto del día.
  //
  // Todo, incluido el de los pedidos pagados con crédito. Al motorizado se le paga igual: no
  // le importa de qué bolsillo salió la venta. Descontar solo el reparto de los pedidos que
  // trajeron efectivo dejaría fuera una salida de caja real y el número saldría optimista —
  // que es la dirección exacta en la que un cierre de caja no se puede equivocar.
  const businessRevenue = cashIn - delivery;

  // Yape/Plin sin confirmar no es caja: el cliente dijo que pagó y nadie miró la cuenta.
  // Va aparte y no suma, porque el día que sume una vez deja de servir para cuadrar.
  const pendientes = lista.filter((o) => o.payment_status !== "paid");

  return {
    orders: pagados.length,
    gross: r2(gross),
    deliveryPassThrough: r2(delivery),
    byMethod: [...porMetodo.entries()]
      .map(([method, v]) => ({ method, label: METHOD_LABELS[method] || method, orders: v.orders, gross: r2(v.gross), net: r2(v.net) }))
      .sort((a, b) => b.gross - a.gross),
    cardFees: r2(cardFees),
    creditUsed: r2(creditUsed),
    cashIn: r2(cashIn),
    businessRevenue: r2(businessRevenue),
    pendingConfirmation: {
      orders: pendientes.length,
      amount: r2(pendientes.reduce((a, o) => a + num(o.total), 0)),
    },
  };
}

export async function actAdminCashClose(b: any) {
  await requireAdmin(b.token);
  // Por defecto el día en curso en hora de Lima, que es lo que significa "cerrar la caja".
  const desde = typeof b.since === "string" && b.since ? b.since : limaDayStartIso(new Date());
  const hasta = typeof b.until === "string" && b.until ? b.until : new Date().toISOString();
  const [rows, conSaldo] = await Promise.all([
    sbGet(
      "orders",
      `created_at=gte.${encodeURIComponent(desde)}&created_at=lte.${encodeURIComponent(hasta)}` +
        `&select=payment_method,payment_status,status,total,delivery_fee&limit=5000`,
    ),
    // #39 — El pasivo de crédito NO es del día: es un saldo acumulado. Viaja con el cierre
    // de caja porque es donde el dueño está mirando plata, pero la pantalla lo separa y lo
    // dice — mezclarlo con el día sería exactamente el error que este cierre vino a arreglar.
    sbGet("customers", "credit_balance=gt.0&select=credit_balance&limit=20000"),
  ]);
  return {
    since: desde,
    until: hasta,
    culqiFeeRate: CULQI_FEE_RATE,
    ...cashClose(rows, CULQI_FEE_RATE),
    creditLiability: creditLiability(conSaldo),
  };
}

// ── #9 / #3 / #4: RECETAS DE PRODUCCIÓN ────────────────────────────────────────────────
//
// Las recetas viven en `production_recipes` (append-only: la fila de mayor id por
// recipe_code es la vigente, mismo patrón que catalog_items y secret_signature). RECETARIO.md
// sigue siendo la EXPLICACIÓN — por qué punta de pecho y no lomo, qué pasa si sobrecargas la
// sartén — y ahí se queda; acá vive solo lo que hay que poder calcular.

export type RecipeIngredient = { item: string; qty: number; unit: string };
export type RecipeStep = { label: string; minutes: number | null };

// #9 — Escalar una receta a las porciones que se quieren hoy.
//
// Puro y probado (tests-api/recetas.test.ts). Es aritmética simple y por eso mismo es fácil
// que nadie la pruebe — pero se equivoca hacia el lado caro: un factor mal calculado hace
// comprar 12 kg de carne en vez de 6, y eso son S/120 parados en un refri que además tiene
// fecha de vencimiento.
export function scaleRecipe(
  ingredients: RecipeIngredient[],
  baseYield: number,
  targetPortions: number,
): (RecipeIngredient & { scaledQty: number })[] {
  const base = Number(baseYield);
  const objetivo = Number(targetPortions);
  if (!Array.isArray(ingredients) || !Number.isFinite(base) || base <= 0) return [];
  if (!Number.isFinite(objetivo) || objetivo <= 0) return [];
  const factor = objetivo / base;
  return ingredients
    .filter((i) => i && typeof i.item === "string" && Number.isFinite(Number(i.qty)))
    .map((i) => {
      const escalada = Number(i.qty) * factor;
      return {
        item: i.item,
        qty: Number(i.qty),
        unit: String(i.unit || ""),
        // Se redondea a 1 decimal, no a entero: media cucharada de sal en una tanda de 2 kg
        // sí cambia el resultado, y redondear 0.4 huevos a 0 deja la receta sin huevo.
        scaledQty: Math.round(escalada * 10) / 10,
      };
    });
}

// #3 — Los tiempos de la tanda, acumulados.
//
// Cada etapa con su minuto de inicio contado desde el arranque, y el total. Sin el
// acumulado, "hornear 17 min" no responde la pregunta real, que es a qué hora se termina —
// y esa es la que decide si la tanda entra en la tarde o hay que empezar mañana.
//
// Una etapa SIN minutos se conserva en la lista con `minutes: null`: se muestra como paso
// pero sin cronómetro. Inventarle una duración sería peor que no tenerla.
export function recipeTimeline(
  steps: RecipeStep[],
): { steps: (RecipeStep & { startsAtMinute: number })[]; totalMinutes: number } {
  const lista = Array.isArray(steps) ? steps : [];
  let acumulado = 0;
  const salida = lista
    .filter((s) => s && typeof s.label === "string" && s.label.length > 0)
    .map((s) => {
      const m = Number(s.minutes);
      const minutos = Number.isFinite(m) && m > 0 ? Math.round(m) : null;
      const inicio = acumulado;
      if (minutos) acumulado += minutos;
      return { label: s.label, minutes: minutos, startsAtMinute: inicio };
    });
  return { steps: salida, totalMinutes: acumulado };
}

// #4 — La etiqueta que va pegada al envase.
//
// RECETARIO.md lo dice sin rodeos: "Sin fecha no hay rotación". En el refri, dos bolsas de
// mechado son indistinguibles, y la única forma de saber cuál usar primero es que lo diga la
// etiqueta.
//
// La vida útil llega desde `inventory.shelf_life_days` — la MISMA que usa la alerta de
// caducidad (#5) y que el dueño edita en el panel de Inventario. No se guarda en la receta a
// propósito: dos números para la misma cosa terminan en que uno gana en silencio.
export function batchLabels(
  recipe: { recipe_code: string; name: string; portion_grams?: number | null },
  cookedAtIso: string,
  shelfLifeDays: number | null,
): { code: string; name: string; portionGrams: number | null; cookedAt: string; useBy: string | null } {
  const cocinado = new Date(cookedAtIso);
  const valido = !Number.isNaN(cocinado.getTime());
  const dias = Number(shelfLifeDays);
  return {
    code: String(recipe?.recipe_code || ""),
    name: String(recipe?.name || ""),
    portionGrams: Number.isFinite(Number(recipe?.portion_grams)) ? Number(recipe?.portion_grams) : null,
    cookedAt: valido ? cocinado.toISOString() : "",
    // Sin vida útil configurada la etiqueta sale igual, con la fecha de producción y sin
    // fecha límite. Una etiqueta sin "usar antes de" sigue permitiendo rotar; una etiqueta
    // con una fecha inventada hace tirar comida buena o servir comida vencida.
    useBy: valido && Number.isFinite(dias) && dias > 0
      ? new Date(cocinado.getTime() + dias * 86400000).toISOString()
      : null,
  };
}

// Solo la fila vigente de cada receta: append-only significa que hay varias por código.
export async function actAdminRecipes(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("production_recipes", "select=*&order=id.desc&limit=500");
  const vigentes = new Map<string, any>();
  for (const r of rows) if (!vigentes.has(r.recipe_code)) vigentes.set(r.recipe_code, r);
  const recetas = [...vigentes.values()].filter((r) => r.active !== false);

  // La vida útil de cada insumo, para las etiquetas. Una sola consulta para todas las
  // recetas en vez de una por receta.
  const codes = recetas.map((r) => r.recipe_code);
  const inv = codes.length
    ? await sbGet("inventory", `product_code=in.(${codes.map((c) => encodeURIComponent(c)).join(",")})&select=product_code,shelf_life_days`)
    : [];
  const vida = new Map<string, number | null>(inv.map((i: any) => [i.product_code, i.shelf_life_days ?? null]));

  const targetPortions = Number(b.targetPortions);
  return {
    recipes: recetas.map((r) => ({
      ...r,
      timeline: recipeTimeline(r.steps || []),
      shelfLifeDays: vida.get(r.recipe_code) ?? null,
      // El escalado solo viaja si se pidió: sin objetivo, la pantalla muestra la receta tal
      // como está escrita, que es lo correcto por defecto.
      scaled: Number.isFinite(targetPortions) && targetPortions > 0
        ? scaleRecipe(r.ingredients || [], r.yield_portions, targetPortions)
        : null,
    })),
    targetPortions: Number.isFinite(targetPortions) && targetPortions > 0 ? targetPortions : null,
  };
}

// Guardar una receta = insertar una fila nueva (append-only). Nunca se edita in-place: así
// queda el historial de "qué hice la vez que salió bien", que en una receta es justo lo que
// uno quiere poder mirar.
const RECIPE_MAX_INGREDIENTS = 60;
const RECIPE_MAX_STEPS = 40;
export async function actAdminRecipeSet(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.recipeCode || "").trim().toUpperCase().slice(0, 20);
  const name = String(b.name || "").trim().slice(0, 120);
  const yieldPortions = Number(b.yieldPortions);
  if (!code) throw new ApiError("Falta el código del insumo.", 400);
  if (!name) throw new ApiError("Falta el nombre de la receta.", 400);
  if (!Number.isFinite(yieldPortions) || yieldPortions <= 0) {
    // Sin rendimiento no se puede escalar nada, así que una receta sin él no sirve para lo
    // único que esta pantalla hace.
    throw new ApiError("El rendimiento en porciones tiene que ser un número mayor que cero.", 400);
  }
  const ingredients = (Array.isArray(b.ingredients) ? b.ingredients : [])
    .slice(0, RECIPE_MAX_INGREDIENTS)
    .filter((i: any) => i && String(i.item || "").trim() && Number.isFinite(Number(i.qty)))
    .map((i: any) => ({ item: String(i.item).trim().slice(0, 120), qty: Number(i.qty), unit: String(i.unit || "").trim().slice(0, 20) }));
  const steps = (Array.isArray(b.steps) ? b.steps : [])
    .slice(0, RECIPE_MAX_STEPS)
    .filter((x: any) => x && String(x.label || "").trim())
    .map((x: any) => ({ label: String(x.label).trim().slice(0, 200), minutes: Number.isFinite(Number(x.minutes)) && Number(x.minutes) > 0 ? Math.round(Number(x.minutes)) : null }));

  const row = (await sbInsert("production_recipes", {
    recipe_code: code,
    name,
    yield_portions: Math.round(yieldPortions),
    portion_grams: Number.isFinite(Number(b.portionGrams)) && Number(b.portionGrams) > 0 ? Math.round(Number(b.portionGrams)) : null,
    ingredients,
    steps,
    notes: b.notes ? String(b.notes).slice(0, 2000) : null,
    active: b.active !== false,
    created_by: s.phone,
  }))[0];
  await logAdminAction(s.phone, "recipe-set", code, { name, yieldPortions, ingredientes: ingredients.length, etapas: steps.length });
  return { success: true, recipe: row };
}

// Cálculo puro del plan de tanda, extraído de actAdminBatchPlan (#2, 2026-08-30).
//
// Se saca acá por la misma razón que `prepShortfall` y `cancellationDeltas`: la ALERTA de
// "toca cocinar" tiene que usar exactamente el mismo criterio que la pantalla. Dos copias
// del mismo cálculo divergen, y el día que diverjan la pantalla dirá que alcanza mientras
// la alerta grita, o al revés — y entonces no se le cree a ninguna de las dos.
export type BatchPlanItem = {
  code: string;
  name: string;
  usedInWindow: number;
  perDay: number;
  committed: number;
  needed: number;
  stock: number | null;
  toCook: number | null;
  stockTracked: boolean;
  daysLeft: number | null;
};

export function batchPlanItems(
  consumo: Map<string, number>,
  comprometido: Map<string, number>,
  invMap: Map<string, { product_name?: string | null; stock_qty?: number | null }>,
  daysOfData: number,
  coverDays: number,
): BatchPlanItem[] {
  const dias = Math.max(1, Number(daysOfData) || 1);
  const codes = new Set<string>([...consumo.keys(), ...comprometido.keys()]);
  return [...codes]
    .map((code) => {
      const usado = consumo.get(code) || 0;
      const porDia = usado / dias;
      const proyectado = Math.ceil(porDia * coverDays * BATCH_SAFETY_FACTOR);
      const yaPedido = comprometido.get(code) || 0;
      // Los pedidos ya programados son demanda comprometida: si superan la proyección,
      // manda el compromiso — no se puede "promediar" algo que ya está vendido.
      const necesario = Math.max(proyectado, yaPedido);
      const inv = invMap.get(code);
      // Sin cantidad rastreada no se puede restar nada: se informa el total necesario y se
      // deja claro que el stock actual es desconocido, en vez de asumir cero (haría
      // cocinar de más) o asumir que alcanza (haría quedarse corto).
      const stock = inv?.stock_qty ?? null;
      return {
        code,
        name: inv?.product_name || code,
        usedInWindow: usado,
        perDay: Math.round(porDia * 100) / 100,
        committed: yaPedido,
        needed: necesario,
        stock,
        toCook: stock == null ? null : Math.max(0, necesario - stock),
        stockTracked: stock != null,
        // #2 — Para cuántos días alcanza lo que hay, al ritmo real de consumo. Es el número
        // que convierte "te quedan 12 porciones" (que no dice nada por sí solo) en "se te
        // acaba el jueves". `null` cuando no hay consumo medido: dividir entre cero daría
        // Infinity y la pantalla mostraría que alcanza para siempre.
        daysLeft: stock == null || porDia <= 0 ? null : Math.round((stock / porDia) * 10) / 10,
      };
    })
    .filter((x) => x.needed > 0)
    .sort((a, b) => b.needed - a.needed);
}

// Lectura + cálculo del plan de tanda, compartida por la pantalla (actAdminBatchPlan) y la
// alerta de "toca cocinar" (#2). Antes esto vivía entero dentro de la acción del panel, así
// que la alerta habría necesitado su propia copia de las dos consultas y del promedio.
const BATCH_DEFAULT_COVER_DAYS = 4;
async function computeBatchPlan(coverDays: number) {
  await loadCatalogPrices();
  const now = Date.now();
  const since = new Date(now - BATCH_LOOKBACK_DAYS * 86400000).toISOString();
  const horizonEnd = new Date(now + coverDays * 86400000).toISOString();

  const [historial, programados] = await Promise.all([
    // Solo pedidos PAGADOS y no cancelados: un pedido que nunca se cobró no consumió
    // insumos, y contarlo haría cocinar de más todas las semanas.
    sbGet(
      "orders",
      `payment_status=eq.paid&status=neq.CANCELADO&created_at=gte.${encodeURIComponent(since)}&select=created_at,items&order=created_at.asc&limit=5000`,
    ),
    sbGet(
      "orders",
      `delivery_time=not.is.null&delivery_time=gte.${encodeURIComponent(new Date(now).toISOString())}&delivery_time=lte.${encodeURIComponent(horizonEnd)}` +
        `&status=neq.CANCELADO&status=neq.ENTREGADO&select=items&limit=500`,
    ),
  ]);

  function contar(rows: any[], into: Map<string, number>) {
    for (const o of rows) {
      if (!Array.isArray(o.items)) continue;
      for (const it of o.items) {
        try {
          const priced = priceCartItem(it);
          for (const code of priced.ingredientsPerUnit) into.set(code, (into.get(code) || 0) + priced.qty);
        } catch {
          // Ítem legado que ya no encaja en el catálogo — se omite solo ese, el resto del
          // plan sigue siendo útil (mismo criterio que la lista de preparación).
        }
      }
    }
  }
  const consumo = new Map<string, number>();
  contar(historial, consumo);
  const comprometido = new Map<string, number>();
  contar(programados, comprometido);

  // Días transcurridos desde el primer pedido de la ventana, no los 28 completos: si el
  // negocio lleva 6 días abierto, dividir entre 28 daría un consumo diario cuatro veces
  // menor que el real y la tanda saldría corta.
  const primero = historial.length ? new Date(historial[0].created_at).getTime() : now;
  const daysOfData = Math.max(1, Math.min(BATCH_LOOKBACK_DAYS, Math.ceil((now - primero) / 86400000)));
  const reliable = daysOfData >= BATCH_MIN_DAYS_OF_DATA && historial.length >= BATCH_MIN_ORDERS;

  const codes = new Set<string>([...consumo.keys(), ...comprometido.keys()]);
  const invRows = codes.size
    ? await sbGet(
        "inventory",
        `product_code=in.(${[...codes].map((c) => encodeURIComponent(c)).join(",")})&select=product_code,product_name,stock_qty,in_stock`,
      )
    : [];
  const invMap = new Map<string, any>(invRows.map((r: any) => [r.product_code, r]));

  const items = batchPlanItems(consumo, comprometido, invMap, daysOfData, coverDays);

  return {
    coverDays,
    lookbackDays: BATCH_LOOKBACK_DAYS,
    daysOfData,
    ordersConsidered: historial.length,
    scheduledConsidered: programados.length,
    safetyFactor: BATCH_SAFETY_FACTOR,
    // Cuando esto es falso la pantalla NO muestra las cantidades como una indicación:
    // muestra primero por qué todavía no se les puede creer.
    reliable,
    minDaysOfData: BATCH_MIN_DAYS_OF_DATA,
    minOrders: BATCH_MIN_ORDERS,
    items,
  };
}

export async function actAdminBatchPlan(b: any) {
  await requireAdmin(b.token);
  const coverDays = Number.isInteger(b.coverDays) && b.coverDays > 0 && b.coverDays <= 14
    ? b.coverDays
    : BATCH_DEFAULT_COVER_DAYS;
  return await computeBatchPlan(coverDays);
}

// C5 — SALUD DEL NEGOCIO. Una sola pantalla que responde "¿hay algo que atender ahora
// mismo?", que es la pregunta que el dueño se hace cuando abre la app entre tandas.
//
// No es otro tablero de cifras: el dashboard de ingresos, el reporte de retención y la
// cola de pedidos ya existen y son buenos, pero están repartidos en 3 pantallas distintas
// y ninguno responde esa pregunta — hay que entrar a cada uno y deducirlo. Acá cada señal
// viene con un veredicto (ok / atención / problema) y con lo único que importa: cuántos y
// dónde tocar. Cocinando solo, ese es el formato que se puede leer entre dos sándwiches.
//
// Todas las señales son cosas que se pueden ARREGLAR hoy. Deliberadamente NO entran acá
// las métricas de tendencia (ingresos del mes, ticket promedio, productos más vendidos):
// son para sentarse a pensar, no para actuar en el momento, y mezclarlas haría que esta
// pantalla se lea como "informe" y deje de mirarse a diario.
const HEALTH_STUCK_MINUTES = 45;
export async function actAdminHealth(b: any) {
  await requireAdmin(b.token);
  const now = Date.now();
  const stuckCutoff = new Date(now - HEALTH_STUCK_MINUTES * 60000).toISOString();

  const [pagosPendientes, estancados, agotados, bajoStock, reclamos, cronsMuertos, pico] = await Promise.all([
    // Yape/Plin que el cliente dice haber pagado y nadie confirmó: la cocina no puede
    // avanzarlos, así que cada uno es un cliente esperando comida que no se está haciendo.
    sbGet("orders", "payment_method=in.(yape,plin)&payment_status=neq.paid&status=eq.RECIBIDO&select=id&limit=200"),
    // Pedidos parados en el mismo estado más de HEALTH_STUCK_MINUTES. El cron ya manda un
    // push por cada uno, pero un push se pierde: acá queda el conteo hasta que se resuelva.
    sbGet(
      "orders",
      `status=in.(RECIBIDO,PREPARANDO,EN CAMINO)&status_changed_at=lt.${encodeURIComponent(stuckCutoff)}&select=id&limit=200`,
    ),
    sbGet("inventory", "in_stock=eq.false&select=product_code,product_name&limit=200"),
    // Se piden también las columnas de tanda: el mismo viaje sirve para "por acabarse" y
    // para la caducidad (#5), y una consulta menos en una pantalla que ya hace siete.
    sbGet("inventory", "select=product_code,product_name,stock_qty,low_stock_threshold,in_stock,batch_cooked_at,shelf_life_days&limit=200"),
    // Plazo legal del Libro de Reclamaciones: es el único de esta lista con consecuencia
    // regulatoria, no solo comercial.
    sbGet("complaints", "status=neq.atendido&select=id,claim_code,created_at&limit=200"),
    // Las dos señales de C1/C2: si la automatización está caída, TODO lo de arriba se
    // deja de vigilar solo, así que corresponde verlo en la misma pantalla.
    rpc("dead_cron_jobs", { p_min_misses: 3 }).catch(() => []),
    rpc("error_spike", { p_min_errors: 10, p_factor: 4 }).catch(() => []),
  ]);

  // `stock_qty=not.is.null` se movió del filtro de PostgREST al de acá porque la misma
  // consulta ahora alimenta dos señales: la caducidad necesita ver TODAS las filas.
  const bajos = (bajoStock as any[]).filter((r) => r.stock_qty != null && r.stock_qty > 0 && r.stock_qty <= (r.low_stock_threshold || 5));
  const caducidad = batchExpiryStatus(bajoStock as any[], now);
  const porVencer = (reclamos as any[]).filter(
    (c) => COMPLAINT_DEADLINE_BUSINESS_DAYS - businessDaysSince(new Date(c.created_at), new Date(now)) <= DEADLINE_WARNING_BUSINESS_DAYS,
  );

  // El veredicto se calcula en el SERVIDOR, no en la pantalla: si cada cliente decidiera
  // por su cuenta qué es "problema", dos versiones de la app pintarían distinto el mismo
  // estado del negocio. Acá también es donde se cambia un umbral una sola vez.
  const señales = [
    {
      id: "pagos",
      label: "Pagos por confirmar",
      count: pagosPendientes.length,
      // Cualquiera bloquea a un cliente, así que no hay zona amarilla.
      level: pagosPendientes.length > 0 ? "problema" : "ok",
      hint: pagosPendientes.length ? "La cocina no puede avanzarlos hasta que confirmes que llegó el pago." : "Ninguno esperando.",
      screen: "admin_home",
    },
    {
      id: "estancados",
      label: "Pedidos parados +" + HEALTH_STUCK_MINUTES + " min",
      count: estancados.length,
      level: estancados.length > 0 ? "problema" : "ok",
      hint: estancados.length ? "Alguien está esperando y mirando el reloj." : "Todo avanzando.",
      screen: "admin_home",
    },
    {
      id: "agotados",
      label: "Insumos agotados",
      count: agotados.length,
      // Un agotado no rompe nada — el cliente simplemente no lo ve — pero si es la
      // proteína de un Signature, ese producto desaparece de la carta sin avisar.
      level: agotados.length > 0 ? "atencion" : "ok",
      hint: agotados.length
        ? (agotados as any[]).map((r) => r.product_name || r.product_code).slice(0, 4).join(", ")
        : "Nada marcado como agotado.",
      screen: "admin_inventory",
    },
    {
      id: "bajo_stock",
      label: "Insumos por acabarse",
      count: bajos.length,
      level: bajos.length > 0 ? "atencion" : "ok",
      hint: bajos.length
        ? bajos.map((r) => (r.product_name || r.product_code) + " (" + r.stock_qty + ")").slice(0, 4).join(", ")
        : "Stock cómodo en todo lo que se rastrea.",
      screen: "admin_inventory",
    },
    {
      id: "caducidad",
      label: "Tandas vencidas o por vencer",
      count: caducidad.vencidos.length + caducidad.porVencer.length,
      // Una tanda VENCIDA no es "atención": es comida que no se puede servir, y es lo único
      // de esta pantalla que puede enfermar a alguien. Una por vencer sí es aviso: todavía
      // se puede vender antes de la fecha o planificar la siguiente tanda.
      level: caducidad.vencidos.length > 0 ? "problema" : caducidad.porVencer.length > 0 ? "atencion" : "ok",
      hint: caducidad.vencidos.length
        ? "NO USAR: " + caducidad.vencidos.map((v) => v.name).slice(0, 4).join(", ")
        : caducidad.porVencer.length
        ? "Vencen en menos de " + BATCH_EXPIRY_WARN_HOURS + " h: " + caducidad.porVencer.map((v) => v.name).slice(0, 4).join(", ")
        : "Ninguna tanda cerca de su fecha límite.",
      screen: "admin_inventory",
    },
    {
      id: "reclamos",
      label: "Reclamos por vencer",
      count: porVencer.length,
      // El único con consecuencia legal: se marca como problema apenas hay uno.
      level: porVencer.length > 0 ? "problema" : "ok",
      hint: porVencer.length
        ? "Quedan " + DEADLINE_WARNING_BUSINESS_DAYS + " días hábiles o menos para responder."
        : "Ninguno cerca del plazo.",
      screen: "admin_complaints",
    },
    {
      id: "automatizacion",
      label: "Automatización",
      count: (cronsMuertos as any[]).length,
      level: (cronsMuertos as any[]).length > 0 ? "problema" : "ok",
      hint: (cronsMuertos as any[]).length
        ? (cronsMuertos as any[]).map((j) => j.jobname).slice(0, 3).join(", ") + " no responde(n)."
        : "Todos los procesos automáticos respondiendo.",
      screen: null,
    },
    {
      id: "errores",
      label: "Errores del sistema",
      count: (pico as any[]).length ? Number((pico as any[])[0].last_hour) : 0,
      level: (pico as any[]).length ? "problema" : "ok",
      hint: (pico as any[]).length
        ? "Pico en la última hora (lo normal es ~" + (pico as any[])[0].baseline_per_hour + " por hora)."
        : "Sin picos de error.",
      screen: null,
    },
  ];

  return {
    checkedAt: new Date(now).toISOString(),
    // "problema" gana sobre "atencion": el resumen de arriba tiene que reflejar lo peor
    // que hay, no el promedio.
    overall: señales.some((s) => s.level === "problema")
      ? "problema"
      : señales.some((s) => s.level === "atencion")
      ? "atencion"
      : "ok",
    signals: señales,
  };
}

// Reporte de retención y cohortes (RPC retention_report, ver migración
// `retention_report_rpc`). Es la contraparte de actDashboardStats: ese mide DINERO por
// período, este mide si los clientes VUELVEN. Hasta ahora el panel no tenía ninguna cifra
// agregada de retención — se podía ver "clientes en riesgo de fuga" uno por uno, pero no
// la tasa a la que el negocio pierde o conserva gente, que es lo que decide si funciona.
//
// Todo el cálculo vive en SQL sobre la tabla completa (no la ventana acotada que usa el
// dashboard de ingresos): una cohorte a medias no se nota como faltante, se nota como un
// número equivocado.
const RETENTION_COHORT_MONTHS = 6;
// Debajo de este % de repetición a 30 días, el negocio está adquiriendo clientes que no
// vuelven — el panel lo marca en rojo. El umbral es un punto de referencia de la
// categoría, no una ley: revisarlo cuando haya varios meses de historial real propio.
const RETENTION_ALARM_PCT = 25;
export async function actAdminRetentionReport(b: any) {
  await requireAdmin(b.token);
  const months = Number.isInteger(b.months) && b.months > 0 && b.months <= 24 ? b.months : RETENTION_COHORT_MONTHS;
  const report = await rpc("retention_report", { p_cohort_months: months });
  const rolling = report?.rolling30 || {};
  return {
    ...report,
    alarm: {
      thresholdPct: RETENTION_ALARM_PCT,
      // Solo tiene sentido dar la alarma cuando hay clientes activos que medir; con 0
      // activos el 0% no significa "retención pésima", significa "todavía no hay dato".
      triggered: (rolling.active || 0) > 0 && (rolling.returningPct || 0) < RETENTION_ALARM_PCT,
    },
  };
}
