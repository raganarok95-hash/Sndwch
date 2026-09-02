// SND//WCH — api / actions/orders
// Colocar pedido, historial de pedidos (cliente + invitado), y todo el flujo admin de
// cola de pedidos: avanzar estado, confirmar pago manual (Yape/Plin/COD), cancelar, y
// la expiración automática de pagos manuales nunca confirmados.
import {
  CULQI_SECRET_KEY, REFERRAL_BONUS_POINTS, REFERRER_REWARD_POINTS, STALE_MANUAL_PAYMENT_HOURS,
  isWithinStoreHours, computeRankName, loadStoreHours, DELIVERY_EXCLUDED_ZONES, DELIVERY_ZONE_FEES,
  DELIVERY_KM_RATE, DELIVERY_ROAD_FACTOR, DELIVERY_MIN_FEE, DELIVERY_MAX_KM, STORE_LAT, STORE_LON,
  CULQI_FEE_RATE, MAX_ORDERS_PER_HOUR, noteNeedsAttention, MAX_PUSH_PER_RUN, REFERRAL_MILESTONES,
} from "../env.ts";
import { sbGet, sbInsert, sbUpdate, rpc, storageUpload, storageSignedUrl } from "../db.ts";
import { ApiError } from "../types.ts";
import { verifyActiveSession, requireSession, requireAdmin, safeCustomer, verifyCronSecret } from "../session.ts";
import { loadCatalogPrices, deriveCart, priceCartItem, REWARDS, assertCartGatesAllowed, SIG_GATES } from "../catalog.ts";
import { organizerFreeSandwichApplies } from "./group.ts";
import { sendPushToPhone, sendPushToAdmins, STATUS_PUSH_MESSAGES, etaWindowText } from "../push.ts";
import { sendPurchaseEvent } from "../meta-capi.ts";
import { storePausedUntil } from "./hours.ts";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../email.ts";
import { logAdminAction, debugLog } from "../logging.ts";

// Avisa al dueño solo en el momento en que un producto CRUZA su umbral de stock bajo (o
// llega a 0) — no en cada pedido siguiente mientras ya viene bajo, para no saturarlo de
// notificaciones repetidas por el mismo producto. Ítems sin seguimiento de cantidad
// (stock_qty null, solo el toggle in_stock) quedan fuera del filtro sin querer alertar.
async function alertLowStockCrossing(codes: string[], qtys: number[]): Promise<void> {
  const rows = await sbGet(
    "inventory",
    `product_code=in.(${codes.join(",")})&stock_qty=not.is.null&select=product_code,product_name,stock_qty,low_stock_threshold`,
  );
  for (const row of rows) {
    const idx = codes.indexOf(row.product_code);
    if (idx < 0) continue;
    const threshold = row.low_stock_threshold || 5;
    const after = row.stock_qty || 0;
    const before = after + qtys[idx];
    if (before > threshold && after <= threshold) {
      await sendPushToAdmins({
        title: after === 0 ? "Se agotó un producto ⚠️" : "Stock bajo ⚠️",
        body: (row.product_name || row.product_code) + ": quedan " + after + " unidades.",
        url: "./index.html",
        tag: "sndwch-low-stock-" + row.product_code,
      });
    }
  }
}

// Devuelve al inventario, sin propagar el error si falla — usado en los 3 puntos donde
// una reserva/pedido ya descontó stock real pero la operación termina fallando de
// todos modos. Antes cada uno repetía el mismo try/catch con solo el texto del mensaje
// de consola distinto (hallazgo de la auditoría de código).
async function restockBestEffort(codes: string[], qtys: number[], context: string): Promise<void> {
  if (!codes.length) return;
  try {
    await rpc("restock_inventory", { p_codes: codes, p_qtys: qtys });
  } catch (restockErr) {
    console.error(`Failed to restock inventory after ${context} failure:`, restockErr);
  }
}

// Antes un solo fallo de red (timeout, DNS, 5xx transitorio de Culqi) devolvía false y
// rechazaba un pedido con un cargo real y válido detrás — un reintento cubre la gran
// mayoría de esos blips sin debilitar el chequeo: un 4xx real de Culqi ("este chargeId
// no existe/no coincide") sigue rechazando sin reintentar, solo se reintenta ante un
// fallo de red o un 5xx del propio Culqi.
//
// expectedRef/metadataKey (hallazgo de auditoría de código, CRÍTICO): un cargo Culqi
// exitoso queda en ese estado para siempre — reconsultarlo es idempotente/sin efecto
// secundario. Antes de este chequeo, un cliente podía pagar un pedido una vez y luego
// reenviar el MISMO chargeId contra un `ref` nuevo (otra reserva `pending_charges`, o un
// `pending_weekly_plans` nuevo) del mismo monto: `verifyCulqiCharge` volvía a devolver
// true porque el cargo real sigue siendo "venta_exitosa" con el monto correcto, sin
// verificar que ese cargo específico fue creado PARA este pedido/plan. `claimAndChargeCulqi`
// (_shared/culqi-claim.ts) ya graba `metadata: { order_ref | credit_ref: <ref> }` al crear
// el cargo — comparar contra eso ata cada cargo real a un único `ref`, cerrando la reutilización.
export async function verifyCulqiCharge(
  chargeId: string,
  expectedAmountCents: number,
  expectedRef: string,
  metadataKey: "order_ref" | "credit_ref",
): Promise<boolean> {
  if (!CULQI_SECRET_KEY) return false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://api.culqi.com/v2/charges/${encodeURIComponent(chargeId)}`, {
        headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
      });
      if (!r.ok) {
        if (r.status >= 500 && attempt === 0) continue;
        return false;
      }
      const data = await r.json();
      const successful = data?.outcome?.type === "venta_exitosa";
      const amountMatches = Number(data?.amount) === expectedAmountCents;
      const refMatches = data?.metadata?.[metadataKey] === expectedRef;
      return successful && amountMatches && refMatches;
    } catch {
      if (attempt === 0) continue;
      return false;
    }
  }
  return false;
}

// Ventana durante la cual una reserva de Culqi (ver actPrepareOrder) sigue siendo
// válida para cobrarse — pasado esto, el cron actExpirePendingCharges libera el
// inventario y el cliente debe volver a intentar.
const PENDING_CHARGE_TTL_MINUTES = 10;

// Límite de pedidos con pago manual (Yape/Plin) sin confirmar por teléfono de contacto —
// ver el comentario junto a check_rate_limit en actPlaceOrder.
const MANUAL_ORDER_RATE_LIMIT = 4;
const MANUAL_ORDER_RATE_WINDOW_MINUTES = 30;

// Techo de pedidos por hora de ENTREGA. Nada lo verificaba antes — isWithinStoreHours solo
// comprueba que la hora caiga dentro del horario de atención, así que el checkout aceptaba
// 20 pedidos programados para las 8pm sin ningún freno, prometiéndole al cliente algo que
// la cocina no puede cumplir (hallazgo de auditoría de logística). Es un tope BLANDO y
// configurable: cuenta los pedidos que ya tienen esa misma hora comprometida y rechaza el
// que se pasa, sugiriendo otra hora.
//
// Subido de 6 a 10 (2026-08-15) al conocer el método de trabajo real: la cocción se hace
// por TANDAS 1-2 veces por semana (proteínas, salsas, vegetales listos), y en hora de
// servicio cada pedido es solo ARMAR el sándwich — ~4-5 minutos con todo en mise en place,
// no cocinar desde cero. Además el dueño NUNCA reparte: el motorizado es aparte y lo paga
// el cliente por zona, así que armar no compite con salir a entregar. El 6 anterior venía
// de suponer un ciclo cocinar+repartir que no es el de este negocio, y con la meta de
// ~20 pedidos/día concentrados en dos ventanas habría empezado a rechazar pedidos reales
// un viernes por la noche.
// Vive en env.ts desde que `get-store-hours` también lo necesita para decirle al cliente
// qué franjas están llenas (#23): hours.ts no puede importar de orders.ts sin crear un
// ciclo, porque orders.ts ya importa storePausedUntil de hours.ts.
// (Ver MAX_ORDERS_PER_HOUR en ../env.ts)

// El negocio abre el 7 de septiembre de 2026. Hasta ese momento `app_settings
// .business_launched` es false y el home muestra el badge "AÚN NO ABRIMOS" con la lista de
// espera — pero el catálogo, el carrito y Culqi seguían 100% operativos: cualquiera podía
// armar un pedido, PAGARLO DE VERDAD con tarjeta y recibir "✓ Pago confirmado" por comida
// que nadie iba a preparar. El único guard que existía era el horario de atención, que no
// tiene nada que ver con si el negocio ya arrancó. Encontrado por dos auditorías
// independientes de UX el 2026-08-15; es un cobro real sin contraparte, con reembolso
// manual y un cliente enojado antes siquiera de abrir.
//
// Se valida en el servidor y no solo escondiendo el botón: el cliente es reemplazable
// (una llamada directa a la API, una pestaña vieja en caché) y esto mueve dinero real.
async function assertBusinessLaunched(): Promise<void> {
  let launched = false;
  try {
    const rows = await sbGet("app_settings", "select=business_launched&id=eq.true");
    launched = rows?.[0]?.business_launched === true;
  } catch (e) {
    // Si no se puede leer la bandera, se asume NO lanzado: es preferible rechazar un
    // pedido legítimo (recuperable) que cobrar por uno que nadie va a preparar.
    console.error("assertBusinessLaunched failed:", e);
    throw new ApiError("No pudimos verificar si estamos operando. Intenta en unos minutos.", 503);
  }
  if (!launched) {
    throw new ApiError(
      "Todavía no abrimos. Déjanos tu teléfono en la app y te avisamos apenas arranquemos.",
      403,
    );
  }
  // Pausa temporal ("hoy ya no puedo", "vuelvo en 2 horas"). Va dentro del mismo guard que
  // ya atraviesan los DOS caminos de cobro, así que ningún pedido puede colarse por un
  // lado mientras el otro rechaza. Se reanuda sola comparando contra la hora actual: no
  // hay nada que acordarse de revertir.
  const pausedUntil = await storePausedUntil();
  if (pausedUntil) {
    const hora = new Date(pausedUntil).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
    throw new ApiError("Estamos con una pausa breve — volvemos a las " + hora + ". Gracias por la paciencia.", 503);
  }
}

// Cuenta los pedidos vivos (no cancelados) cuya entrega cae en la misma hora que `when`, y
// rechaza si ya se llegó al tope. `scheduled_for` manda cuando existe; si no, la hora de
// creación es la hora de entrega efectiva (pedido "AHORA").
async function assertHourCapacity(when: Date): Promise<void> {
  const hourStart = new Date(when);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(hourStart.getTime() + 3600000);
  const from = encodeURIComponent(hourStart.toISOString());
  const to = encodeURIComponent(hourEnd.toISOString());
  try {
    const [scheduled, immediate] = await Promise.all([
      // La columna se llama `delivery_time`, NO `scheduled_for` (verificado contra
      // information_schema: `orders` no tiene `scheduled_for`; ese nombre solo existe en
      // `pending_charges`). Con el nombre equivocado PostgREST devolvía 42703, el catch de
      // abajo se lo tragaba, y el tope NUNCA se aplicó desde que se introdujo.
      sbGet("orders", `status=neq.CANCELADO&delivery_time=gte.${from}&delivery_time=lt.${to}&select=id&limit=100`),
      sbGet("orders", `status=neq.CANCELADO&delivery_time=is.null&created_at=gte.${from}&created_at=lt.${to}&select=id&limit=100`),
    ]);
    if (scheduled.length + immediate.length >= MAX_ORDERS_PER_HOUR) {
      throw new ApiError(
        "Esa hora ya está llena — la cocina no da abasto para más pedidos en esa franja. Elige otra hora, por favor.",
        409,
      );
    }
  } catch (e) {
    // Un fallo leyendo la tabla no debe bloquear una venta real: el tope es una
    // protección operativa, no una regla de dinero. Solo se propaga el rechazo real.
    if (e instanceof ApiError) throw e;
    // Se sigue sin bloquear la venta (el tope es operativo, no una regla de dinero), pero
    // ahora queda registrado: el fallo anterior era invisible porque solo iba a la consola
    // de la función, que nadie mira. Así un error de esquema se ve en el resumen diario.
    console.error("assertHourCapacity failed:", e);
    void debugLog({ stage: "assert-hour-capacity", error: String(e) });
  }
}

// PUNTOS SIEMPRE ENTEROS (2026-08-27).
// `customers.points` y `transactions.points` son `integer` en la base. Desde que los
// precios llevan decimales (+S/0.90 el 2026-08-15) la resta `total − delivery` dejó de
// dar enteros: un pedido de S/27.25 con delivery S/6.35 da 20.900000000000002, y ese
// valor viaja como `p_points_delta` a un parámetro `integer`. PostgREST castea con la
// función de entrada del tipo, así que revienta con 22P02 (invalid input syntax for type
// integer) — DESPUÉS de que Culqi ya cobró.
//
// Es el mismo mecanismo que ya obligó a ensanchar las columnas de dinero a numeric
// (migración 20260730210447): ahí se corrigieron las de dinero, pero las de puntos
// quedaron integer y nadie las volvió a mirar hasta que los precios cambiaron.
//
// No se ha disparado en producción sólo porque los pedidos existentes son de julio, con
// totales enteros y delivery 0. Con el catálogo de hoy fallaría en el 100% de los pedidos
// de un cliente con cuenta.
// Anticipación máxima de un pedido programado. El cliente ya ofrece solo HOY/MAÑANA.
const MAX_SCHEDULE_AHEAD_HOURS = 48;

export function pointsFor(total: number, deliveryFee: number): number {
  return Math.round(total - (deliveryFee || 0));
}

type FinalizeOrderParams = {
  ref: string;
  phone: string | null;
  contactPhone: string;
  name: string;
  email: string;
  address: string;
  summary: string;
  notes: string | null;
  total: number;
  deliveryFee: number;
  deliveryKm?: number | null;
  deliveryZone: string | null;
  paymentStatus: string;
  paymentId: string | null;
  paymentMethod: string;
  items: Record<string, unknown>[];
  scheduledFor: string | null;
  reward: { pts: number; label: string } | null;
  useCredit: boolean;
  lat: number | null;
  lon: number | null;
  /** Cookies del píxel de Meta (_fbp/_fbc) y user-agent del navegador — solo sirven para
   *  que el evento de compra que manda el servidor se pueda atribuir al anuncio que trajo
   *  al cliente. Opcionales: si no llegan, el evento se manda igual con lo que haya. */
  fbp?: string | null;
  fbc?: string | null;
  clientUserAgent?: string | null;
  /** Código del pedido grupal del que salió este pedido, si vino de uno. Solo sirve para
   *  poder medir cuánta venta genera ese canal (una entrega, varios sándwiches). */
  groupCode?: string | null;
};

// Coordenadas del pin que el cliente confirmó en el mapa del checkout. Se sanean acá y
// no se confía en lo que llegue: cualquier cosa fuera del rango válido de lat/lon (o no
// numérica) se guarda como null, porque una coordenada basura en el ticket de reparto es
// peor que no tener ninguna — manda al motorizado a un lugar equivocado con la confianza
// de un dato "preciso", en vez de hacerlo leer la dirección en texto.
function sanitizeCoord(raw: unknown, max: number): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > max) return null;
  return Math.round(n * 1e6) / 1e6;
}
// Identificadores del píxel de Meta que el navegador puede mandar junto al pedido
// (_fbp/_fbc son cookies que pone el propio píxel). No son datos personales por sí solos y
// solo se usan para atribuir la venta al anuncio correcto. Se acotan a un largo razonable
// para que nadie use este campo para inyectar basura en el evento.
// ¿Este carrito se cobra con el sándwich gratis del organizador de un pedido grupal?
// Se resuelve ANTES de deriveCart porque el descuento entra en el precio, y se verifica
// entero contra la base (ver organizerFreeSandwichApplies): el `groupCode` que manda el
// cliente es solo una pista, nunca una autorización.
//
// Verifica la sesión por su cuenta en vez de reusar la que estas funciones resuelven más
// abajo: ese bloque corre DESPUÉS de deriveCart a propósito (el orden está documentado
// por el fix de identidad del código promocional) y moverlo para ahorrar una consulta
// sería tocar el camino del dinero por una razón cosmética. Es una verificación extra
// solo en pedidos grupales, que son el camino menos frecuente.
async function organizerWaiverFor(b: any): Promise<boolean> {
  const code = typeof b?.groupCode === "string" ? b.groupCode.trim().toUpperCase().slice(0, 24) : "";
  if (!code || !b?.token) return false;
  const active = await verifyActiveSession(b.token);
  if (!active) return false;
  return await organizerFreeSandwichApplies(code, active.payload.phone);
}

function readMetaAttribution(b: any): { fbp: string | null; fbc: string | null; clientUserAgent: string | null; groupCode: string | null } {
  const clean = (v: unknown, max: number) => {
    const s = typeof v === "string" ? v.trim().slice(0, max) : "";
    return s || null;
  };
  return {
    fbp: clean(b?.fbp, 120),
    fbc: clean(b?.fbc, 300),
    clientUserAgent: clean(b?.ua, 400),
    // Se normaliza igual que en group.ts (mayúsculas, sin espacios) para que coincida con
    // el código real del pedido grupal aunque el cliente lo mande de otra forma.
    groupCode: (typeof b?.groupCode === "string" ? b.groupCode.trim().toUpperCase().slice(0, 24) : "") || null,
  };
}

function readCoords(b: any): { lat: number | null; lon: number | null } {
  const lat = sanitizeCoord(b?.lat, 90);
  const lon = sanitizeCoord(b?.lon, 180);
  // Media coordenada no ubica nada — o van las dos o no va ninguna.
  return lat === null || lon === null ? { lat: null, lon: null } : { lat, lon };
}

// Núcleo compartido entre el pago con Culqi (confirmado desde una reserva ya validada,
// ver actPrepareOrder/actConfirmCulqiOrder) y crédito/Yape-Plin/recompensa-gratis
// (validados y cobrados en el mismo tiro dentro de actPlaceOrder) — ambos terminan
// haciendo exactamente lo mismo: debitar puntos/crédito del cliente si corresponde,
// insertar el pedido, y registrar la auditoría. Antes esta lógica estaba duplicada casi
// entera en dos lugares del archivo.
// Antes de esto, ningún correo confirmaba la recepción del pedido para NINGÚN método de
// pago — el único correo de pedido existente (send-order-email) solo se dispara cuando
// el admin avanza el estado, y nunca se llama con status:'RECIBIDO' (hallazgo de la
// auditoría de flujo de pedidos). Se manda aquí, en el único punto por el que pasan
// TODOS los caminos de creación de pedido, en vez de depender de que el cliente siga
// conectado tras pagar o de que un admin haga algo después.
async function sendConfirmationEmailSafely(p: FinalizeOrderParams): Promise<void> {
  if (!p.email) return;
  try {
    await sendOrderConfirmationEmail(p.email, p.name, p.ref, p.total);
  } catch {
    // un correo fallido no debe bloquear la creación del pedido
  }
}

// #55 — Qué escalón de referidos corresponde cobrar, si es que alguno.
//
// Cálculo PURO a propósito, separado de la escritura en la base (la RPC
// grant_referral_milestone): así `npm run test:api` puede ejecutar de verdad la decisión de
// cuántos puntos regalar, que es la parte que toca dinero. Es el mismo patrón que ya
// siguieron `cancellationDeltas` y `batchExpiryStatus`.
//
// Devuelve el escalón MÁS ALTO alcanzado y todavía no pagado, no "el siguiente". Si por lo
// que sea se saltó uno —un fallo de red en la conversión anterior, dos referidos que
// convierten casi a la vez— el referidor igual cobra el que le corresponde por su conteo
// real, en vez de quedarse trabado para siempre en el escalón que se perdió.
export function nextReferralMilestone(
  totalReferrals: number,
  alreadyGranted: number,
  milestones: { count: number; points: number; label: string }[] = REFERRAL_MILESTONES,
): { count: number; points: number; label: string } | null {
  const total = Number(totalReferrals);
  const done = Number(alreadyGranted);
  // Basura de la base (null, NaN, negativos) tiene que terminar en "no pagar nada", nunca
  // en un premio inventado.
  if (!Array.isArray(milestones) || !Number.isFinite(total) || total <= 0) return null;
  const yaPagado = Number.isFinite(done) ? done : 0;
  let mejor: { count: number; points: number; label: string } | null = null;
  for (const m of milestones) {
    if (!m || !Number.isFinite(m.count) || !Number.isFinite(m.points) || m.points <= 0) continue;
    if (m.count > total || m.count <= yaPagado) continue;
    if (!mejor || m.count > mejor.count) mejor = m;
  }
  return mejor;
}

// El bono al que invita cae recién cuando su referido hace el PRIMER PEDIDO PAGADO — pero
// hasta ahora nadie se lo decía: se enteraba solo si abría la app y miraba sus puntos. Ese
// es justo el momento de máxima motivación para volver a invitar a alguien, y se estaba
// desperdiciando.
//
// Desde #55 esta función hace las dos cosas de una sola vez: paga el escalón si toca, y
// manda UN push (no dos). Dos notificaciones seguidas por el mismo evento se leen como
// spam justo en el momento en que más importa que se lean.
//
// Nada de esto puede tumbar el pedido: el bono base ya quedó otorgado dentro de
// finalize_order_customer_update, que es la parte atómica. Si el escalón falla, la próxima
// conversión lo recupera sola (nextReferralMilestone toma el más alto pendiente), y el
// fallo queda en debug_logs para que lo vea error_spike().
export async function rewardReferrer(referrerPhone: string, referredName: string): Promise<void> {
  let hito: { count: number; points: number; label: string } | null = null;
  try {
    const rows = await sbGet(
      "customers",
      `phone=eq.${encodeURIComponent(referrerPhone)}&select=total_referrals,referral_milestone_granted`,
    );
    const r = rows[0];
    if (r) {
      const candidato = nextReferralMilestone(r.total_referrals || 0, r.referral_milestone_granted || 0);
      if (candidato) {
        // La RPC vuelve a comprobar el escalón contra la fila (`referral_milestone_granted
        // < p_tier` en el WHERE): si dos referidos convierten en el mismo segundo, solo una
        // de las dos llamadas paga. Un null acá significa "ya estaba pagado", no un error.
        const res = await rpc("grant_referral_milestone", {
          p_phone: referrerPhone,
          p_tier: candidato.count,
          p_points: candidato.points,
        });
        if (res) {
          hito = candidato;
          await sbInsert("transactions", {
            customer_phone: referrerPhone,
            type: "earn_confirmed",
            points: candidato.points,
            description: `Premio por ${candidato.count} amigos referidos`,
            confirmed: true,
          });
        }
      }
    }
  } catch (e) {
    await debugLog({ stage: "referral_milestone_failed", phone: referrerPhone, error: String(e) });
  }

  try {
    await sendPushToPhone(referrerPhone, hito
      ? {
        title: `🏆 ¡${hito.count} amigos referidos!`,
        body: `${referredName} hizo su primer pedido. Además de tu sándwich, te llevas ${hito.points} puntos extra: ${hito.label}.`,
        url: "./index.html",
        tag: "sndwch-referral-milestone-" + hito.count,
        vibrate: [120, 60, 120, 60, 240],
      }
      : {
        title: "🥪 ¡Te ganaste un sándwich!",
        body: `${referredName} hizo su primer pedido con tu código. Ya tienes ${REFERRER_REWARD_POINTS} puntos: canjéalos por un 15CM gratis.`,
        url: "./index.html",
        tag: "sndwch-referral-reward",
        vibrate: [120, 60, 120, 60, 240],
      });
  } catch {
    // sin conexión, sin suscripción push o token vencido — el bono ya está otorgado igual
  }
}

// Compra reportada a Meta desde el servidor (Conversions API). El píxel del navegador ya
// manda la suya, pero los bloqueadores se comen una parte grande justo del evento más
// importante; los dos llevan el mismo event_id (la referencia del pedido) y Meta deduplica.
// El valor excluye el delivery a propósito: es pass-through al motorizado, no ingreso del
// negocio, e incluirlo inflaría el ROAS de las campañas con plata que nunca fue tuya.
function reportPurchaseToMeta(p: FinalizeOrderParams): void {
  // Un pedido Yape/Plin nace en "pending" y solo se vuelve una venta real cuando el admin
  // confirma el pago — ese caso se reporta desde confirmManualPayment, no acá. Sin este
  // guard, Meta optimizaría hacia pedidos que todavía nadie pagó.
  if (p.paymentStatus !== "paid") return;
  // Sin await: es telemetría de marketing y el cliente no tiene por qué esperar a Meta
  // para ver su pedido confirmado. sendPurchaseEvent nunca lanza (traga sus propios
  // errores), así que esto no puede dejar una promesa rechazada suelta.
  sendPurchaseEvent({
    eventId: p.ref,
    value: p.total - (p.deliveryFee || 0),
    phone: p.contactPhone || p.phone,
    email: p.email,
    name: p.name,
    fbp: p.fbp,
    fbc: p.fbc,
    clientUserAgent: p.clientUserAgent,
    contents: p.items.map((it: any) => ({
      id: String(it.sigId || it.prot || it.sideId || it.type || "item"),
      quantity: Number(it.qty) || 1,
    })),
  });
}

async function finalizeAndInsertOrder(p: FinalizeOrderParams): Promise<{ order: any; customer: any }> {
  // Rango del cliente (ver computeRankName/env.ts) al momento de ESTE pedido — se guarda
  // en el pedido en vez de calcularse al imprimir el ticket porque para cocina lo
  // relevante es "quién es este cliente ahora", no una consulta aparte cada vez que se
  // reimprime. null para invitados (sin cuenta no hay rango que mostrar).
  let customerRank: string | null = null;
  async function insertOrder() {
    return sbInsert("orders", {
      ref: p.ref,
      customer_phone: p.phone,
      contact_phone: p.contactPhone,
      customer_name: p.name,
      customer_email: p.email || null,
      customer_address: p.address,
      lat: p.lat,
      lon: p.lon,
      group_code: p.groupCode || null,
      summary: p.summary || "",
      notes: p.notes,
      total: p.total,
      delivery_fee: p.deliveryFee,
      // Los km que se COBRARON, guardados con el pedido. Se podrían recalcular desde
      // lat/lon, pero guardarlos deja el número inmune a un cambio futuro del factor de
      // ruta — y todo el sentido de esto es poder comparar contra lo que cobró el
      // motorizado ese día, no contra lo que hoy diría la fórmula.
      delivery_km: p.deliveryKm ?? null,
      delivery_zone: p.deliveryZone,
      status: "RECIBIDO",
      payment_status: p.paymentStatus,
      payment_id: p.paymentId,
      payment_method: p.paymentMethod,
      mode: null,
      product_key: null,
      size: null,
      build: null,
      items: p.items,
      delivery_time: p.scheduledFor,
      redeemed_reward: p.reward ? p.reward.label : null,
      // Puntos exactos que costó la recompensa canjeada (si hubo una) — guardado aparte
      // de la etiqueta para que actCancelMyOrder pueda devolverlos con exactitud sin
      // depender de volver a buscar el precio en puntos actual de esa recompensa (que
      // puede repreciarse con el tiempo, como ya pasó esta sesión con R02/R03/R05).
      redeemed_reward_pts: p.reward ? p.reward.pts : null,
      customer_rank: customerRank,
    });
  }

  if (p.phone && p.paymentStatus === "paid") {
    const custRows = await sbGet("customers", `phone=eq.${encodeURIComponent(p.phone)}`);
    const c = custRows[0];
    if (!c) throw new ApiError("Cliente no encontrado.", 404);
    if (p.reward && (c.points || 0) < p.reward.pts) throw new ApiError("No tienes puntos suficientes para esta recompensa.", 402);
    if (p.useCredit && (c.credit_balance || 0) < p.total) throw new ApiError("No tienes crédito suficiente para cubrir este pedido.", 402);

    // El gate real vive en la RPC (referral_bonus_granted, con lock de fila) — este check
    // acá es solo para decidir si insertar las transacciones de auditoría "Bono por
    // referido" más abajo. Antes usaba total_orders===0 como proxy de "primer pedido",
    // pero total_orders puede volver a 0 tras una autocancelación (actCancelMyOrder resta
    // 1) sin que referred_by se limpie nunca, así que el bono se podía volver a otorgar
    // indefinidamente con "pedir con crédito → cancelar → repetir" (hallazgo de auditoría
    // de código, CRÍTICO). referral_bonus_granted es monotónico: se otorga una sola vez en
    // la vida del cliente sin importar cuántas veces total_orders suba o baje después.
    const isReferral = !!c.referred_by && !c.referral_bonus_granted;
    // Todos los clientes ganan los mismos puntos por sol gastado — antes VIP ganaba 1.25x,
    // pero eso quedó retirado (decisión de negocio: sin trato preferencial por tier).
    // Los puntos se ganan solo sobre la comida, nunca sobre el delivery — el delivery es
    // un pass-through al motorizado (el negocio no se queda con ese margen), así que
    // premiarlo con puntos 1:1 igual que la comida inflaría el programa de lealtad sin
    // que haya ingreso real detrás.
    const basePoints = pointsFor(p.total, p.deliveryFee);
    let pointsDelta = basePoints;
    if (p.reward) pointsDelta -= p.reward.pts;

    // Actualiza el saldo del cliente ANTES de insertar el pedido: si el crédito o los
    // puntos resultan insuficientes por una carrera con otra solicitud concurrente del
    // mismo cliente, finalize_order_customer_update (migración del mismo nombre) lanza
    // una excepción y el pedido NUNCA llega a crearse — en vez de quedar un pedido
    // marcado "pagado" sin el débito real detrás.
    const updated = await rpc("finalize_order_customer_update", {
      p_phone: p.phone,
      p_points_delta: pointsDelta,
      p_credit_delta: p.useCredit ? -p.total : 0,
      p_total_orders_delta: 1,
      p_last_address: p.address,
      p_total_redeemed_delta: p.reward ? 1 : 0,
      p_referrer_phone: isReferral ? c.referred_by : null,
      p_referral_bonus: isReferral ? REFERRAL_BONUS_POINTS : 0,
      p_referrer_bonus: isReferral ? REFERRER_REWARD_POINTS : 0,
    });
    const customer = safeCustomer(updated);
    customerRank = computeRankName(updated.total_orders || 0);
    // Aviso de "subiste de rango" — compara el rango ANTES de este pedido (con `c`, la fila
    // leída antes del incremento) contra el de después; si cruzó un umbral, se lo dice de
    // inmediato en vez de dejar que se entere la próxima vez que abra su perfil.
    const previousRank = computeRankName(c.total_orders || 0);
    if (previousRank !== customerRank) {
      // El rango exacto que desbloquea el menú secreto se deriva de SIG_GATES (hoy 5 pedidos,
      // antes 15) en vez de estar escrito a mano acá — así este aviso no se desincroniza
      // si el umbral de negocio vuelve a cambiar.
      const vaultRank = computeRankName(SIG_GATES.SIG05.minOrders);
      try {
        await sendPushToPhone(p.phone, {
          title: "🎖️ ¡Subiste de rango!",
          body: `Ahora eres ${customerRank} en SND//WCH.` + (customerRank === vaultRank ? " Ya puedes ver el menú secreto 👀" : ""),
          url: "./index.html",
          tag: "sndwch-rank-up-" + customerRank,
        });
      } catch {
        // un push fallido no debe bloquear la creación del pedido
      }
    }
    const orderRows = await insertOrder();

    // Registro de auditoría (tabla transactions) — se hace DESPUÉS de que el saldo y el
    // pedido ya quedaron correctos arriba; si algo aquí falla, ambos siguen siendo la
    // fuente de verdad y solo falta una línea de historial, no un descuadre de dinero.
    const auditInserts: Promise<unknown>[] = [
      sbInsert("transactions", {
        customer_phone: p.phone,
        type: "earn_confirmed",
        points: basePoints,
        description: p.useCredit ? "Pedido SND//WCH (pagado con crédito)" : "Pedido SND//WCH (pago con tarjeta)",
        order_ref: p.ref,
        confirmed: true,
      }),
    ];
    if (p.useCredit) {
      auditInserts.push(sbInsert("credit_ledger", {
        customer_phone: p.phone,
        delta: -p.total,
        reason: "Pedido pagado con crédito (" + p.ref + ")",
      }));
    }
    if (p.reward) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: p.phone,
        type: "redeem",
        points: -p.reward.pts,
        description: p.reward.label + " canjeado en pedido " + p.ref,
        order_ref: p.ref,
        confirmed: true,
      }));
    }
    if (isReferral) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: p.phone,
        type: "earn_confirmed",
        points: REFERRAL_BONUS_POINTS,
        description: "Bono por referido",
        confirmed: true,
      }));
      auditInserts.push(sbInsert("transactions", {
        customer_phone: c.referred_by,
        type: "earn_confirmed",
        points: REFERRER_REWARD_POINTS,
        description: "Sándwich gratis por invitar a " + p.name,
        confirmed: true,
      }));
    }
    await Promise.all(auditInserts);
    if (isReferral && c.referred_by) await rewardReferrer(c.referred_by, p.name);
    await alertLowMarginOrder(p);
    reportPurchaseToMeta(p);
    await sendConfirmationEmailSafely(p);
    return { order: orderRows[0], customer };
  }

  const orderRows = await insertOrder();
  reportPurchaseToMeta(p);
  await sendConfirmationEmailSafely(p);
  return { order: orderRows[0], customer: null };
}

// El cliente valida esto mismo primero (mejor experiencia, feedback inmediato), pero un
// pedido de invitado vía API directa se saltaría ese chequeo sin esto — el reparto es
// por motorizados que el dueño coordina a mano, así que una dirección en una zona que no
// cubre no debe llegar a cobrarse/reservarse nunca. Comparación por substring, sin
// acentos/mayúsculas, contra DELIVERY_EXCLUDED_ZONES (env.ts).
function assertAddressAllowed(address: string): void {
  const normalized = address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hit = DELIVERY_EXCLUDED_ZONES.find((zone) => normalized.includes(zone));
  if (hit) throw new ApiError("Por ahora tu zona aún no está disponible para delivery, pero esperamos poder llegar pronto.", 400);
}

// Valida un código promocional y calcula el descuento sobre el total DE COMIDA (nunca
// sobre el delivery, mismo criterio que las recompensas) — se llama tanto desde el
// preview del cliente (actValidatePromoCode) como desde actPrepareOrder/actPlaceOrder
// justo antes de fijar el total real a cobrar, así el descuento nunca se confía del
// cliente. `phone` es el teléfono de CONTACTO del checkout (funciona también para
// invitados sin cuenta) — es la misma identidad contra la que se bloquea la reutilización
// en promo_code_redemptions (redeem_promo_code, ver migración).
async function computePromoDiscount(
  codeRaw: string,
  phone: string,
  foodTotal: number,
): Promise<{ promoCodeId: string; code: string; discount: number }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) throw new ApiError("Ingresa un código promocional.", 400);
  const rows = await sbGet("promo_codes", `code=eq.${encodeURIComponent(code)}&select=*`);
  const promo = rows[0];
  if (!promo || !promo.active) throw new ApiError("Ese código promocional no existe o ya no está activo.", 404);
  const now = Date.now();
  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    throw new ApiError("Ese código promocional todavía no está activo.", 400);
  }
  if (promo.valid_until && new Date(promo.valid_until).getTime() < now) {
    throw new ApiError("Ese código promocional ya expiró.", 400);
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    throw new ApiError("Ese código promocional ya alcanzó su límite de usos.", 409);
  }
  if (foodTotal < Number(promo.min_order_total || 0)) {
    throw new ApiError(`Ese código requiere un pedido de al menos S/${Number(promo.min_order_total).toFixed(2)}.`, 400);
  }
  // Chequeo previo por cortesía (mejor mensaje de error) — es de solo lectura, así que un
  // caso límite (dos solicitudes casi simultáneas) puede pasar aquí igual; la verificación
  // que de verdad importa contra una carrera es el reclamo atómico de claimPromoDiscount,
  // no esta.
  const already = await sbGet(
    "promo_code_redemptions",
    `promo_code_id=eq.${encodeURIComponent(promo.id)}&phone=eq.${encodeURIComponent(phone)}&select=id`,
  );
  if (already.length) throw new ApiError("Ya usaste ese código promocional antes.", 409);

  let raw = promo.discount_type === "percent" ? foodTotal * (Number(promo.value) / 100) : Number(promo.value);
  if (promo.discount_type === "percent" && promo.max_discount !== null) raw = Math.min(raw, Number(promo.max_discount));
  const discount = Math.round(Math.min(raw, foodTotal) * 100) / 100;
  return { promoCodeId: promo.id, code, discount };
}

// A diferencia de computePromoDiscount (solo lectura, usada también por el preview de
// actValidatePromoCode — NUNCA debe tener efectos secundarios), esta SÍ reclama el uso de
// verdad de forma atómica (RPC redeem_promo_code, con lock de fila + índice único
// (promo_code_id, phone)) — se usa solo en los caminos reales de creación de pedido, ANTES
// de cobrar/finalizar. Hallazgo de la re-auditoría de 10 agentes (MEDIO/ALTO): antes el
// reclamo real ocurría recién DESPUÉS de crear el pedido, de forma best-effort — dos
// solicitudes casi simultáneas con el mismo código podían pasar ambas el precheck de
// computePromoDiscount y aplicar el descuento dos veces antes de que cualquiera escribiera
// en promo_code_redemptions, rompiendo tanto el límite "una vez por cliente" como
// max_uses global. Si el pedido termina fallando después de este reclamo, quien llame debe
// liberarlo con releasePromoBestEffort (mismo patrón que restockBestEffort con inventario).
async function claimPromoDiscount(
  codeRaw: string,
  phone: string,
  foodTotal: number,
  orderRef: string,
): Promise<{ promoCodeId: string; code: string; discount: number }> {
  const result = await computePromoDiscount(codeRaw, phone, foodTotal);
  try {
    await rpc("redeem_promo_code", { p_promo_id: result.promoCodeId, p_phone: phone, p_order_ref: orderRef, p_discount: result.discount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("promo_code_exhausted")) throw new ApiError("Ese código promocional ya alcanzó su límite de usos.", 409);
    if (msg.includes("23505") || msg.toLowerCase().includes("duplicate")) throw new ApiError("Ya usaste ese código promocional antes.", 409);
    throw e;
  }
  return result;
}

// Revierte un reclamo de claimPromoDiscount si el pedido termina fallando después (reserva
// que expira sin pagarse, pago que falla, un insert que revienta) — sin propagar el error
// si falla (mismo criterio que restockBestEffort): no vale la pena tumbar la respuesta real
// por esto, en el peor caso el código queda "gastado" de más y se corrige a mano.
async function releasePromoBestEffort(promoCodeId: string | null, phone: string, orderRef: string): Promise<void> {
  if (!promoCodeId) return;
  try {
    await rpc("release_promo_redemption", { p_promo_id: promoCodeId, p_phone: phone, p_order_ref: orderRef });
  } catch (e) {
    console.error("releasePromoBestEffort failed for", orderRef, e);
  }
}

// Preview sin efectos secundarios (no reserva ni redime nada) — el cliente lo llama al
// escribir un código en el checkout para mostrar el descuento antes de pagar, con
// exactamente el mismo cálculo que usará el pedido real (misma deriveCart).
// A diferencia de submit-complaint/upload-receipt/add-group-item (todas públicas y con
// check_rate_limit), esta no tenía ningún límite — sin él, alguien podía automatizar la
// búsqueda de códigos activos por fuerza bruta (el formato permite códigos de solo 3
// caracteres) y usarlos antes de que el negocio los distribuyera a la audiencia prevista
// (hallazgo de auditoría de seguridad, BAJO).
const PROMO_VALIDATE_RATE_LIMIT = 20;
const PROMO_VALIDATE_RATE_WINDOW_MINUTES = 10;
export async function actValidatePromoCode(b: any) {
  const code = String(b.code || "").trim();
  const phone = String(b.phone || "").trim();
  if (!code || !phone) throw new ApiError("Faltan datos.", 400);
  const withinLimit = await rpc("check_rate_limit", {
    p_key: `validate-promo:${phone}`,
    p_limit: PROMO_VALIDATE_RATE_LIMIT,
    p_window_minutes: PROMO_VALIDATE_RATE_WINDOW_MINUTES,
  });
  if (!withinLimit) throw new ApiError("Demasiados intentos. Espera un momento antes de probar otro código.", 429);
  const rewardId = b.rewardId ? String(b.rewardId) : null;
  // Mismo criterio que actPrepareOrder/actPlaceOrder: un código promocional y una
  // recompensa de puntos no se combinan — rechazarlo ya en el preview evita que el
  // cliente vea "válido" acá y recién se entere del rechazo real al pagar.
  if (rewardId) throw new ApiError("Los códigos promocionales no se pueden combinar con una recompensa de puntos.", 400);
  await loadCatalogPrices();
  const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
  // Mismo cálculo que el cobro real, incluido el sándwich gratis del organizador — si el
  // preview lo ignorara, alguien con un pedido grupal vería un descuento distinto acá que
  // el que termina pagando.
  const { expectedTotal: foodTotal } = deriveCart(b.items, rewardId, scheduledFor, await organizerWaiverFor(b));
  const result = await computePromoDiscount(code, phone, foodTotal);
  return { valid: true, code: result.code, discount: result.discount };
}

// El cliente elige su zona en el checkout (ver DELIVERY_PRICE_ZONES en src/app.ts) y
// manda el id — nunca el monto, que siempre se recalcula acá (mismo criterio que el resto
// del catalogo: nunca confiar en un precio que reporte el cliente).
function deliveryFeeForZone(zone: string): number {
  const fee = DELIVERY_ZONE_FEES[zone];
  if (fee === undefined) throw new ApiError("Elige una zona de entrega valida.", 400);
  return fee;
}
// Solo para el flujo de tarjeta (actPrepareOrder, vía Culqi) — "engorda" el fee real para
// que, incluso después de que Culqi descuente su comisión, lo que le quede al negocio siga
// alcanzando para pagarle al motorizado el monto real (DELIVERY_ZONE_FEES). Yape/Plin/
// crédito (actPlaceOrder) no pagan esta comisión, así que siguen cobrando el fee real sin
// ajustar — ver CULQI_FEE_RATE en env.ts para el razonamiento completo.
function deliveryFeeForZoneCard(zone: string): number {
  const realFee = deliveryFeeForZone(zone);
  return Math.round((realFee / (1 - CULQI_FEE_RATE)) * 100) / 100;
}

// ── DELIVERY POR DISTANCIA REAL (2026-09-02) ──────────────────────────────────────────
//
// Distancia en línea recta entre dos puntos. Es la misma fórmula que el cliente usa para el
// banner "estás cerca" — pero acá es la que COBRA, así que el servidor la recalcula siempre
// desde las coordenadas y nunca acepta ni el km ni el monto que reporte el cliente. Mismo
// criterio que el resto del catálogo.
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Kilómetros COBRABLES: la línea recta corregida por el factor de ruta. Devuelve null si las
// coordenadas no son utilizables — y `null` significa "no se puede medir", nunca 0: un 0
// silencioso cobraría el mínimo a alguien que vive a 10 km.
export function billableKm(lat: unknown, lon: unknown): number | null {
  const la = Number(lat), lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (la === 0 && lo === 0) return null;          // el "null island" clásico de un GPS roto
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  const recta = haversineKm(la, lo, STORE_LAT, STORE_LON);
  if (!Number.isFinite(recta)) return null;
  return Math.round(recta * DELIVERY_ROAD_FACTOR * 100) / 100;
}

// Tarifa a partir de los kilómetros. Se redondea hacia ARRIBA al medio sol: el motorizado
// cobra en efectivo y un monto como S/7.43 no existe en la práctica; y redondear hacia arriba
// y no al más cercano deja el error del lado del que paga al motorizado, nunca del lado de
// quedarse corto — el delivery es pass-through y no tiene margen del que salga la diferencia.
export function deliveryFeeForKm(km: number): number {
  const bruto = Math.max(DELIVERY_MIN_FEE, km * DELIVERY_KM_RATE);
  return Math.ceil(bruto * 2) / 2;
}

// El monto que se cobra, resuelto desde las coordenadas del pedido.
//
// SI NO HAY COORDENADAS, CAE A LA ZONA — y eso es a propósito, no una omisión. El cliente ya
// exige el pin al guardar una dirección nueva, así que un pedido sin coordenadas solo puede
// venir de un shell viejo servido por un service worker desactualizado (le pasó a este
// negocio el 2026-08-21, con el shell viejo pegado a la vez en tres dispositivos). Ese
// cliente tiene que poder pagar igual: romperle el checkout sería un fallo total por una
// mejora de tarifa.
export function resolveDeliveryFee(lat: unknown, lon: unknown, zone: string): { fee: number; km: number | null } {
  const km = billableKm(lat, lon);
  if (km === null) return { fee: deliveryFeeForZone(zone), km: null };
  if (km > DELIVERY_MAX_KM) {
    throw new ApiError(
      `Tu ubicación está a ${km.toFixed(1)} km del local y por ahora llegamos hasta ${DELIVERY_MAX_KM} km. Revisa el punto en el mapa.`,
      400,
    );
  }
  return { fee: deliveryFeeForKm(km), km };
}

// Versión para el flujo de tarjeta: el fee se "engorda" por la comisión de Culqi, igual que
// hacía deliveryFeeForZoneCard, para que después del descuento quede el monto real para el
// motorizado. El km NO se engorda: es la distancia, no dinero.
export function resolveDeliveryFeeCard(lat: unknown, lon: unknown, zone: string): { fee: number; km: number | null } {
  const { fee, km } = resolveDeliveryFee(lat, lon, zone);
  return { fee: Math.round((fee / (1 - CULQI_FEE_RATE)) * 100) / 100, km };
}

// Antes el cobro real con Culqi pasaba en el cliente ANTES de que place-order validara
// horario/inventario/carrito — cualquier rechazo posterior (el bug de zona horaria que
// se arregló en vivo, inventario agotado a media compra, un fallo transitorio al
// re-verificar el cargo) dejaba un cargo real sin ningún pedido creado. Ahora ese orden
// se invierte: actPrepareOrder valida y RESERVA todo antes de que el cliente abra el
// widget de Culqi; el cobro real solo ocurre si esto tuvo éxito. actPlaceOrder, cuando
// llega con un chargeId, ya no repite esas validaciones — solo confirma el cargo contra
// la reserva y crea el pedido (ver actConfirmCulqiOrder). Crédito/Yape-Plin/recompensa-
// gratis no tienen este problema (no hay ningún cobro externo antes de crear el pedido),
// así que siguen su camino directo de siempre, sin pasar por una reserva previa.
export async function actPrepareOrder(b: any) {
  const ref = String(b.ref || "").trim();
  const name = String(b.name || "").trim();
  const contactPhone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const address = String(b.address || "").trim();
  const clientTotal = Number(b.total || 0);
  const rewardId = b.rewardId ? String(b.rewardId) : null;
  const deliveryZone = String(b.deliveryZone || "");
  const { fee: deliveryFee, km: deliveryKm } = resolveDeliveryFeeCard(b.lat, b.lon, deliveryZone);
  if (!ref || !name || !contactPhone || !address || clientTotal <= 0) throw new ApiError("Faltan datos del pedido.");
  assertAddressAllowed(address);

  // Recarga el horario real configurado por el admin (igual que loadCatalogPrices()
  // abajo para precios) — sin esto, una instancia fría de la función validaría contra
  // STORE_HOURS de respaldo hardcodeado en vez del horario que el dueño configuró, y
  // podría aceptar un pedido con el negocio cerrado o rechazar uno válido en horario
  // extendido (hallazgo de auditoría de código).
  // El negocio todavía no abre → ningún pedido se acepta, en ninguno de los dos caminos
  // de pago (ver assertBusinessLaunched). Va ANTES de cualquier reserva o cobro.
  await assertBusinessLaunched();
  await loadStoreHours();
  const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
  if (scheduledFor) {
    const schedDate = new Date(scheduledFor);
    const t = schedDate.getTime();
    if (!t || t < Date.now() - 60000) throw new ApiError("La hora programada no es válida.", 400);
    // Techo superior: sin esto, por API directa se podía programar un pedido para dentro de
    // un año. Ese pedido reserva inventario real (reserve_inventory) y se queda vivo
    // indefinidamente, bloqueando stock que nadie va a usar. El cliente ya acota a HOY o
    // MAÑANA en la UI; esto lo hace valer también fuera de ella.
    if (t > Date.now() + MAX_SCHEDULE_AHEAD_HOURS * 3600000) {
      throw new ApiError("Solo puedes programar pedidos con hasta 48 horas de anticipación.", 400);
    }
    if (!isWithinStoreHours(schedDate)) throw new ApiError("Esa hora está fuera de nuestro horario de atención.", 400);
  } else if (!isWithinStoreHours(new Date())) {
    throw new ApiError("Estamos cerrados ahora mismo. Programa tu pedido para más tarde.", 400);
  }
  // Techo de capacidad de la franja (ver assertHourCapacity) — va DESPUÉS de validar el
  // horario y ANTES de reservar inventario o cobrar nada.
  await assertHourCapacity(scheduledFor ? new Date(scheduledFor) : new Date());

  await loadCatalogPrices();
  const { ingredients, expectedTotal: foodExpectedTotal, sanitizedItems } = deriveCart(b.items, rewardId, scheduledFor, await organizerWaiverFor(b));

  // Sesión (si hay token) se resuelve ANTES del código promocional — el teléfono de la
  // CUENTA autenticada (no contactPhone, campo de texto libre del checkout que un
  // cliente logueado podía cambiar en cada intento) es la identidad real usada para el
  // límite "una vez por cliente" de un código promocional (hallazgo de auditoría, ALTO —
  // antes bastaba con reportar un contactPhone distinto para reusar el mismo código).
  let phone: string | null = null;
  let totalOrders = 0;
  if (b.token) {
    const active = await verifyActiveSession(b.token);
    if (active) { phone = active.payload.phone; totalOrders = active.row.total_orders || 0; }
    if (rewardId) {
      if (!active) throw new ApiError("Debes iniciar sesión para usar una recompensa.", 401);
      const reward = REWARDS[rewardId];
      if (!reward) throw new ApiError("Recompensa inválida.");
      if ((active.row.points || 0) < reward.pts) throw new ApiError("No tienes puntos suficientes para esta recompensa.", 402);
    }
  } else if (rewardId) {
    throw new ApiError("Debes iniciar sesión para usar una recompensa.", 401);
  }
  assertCartGatesAllowed(b.items, totalOrders);
  const promoPhone = phone || contactPhone;

  // Mismo criterio que combo/hora-valle (nunca se suman, solo se aplica el mayor de los
  // dos) — un código promocional y una recompensa de puntos tampoco deben combinarse en
  // el mismo pedido (hallazgo de auditoría, ALTO: no había ningún guard equivalente).
  if (rewardId && b.promoCode) {
    throw new ApiError("Los códigos promocionales no se pueden combinar con una recompensa de puntos.", 400);
  }

  // Código promocional (opcional) — se valida/calcula ANTES de fijar expectedTotal, nunca
  // se confía en un descuento que reporte el cliente. Usa promoPhone (cuenta si hay
  // sesión, si no contactPhone, igual que el checkout de invitados).
  const promoCodeRaw = b.promoCode ? String(b.promoCode).trim() : "";
  let promoCodeId: string | null = null;
  let promoDiscount = 0;
  if (promoCodeRaw) {
    const promo = await claimPromoDiscount(promoCodeRaw, promoPhone, foodExpectedTotal, ref);
    promoCodeId = promo.promoCodeId;
    promoDiscount = promo.discount;
  }

  // A partir de aquí, cualquier salida con error DEBE liberar el código promocional recién
  // reclamado (si se usó uno) — mismo criterio que orderInserted/restockBestEffort con
  // inventario más abajo, pero para claimPromoDiscount. Un solo try/catch envolvente en vez
  // de repetir la liberación en cada punto de salida (hallazgo de la re-auditoría de 10
  // agentes, MEDIO/ALTO: antes el reclamo real de un código promocional ocurría recién
  // DESPUÉS de crear el pedido, de forma best-effort — ver claimPromoDiscount arriba).
  try {
    const expectedTotal = foodExpectedTotal - promoDiscount + deliveryFee;
    if (Math.round(expectedTotal * 100) !== Math.round(clientTotal * 100)) {
      throw new ApiError("El total no coincide con los productos del pedido.", 400);
    }

    // Bloquea una segunda reserva concurrente del mismo número de contacto (dos
    // pestañas/dispositivos pagando el mismo carrito a la vez, o un reintento tras un fallo
    // de red ambiguo) — sin esto, cada intento podría terminar generando su propio cargo
    // real. Antes esto solo miraba customer_phone (null para invitados) — un invitado que
    // reintentaba tras un fallo de red generaba una referencia nueva cada vez (ver oref() en
    // el cliente) y se saltaba el bloqueo por completo (hallazgo de la re-auditoría de pagos).
    // contact_phone es un campo obligatorio del checkout para TODOS, con o sin cuenta, así
    // que sirve como identidad estable en ambos casos.
    {
      const nowIso = new Date().toISOString();
      const existing = await sbGet(
        "pending_charges",
        `contact_phone=eq.${encodeURIComponent(contactPhone)}&status=eq.pending&expires_at=gt.${encodeURIComponent(nowIso)}&select=id`,
      );
      if (existing.length) {
        throw new ApiError("Ya tienes un pedido en proceso de pago con este número. Espera un momento o revisa la otra pestaña antes de intentar de nuevo.", 409);
      }
    }

    // Misma reserva atómica de siempre (ver reserve_inventory), solo que ahora ocurre
    // ANTES del cobro en vez de después. .sort() antes del RPC: reserve_inventory bloquea
    // filas en el orden de `codes` (SELECT ... FOR UPDATE) — sin un orden determinístico,
    // dos pedidos concurrentes que comparten 2+ ingredientes en orden distinto podrían
    // deadlockear entre sí (Postgres lo detecta y aborta una transacción, no corrompe
    // datos, pero el cliente afectado ve un error evitable). Hallazgo de auditoría 2026-08-07.
    const codes = ingredients.length ? Array.from(new Set(ingredients)).sort() : [];
    const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
    if (codes.length) {
      try {
        await rpc("reserve_inventory", { p_codes: codes, p_qtys: qtys });
      } catch (e) {
        throw new ApiError("Uno o más productos de tu pedido se agotaron. Actualiza tu carrito e intenta de nuevo.", 409);
      }
      try {
        await alertLowStockCrossing(codes, qtys);
      } catch {
        // una alerta fallida no debe afectar la reserva
      }
    }

    const expiresAt = new Date(Date.now() + PENDING_CHARGE_TTL_MINUTES * 60000).toISOString();
    try {
      await sbInsert("pending_charges", {
        ref,
        customer_phone: phone,
        contact_phone: contactPhone,
        customer_name: name,
        customer_email: email || null,
        customer_address: address,
        notes: b.notes || null,
        summary: b.summary || "",
        expected_total: expectedTotal,
        delivery_fee: deliveryFee,
        delivery_km: deliveryKm,
        delivery_zone: deliveryZone,
        reserved_codes: codes,
        reserved_qtys: qtys,
        sanitized_items: sanitizedItems,
        reward_id: rewardId,
        scheduled_for: scheduledFor,
        expires_at: expiresAt,
        promo_code_id: promoCodeId,
        promo_discount: promoDiscount,
        ...readCoords(b),
        ...readMetaAttribution(b),
      });
    } catch (e) {
      await restockBestEffort(codes, qtys, "prepare-order");
      if (e instanceof Error && e.message.includes("23505")) {
        throw new ApiError("Ya hay un pago en proceso para este pedido. Espera un momento e intenta de nuevo.", 409);
      }
      throw e;
    }

    return { success: true, ref, expiresAt };
  } catch (e) {
    if (promoCodeId) await releasePromoBestEffort(promoCodeId, promoPhone, ref);
    throw e;
  }
}

// Confirma un cobro de Culqi ya realizado contra la reserva creada por actPrepareOrder —
// ya no repite horario/inventario/total (eso ya pasó ANTES de cobrar), solo verifica el
// cargo real contra lo reservado y crea el pedido.
async function actConfirmCulqiOrder(chargeId: string, ref: string) {
  if (!chargeId || !ref) throw new ApiError("Faltan datos del pedido.");
  const rows = await sbGet("pending_charges", `ref=eq.${encodeURIComponent(ref)}&select=*`);
  const pc = rows[0];
  if (!pc) throw new ApiError("No encontramos tu reserva. Vuelve a intentar tu pedido.", 410);
  if (pc.status !== "pending") throw new ApiError("Este pedido ya fue procesado.", 409);
  if (new Date(pc.expires_at).getTime() < Date.now()) {
    throw new ApiError("Tu reserva expiró. Vuelve a intentar tu pedido — el inventario ya se liberó.", 410);
  }

  const total = Number(pc.expected_total);
  const amountCents = Math.round(total * 100);
  const paymentOk = await verifyCulqiCharge(chargeId, amountCents, ref, "order_ref");
  if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);

  // Reclamo atómico pending -> consumed: si el cliente reintenta (ej. su navegador
  // reintentó tras un timeout de red), la segunda llamada encuentra 0 filas y responde
  // 409 en vez de crear un segundo pedido para el mismo cargo.
  const claim = await sbUpdate("pending_charges", `id=eq.${pc.id}&status=eq.pending`, { status: "consumed" });
  if (!claim.length) throw new ApiError("Este pedido ya fue procesado.", 409);

  const codes: string[] = pc.reserved_codes || [];
  const qtys: number[] = pc.reserved_qtys || [];
  let orderInserted = false;
  try {
    const reward = pc.reward_id ? REWARDS[pc.reward_id] || null : null;
    if (pc.reward_id && !reward) throw new ApiError("Recompensa inválida.");

    const { order, customer } = await finalizeAndInsertOrder({
      ref: pc.ref,
      phone: pc.customer_phone,
      contactPhone: pc.contact_phone,
      name: pc.customer_name,
      email: pc.customer_email || "",
      address: pc.customer_address,
      summary: pc.summary || "",
      notes: pc.notes,
      total,
      deliveryFee: Number(pc.delivery_fee || 0),
      deliveryKm: pc.delivery_km === null || pc.delivery_km === undefined ? null : Number(pc.delivery_km),
      deliveryZone: pc.delivery_zone || null,
      paymentStatus: "paid",
      paymentId: chargeId,
      paymentMethod: "culqi",
      items: pc.sanitized_items,
      scheduledFor: pc.scheduled_for,
      reward,
      useCredit: false,
      lat: pc.lat ?? null,
      lon: pc.lon ?? null,
    });
    orderInserted = true;
    // El código promocional (si se usó uno) ya quedó reclamado de forma atómica desde
    // actPrepareOrder (ver claimPromoDiscount) — no hay nada que redimir aquí. Si el pedido
    // termina fallando después de este punto, orderInserted ya es true y el código
    // promocional NO se libera (mismo criterio que el inventario: el catch de abajo solo
    // restockea/libera cuando `!orderInserted`).

    try {
      await sendPushToAdmins({
        // #30 — La restricción va en el TÍTULO, no escondida en el cuerpo: el push se lee
        // de reojo mientras se cocina, y ahí solo se ve la primera línea. Un aviso que hay
        // que abrir para enterarse no sirve para algo que puede enfermar a alguien.
        title: (noteNeedsAttention(pc.notes) ? "⚠️ ALERGIA — pedido " : "Nuevo pedido ") + pc.ref + " 🥪",
        body: (pc.customer_name || "Cliente") + " — S/" + total.toFixed(2)
          + (noteNeedsAttention(pc.notes) ? "\nNOTA: " + String(pc.notes || "").slice(0, 180) : ""),
        url: "./index.html",
        tag: "sndwch-new-order-" + pc.ref,
      });
    } catch {
      // un push fallido no debe bloquear la creación del pedido
    }

    return { success: true, order, customer };
  } catch (e) {
    if (!orderInserted) {
      await restockBestEffort(codes, qtys, "confirm");
      // Mismo identidad que se usó para reclamar en actPrepareOrder: cuenta si había
      // sesión (customer_phone), si no contactPhone — ver comentario en actPrepareOrder.
      await releasePromoBestEffort(pc.promo_code_id, pc.customer_phone || pc.contact_phone, pc.ref);
    }
    // La reserva ya quedó 'consumed' — si el pedido no llegó a crearse, la marcamos
    // 'cancelled' para que el registro de conciliación refleje que el cobro real no
    // terminó en un pedido (en vez de quedar engañosamente como 'consumed').
    try {
      await sbUpdate("pending_charges", `id=eq.${pc.id}`, { status: "cancelled" });
    } catch {
      // no debe tumbar la respuesta real
    }
    throw e;
  }
}

export async function actPlaceOrder(b: any) {
  const chargeId = b.chargeId ? String(b.chargeId).trim() : "";
  if (chargeId) return actConfirmCulqiOrder(chargeId, String(b.ref || "").trim());

  const ref = String(b.ref || "").trim();
  const name = String(b.name || "").trim();
  // Antes no se pedía ningún teléfono al invitado — la única forma de contactarlo era el
  // mensaje de WhatsApp que él mismo debía enviar tras pagar (ver finalizeOrderSuccess en
  // el cliente), y si ese paso fallaba un pedido ya cobrado quedaba sin ningún dato de
  // contacto. contact_phone es del PEDIDO, distinto de customer_phone (el de la cuenta,
  // null para invitados).
  const contactPhone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const address = String(b.address || "").trim();
  const clientTotal = Number(b.total || 0);
  const useCredit = !!b.useCredit;
  if (b.cod) throw new ApiError("Pago contra entrega no está disponible por el momento.", 400);
  // Yape/Plin: el cliente transfiere por su cuenta desde su propia app — el servidor no
  // procesa el cobro. El pedido queda payment_status:'pending' hasta que un operador
  // confirme manualmente que el dinero llegó (ver actAdminConfirmPayment); solo entonces
  // se otorgan puntos, y el pedido no puede avanzar de RECIBIDO antes de esa confirmación
  // (ver el guard en actAdminUpdateStatus).
  const manualMethod = b.paymentMethod === "yape" || b.paymentMethod === "plin" ? String(b.paymentMethod) : null;
  const rewardId = b.rewardId ? String(b.rewardId) : null;
  if (!ref || !name || !contactPhone || !address || clientTotal < 0) throw new ApiError("Faltan datos del pedido.");
  assertAddressAllowed(address);
  if (manualMethod && rewardId) throw new ApiError("Las recompensas no se pueden usar con Yape/Plin hasta confirmar el pago.", 400);
  // Mismo criterio que las recompensas justo arriba: Yape/Plin no confirma el pago real
  // hasta que un admin lo revisa a mano — redimir el código ahora (antes de saber si el
  // dinero de verdad llegó) dejaría "quemado" un uso de un pedido que podría cancelarse
  // por falta de pago.
  if (manualMethod && b.promoCode) throw new ApiError("Los códigos promocionales no se pueden usar con Yape/Plin hasta confirmar el pago.", 400);
  // Mismo criterio que combo/hora-valle (nunca se suman) — un código promocional y una
  // recompensa de puntos tampoco deben combinarse en el mismo pedido (hallazgo de
  // auditoría, ALTO: no había ningún guard equivalente).
  if (rewardId && b.promoCode) throw new ApiError("Los códigos promocionales no se pueden combinar con una recompensa de puntos.", 400);
  // Yape/Plin no verifica el pago server-side al colocar el pedido (queda 'pending' hasta
  // que un operador lo confirma a mano) — y reserve_inventory más abajo descuenta stock
  // REAL de inmediato, con o sin cuenta. Sin límite, cualquiera (invitado incluido) podía
  // spamear pedidos "pago pendiente" y agotar inventario real sin pagar nunca (hallazgo de
  // la re-auditoría de 10 agentes). Va ANTES de tocar inventario a propósito.
  if (manualMethod) {
    const withinLimit = await rpc("check_rate_limit", {
      p_key: `guest-manual-order:${contactPhone}`,
      p_limit: MANUAL_ORDER_RATE_LIMIT,
      p_window_minutes: MANUAL_ORDER_RATE_WINDOW_MINUTES,
    });
    if (!withinLimit) throw new ApiError("Ya tienes varios pedidos con pago pendiente de confirmar. Espera a que se confirmen antes de hacer otro.", 429);
  }

  // Recarga el horario real configurado por el admin — sin esto, una instancia fría de
  // la función validaría contra STORE_HOURS de respaldo hardcodeado (hallazgo de
  // auditoría de código, mismo motivo que en actPrepareOrder arriba).
  // El negocio todavía no abre → ningún pedido se acepta, en ninguno de los dos caminos
  // de pago (ver assertBusinessLaunched). Va ANTES de cualquier reserva o cobro.
  await assertBusinessLaunched();
  await loadStoreHours();
  const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
  if (scheduledFor) {
    const schedDate = new Date(scheduledFor);
    const t = schedDate.getTime();
    if (!t || t < Date.now() - 60000) throw new ApiError("La hora programada no es válida.", 400);
    // Techo superior: sin esto, por API directa se podía programar un pedido para dentro de
    // un año. Ese pedido reserva inventario real (reserve_inventory) y se queda vivo
    // indefinidamente, bloqueando stock que nadie va a usar. El cliente ya acota a HOY o
    // MAÑANA en la UI; esto lo hace valer también fuera de ella.
    if (t > Date.now() + MAX_SCHEDULE_AHEAD_HOURS * 3600000) {
      throw new ApiError("Solo puedes programar pedidos con hasta 48 horas de anticipación.", 400);
    }
    if (!isWithinStoreHours(schedDate)) throw new ApiError("Esa hora está fuera de nuestro horario de atención.", 400);
  } else if (!isWithinStoreHours(new Date())) {
    // Antes solo se validaba el horario para pedidos programados — uno "AHORA" con la
    // tienda cerrada se podía pagar igual (el cliente solo veía el badge de horario en el
    // home, nunca un bloqueo real), y la cocina nunca lo iba a preparar.
    throw new ApiError("Estamos cerrados ahora mismo. Programa tu pedido para más tarde.", 400);
  }
  // Mismo techo de capacidad por franja que actPrepareOrder (ver assertHourCapacity).
  await assertHourCapacity(scheduledFor ? new Date(scheduledFor) : new Date());

  const deliveryZone = String(b.deliveryZone || "");
  const { fee: deliveryFee, km: deliveryKm } = resolveDeliveryFee(b.lat, b.lon, deliveryZone);

  // Precios vigentes (pueden haber cambiado desde el panel admin sin redeploy) —
  // ver loadCatalogPrices/catalog_prices.
  await loadCatalogPrices();
  const { ingredients, expectedTotal: foodExpectedTotal, sanitizedItems } = deriveCart(b.items, rewardId, scheduledFor, await organizerWaiverFor(b));

  // Sesión (si hay token) se resuelve ANTES del código promocional — mismo criterio y
  // mismo motivo que en actPrepareOrder (hallazgo de auditoría, ALTO): la identidad real
  // para el límite "una vez por cliente" es el teléfono de la CUENTA, no contactPhone.
  let phone: string | null = null;
  let custRow: any = null;
  if (b.token) {
    const active = await verifyActiveSession(b.token);
    if (active) { phone = active.payload.phone; custRow = active.row; }
  }
  const promoPhone = phone || contactPhone;

  // Nota: manualMethod+promoCode ya se rechazó arriba (línea ~687), así que un código
  // promocional real solo llega aquí por el camino de pago inmediato (crédito/recompensa),
  // nunca por Yape/Plin pendiente.
  const promoCodeRaw = b.promoCode ? String(b.promoCode).trim() : "";
  let promoCodeId: string | null = null;
  let promoDiscount = 0;
  if (promoCodeRaw) {
    const promo = await claimPromoDiscount(promoCodeRaw, promoPhone, foodExpectedTotal, ref);
    promoCodeId = promo.promoCodeId;
    promoDiscount = promo.discount;
  }

  // A partir de aquí, cualquier salida con error DEBE liberar el código promocional recién
  // reclamado (si se usó uno) — mismo criterio que actPrepareOrder (ver claimPromoDiscount).
  try {
    const expectedTotal = foodExpectedTotal - promoDiscount + deliveryFee;
    if (Math.round(expectedTotal * 100) !== Math.round(clientTotal * 100)) {
      throw new ApiError("El total no coincide con los productos del pedido.", 400);
    }

    // Reserva de stock ANTES de registrar nada: reserve_inventory revisa Y descuenta
    // en una sola transacción atómica (con bloqueo de fila), así que dos pedidos concurrentes
    // por el último ingrediente disponible no pueden ambos "pasar" — el que llega segundo
    // rechaza limpio en vez de sobrevender. .sort() por el mismo motivo que en
    // actPrepareOrder — orden determinístico de bloqueo evita deadlocks entre pedidos
    // concurrentes que comparten ingredientes en distinto orden.
    const codes = ingredients.length ? Array.from(new Set(ingredients)).sort() : [];
    const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
    if (codes.length) {
      try {
        await rpc("reserve_inventory", { p_codes: codes, p_qtys: qtys });
      } catch (e) {
        throw new ApiError("Uno o más productos de tu pedido se agotaron. Actualiza tu carrito e intenta de nuevo.", 409);
      }
      try {
        await alertLowStockCrossing(codes, qtys);
      } catch {
        // una alerta fallida no debe afectar el pedido — el stock ya se descontó de verdad
      }
    }

    // A partir de aquí el inventario ya quedó reservado/descontado de verdad — cualquier
    // salida de este punto en adelante (recompensa/crédito insuficiente, un fallo de red)
    // DEBE devolver el stock antes de propagar el error. `orderInserted` marca el punto de
    // no-retorno: una vez que el pedido ya quedó creado, un fallo posterior (ej. el insert
    // de auditoría) NO debe restituir stock que de verdad se usó para armar el pedido.
    let orderInserted = false;
    try {
      // A partir de aquí, `total` es SIEMPRE el valor recalculado por el servidor — nunca el
      // que mandó el cliente. phone/custRow ya se resolvieron arriba, antes del código
      // promocional.
      const total = expectedTotal;

      assertCartGatesAllowed(b.items, custRow?.total_orders || 0);

      let reward: { pts: number; label: string } | null = null;
      if (rewardId) {
        if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para usar una recompensa.", 401);
        reward = REWARDS[rewardId] || null;
        if (!reward) throw new ApiError("Recompensa inválida.");
        if ((custRow.points || 0) < reward.pts) throw new ApiError("No tienes puntos suficientes para esta recompensa.", 402);
      }

      let paymentMethod = "reward";
      let paymentStatus = "paid";
      if (total > 0) {
        if (useCredit) {
          if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para pagar con tu crédito.", 401);
          if ((custRow.credit_balance || 0) < total) throw new ApiError("No tienes crédito suficiente para cubrir este pedido.", 402);
          paymentMethod = "credit";
        } else if (manualMethod) {
          paymentMethod = manualMethod;
          paymentStatus = "pending";
        } else {
          throw new ApiError("Faltan datos del pedido.");
        }
      }

      const { order, customer } = await finalizeAndInsertOrder({
        ref, phone, contactPhone, name, email, address,
        summary: b.summary || "", notes: b.notes || null, total,
        deliveryFee, deliveryKm, deliveryZone,
        paymentStatus, paymentId: null, paymentMethod,
        items: sanitizedItems, scheduledFor, reward, useCredit,
        ...readCoords(b),
        ...readMetaAttribution(b),
      });
      orderInserted = true;
      // El código promocional (si se usó uno) ya quedó reclamado de forma atómica arriba
      // (claimPromoDiscount) — no hay nada que redimir aquí.

      try {
        await sendPushToAdmins({
          title: (noteNeedsAttention(b.notes) ? "⚠️ ALERGIA — pedido " : "Nuevo pedido ") + ref + " 🥪",
          body: (name || "Cliente") + " — S/" + total.toFixed(2)
            + (paymentStatus === "pending" ? " (pago " + paymentMethod.toUpperCase() + " pendiente)" : "")
            + (noteNeedsAttention(b.notes) ? "\nNOTA: " + String(b.notes || "").slice(0, 180) : ""),
          url: "./index.html",
          tag: "sndwch-new-order-" + ref,
        });
      } catch {
        // un push fallido no debe bloquear la creación del pedido
      }

      return { success: true, order, customer };
    } catch (e) {
      if (!orderInserted) await restockBestEffort(codes, qtys, "order");
      throw e;
    }
  } catch (e) {
    if (promoCodeId) await releasePromoBestEffort(promoCodeId, promoPhone, ref);
    throw e;
  }
}

// Campos que la pantalla de seguimiento de invitado (sin cuenta) realmente muestra —
// deliberadamente excluye customer_phone/customer_email. El `ref` es la única prueba de
// acceso en este modo (ver oref() en index.html, que ahora incluye un componente
// aleatorio para que no sea adivinable); igual no se expone más de lo necesario por si
// alguna vez se comparte o queda en un historial de navegador.
const GUEST_ORDER_FIELDS =
  "id,ref,customer_name,customer_address,summary,total,status,payment_status,payment_method,eta_minutes,redeemed_reward,created_at,date";
export async function actMyOrders(b: any) {
  if (b.token) {
    const s = await requireSession(b.token);
    return { orders: await sbGet("orders", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc&limit=20`) };
  }
  if (b.ref) {
    const ref = String(b.ref).trim().slice(0, 40);
    return { orders: await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=${GUEST_ORDER_FIELDS}`) };
  }
  return { orders: [] };
}

export async function actMyHistory(b: any) {
  const s = await requireSession(b.token);
  return { transactions: await sbGet("transactions", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc&limit=50`) };
}

// Pide un registro más que el límite real para poder avisar si se recortó algo, en vez
// de que la cola/el export se vea completo cuando en realidad falta al final.
const ADMIN_ORDERS_LIMIT = 30;
// ── #21 / #22 / #17: LO QUE LA COLA NO DECÍA SOBRE LAS DIRECCIONES ────────────────────
//
// Los tres salen del MISMO dato que la cola ya tiene y nadie estaba mirando: el texto de la
// dirección de los pedidos activos. Cada uno se descubre hoy de la peor forma posible — el
// motorizado perdido llamando, dos viajes a la misma puerta, o dos viajes a la misma cuadra
// con veinte minutos de diferencia.

// Normalización para COMPARAR direcciones, nunca para mostrarlas. Sin esto "Av. España 123"
// y "av espana 123" son dos direcciones distintas y no se detecta ningún duplicado.
export function normalizeAddress(address: string): string {
  return String(address || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // Abreviaturas que la misma persona escribe distinto entre un pedido y otro.
    .replace(/\b(av|avda)\b\.?/g, "avenida")
    .replace(/\b(jr)\b\.?/g, "jiron")
    .replace(/\b(ca|cl)\b\.?/g, "calle")
    .replace(/\b(urb)\b\.?/g, "urbanizacion")
    .replace(/\bnro\b\.?|\bn°|\bno\b\.?|#/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// #21 — Qué le falta a una dirección para que el motorizado la encuentre.
//
// Se comprueba ANTES de despachar, no cuando ya está dando vueltas. Devuelve motivos, no un
// booleano: "sin número" y "sin referencia" se arreglan con preguntas distintas, y un aviso
// que no dice qué preguntar obliga a abrir el pedido igual.
export function addressIssues(address: string, hasCoords: boolean): string[] {
  const texto = String(address || "").trim();
  const motivos: string[] = [];
  if (texto.length < 10) motivos.push("demasiado corta");
  // Un número de puerta es lo único que convierte una calle en una dirección. Se busca un
  // número suelto, no cualquier dígito: "Mz A Lt 12" cuenta, "Av. 28 de Julio" sola no.
  if (!/\d/.test(texto.replace(/\b(28|9|2)\s*de\s*\w+/gi, ""))) motivos.push("sin número de puerta");
  // La referencia es lo que salva una dirección que el mapa ubica mal. No hace falta si el
  // cliente dejó el pin: ahí el motorizado tiene coordenadas exactas.
  if (!hasCoords && texto.length < 30 && !/(ref|frente|espalda|costado|altura|cerca|entre|puerta|color|piso|dpto|depto|interior)/i.test(texto)) {
    motivos.push("sin referencia");
  }
  return motivos;
}

export type QueueAddressFlags = {
  duplicates: { address: string; refs: string[] }[];
  ambiguous: { ref: string; address: string; reasons: string[] }[];
  nearby: { zone: string; refs: string[] }[];
};

// #22 y #17 — Dos pedidos a la misma puerta, y dos pedidos a la misma zona en la misma
// ventana. Son cosas distintas: el primero casi siempre es un pedido partido en dos y se
// puede entregar en un solo timbre; el segundo son dos clientes distintos que igual se
// pueden repartir en un viaje.
export function queueAddressFlags(
  orders: { ref: string; customer_address?: string | null; delivery_zone?: string | null; created_at?: string | null; lat?: number | null; lon?: number | null }[],
  nearbyWindowMinutes: number,
): QueueAddressFlags {
  const lista = Array.isArray(orders) ? orders.filter((o) => o && o.ref) : [];

  const porDireccion = new Map<string, { address: string; refs: string[] }>();
  const ambiguous: { ref: string; address: string; reasons: string[] }[] = [];
  for (const o of lista) {
    const texto = String(o.customer_address || "");
    const clave = normalizeAddress(texto);
    if (clave) {
      if (!porDireccion.has(clave)) porDireccion.set(clave, { address: texto, refs: [] });
      porDireccion.get(clave)!.refs.push(o.ref);
    }
    const reasons = addressIssues(texto, o.lat != null && o.lon != null);
    if (reasons.length) ambiguous.push({ ref: o.ref, address: texto, reasons });
  }
  const duplicates = [...porDireccion.values()].filter((g) => g.refs.length > 1);

  // Agrupación por cercanía: la zona de delivery es la única señal de ubicación que este
  // sistema tiene para TODOS los pedidos (el pin GPS es opcional). Se exige además que
  // caigan en la misma ventana de tiempo — dos pedidos a la misma zona con tres horas de
  // diferencia no se reparten juntos, y sugerirlo haría llegar tarde a uno de los dos.
  const porZona = new Map<string, typeof lista>();
  for (const o of lista) {
    const zona = String(o.delivery_zone || "").trim();
    if (!zona) continue;
    if (!porZona.has(zona)) porZona.set(zona, []);
    porZona.get(zona)!.push(o);
  }
  const ventana = Math.max(1, Number(nearbyWindowMinutes) || 1) * 60000;
  const nearby: { zone: string; refs: string[] }[] = [];
  for (const [zona, pedidos] of porZona) {
    if (pedidos.length < 2) continue;
    const conFecha = pedidos
      .filter((o) => o.created_at && !Number.isNaN(new Date(o.created_at).getTime()))
      .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());
    let grupo: string[] = [];
    let inicio = 0;
    for (const o of conFecha) {
      const t = new Date(o.created_at as string).getTime();
      if (!grupo.length) { grupo = [o.ref]; inicio = t; continue; }
      if (t - inicio <= ventana) { grupo.push(o.ref); continue; }
      if (grupo.length > 1) nearby.push({ zone: zona, refs: grupo });
      grupo = [o.ref];
      inicio = t;
    }
    if (grupo.length > 1) nearby.push({ zone: zona, refs: grupo });
  }
  return { duplicates, ambiguous, nearby };
}

// Ventana para considerar que dos pedidos de la misma zona salen en un viaje. 45 min: lo
// que tarda una vuelta de reparto más el margen de armado. Más ancha haría esperar al
// primero; más angosta no agruparía nunca nada.
const NEARBY_WINDOW_MINUTES = 45;

// ── #35: ALERTA DE MARGEN POR PEDIDO BAJO EL UMBRAL ────────────────────────────────────
//
// Un pedido puede apilar combo + recompensa + zona cara y quedar por debajo del piso sin que
// nada avise: cada descuento por separado está aprobado y tiene sentido, y el problema
// aparece solo al sumarlos. Es el mismo patrón que ya obligó a apagar el doble de atún y a
// corregir el pDbl de 30CM — un producto que pierde plata en una combinación concreta.
//
// El margen se estima con el % de insumos acordado con el dueño (45% del precio de venta,
// ver el contexto de negocio en CLAUDE.md). NO es el costo real medido: eso es el #7 y
// necesita las compras (#38) y la merma medida (#6). Por eso esto AVISA, no bloquea.
const MARGIN_INPUT_COST_RATE = 0.45;
const MARGIN_FLOOR_PCT = 0.25;

export type OrderMargin = {
  ref: string;
  listFood: number;
  chargedFood: number;
  discount: number;
  estimatedCost: number;
  contribution: number;
  marginPct: number;
  belowFloor: boolean;
};

export function orderMargin(
  order: { ref?: string | null; total?: number | null; delivery_fee?: number | null; listFood?: number | null },
  culqiFee: number,
  inputRate = MARGIN_INPUT_COST_RATE,
  floor = MARGIN_FLOOR_PCT,
): OrderMargin {
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const r2 = (n: number) => Math.round(n * 100) / 100;
  // Lo que el cliente PAGÓ por la comida: el reparto es pass-through al motorizado.
  const chargedFood = Math.max(0, num(order?.total) - num(order?.delivery_fee));
  // Lo que el sándwich VALE de carta, antes de combo, recompensa y promo.
  //
  // ESTA DISTINCIÓN ES TODO EL ÍTEM. Calcular el costo como un % del precio ya descontado
  // hace que el margen dé siempre lo mismo (55%) por construcción, y la alerta no saltaría
  // JAMÁS — un aviso que nunca suena es peor que no tenerlo, porque da la sensación de estar
  // vigilado. El costo de los insumos no baja porque el cliente haya pagado menos: la
  // proteína, el pan y la salsa son los mismos. Por eso el costo se ancla al precio de
  // carta y el descuento sale ENTERO del margen, que es lo que pasa de verdad.
  const listFood = num(order?.listFood) > 0 ? num(order.listFood) : chargedFood;
  const estimatedCost = listFood * inputRate;
  const contribution = chargedFood - estimatedCost - culqiFee;
  return {
    ref: String(order?.ref || ""),
    listFood: r2(listFood),
    chargedFood: r2(chargedFood),
    discount: r2(Math.max(0, listFood - chargedFood)),
    estimatedCost: r2(estimatedCost),
    contribution: r2(contribution),
    // El margen se mide contra lo que se COBRÓ: es la pregunta "de cada sol que entró,
    // cuánto me quedó". Medirlo contra el precio de carta diría que un sándwich regalado
    // tiene margen negativo del 100%, que es cierto pero no accionable.
    marginPct: chargedFood > 0 ? Math.round((contribution / chargedFood) * 1000) / 1000 : 0,
    // Sobre CERO comida cobrada el margen no es malo, es indefinido: un pedido 100% cubierto
    // por una recompensa es un premio ya pagado con puntos, no una venta mal calibrada.
    belowFloor: chargedFood > 0 && (contribution / chargedFood) < floor,
  };
}

// Aviso de margen bajo, en el momento en que el pedido se crea.
//
// Va acá y no en un cron a propósito: el valor está en verlo cuando todavía se puede hacer
// algo — mirar qué combinación lo produjo y decidir si esa promo sigue. Un reporte semanal
// diría lo mismo cuando ya se cobraron veinte iguales.
//
// Con freno de 6 horas: si una combinación concreta está mal calibrada, va a disparar en
// cada pedido, y veinte notificaciones idénticas se apagan antes que se corrija el precio.
async function alertLowMarginOrder(p: FinalizeOrderParams): Promise<void> {
  try {
    // La comisión solo existe si el cobro pasó por Culqi. Yape/Plin, crédito y recompensa
    // no la pagan, y cargársela les bajaría el margen en el reporte sin ninguna razón.
    const culqiFee = p.paymentMethod === "card" ? (Number(p.total) || 0) * CULQI_FEE_RATE : 0;
    // El precio de carta de lo que se armó, ANTES de combo/recompensa/promo. Es lo que hace
    // que el descuento salga del margen en vez de desaparecer del cálculo.
    let listFood = 0;
    for (const it of p.items || []) {
      try {
        const priced = priceCartItem(it);
        listFood += priced.unitPrice * priced.qty;
      } catch {
        // Un ítem que ya no encaja en el catálogo no puede tumbar el aviso de los demás.
      }
    }
    const m = orderMargin({ ref: p.ref, total: p.total, delivery_fee: p.deliveryFee, listFood }, culqiFee);
    if (!m.belowFloor) return;
    const ok = await rpc("check_rate_limit", { p_key: "low-margin-order", p_limit: 1, p_window_minutes: 360 });
    if (!ok) return;
    await sendPushToAdmins({
      title: "📉 Pedido bajo el margen mínimo",
      body: `${p.ref}: cobraste S/${m.chargedFood.toFixed(2)} de S/${m.listFood.toFixed(2)} de carta y quedan S/${m.contribution.toFixed(2)} (${Math.round(m.marginPct * 100)}%). Revisa qué promos se apilaron.`,
      url: "./index.html",
      tag: "sndwch-low-margin",
      renotify: true,
    });
  } catch {
    // Un aviso nunca puede tumbar un pedido que ya se cobró.
  }
}

// ── #28: LECTURA DEL COMPROBANTE (OCR), SIN COSTO ──────────────────────────────────────
//
// El OCR corre en el NAVEGADOR del admin con Tesseract.js: sin cuenta, sin API key, sin
// servicio externo y sin costo por uso. Los ~3 MB del motor solo los descarga el dueño la
// primera vez que abre un comprobante — ningún cliente los ve.
//
// ⚠ ESTO NO CONFIRMA UN PAGO, Y NO PUEDE. Una captura se edita en dos minutos; leerla
// automáticamente solo confirmaría una falsificación más rápido. La confirmación sigue
// siendo del admin mirando su cuenta. Lo que esto hace es los tres chequeos que él haría a
// ojo — monto, fecha y número de operación — para que no tenga que entrecerrar los ojos.
//
// El número de operación es lo verdaderamente nuevo: detecta la MISMA transferencia usada
// en dos pedidos. Es más fuerte que el hash de la imagen (#29), porque volver a capturar la
// pantalla cambia el hash y no el número.

export type ReceiptFields = { amount: number | null; opNumber: string | null; dateText: string | null };

// Parser tolerante del texto que devuelve el OCR.
//
// ⚠ LOS RÓTULOS SON BEST-EFFORT. No se pudo verificar contra una constancia real de Yape al
// escribir esto, así que se aceptan varias formas de decir lo mismo y NUNCA se inventa un
// dato: lo que no se reconoce vuelve como `null` y la pantalla lo dice. Cuando el dueño
// mande una captura real (ver P20 en docs/PENDIENTE_DEL_DUENO.md), esta lista se ajusta con
// una línea — el resto del mecanismo no cambia.
export function parseTransferReceipt(text: string): ReceiptFields {
  const raw = String(text || "");
  // El OCR mete saltos y espacios raros; se normaliza para buscar, nunca para mostrar.
  const t = raw.replace(/\s+/g, " ").trim();

  // MONTO. Se busca la cifra pegada a un símbolo de soles, que es como aparece en todas las
  // apps de pago peruanas. Sin el símbolo NO se toma cualquier número suelto: un número de
  // operación de 8 dígitos se confundiría con un monto de S/12345678.
  let amount: number | null = null;
  const montos = [...t.matchAll(/(?:S\/\.?|s\/\.?|PEN)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{1,2})?)/g)];
  if (montos.length) {
    // Si hay varias cifras (comisión, saldo), manda la MAYOR: en una constancia de
    // transferencia el monto enviado es el número grande, y quedarse con el primero tomaría
    // un saldo o una comisión.
    const valores = montos
      .map((m) => {
        const limpio = m[1].replace(/\.(?=[0-9]{3}\b)/g, "").replace(/,(?=[0-9]{3}\b)/g, "").replace(",", ".");
        return Number(limpio);
      })
      .filter((n) => Number.isFinite(n) && n > 0);
    if (valores.length) amount = Math.round(Math.max(...valores) * 100) / 100;
  }

  // NÚMERO DE OPERACIÓN. Se acepta cualquiera de los rótulos que usan las apps peruanas.
  // Solo se toma un número que venga DETRÁS de un rótulo: agarrar el dígito más largo del
  // texto tomaría un número de teléfono o parte de la fecha.
  let opNumber: string | null = null;
  const op = t.match(/(?:n[°ºo]?\.?\s*de\s*operaci[oó]n|nro\.?\s*de\s*operaci[oó]n|c[oó]digo\s*de\s*operaci[oó]n|operaci[oó]n|constancia|comprobante)\D{0,12}([0-9]{5,20})/i);
  if (op) opNumber = op[1];

  // FECHA. Se guarda como TEXTO tal como se leyó, no como Date: interpretar 03/09 como
  // marzo o setiembre según el runtime metería un error de meses en un dato que existe
  // justamente para detectar comprobantes viejos.
  let dateText: string | null = null;
  const fecha = t.match(/([0-3]?[0-9][\/\-. ](?:[0-1]?[0-9]|ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*[\/\-. ][0-9]{2,4})/i);
  if (fecha) dateText = fecha[1].trim();

  return { amount, opNumber, dateText };
}

// Qué decirle al admin sobre lo que se leyó. Puro y probado: decide un VEREDICTO sobre
// dinero, y equivocarlo en cualquiera de las dos direcciones es caro — un falso "todo bien"
// deja pasar un pago que no llegó, y un falso "ojo" enseña a ignorar el aviso.
export type ReceiptChecks = {
  amountMatches: boolean | null;
  amountRead: number | null;
  expected: number;
  duplicateOpRefs: string[];
  verdict: "ok" | "revisar" | "sin_lectura";
};

export function receiptChecks(
  fields: ReceiptFields,
  expectedTotal: number,
  otherRefsWithSameOp: string[],
): ReceiptChecks {
  const expected = Math.round((Number(expectedTotal) || 0) * 100) / 100;
  const leido = fields?.amount ?? null;
  // Tolerancia de un céntimo: el OCR puede leer una coma como punto y el total del pedido
  // lleva decimales desde los precios .90.
  //
  // La comparación va en CÉNTIMOS ENTEROS, no en soles: `Math.abs(26.91 - 26.90)` da
  // 0.010000000000001563 en punto flotante y no pasa un `<= 0.01`. Es el mismo motivo por el
  // que el servidor compara totales con `Math.round(total * 100)` en el checkout.
  const amountMatches = leido === null
    ? null
    : Math.abs(Math.round(leido * 100) - Math.round(expected * 100)) <= 1;
  const duplicateOpRefs = (Array.isArray(otherRefsWithSameOp) ? otherRefsWithSameOp : []).filter(Boolean);
  // Un duplicado manda sobre todo lo demás: aunque el monto cuadre, la misma transferencia
  // no puede respaldar dos pedidos.
  const verdict: ReceiptChecks["verdict"] = duplicateOpRefs.length
    ? "revisar"
    : amountMatches === null
    ? "sin_lectura"
    : amountMatches
    ? "ok"
    : "revisar";
  return { amountMatches, amountRead: leido, expected, duplicateOpRefs, verdict };
}

// Guarda lo que el navegador del admin leyó del comprobante y devuelve el veredicto.
//
// Requiere sesión de ADMIN: el cliente nunca ejecuta esto, así que no hay forma de que
// alguien mande un OCR inventado para que su pedido se vea bien. Y aunque lo hiciera, no
// confirmaría nada — el pago lo sigue confirmando una persona.
export async function actAdminReceiptOcr(b: any) {
  await requireAdmin(b.token);
  const ref = String(b.ref || "").trim().slice(0, 40);
  if (!ref) throw new ApiError("Falta el pedido.", 400);
  const texto = String(b.text || "").slice(0, 4000);

  const rows = await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=id,ref,total`);
  const order = rows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);

  const fields = parseTransferReceipt(texto);
  let otras: string[] = [];
  if (fields.opNumber) {
    const previos = await sbGet(
      "orders",
      `receipt_op_number=eq.${encodeURIComponent(fields.opNumber)}&select=ref&limit=20`,
    );
    otras = previos.map((r: any) => String(r.ref || "")).filter((r: string) => r && r !== ref);
  }
  const checks = receiptChecks(fields, Number(order.total) || 0, otras);

  await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
    receipt_ocr: { ...fields, readAt: new Date().toISOString() },
    receipt_op_number: fields.opNumber,
  });
  return { success: true, fields, checks };
}

// ── #19: CONFIRMACIÓN DE ENTREGA POR LINK ──────────────────────────────────────────────
//
// Hoy el pedido pasa a ENTREGADO porque el dueño lo marca, y el dueño no está en la puerta:
// está cocinando. Entre la entrega real y el toque del botón pasan minutos u horas, y en ese
// hueco el cliente ve "EN CAMINO" cuando ya está comiendo, la alerta de pedido estancado
// suena por un pedido que ya llegó, y `delivered_at` —que weekly-summary usa para comparar
// contra la promesa de entrega— guarda la hora equivocada.
//
// El motorizado abre un link y el pedido se cierra solo, con la hora real.
function newDeliveryToken(): string {
  // 32 caracteres hex de crypto: no adivinable por fuerza bruta, y corto como para caber en
  // un mensaje de WhatsApp sin que el link se corte en dos líneas.
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Acción PÚBLICA (sin token de sesión): quien lleva el pedido no tiene cuenta. El
// `delivery_token` es la autorización — un identificador no adivinable que solo recibe quien
// lleva ESE pedido, el mismo criterio con el que `ref` deja a un invitado ver o cancelar el
// suyo.
export async function actConfirmDelivery(b: any) {
  const token = String(b.deliveryToken || "").trim();
  // Se exige la forma exacta antes de tocar la base: así una petición con basura ni siquiera
  // llega a consultar, y no sirve para sondear si un token existe por el tiempo de respuesta.
  if (!/^[0-9a-f]{32}$/.test(token)) throw new ApiError("Link de entrega inválido.", 400);

  const rows = await sbGet("orders", `delivery_token=eq.${encodeURIComponent(token)}&select=id,ref,status,customer_name,customer_phone,contact_phone,customer_email,total,delivery_fee,eta_minutes`);
  const order = rows[0];
  // Un token que ya se usó fue BORRADO, así que acá no aparece nada. Se responde lo mismo
  // que para un token inventado a propósito: distinguirlos le diría a cualquiera si un link
  // existió alguna vez.
  if (!order) throw new ApiError("Este link ya se usó o no es válido.", 404);
  if (order.status === "CANCELADO") throw new ApiError("Este pedido está cancelado.", 400);
  if (order.status === "ENTREGADO") return { success: true, ref: order.ref, alreadyDelivered: true };
  if (order.status !== "EN CAMINO") {
    // El link solo cierra un pedido que de verdad salió. Si el estado retrocedió por
    // cualquier razón, esto no puede saltarse la cocina.
    throw new ApiError("Este pedido todavía no está en camino.", 400);
  }

  const ahora = new Date().toISOString();
  await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, {
    status: "ENTREGADO",
    status_changed_at: ahora,
    // La hora REAL de la entrega, escrita por quien entregó.
    delivered_at: ahora,
    // El token se quema acá: un link reenviado por WhatsApp no puede volver a cerrar (ni
    // reabrir) el pedido más tarde.
    delivery_token: null,
    alerted_stuck_progress: false,
  });

  // El cliente se entera al instante, que es la mitad del valor de esto.
  const phone = order.customer_phone || order.contact_phone;
  if (phone) {
    try {
      await sendPushToPhone(phone, {
        title: "🥪 ¡Tu pedido llegó!",
        body: "Que lo disfrutes. Cuando puedas, cuéntanos cómo estuvo desde la app.",
        url: "./index.html",
        tag: "sndwch-delivered-" + order.ref,
      });
    } catch {
      // un push fallido nunca puede impedir que el pedido quede cerrado
    }
  }
  try {
    await sendPushToAdmins({
      title: "✅ Entregado",
      body: `${order.ref} se confirmó desde el link del motorizado.`,
      url: "./index.html",
      tag: "sndwch-delivered-admin-" + order.ref,
    });
  } catch { /* best-effort */ }

  return { success: true, ref: order.ref, alreadyDelivered: false };
}

export async function actAdminOrders(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("orders", `status=in.(RECIBIDO,PREPARANDO,EN+CAMINO)&order=created_at.desc&limit=${ADMIN_ORDERS_LIMIT + 1}`);
  const orders = rows.slice(0, ADMIN_ORDERS_LIMIT);
  return {
    orders,
    truncated: rows.length > ADMIN_ORDERS_LIMIT,
    // Se calcula sobre los pedidos YA leídos: cero consultas extra, y no puede contradecir
    // a la lista que se muestra al lado.
    addressFlags: queueAddressFlags(orders, NEARBY_WINDOW_MINUTES),
    nearbyWindowMinutes: NEARBY_WINDOW_MINUTES,
  };
}

// Cuando un pago que no se pudo verificar automáticamente (Yape, Plin, o un pedido
// legado contra entrega) se confirma manualmente por un operador, aquí es donde se
// otorgan los puntos (nunca antes), replicando la misma lógica de "puntos solo tras
// pago confirmado" que usa actPlaceOrder para tarjeta/crédito/recompensa.
async function confirmManualPayment(order: any) {
  if (!order.customer_phone) return;
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(order.customer_phone)}`);
  if (!rows.length) return;
  const c = rows[0];
  const methodLabel = order.payment_method === "yape" ? "Yape" : order.payment_method === "plin" ? "Plin" : "pago contra entrega";
  // Igual que en finalizeAndInsertOrder — los puntos se ganan solo sobre la comida, nunca
  // sobre el delivery (pass-through al motorizado, sin margen real detrás).
  const earnedPoints = pointsFor(order.total, order.delivery_fee);

  // Mismo fix que en finalizeAndInsertOrder — referral_bonus_granted (monotónico) en vez
  // de total_orders===0 como proxy de "primer pedido" (hallazgo de auditoría, CRÍTICO).
  let referrerPhone: string | null = null;
  if (c.referred_by && !c.referral_bonus_granted) {
    const referrerRows = await sbGet("customers", `phone=eq.${encodeURIComponent(c.referred_by)}&select=phone`);
    if (referrerRows.length) referrerPhone = c.referred_by;
  }

  // Una sola llamada atómica (ver migración finalize_order_customer_update) en vez de
  // varias secuenciales — mismo motivo que en actPlaceOrder.
  await rpc("finalize_order_customer_update", {
    p_phone: order.customer_phone,
    p_points_delta: earnedPoints,
    p_credit_delta: 0,
    p_total_orders_delta: 1,
    p_last_address: order.customer_address,
    p_total_redeemed_delta: 0,
    p_referrer_phone: referrerPhone,
    p_referral_bonus: referrerPhone ? REFERRAL_BONUS_POINTS : 0,
    p_referrer_bonus: referrerPhone ? REFERRER_REWARD_POINTS : 0,
  });

  await sbInsert("transactions", {
    customer_phone: order.customer_phone,
    type: "earn_confirmed",
    points: earnedPoints,
    description: "Pedido SND//WCH (" + methodLabel + ")",
    order_ref: order.ref,
    confirmed: true,
  });
  if (referrerPhone) {
    await sbInsert("transactions", {
      customer_phone: order.customer_phone,
      type: "earn_confirmed",
      points: REFERRAL_BONUS_POINTS,
      description: "Bono por referido",
      confirmed: true,
    });
    await sbInsert("transactions", {
      customer_phone: referrerPhone,
      type: "earn_confirmed",
      points: REFERRER_REWARD_POINTS,
      description: "Sándwich gratis por invitar a " + order.customer_name,
      confirmed: true,
    });
    await rewardReferrer(referrerPhone, order.customer_name);
  }

  // Recién ACÁ un pedido Yape/Plin se vuelve una venta real (el admin confirmó que el
  // dinero llegó), así que este es el momento de reportarlo a Meta — no cuando el cliente
  // dijo "ya pagué". Mismo event_id que usaría el píxel: la referencia del pedido.
  sendPurchaseEvent({
    eventId: order.ref,
    value: (Number(order.total) || 0) - (Number(order.delivery_fee) || 0),
    phone: order.contact_phone || order.customer_phone,
    email: order.customer_email,
    name: order.customer_name,
  });

  // Antes esta función nunca avisaba al cliente que su pago Yape/Plin/COD ya se había
  // confirmado — se enteraba recién cuando el pedido avanzara a PREPARANDO (si el admin
  // hacía ese segundo paso por separado) o revisando MIS PEDIDOS a mano (hallazgo de
  // esta ronda de mejoras de fricción Yape/Plin). urgency:'high' + un patrón de
  // vibración propio (más largo que el de un cambio de estado normal) para que se
  // distinga al tacto de una notificación cualquiera.
  try {
    await sendPushToPhone(order.customer_phone, {
      title: "✅ ¡Tu pago fue confirmado!",
      body: "Verificamos tu pago por " + methodLabel + " — tu pedido " + order.ref + " ya pasa a preparación.",
      url: "./index.html",
      tag: "sndwch-payment-confirmed-" + order.ref,
      urgency: "high",
      vibrate: [120, 60, 120, 60, 250],
    });
  } catch {
    // un push fallido no debe bloquear la confirmación del pago
  }
}

// CANCELADO deliberadamente NO está aquí: solo se llega a ese estado a través de
// actAdminCancelOrder, que además restituye el inventario descontado — si se agregara
// aquí, este endpoint genérico permitiría "cancelar" un pedido sin devolver el stock.
const STATUS_SEQUENCE = ["RECIBIDO", "PREPARANDO", "EN CAMINO", "ENTREGADO"];
const VALID_ORDER_STATUSES = new Set(STATUS_SEQUENCE);

// Núcleo compartido entre actAdminUpdateStatus (un pedido) y actAdminBulkUpdateStatus
// (varios a la vez, ver #113) — mismo guard de pago pendiente, mismo otorgamiento de
// puntos al entregar COD, y mismo push de seguimiento, sin duplicar la lógica en dos
// lugares que inevitablemente terminarían divergiendo.
// Cuánto se le promete al cliente cuando el pedido sale, si el operador no escribe un
// número. Antes la app le preguntaba los minutos EN CADA pedido — 10 veces al día
// escribiendo lo mismo. Estos valores salen de la promesa que el propio cliente ya vio
// antes de pagar (ESTIMATED_DELIVERY_RANGE = 25-40 min en src/app.ts) más el tramo extra
// que agrega cada zona. El operador la puede seguir sobrescribiendo cuando sabe que ese
// pedido va a tardar distinto: esto solo elimina el caso normal, no la decisión.
const DEFAULT_ETA_BY_ZONE: Record<string, number> = {
  cerca: 25,
  media: 30,
  lejos: 40,
  muy_lejos: 50,
};
const DEFAULT_ETA_FALLBACK = 30;

async function applyOrderStatusUpdate(orderId: string, status: string, etaMinutes?: unknown): Promise<any> {
  if (!VALID_ORDER_STATUSES.has(status)) throw new ApiError("Estado de pedido inválido.", 400);
  // status_changed_at, alerted_stuck_progress y delivered_at se fijan MÁS ABAJO, solo si el
  // estado cambia de verdad. Acá el objeto arranca sin ellos: editar la ETA de un pedido
  // manda su mismo estado sobre sí mismo, y antes eso reiniciaba el reloj de "pedido
  // estancado" y reescribía la hora de entrega.
  const upd: Record<string, unknown> = { status };
  if (etaMinutes) {
    const eta = Number(etaMinutes);
    if (!Number.isFinite(eta) || eta < 0 || eta > 240) throw new ApiError("ETA inválida.", 400);
    upd.eta_minutes = eta;
  }

  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,status,total,delivery_fee,customer_phone,contact_phone,customer_name,customer_address,customer_email,payment_method,payment_status,delivery_zone,eta_minutes`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);

  // Si el pedido sale y nadie escribió una ETA, se pone la de su zona en vez de dejar al
  // cliente sin ningún número. Solo aplica cuando el pedido todavía no tiene una: una ETA
  // ya puesta a mano nunca se pisa.
  if (status === "EN CAMINO" && upd.eta_minutes === undefined && !order.eta_minutes) {
    upd.eta_minutes = DEFAULT_ETA_BY_ZONE[String(order.delivery_zone || "")] ?? DEFAULT_ETA_FALLBACK;
  }
  // #19 — El token del link de confirmación se crea justo cuando el pedido SALE, que es
  // cuando hay alguien a quien mandárselo. Antes de eso no existe, así que no hay nada que
  // filtrar; después de confirmar se borra, así que el link es de un solo uso.
  if (status === "EN CAMINO" && status !== order.status) {
    upd.delivery_token = newDeliveryToken();
  }
  if (order.status === "CANCELADO") throw new ApiError("Este pedido está cancelado.", 400);
  if (status !== order.status) {
    // status_changed_at marca CUÁNDO entró a este estado — es lo que permite detectar un
    // pedido colgado a mitad del flujo (created_at solo dice cuándo se hizo el pedido).
    upd.status_changed_at = new Date().toISOString();
    upd.alerted_stuck_progress = false;
    // Sin esto no había forma de saber CUÁNTO tardó realmente un pedido en entregarse —
    // solo created_at. weekly-summary lo usa para comparar contra ESTIMATED_DELIVERY_RANGE
    // (la promesa que ve el cliente antes de pagar) y avisar si se está desviando.
    if (status === "ENTREGADO") upd.delivered_at = new Date().toISOString();
  }

  // Antes esto no revisaba el estado actual del pedido — la acción en lote
  // (actAdminBulkUpdateStatus) podía seleccionar pedidos RECIBIDO recién llegados junto
  // con otros ya en PREPARANDO y marcarlos todos ENTREGADO de un tiro, saltándose
  // cocina/despacho por completo (hallazgo de la auditoría de flujo de pedidos). Ahora
  // solo se permite avanzar un estado a la vez, o repetir el mismo estado (ej. para
  // solo actualizar la ETA sin cambiar de estado).
  const currentIdx = STATUS_SEQUENCE.indexOf(order.status);
  const targetIdx = STATUS_SEQUENCE.indexOf(status);
  if (status !== order.status && targetIdx !== currentIdx + 1) {
    throw new ApiError(`No se puede pasar de ${order.status} directo a ${status} — avanza un estado a la vez.`, 400);
  }

  // Yape/Plin sin confirmar: no se puede avanzar el pedido de RECIBIDO — evita que
  // cocina empiece a preparar un pedido que en realidad nunca se pagó.
  if ((order.payment_method === "yape" || order.payment_method === "plin") && order.payment_status !== "paid" && status !== "RECIBIDO") {
    throw new ApiError("Confirma que el pago llegó antes de avanzar el estado del pedido.", 400);
  }

  if (status === "ENTREGADO" && order.payment_method === "cod" && order.payment_status !== "paid") {
    // Reclamo atómico: el filtro payment_status=neq.paid en la MISMA sentencia hace que,
    // si dos solicitudes llegan casi juntas (doble clic en "ENTREGADO"), solo una de ellas
    // encuentre la fila para actualizar — la otra recibe un array vacío y no vuelve a
    // otorgar puntos por el mismo pedido (ver el mismo patrón en actAdminConfirmPayment).
    const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid`, { payment_status: "paid" });
    if (claim.length) await confirmManualPayment(order);
  }

  // El filtro por el estado que se leyó arriba hace de reclamo atómico. Sin él, este
  // UPDATE podía pisar un CANCELADO: si "avanzar" y "cancelar" llegaban casi juntos, la
  // cancelación reclamaba la fila, restockeaba, reembolsaba el crédito y decrementaba
  // total_orders, y este UPDATE la reescribía como ENTREGADO — quedaba un pedido
  // "entregado" ya reembolsado y con el stock devuelto. actAdminCancelOrder y el cron de
  // pagos vencidos ya usaban este mismo patrón; esta ruta era la única sin él.
  const rows = await sbUpdate(
    "orders",
    `id=eq.${encodeURIComponent(orderId)}&status=eq.${encodeURIComponent(order.status)}`,
    upd,
  );
  if (!rows.length) {
    throw new ApiError("El pedido cambió de estado mientras lo actualizabas. Vuelve a cargar la cola.", 409);
  }

  // Las notificaciones y el reinicio del reloj de "pedido estancado" SOLO cuando el estado
  // cambia de verdad. Editar la ETA de un pedido que ya está EN CAMINO manda
  // status:'EN CAMINO' sobre sí mismo: antes eso reenviaba el push "¡Tu pedido va en
  // camino!" (con renotify:true) y el correo de estado por segunda vez, y además reescribía
  // status_changed_at y alerted_stuck_progress, o sea CORREGIR la hora de un pedido que iba
  // tarde reiniciaba justo la alarma que debía avisar que iba tarde.
  const statusChanged = status !== order.status;

  if (statusChanged && order.customer_phone && STATUS_PUSH_MESSAGES[status]) {
    const msg = STATUS_PUSH_MESSAGES[status];
    // En "EN CAMINO" con ETA cargada, reemplazamos el cuerpo genérico por una ventana de
    // hora real (ej. "9:20 - 9:40") en vez de solo "ya casi llega" — mismo tipo de dato que
    // muestran las apps de delivery en su notificación de seguimiento.
    const body = status === "EN CAMINO" && upd.eta_minutes
      ? `Llega entre las ${etaWindowText(upd.eta_minutes as number)}.`
      : msg.body;
    try {
      await sendPushToPhone(order.customer_phone, {
        title: msg.title,
        body: body + " Ref: " + order.ref,
        url: "./index.html",
        tag: "sndwch-order-" + order.ref,
        renotify: true,
      });
    } catch {
      // un push fallido no debe bloquear la actualización de estado del pedido
    }
  }

  // Antes esto lo disparaba el cliente admin directo a la función edge send-order-email,
  // sin ninguna autenticación (hallazgo de auditoría de seguridad, CRÍTICO — ver
  // sendOrderStatusEmail en email.ts). rows[0] (no `order`, que se seleccionó sin
  // customer_email) trae la fila completa tras el update.
  const updatedOrder = rows[0];
  if (statusChanged && updatedOrder?.customer_email) {
    try {
      await sendOrderStatusEmail(updatedOrder.customer_email, updatedOrder.customer_name || "", updatedOrder.ref, status, upd.eta_minutes as number | undefined);
    } catch {
      // un correo fallido no debe bloquear la actualización de estado del pedido
    }
  }

  return updatedOrder;
}

export async function actAdminUpdateStatus(b: any) {
  const s = await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  const status = String(b.status || "");
  if (!orderId || !status) throw new ApiError("Faltan datos.");
  const order = await applyOrderStatusUpdate(orderId, status, b.etaMinutes);
  // Antes solo su hermana actAdminBulkUpdateStatus quedaba registrada acá — la acción
  // admin más usada del día a día (avanzar UN pedido de estado) no dejaba ningún rastro
  // en admin_action_log (hallazgo de auditoría de código, ALTO).
  await logAdminAction(s.phone, "update-status", orderId, { status });
  return { success: true, order };
}

// Acción para pasar varios pedidos al mismo estado de un solo tap (ej. marcar "EN CAMINO"
// toda una tanda que sale junta en el mismo repartidor) — cada pedido se procesa por
// separado y un fallo en uno (pago Yape/Plin sin confirmar, id inexistente) no aborta el
// resto del lote, para que el operador no tenga que repetir los que sí eran válidos.
const MAX_BULK_STATUS_ORDERS = 30;
export async function actAdminBulkUpdateStatus(b: any) {
  const s = await requireAdmin(b.token);
  const orderIds: string[] = Array.isArray(b.orderIds)
    ? Array.from(new Set(b.orderIds.map((x: any) => String(x)).filter(Boolean)))
    : [];
  const status = String(b.status || "");
  if (!orderIds.length || !status) throw new ApiError("Faltan datos.");
  if (!VALID_ORDER_STATUSES.has(status)) throw new ApiError("Estado de pedido inválido.", 400);
  if (orderIds.length > MAX_BULK_STATUS_ORDERS) {
    throw new ApiError("Demasiados pedidos a la vez (máximo " + MAX_BULK_STATUS_ORDERS + ").", 400);
  }

  const updated: any[] = [];
  const failed: { orderId: string; error: string }[] = [];
  for (const orderId of orderIds) {
    try {
      // etaMinutes ahora se pasa también acá (antes solo actAdminUpdateStatus, el flujo de
      // UN pedido, lo recibía) — sin esto, avanzar un lote a EN CAMINO nunca cargaba ETA y
      // el cliente recibía el push genérico "va en camino" en vez de la ventana de hora
      // real que sí ve quien avanza su pedido uno por uno (hallazgo de auditoría operativa,
      // ALTO).
      updated.push(await applyOrderStatusUpdate(orderId, status, b.etaMinutes));
    } catch (e) {
      failed.push({ orderId, error: e instanceof ApiError ? e.message : "Error interno." });
    }
  }
  await logAdminAction(s.phone, "bulk-update-status", orderIds.join(",") + " -> " + status);
  return { success: true, updated, failed };
}

// El operador revisa su propia app de Yape/Plin y confirma aquí que el dinero llegó
// antes de que el pedido pueda avanzar a cocina. Solo entonces se otorgan los puntos.
export async function actAdminConfirmPayment(b: any) {
  const s = await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,total,delivery_fee,customer_phone,contact_phone,customer_name,customer_address,customer_email,payment_method,payment_status,status`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (!["yape", "plin", "cod"].includes(order.payment_method)) {
    throw new ApiError("Este pedido no requiere confirmación manual de pago.", 400);
  }
  // Un pedido ya CANCELADO (a mano o por el cron de pagos manuales sin confirmar) ya
  // devolvió su inventario reservado — confirmar el pago después igualmente otorgaría
  // puntos/bono/total_orders reales por un pedido que nunca se va a entregar (hallazgo de
  // la re-auditoría de 10 agentes, ALTO). El guard va en el mismo chequeo previo a la
  // reserva atómica de abajo, no en la reserva misma, porque distinguir "cancelado" de
  // "confirmado dos veces" da un mensaje de error más claro al admin.
  if (order.status === "CANCELADO") throw new ApiError("Este pedido está cancelado — no se puede confirmar su pago.", 409);
  // Reclamo atómico ANTES de otorgar puntos: el filtro payment_status=neq.paid en la misma
  // sentencia hace que un doble clic o un reintento de red en "confirmar pago" solo pueda
  // ganarlo UNA vez — antes se leía payment_status, se otorgaban puntos, y RECIÉN AL FINAL
  // se marcaba paid, dejando una ventana donde dos solicitudes casi simultáneas otorgaban
  // el bono/puntos dos veces para el mismo pedido (confirmado en vivo durante la auditoría).
  const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid&status=neq.CANCELADO`, { payment_status: "paid" });
  if (!claim.length) throw new ApiError("Este pedido ya estaba confirmado o fue cancelado.", 409);
  await confirmManualPayment(order);
  // Confirmar que un Yape/Plin de verdad llegó es tan sensible como cancelar un pedido o
  // dar puntos manuales (ambos ya se auditan) — no quedaba ningún rastro de quién lo
  // confirmó ni cuándo (hallazgo de auditoría de código, ALTO).
  await logAdminAction(s.phone, "confirm-payment", orderId, { paymentMethod: order.payment_method, total: order.total });
  return { success: true, order: claim[0] };
}

// Captura de pantalla del comprobante de transferencia (item 12 de la lista de fricción
// Yape/Plin) — puramente informativo para el admin, NO reemplaza la confirmación manual
// de actAdminConfirmPayment (el pedido sigue 'pending' hasta que el admin la confirme;
// una imagen no es prueba suficiente sin mirar el estado de cuenta real del negocio).
// Igual que actCancelMyOrder con `ref` sin token: el ref en sí funciona como la prueba de
// propiedad para un invitado sin cuenta (es un identificador no adivinable que solo el
// cliente tiene, mostrado recién al colocar su pedido).
const RECEIPT_UPLOAD_RATE_LIMIT = 6;
const RECEIPT_UPLOAD_RATE_WINDOW_MINUTES = 60;
const RECEIPT_MAX_BYTES = 2 * 1024 * 1024;
const RECEIPT_MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// #29 — El SHA-256 de los bytes del comprobante. Se calcula sobre los BYTES DECODIFICADOS,
// no sobre el base64: dos codificaciones del mismo archivo pueden diferir en el texto y ser
// el mismo píxel por píxel, y esa diferencia es justo la que dejaría pasar el duplicado.
export async function receiptHash(bytes: Uint8Array): Promise<string> {
  // `bytes.slice().buffer` y no `bytes` a secas: desde TypeScript 5.7 un Uint8Array ya no
  // encaja en BufferSource aunque en runtime funcione perfecto — es exactamente el mismo
  // choque que ya está documentado para `storageUpload` en db.ts. El slice además garantiza
  // que se hashea SOLO la vista y no un buffer subyacente más grande, que daría un hash
  // distinto para el mismo archivo.
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Qué otro pedido ya usó esta misma captura. Devuelve la lista de refs, no un booleano: el
// aviso al admin tiene que DECIR cuál, porque lo primero que va a querer hacer es abrir el
// otro pedido y comparar.
//
// Deliberadamente NO bloquea la subida. Hay un caso legítimo —un pedido grupal que se paga
// con una sola transferencia, o el cliente que reenvía la captura equivocada por error— y
// rechazarlo dejaría a alguien que sí pagó sin poder avisar. Lo que sí hace es que el admin
// lo vea ANTES de dar el pago por bueno, que es el único momento en que sirve.
export function duplicateReceiptRefs(rows: { ref: string }[], currentRef: string): string[] {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => String(r?.ref || ""))
    .filter((ref) => ref && ref !== currentRef);
}

export async function actUploadReceipt(b: any) {
  const ref = String(b.ref || "").trim().slice(0, 40);
  const mime = String(b.mime || "");
  const imageBase64 = String(b.imageBase64 || "");
  if (!ref || !imageBase64) throw new ApiError("Faltan datos del comprobante.");
  const ext = RECEIPT_MIME_EXT[mime];
  if (!ext) throw new ApiError("Formato de imagen no soportado — usa JPG, PNG o WEBP.", 400);

  const withinLimit = await rpc("check_rate_limit", {
    p_key: `receipt-upload:${ref}`,
    p_limit: RECEIPT_UPLOAD_RATE_LIMIT,
    p_window_minutes: RECEIPT_UPLOAD_RATE_WINDOW_MINUTES,
  });
  if (!withinLimit) throw new ApiError("Ya subiste varios comprobantes para este pedido. Espera un momento e intenta de nuevo.", 429);

  const rows = await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=id,ref,payment_method,payment_status`);
  const order = rows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (order.payment_method !== "yape" && order.payment_method !== "plin") {
    throw new ApiError("Este pedido no usa pago manual por Yape/Plin.", 400);
  }

  let bytes: Uint8Array;
  try {
    const bin = atob(imageBase64);
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    throw new ApiError("Imagen inválida.", 400);
  }
  if (!bytes.length || bytes.length > RECEIPT_MAX_BYTES) throw new ApiError("La imagen debe pesar menos de 2MB.", 400);

  const path = `${ref}.${ext}`;
  await storageUpload("payment-receipts", path, bytes, mime);

  // #29 — Antes de guardar, ver si esta MISMA captura ya respalda otro pedido. Es la única
  // defensa contra reenviar el comprobante de un pago que ya se usó: el admin confirma
  // mirando la imagen, y dos pedidos seguidos del mismo cliente se ven iguales.
  let duplicados: string[] = [];
  try {
    const hash = await receiptHash(bytes);
    const previos = await sbGet("orders", `receipt_hash=eq.${encodeURIComponent(hash)}&select=ref&limit=20`);
    duplicados = duplicateReceiptRefs(previos, ref);
    await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { receipt_path: path, receipt_hash: hash });
  } catch (e) {
    // Un fallo del hash NUNCA puede impedir que un cliente que sí pagó suba su comprobante:
    // el camino de siempre sigue guardando la ruta del archivo.
    await debugLog({ stage: "receipt_hash_failed", ref, error: String(e) });
    await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { receipt_path: path });
  }

  // Aviso opcional al admin — no bloquea la respuesta al cliente si el push falla, mismo
  // criterio que el resto de notificaciones best-effort de este archivo.
  try {
    await sendPushToAdmins(duplicados.length
      ? {
        // El aviso NOMBRA el otro pedido: lo primero que el dueño va a querer es abrirlo y
        // comparar, y un "ojo, parece repetido" sin decir con cuál no le ahorra ese paso.
        title: "⚠️ Comprobante repetido",
        body: `El comprobante del pedido ${ref} es idéntico al de ${duplicados.join(", ")}. Revísalo antes de confirmar el pago.`,
        url: "./index.html",
        tag: `sndwch-receipt-dup-${ref}`,
        renotify: true,
      }
      : {
        title: "📎 Comprobante subido",
        body: `El pedido ${ref} tiene un comprobante de Yape/Plin listo para revisar.`,
        url: "./index.html",
        tag: `sndwch-receipt-${ref}`,
      });
  } catch {
    // silencioso a propósito
  }
  // El cliente NO recibe la lista de refs ajenos (sería filtrar pedidos de otra persona),
  // solo el éxito de siempre. El aviso del duplicado va al admin, que es quien decide.
  return { success: true };
}

// URL firmada de corta duración para que el admin vea el comprobante — nunca se expone
// una URL pública/permanente (el bucket es privado a propósito).
export async function actAdminReceiptUrl(b: any) {
  await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const rows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=receipt_path`);
  const order = rows[0];
  if (!order || !order.receipt_path) throw new ApiError("Este pedido no tiene comprobante.", 404);
  const url = await storageSignedUrl("payment-receipts", order.receipt_path, 300);
  return { url };
}

// Cancela un pedido que nunca se pagó (típicamente Yape/Plin donde el cliente nunca
// transfirió) y restituye el stock que se había descontado al registrarlo — sin esto,
// un pago que nunca llega deja el pedido "vivo" para siempre y el inventario bloqueado.
// Compartido entre la cancelación manual (admin) y la expiración automática de abajo —
// re-deriva los ingredientes de cada línea del pedido y los devuelve al inventario.
async function restockOrderItems(items: any): Promise<void> {
  if (!Array.isArray(items) || !items.length) return;
  const ingredients: string[] = [];
  for (const it of items) {
    try {
      // Foto guardada al momento de pedir (ver snapIngredients en priceCartItem): es la
      // única fuente fiel para un Signature cuya receta pudo cambiar después — en
      // particular SIG05, que rota cada mes. Re-derivar con priceCartItem devolvería la
      // receta VIGENTE, no la que se vendió. Solo se re-deriva cuando no hay foto
      // (pedidos anteriores a este cambio) o cuando la foto viene corrupta.
      const snap = Array.isArray((it as any)?.snapIngredients)
        ? (it as any).snapIngredients.filter((x: any) => typeof x === "string" && x)
        : null;
      if (snap && snap.length) {
        const qty = Number((it as any)?.qty) > 0 ? Math.floor(Number((it as any).qty)) : 1;
        for (let i = 0; i < qty; i++) ingredients.push(...snap);
        continue;
      }
      const priced = priceCartItem(it);
      for (let i = 0; i < priced.qty; i++) ingredients.push(...priced.ingredientsPerUnit);
    } catch {
      // Ítem legado que ya no encaja en el catálogo actual — no se puede re-derivar
      // su composición, así que se omite la restitución solo para ese ítem.
    }
  }
  if (!ingredients.length) return;
  const codes = Array.from(new Set(ingredients));
  const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
  await rpc("restock_inventory", { p_codes: codes, p_qtys: qtys });
}

// El bono de referido (+50/+50 pts) se otorgaba al pagar pero nunca se revertía al
// cancelar — permitía "registrarse con código de referido → pedido mínimo pagado →
// cancelar antes de que cocina empiece → repetir" para farmear el bono sin comprar de
// verdad (hallazgo de auditoría financiera). No hay columna en `orders` que diga qué
// pedido exacto disparó el bono, así que se usa `total_orders === 1` (justo antes de
// que este cancelación lo baje a 0) como el mejor indicador disponible de "este pedido
// fue el que lo otorgó" — debe leerse ANTES de que finalize_order_customer_update
// decremente total_orders, nunca después.
// Lo que hay que DESHACER en la cuenta del cliente al cancelar un pedido. Es la misma
// aritmética para la cancelación del cliente (actCancelMyOrder) y la del admin
// (actAdminCancelOrder) — estaba escrita dos veces palabra por palabra, que es justo
// cómo dos copias empiezan a divergir: cada corrección futura tenía que acordarse de la
// otra. Se extrae además porque es exactamente la clase de defecto que ya llegó a
// producción una vez (revertir un monto distinto del que se otorgó, ver el caso de los
// 350 puntos regalados) y sin extraerla no había forma de probarla: el resto de las dos
// funciones toca la base y no se puede ejecutar en `npm run test:api`.
//
// Reglas, todas con una razón concreta detrás:
// · Nada se revierte si el pedido nunca se pagó — un Yape/Plin todavía `pending` nunca
//   pasó por finalize_order_customer_update, no hay nada que deshacer.
// · Los puntos GANADOS fueron sobre total − delivery_fee (el delivery es pass-through al
//   motorizado y nunca premió), así que la reversión resta exactamente eso; los puntos
//   que el cliente GASTÓ en una recompensa se le devuelven. El neto puede quedar en
//   cualquier signo y así debe mandarse.
// · El crédito solo se devuelve si se pagó con crédito interno: el dinero real de una
//   tarjeta no se reembolsa desde acá (eso lo coordina el dueño a mano).
export function cancellationDeltas(order: {
  payment_status?: string | null;
  payment_method?: string | null;
  total: number;
  delivery_fee?: number | null;
  redeemed_reward_pts?: number | null;
}): { creditToRefund: number; pointsToRefund: number; totalOrdersDelta: number; totalRedeemedDelta: number } {
  const paid = order.payment_status === "paid";
  return {
    creditToRefund: paid && order.payment_method === "credit" ? order.total : 0,
    pointsToRefund: paid ? (order.redeemed_reward_pts || 0) - pointsFor(order.total, order.delivery_fee || 0) : 0,
    totalOrdersDelta: paid ? -1 : 0,
    totalRedeemedDelta: paid && order.redeemed_reward_pts ? -1 : 0,
  };
}
async function referrerPhoneToReverse(phone: string): Promise<string | null> {
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(phone)}&select=referred_by,referral_bonus_granted,total_orders`);
  const c = rows[0];
  if (c && c.referred_by && c.referral_bonus_granted && c.total_orders === 1) return c.referred_by;
  return null;
}
async function reverseReferralBonus(referredPhone: string, referrerPhone: string, contextLabel: string) {
  await rpc("reverse_referral_bonus", {
    p_referred_phone: referredPhone,
    p_referrer_phone: referrerPhone,
    p_bonus: REFERRAL_BONUS_POINTS,
    p_referrer_bonus: REFERRER_REWARD_POINTS,
  });
  await Promise.all([
    sbInsert("transactions", {
      customer_phone: referredPhone,
      type: "cancel_reversal",
      points: -REFERRAL_BONUS_POINTS,
      description: "Reversión de bono de referido por cancelación " + contextLabel,
      confirmed: true,
    }),
    sbInsert("transactions", {
      customer_phone: referrerPhone,
      type: "cancel_reversal",
      points: -REFERRER_REWARD_POINTS,
      description: "Reversión de bono de referido por cancelación " + contextLabel,
      confirmed: true,
    }),
  ]);
}

export async function actAdminCancelOrder(b: any) {
  const s = await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet(
    "orders",
    `id=eq.${encodeURIComponent(orderId)}&select=id,status,payment_status,payment_method,total,delivery_fee,items,customer_phone,redeemed_reward_pts`,
  );
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (order.status === "ENTREGADO") throw new ApiError("Un pedido ya entregado no se puede cancelar.", 400);
  if (order.status === "CANCELADO") throw new ApiError("Este pedido ya está cancelado.", 409);
  // Antes esto bloqueaba por completo cancelar un pedido ya pagado — dejaba al operador sin
  // ninguna forma de cancelar en la app un pedido pagado con tarjeta/crédito si, por ejemplo,
  // se acabó un ingrediente a media preparación (hallazgo de la auditoría de flujo de
  // pedidos). Ahora sí se puede, pero exige que el cliente mande `acknowledgeRefund:true`
  // (el panel admin muestra una confirmación aparte explicando que el reembolso de dinero
  // real, si corresponde, se coordina manualmente — esta función no toca Culqi).
  if (order.payment_status === "paid" && !b.acknowledgeRefund) {
    throw new ApiError("Este pedido ya fue pagado. Confirma que coordinarás el reembolso manualmente para cancelarlo.", 409);
  }

  // Motivo opcional (libre, lo escribe el operador) — sin esto, el resumen semanal solo
  // podía contar CUÁNTOS pedidos se cancelaron, nunca POR QUÉ (hallazgo de la
  // re-auditoría de automatización).
  const reason = b.reason ? String(b.reason).trim().slice(0, 200) : "Sin especificar";
  // Reclamo atómico ANTES de restockear/reembolsar — mismo patrón que ya usa
  // applyOrderStatusUpdate para el pago manual (payment_status=neq.paid en el filtro de
  // la propia sentencia). Antes esta función leía el pedido, restockeaba y reembolsaba
  // TODO antes de recién marcarlo CANCELADO sin ningún filtro de estado — dos solicitudes
  // casi simultáneas (doble clic, reintento de red) pasaban ambas la lectura inicial
  // antes de que la primera terminara de escribir, y ambas restockeaban/reembolsaban el
  // mismo pedido (hallazgo de auditoría de funcionamiento, CRÍTICO). El filtro
  // `status=neq.ENTREGADO&status=neq.CANCELADO` en la MISMA sentencia hace que solo una
  // de las dos solicitudes encuentre la fila para actualizar — la otra recibe un array
  // vacío y nunca llega a restockear/reembolsar.
  const claimRows = await sbUpdate(
    "orders",
    `id=eq.${encodeURIComponent(orderId)}&status=neq.ENTREGADO&status=neq.CANCELADO`,
    { status: "CANCELADO", cancel_reason: reason },
  );
  if (!claimRows.length) {
    throw new ApiError("Este pedido ya no se puede cancelar — puede que ya esté cancelado, entregado, o que otra solicitud ya lo haya cancelado.", 409);
  }

  await restockOrderItems(order.items);

  // A diferencia de actCancelMyOrder, esta función NUNCA revertía puntos/crédito/
  // total_orders al cancelar un pedido pagado (hallazgo de auditoría de código, ALTO) —
  // dos consecuencias reales: (1) si se pagó con crédito interno, ese saldo quedaba
  // debitado para siempre sin ninguna herramienta para corregirlo; (2) si se pagó con
  // tarjeta/Yape/Plin y se reembolsó por fuera de la app, el cliente igual conservaba
  // los puntos/rango ganados por un pedido que terminó devuelto. Mismo cálculo que
  // actCancelMyOrder: revierte el delta neto que se aplicó al pagar.
  const { creditToRefund, pointsToRefund, totalOrdersDelta, totalRedeemedDelta } = cancellationDeltas(order);
  // Debe leerse ANTES de finalize_order_customer_update, que es el que decrementa
  // total_orders — ver comentario de referrerPhoneToReverse.
  const referrerToReverse = order.payment_status === "paid" && order.customer_phone
    ? await referrerPhoneToReverse(order.customer_phone)
    : null;
  if (order.customer_phone && (creditToRefund > 0 || pointsToRefund !== 0 || totalOrdersDelta !== 0)) {
    await rpc("finalize_order_customer_update", {
      p_phone: order.customer_phone,
      p_points_delta: pointsToRefund,
      p_credit_delta: creditToRefund,
      p_total_orders_delta: totalOrdersDelta,
      p_last_address: null,
      p_total_redeemed_delta: totalRedeemedDelta,
      p_referrer_phone: null,
      p_referral_bonus: 0,
      // p_referrer_bonus explícito aunque acá siempre sea 0: PostgREST elige la sobrecarga
      // por los NOMBRES de los argumentos, así que omitirlo hacía caer estas dos llamadas
      // en la versión vieja de 8 parámetros. Hoy es inocuo (p_referrer_phone es null),
      // pero es exactamente el defecto de los "350 puntos regalados" esperando a que
      // alguien pase un referrer real por acá.
      p_referrer_bonus: 0,
    });
    const refundAudits: Promise<unknown>[] = [];
    if (pointsToRefund !== 0) {
      refundAudits.push(sbInsert("transactions", {
        customer_phone: order.customer_phone,
        type: "cancel_reversal",
        points: pointsToRefund,
        description: "Ajuste de puntos por cancelación admin (" + order.id + ")",
        confirmed: true,
      }));
    }
    if (creditToRefund > 0) {
      refundAudits.push(sbInsert("credit_ledger", {
        customer_phone: order.customer_phone,
        delta: creditToRefund,
        reason: "Reembolso por cancelación admin (" + order.id + ")",
      }));
    }
    if (referrerToReverse) {
      refundAudits.push(reverseReferralBonus(order.customer_phone, referrerToReverse, "admin (" + order.id + ")"));
    }
    await Promise.all(refundAudits);
  }

  // Avisarle al cliente. Antes cancelar no mandaba nada: se enteraba abriendo la app, o no
  // se enteraba. Es el único cambio de estado que deja a alguien esperando comida que no va
  // a llegar, así que no puede pasar en silencio.
  if (order.customer_phone && STATUS_PUSH_MESSAGES.CANCELADO) {
    try {
      await sendPushToPhone(order.customer_phone, {
        title: STATUS_PUSH_MESSAGES.CANCELADO.title,
        body: STATUS_PUSH_MESSAGES.CANCELADO.body + " Ref: " + order.ref,
        url: "./index.html",
        tag: "sndwch-order-" + order.ref,
        renotify: true,
      });
    } catch {
      // un push fallido no puede tumbar una cancelación que ya se ejecutó en la base
    }
  }
  await logAdminAction(s.phone, "cancel-order", orderId, { hadPayment: order.payment_status === "paid", reason });
  return { success: true, order: claimRows[0] };
}

// La página de Cambios y Devoluciones promete "puedes cancelar sin costo antes de que la
// cocina empiece a preparar tu pedido", pero hasta ahora no existía ningún camino en la
// app para que el CLIENTE lo hiciera él mismo — solo un operador podía cancelar (hallazgo
// de la auditoría de flujo de pedidos: la app no cumplía su propia promesa). Deliberadamente
// solo permite cancelar en RECIBIDO (antes de que cocina empiece), igual que dice el texto
// legal. Cliente con sesión: valida dueño por customer_phone. Invitado: el `ref` (con
// componente aleatorio, ver oref() en el cliente) es la misma prueba de acceso que ya usan
// actMyOrders/actSubmitRating.
export async function actCancelMyOrder(b: any) {
  const orderId = b.orderId ? String(b.orderId) : null;
  const ref = b.ref ? String(b.ref).trim().slice(0, 40) : null;
  if (!orderId && !ref) throw new ApiError("Falta el pedido.");

  let order: any;
  const SELECT_FIELDS = "id,status,payment_status,payment_method,total,delivery_fee,ref,customer_phone,redeemed_reward_pts,items";
  if (b.token) {
    const s = await requireSession(b.token);
    const query = orderId
      ? `id=eq.${encodeURIComponent(orderId)}&customer_phone=eq.${encodeURIComponent(s.phone)}`
      : `ref=eq.${encodeURIComponent(ref as string)}&customer_phone=eq.${encodeURIComponent(s.phone)}`;
    const rows = await sbGet("orders", `${query}&select=${SELECT_FIELDS}`);
    order = rows[0];
  } else if (ref) {
    const rows = await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=${SELECT_FIELDS}`);
    order = rows[0];
  }
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (order.status !== "RECIBIDO") {
    throw new ApiError("Ya no se puede cancelar — la cocina ya empezó a preparar tu pedido.", 400);
  }

  // Reclamo atómico ANTES de restockear/reembolsar — mismo motivo y mismo patrón que
  // actAdminCancelOrder (ver su comentario): sin el filtro `status=eq.RECIBIDO` en esta
  // MISMA sentencia, un doble-tap en "Cancelar pedido" (sin guard de cliente hasta ahora)
  // dejaba pasar dos solicitudes casi simultáneas por el chequeo de arriba antes de que
  // la primera terminara de escribir, y ambas restockeaban/reembolsaban el mismo pedido
  // (hallazgo de auditoría de funcionamiento, CRÍTICO).
  const claimRows = await sbUpdate(
    "orders",
    `id=eq.${encodeURIComponent(order.id)}&status=eq.RECIBIDO`,
    { status: "CANCELADO", cancel_reason: "Cliente canceló" },
  );
  if (!claimRows.length) {
    throw new ApiError("Ya no se puede cancelar — la cocina ya empezó a preparar tu pedido.", 400);
  }

  await restockOrderItems(order.items);

  // Devuelve lo que el cliente ya gastó para pagar este pedido (crédito interno usado)
  // Y revierte lo que había GANADO por la compra (puntos 1:1 sobre el total, el conteo
  // de total_orders, y el contador de recompensas canjeadas) — antes solo se devolvían
  // los puntos de una recompensa canjeada, dejando los puntos GANADOS como un premio
  // permanente aunque el pedido se cancelara y el stock se restituyera. Eso permitía
  // "pedir con crédito propio → cancelar → repetir" para farmear puntos infinitos sin
  // costo real, e inflar total_orders para desbloquear rangos/menú secreto sin comprar de
  // verdad (hallazgo de auditoría de código — CRÍTICO). Ahora se revierte exactamente
  // el mismo delta neto que finalizeAndInsertOrder/confirmManualPayment aplicaron al
  // pagar: total ganado menos puntos de recompensa ya restados en ese momento. Solo
  // aplica si el pedido llegó a debitar/acreditar algo de verdad: payment_status debe
  // ser "paid" (un Yape/Plin todavía "pending" nunca pasó por finalize_order_customer_
  // update, así que no hay nada que revertir ahí). El propio RPC bloquea la reversión
  // (y por tanto la cancelación) si el cliente ya gastó esos puntos en otra parte antes
  // de cancelar (guarda points+delta>=0) — en ese caso raro, el cliente ve "saldo
  // insuficiente" en vez de perder la cuenta en silencio.
  const { creditToRefund, pointsToRefund, totalOrdersDelta, totalRedeemedDelta } = cancellationDeltas(order);
  // Debe leerse ANTES de finalize_order_customer_update, que es el que decrementa
  // total_orders — ver comentario de referrerPhoneToReverse.
  const referrerToReverse = order.payment_status === "paid" && order.customer_phone
    ? await referrerPhoneToReverse(order.customer_phone)
    : null;
  if (order.customer_phone && (creditToRefund > 0 || pointsToRefund !== 0 || totalOrdersDelta !== 0)) {
    await rpc("finalize_order_customer_update", {
      p_phone: order.customer_phone,
      p_points_delta: pointsToRefund,
      p_credit_delta: creditToRefund,
      p_total_orders_delta: totalOrdersDelta,
      p_last_address: null,
      p_total_redeemed_delta: totalRedeemedDelta,
      p_referrer_phone: null,
      p_referral_bonus: 0,
      // p_referrer_bonus explícito aunque acá siempre sea 0: PostgREST elige la sobrecarga
      // por los NOMBRES de los argumentos, así que omitirlo hacía caer estas dos llamadas
      // en la versión vieja de 8 parámetros. Hoy es inocuo (p_referrer_phone es null),
      // pero es exactamente el defecto de los "350 puntos regalados" esperando a que
      // alguien pase un referrer real por acá.
      p_referrer_bonus: 0,
    });
    const refundAudits: Promise<unknown>[] = [];
    if (pointsToRefund !== 0) {
      refundAudits.push(sbInsert("transactions", {
        customer_phone: order.customer_phone,
        type: "cancel_reversal",
        points: pointsToRefund,
        description: "Ajuste de puntos por cancelación de pedido (" + order.ref + ")",
        order_ref: order.ref,
        confirmed: true,
      }));
    }
    if (creditToRefund > 0) {
      refundAudits.push(sbInsert("credit_ledger", {
        customer_phone: order.customer_phone,
        delta: creditToRefund,
        reason: "Reembolso por cancelación (" + order.ref + ")",
      }));
    }
    if (referrerToReverse) {
      refundAudits.push(reverseReferralBonus(order.customer_phone, referrerToReverse, "(" + order.ref + ")"));
    }
    await Promise.all(refundAudits);
  }

  // Dinero real ya cobrado que este endpoint NO puede devolver solo (tarjeta vía Culqi,
  // o Yape/Plin ya confirmado manualmente por un admin) — a diferencia del crédito
  // interno de arriba, acá no hay ningún saldo propio que ajustar, el reembolso implica
  // tocar Culqi o hacer una transferencia real. Antes esta autocancelación quedaba en
  // silencio total para el negocio: el pedido pasaba a CANCELADO sin ningún rastro de
  // que se le debe plata al cliente, a diferencia de actAdminCancelOrder (que si exige
  // acknowledgeRefund y deja auditoría) — contradecía en silencio la promesa de
  // "cancela sin costo" del texto legal (hallazgo de auditoría de QA).
  const needsManualRefund = order.payment_status === "paid" && order.payment_method !== "credit" && order.total > 0;
  if (needsManualRefund) {
    await logAdminAction("cliente:" + (order.customer_phone || "invitado"), "self-cancel-needs-refund", order.ref, {
      total: order.total,
      paymentMethod: order.payment_method,
    });
    try {
      await sendPushToAdmins({
        title: "Cliente canceló un pedido ya pagado 💸",
        body: order.ref + " — S/" + order.total.toFixed(2) + " (" + order.payment_method.toUpperCase() + ") necesita reembolso manual.",
        url: "./index.html",
        tag: "sndwch-self-cancel-refund-" + order.ref,
      });
    } catch {
      // un push fallido no debe bloquear la cancelación
    }
  }

  return { success: true, order: claimRows[0] };
}

// Un pedido Yape/Plin que el cliente nunca terminó de transferir se quedaba "vivo" para
// siempre (RECIBIDO, con el inventario ya reservado) — nada lo cancelaba salvo que un
// operador lo notara y lo cancelara a mano. Este cron (ver migración del cron job) lo
// cancela solo tras STALE_MANUAL_PAYMENT_HOURS y devuelve el stock reservado, reusando
// exactamente la misma lógica de restitución que la cancelación manual del admin. Un
// pedido Yape/Plin sin pagar solo puede estar en RECIBIDO (actAdminUpdateStatus ya
// bloquea avanzarlo de estado sin confirmar el pago primero), así que ese es el único
// status que hace falta revisar aquí.
export async function actExpireStaleManualPayments(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const cutoff = new Date(Date.now() - STALE_MANUAL_PAYMENT_HOURS * 3600000).toISOString();
  const stale = await sbGet(
    "orders",
    `payment_method=in.(yape,plin)&payment_status=neq.paid&status=eq.RECIBIDO&created_at=lt.${encodeURIComponent(cutoff)}&select=id,items,ref,customer_phone&limit=500`,
  );
  let cancelled = 0;
  for (const order of stale) {
    try {
      // Guarda status=eq.RECIBIDO&payment_status=neq.paid en el UPDATE mismo (no solo en
      // el SELECT de arriba) — sin esto, un admin podía confirmar el pago o avanzar el
      // pedido entre el SELECT y este UPDATE (TOCTOU) y este cron lo cancelaba/restockeaba
      // igual, contradiciendo lo que el admin acababa de hacer (hallazgo de auditoría de
      // arquitectura backend). rows.length===0 significa que el pedido ya no calificaba
      // para expirar, así que tampoco se restockea.
      const rows = await sbUpdate(
        "orders",
        `id=eq.${encodeURIComponent(order.id)}&status=eq.RECIBIDO&payment_status=neq.paid`,
        { status: "CANCELADO", cancel_reason: "Pago manual no confirmado a tiempo" },
      );
      if (rows.length) {
        await restockOrderItems(order.items);
        cancelled++;
        // Mismo criterio que la cancelación del admin: nadie se puede quedar esperando un
        // pedido que el sistema canceló solo, sin enterarse.
        if (order.customer_phone && STATUS_PUSH_MESSAGES.CANCELADO) {
          try {
            await sendPushToPhone(order.customer_phone, {
              title: STATUS_PUSH_MESSAGES.CANCELADO.title,
              body: "No recibimos la confirmación de tu pago. Ref: " + order.ref,
              url: "./index.html",
              tag: "sndwch-order-" + order.ref,
              renotify: true,
            });
          } catch { /* un push fallido no revierte la expiración */ }
        }
      }
    } catch (e) {
      console.error("expire-stale-manual-payments failed for order", order.id, e);
      // Fallos dentro de loops de cron solo iban a console.error (visible solo desde el
      // panel de logs de Supabase) — para los 3 crons que mueven dinero real esto contradice
      // la razón de ser de debug_logs (hallazgo de auditoría de código, MEDIO).
      await debugLog({ stage: "expire-stale-manual-payments", orderId: order.id, error: String(e) });
    }
  }
  return { success: true, cancelled };
}

// Avisa al dueño cuando un pedido lleva demasiado tiempo sin que cocina lo tome. El badge
// visual "hace X min" del panel admin (ver isStale en index.html) sigue con su propio
// umbral fijo de 10 min — es solo una señal a simple vista de la cola, no necesita
// variar. Esta alerta SÍ varía según la hora: en hora pico (almuerzo/cena, ver
// actRemindPeakHour) 10 min de espera es normal con cocina llena, así que avisar tan
// rápido generaba ruido; fuera de hora pico, 10 min sin que nadie tome un pedido suele
// ser señal real de que algo se atoró, así que ahí conviene avisar más rápido
// (hallazgo de la re-auditoría de automatización).
const STUCK_ORDER_MINUTES_PEAK = 15;
const STUCK_ORDER_MINUTES_OFFPEAK = 6;
const PEAK_HOURS_LIMA: [number, number][] = [[12, 14], [19, 21]];
function isPeakHourNowLima(): boolean {
  const limaHour = new Date(Date.now() - 5 * 3600000).getUTCHours();
  return PEAK_HOURS_LIMA.some(([start, end]) => limaHour >= start && limaHour < end);
}
export async function actAlertStuckOrders(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const stuckMinutes = isPeakHourNowLima() ? STUCK_ORDER_MINUTES_PEAK : STUCK_ORDER_MINUTES_OFFPEAK;
  const cutoff = new Date(Date.now() - stuckMinutes * 60000).toISOString();
  // Un pedido PROGRAMADO no está estancado: está esperando su hora. Antes esto filtraba
  // solo por created_at, así que un pedido hecho a las 9am para las 8pm disparaba "Pedido
  // estancado ⏰" a los pocos minutos, todos los días. El filtro correcto es sobre la hora
  // en que el pedido DEBÍA empezar: delivery_time si lo tiene, created_at si no.
  const stuck = await sbGet(
    "orders",
    `status=eq.RECIBIDO&alerted_stuck=eq.false&created_at=lt.${encodeURIComponent(cutoff)}` +
      `&or=(delivery_time.is.null,delivery_time.lt.${encodeURIComponent(cutoff)})` +
      `&select=id,ref,customer_name,payment_method,payment_status&limit=500`,
  );
  let alerted = 0;
  for (const order of stuck) {
    try {
      const manualPending = (order.payment_method === "yape" || order.payment_method === "plin") && order.payment_status !== "paid";
      await sendPushToAdmins({
        title: "Pedido estancado ⏰",
        body: order.ref + " (" + (order.customer_name || "cliente") + ") lleva más de " + stuckMinutes + " min en RECIBIDO"
          + (manualPending ? " — pago sin confirmar" : "") + ".",
        url: "./index.html",
        tag: "sndwch-stuck-" + order.id,
      });
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { alerted_stuck: true });
      alerted++;
    } catch (e) {
      console.error("alert-stuck-orders failed for order", order.id, e);
    }
  }
  // Segundo barrido: pedidos colgados DESPUÉS de RECIBIDO. El barrido de arriba solo mira
  // el primer estado, así que un pedido que se quedó en PREPARANDO porque el dueño se
  // distrajo cocinando —o en EN CAMINO porque nadie marcó la entrega— no avisaba nada. Es
  // exactamente el pedido que termina en una calificación de 1 estrella, porque el cliente
  // sí está mirando el reloj. Se usa el DOBLE del umbral de RECIBIDO: preparar y repartir
  // legítimamente toman más que aceptar.
  const progressCutoff = new Date(Date.now() - stuckMinutes * 2 * 60000).toISOString();
  const inProgress = await sbGet(
    "orders",
    `status=in.(PREPARANDO,EN CAMINO)&alerted_stuck_progress=eq.false&status_changed_at=lt.${encodeURIComponent(progressCutoff)}&select=id,ref,customer_name,status&limit=500`,
  );
  for (const order of inProgress) {
    try {
      await sendPushToAdmins({
        title: "Pedido sin avanzar ⏳",
        body: order.ref + " (" + (order.customer_name || "cliente") + ") lleva más de " + stuckMinutes * 2
          + " min en " + order.status + ". El cliente está esperando.",
        url: "./index.html",
        tag: "sndwch-stuck-progress-" + order.id,
      });
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { alerted_stuck_progress: true });
      alerted++;
    } catch (e) {
      console.error("alert-stuck-orders (en progreso) failed for order", order.id, e);
    }
  }

  // Tercer barrido (#79): pedidos que pasaron el ETA que se le PROMETIÓ al cliente. Los dos
  // barridos de arriba miran el reloj de la cocina; este mira la promesa. Cuando el pedido
  // sale EN CAMINO se le manda "llega entre las X y las Y" (etaWindowText, ±5 min sobre
  // eta_minutes) — pasado eso, el cliente ya está mirando el reloj, y lo único que todavía
  // evita la mala calificación es escribirle antes de que escriba él.
  const enCamino = await sbGet(
    "orders",
    `status=eq.EN CAMINO&alerted_eta_missed=eq.false&eta_minutes=not.is.null&select=id,ref,customer_name,contact_phone,customer_phone,eta_minutes,status_changed_at&limit=500`,
  );
  for (const order of etaMissed(enCamino, Date.now())) {
    try {
      await sendPushToAdmins({
        title: "⏱ Pasó el tiempo prometido",
        body: `${order.ref} (${order.customerName}) ya pasó los ${order.etaMinutes} min que le prometimos, por ${order.lateMinutes} min. Escríbele antes de que escriba él.`,
        url: "./index.html",
        tag: "sndwch-eta-missed-" + order.id,
        renotify: true,
      });
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { alerted_eta_missed: true });
      alerted++;
    } catch (e) {
      console.error("alert-stuck-orders (ETA vencido) failed for order", order.id, e);
    }
  }

  return { success: true, alerted };
}

// Margen sobre el ETA antes de considerarlo incumplido. No es arbitrario: al cliente se le
// promete una VENTANA de ±5 minutos (`etaWindowText`), así que avisar antes de que pase el
// borde superior de esa ventana sería avisar de algo que todavía no incumple nada.
export const ETA_GRACE_MINUTES = 5;

export type EtaMissed = { id: string; ref: string; customerName: string; etaMinutes: number; lateMinutes: number };

// Cuáles de estos pedidos EN CAMINO ya pasaron su promesa, y por cuánto. Se extrae del cron
// porque su modo de fallo no es un error: un borde mal resuelto acá no rompe nada, solo
// hace que el aviso no salga (o salga antes de tiempo, que a fuerza de repetirse termina
// siendo lo mismo: una alarma que nadie mira).
export function etaMissed(
  rows: { id: string; ref: string; customer_name?: string | null; eta_minutes?: number | null; status_changed_at?: string | null }[],
  nowMs: number,
): EtaMissed[] {
  const out: EtaMissed[] = [];
  for (const o of rows || []) {
    const eta = Number(o.eta_minutes);
    if (!Number.isFinite(eta) || eta <= 0) continue;
    // Sin marca de cuándo salió no se puede saber si se pasó. Suponer created_at sería
    // inventar el dato: un pedido programado se creó horas antes de salir.
    if (!o.status_changed_at) continue;
    const salida = new Date(o.status_changed_at).getTime();
    if (!Number.isFinite(salida)) continue;
    const limite = salida + (eta + ETA_GRACE_MINUTES) * 60000;
    if (nowMs < limite) continue;
    out.push({
      id: o.id,
      ref: o.ref,
      customerName: o.customer_name || "cliente",
      etaMinutes: eta,
      lateMinutes: Math.round((nowMs - salida - eta * 60000) / 60000),
    });
  }
  // El más atrasado primero: si algo corta la lista, corta por el que menos urge.
  return out.sort((a, b) => b.lateMinutes - a.lateMinutes);
}

// Reserva de Culqi (ver actPrepareOrder) que nunca llegó a cobrarse — el cliente cerró
// la pestaña, se arrepintió, o el pago de Culqi falló antes de que actConfirmCulqiOrder
// llegara a correr. Libera el inventario reservado y marca la fila 'expired' en vez de
// dejarla 'pending' para siempre — eso también es lo que le permite a actPrepareOrder
// bloquear una segunda reserva concurrente sin quedar bloqueado para siempre si el
// cliente simplemente abandonó el pago.
export async function actExpirePendingCharges(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const nowIso = new Date().toISOString();
  // status=in.(pending,charging): 'charging' es el estado transitorio que create-charge usa
  // para reclamar la reserva justo antes de cobrar en Culqi (ver create-charge/index.ts) —
  // normalmente dura segundos, pero si la función se cae a mitad de camino (antes de
  // revertir a 'pending') una fila podría quedar atascada en 'charging' para siempre sin
  // este barrido adicional.
  const stale = await sbGet(
    "pending_charges",
    `status=in.(pending,charging)&expires_at=lt.${encodeURIComponent(nowIso)}&select=id,status,reserved_codes,reserved_qtys,promo_code_id,customer_phone,contact_phone,ref&limit=500`,
  );
  let expired = 0;
  for (const pc of stale) {
    try {
      const codes: string[] = pc.reserved_codes || [];
      const qtys: number[] = pc.reserved_qtys || [];
      if (codes.length) await rpc("restock_inventory", { p_codes: codes, p_qtys: qtys });
      // Mismo criterio que el inventario: una reserva que nunca se pagó y expira debe
      // liberar también el código promocional que claimPromoDiscount reclamó de forma
      // atómica en actPrepareOrder — si no, el código queda "gastado" para un pedido que
      // nunca ocurrió (hallazgo de la re-auditoría de 10 agentes, MEDIO/ALTO). Misma
      // identidad usada al reclamar: cuenta si había sesión, si no contactPhone.
      if (pc.promo_code_id) await rpc("release_promo_redemption", { p_promo_id: pc.promo_code_id, p_phone: pc.customer_phone || pc.contact_phone, p_order_ref: pc.ref });
      await sbUpdate("pending_charges", `id=eq.${pc.id}&status=eq.${pc.status}`, { status: "expired" });
      expired++;
    } catch (e) {
      console.error("expire-pending-charges failed for", pc.id, e);
      await debugLog({ stage: "expire-pending-charges", pendingChargeId: pc.id, error: String(e) });
    }
  }
  return { success: true, expired };
}

// Recuerda a cocina un pedido "para más tarde" (ver scheduledFor/actPrepareOrder) antes
// de su hora — sin esto, un pedido programado con horas de anticipación podía quedar
// completamente fuera de la vista del operador hasta que ya era tarde para prepararlo a
// tiempo (nunca aparecía como "atascado" porque isStale/actAlertStuckOrders miran cuánto
// falta para scheduled_for, no cuánto pasó desde que se creó) (hallazgo de la
// re-auditoría de automatización). alerted_scheduled_reminder evita reenviar el mismo
// aviso en cada corrida de este cron mientras el pedido sigue sin empezar.
const SCHEDULED_REMINDER_LEAD_MINUTES = 20;
// Al cliente se le avisa con MUCHA más anticipación que a la cocina: 20 minutos le sirven al
// que va a armar el sándwich, pero no al que tiene que volver a su casa para recibirlo.
const CUSTOMER_REMINDER_LEAD_MINUTES = 60;
export async function actAlertScheduledOrders(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const nowIso = new Date().toISOString();
  const windowEnd = new Date(Date.now() + SCHEDULED_REMINDER_LEAD_MINUTES * 60000).toISOString();
  const upcoming = await sbGet(
    "orders",
    `status=eq.RECIBIDO&alerted_scheduled_reminder=eq.false&delivery_time=not.is.null&delivery_time=gte.${encodeURIComponent(nowIso)}&delivery_time=lte.${encodeURIComponent(windowEnd)}&select=id,ref,customer_name,delivery_time&limit=500`,
  );
  let alerted = 0;
  for (const order of upcoming) {
    try {
      const etaLabel = new Date(order.delivery_time).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
      await sendPushToAdmins({
        title: "Pedido programado se acerca 🕒",
        body: order.ref + " (" + (order.customer_name || "cliente") + ") es para las " + etaLabel + " — empieza a prepararlo.",
        url: "./index.html",
        tag: "sndwch-scheduled-" + order.id,
      });
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { alerted_scheduled_reminder: true });
      alerted++;
    } catch (e) {
      console.error("alert-scheduled-orders failed for order", order.id, e);
    }
  }
  // #27 — Recordatorio al CLIENTE, no al negocio. El de arriba avisa "empieza a prepararlo"
  // 20 minutos antes; este avisa al cliente con una hora, que es el tiempo que necesita
  // para estar en casa. Un pedido programado se hace horas antes, y para cuando llega la
  // hora el cliente puede estar en la calle: la entrega fallida cuesta el sándwich, el
  // motorizado y casi siempre el cliente.
  const clienteWindowEnd = new Date(Date.now() + CUSTOMER_REMINDER_LEAD_MINUTES * 60000).toISOString();
  const paraRecordar = await sbGet(
    "orders",
    `status=in.(RECIBIDO,PREPARANDO)&reminded_customer_scheduled=eq.false&delivery_time=not.is.null` +
      `&delivery_time=gte.${encodeURIComponent(nowIso)}&delivery_time=lte.${encodeURIComponent(clienteWindowEnd)}` +
      `&select=id,ref,customer_name,customer_phone,contact_phone,delivery_time&limit=${MAX_PUSH_PER_RUN}`,
  );
  let recordados = 0;
  for (const order of paraRecordar) {
    const phone = order.customer_phone || order.contact_phone;
    // Sin teléfono no hay a dónde mandar el push. Igual se marca la bandera: reintentarlo
    // en cada corrida no lo va a conseguir, y dejaría la consulta cargando siempre las
    // mismas filas imposibles.
    try {
      if (phone) {
        const hora = new Date(order.delivery_time).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
        await sendPushToPhone(phone, {
          title: "Tu pedido llega a las " + hora + " 🥪",
          body: "Es dentro de poco — asegúrate de estar en la dirección que nos diste. Ref " + order.ref + ".",
          url: "./index.html",
          tag: "sndwch-sched-customer-" + order.id,
        });
        recordados++;
      }
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { reminded_customer_scheduled: true });
    } catch (e) {
      console.error("alert-scheduled-orders (recordatorio al cliente) failed for order", order.id, e);
    }
  }

  return { success: true, alerted, recordados };
}

// Cruza los cobros recientes exitosos de Culqi contra los pedidos propios — un cobro real
// sin ningún pedido que lo respalde significa que al cliente se le sacó dinero y no
// recibió nada a cambio (ej. create-charge cobró bien pero el navegador del cliente se
// cerró/perdió conexión ANTES de que llegara a llamar actConfirmCulqiOrder, así que la
// reserva terminó expirando sola sin que nadie se enterara del cargo real ya hecho). El
// resto del flujo de pagos (reserva atómica, reclamo pending->charging en create-charge)
// ya reduce mucho este hueco, pero esto es la red de seguridad que lo detecta si de
// todos modos ocurre (hallazgo de la re-auditoría de automatización). Usa check_rate_limit
// como "avisar una sola vez por cargo" en vez de una columna propia — no hay ninguna fila
// nuestra que corresponda a este cargo huérfano donde guardar ese estado.
const CULQI_RECONCILE_LOOKBACK_MINUTES = 180;
const CULQI_RECONCILE_GRACE_MINUTES = 15;
export async function actReconcileCulqiCharges(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!CULQI_SECRET_KEY) return { success: true, checked: 0, orphaned: 0 };
  const r = await fetch("https://api.culqi.com/v2/charges?limit=50", {
    headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
  });
  if (!r.ok) {
    console.error("reconcile-culqi-charges: Culqi list fetch failed", await r.text());
    return { success: false, checked: 0, orphaned: 0 };
  }
  const data = await r.json();
  const now = Date.now();
  const lookbackMs = now - CULQI_RECONCILE_LOOKBACK_MINUTES * 60000;
  const graceMs = now - CULQI_RECONCILE_GRACE_MINUTES * 60000;
  const candidates = (data.data || []).filter((c: any) => {
    const t = (c.creation_date || 0) * 1000;
    return c.outcome?.type === "venta_exitosa" && t >= lookbackMs && t <= graceMs;
  });
  let orphaned = 0;
  for (const charge of candidates) {
    const orderRef = charge.metadata?.order_ref;
    // El Plan Semanal (create-credit-charge) cobra contra pending_weekly_plans en vez de
    // pending_charges/orders — mismo hueco potencial (cobro real sin nada creado del lado
    // nuestro), así que este mismo barrido cubre ambos tipos de cargo por su metadata
    // (order_ref vs credit_ref) en vez de necesitar un cron de conciliación aparte. (La
    // tarjeta de regalo dejó de usar Culqi tras su rediseño a puntos — credit_ref hoy solo
    // lo genera el Plan Semanal, ver create-credit-charge.)
    const creditRef = charge.metadata?.credit_ref;
    const ref = orderRef || creditRef;
    if (!ref) continue;
    try {
      if (orderRef) {
        const orders = await sbGet("orders", `payment_id=eq.${encodeURIComponent(charge.id)}&select=id`);
        if (orders.length) continue;
      } else {
        const purchases = await sbGet("pending_weekly_plans", `ref=eq.${encodeURIComponent(creditRef)}&status=eq.consumed&select=id`);
        if (purchases.length) continue;
      }
      const withinLimit = await rpc("check_rate_limit", { p_key: `orphan-charge:${charge.id}`, p_limit: 1, p_window_minutes: 60 * 24 * 7 });
      if (!withinLimit) continue;
      orphaned++;
      await sendPushToAdmins({
        title: "⚠️ Cobro sin pedido — revisar",
        body: `Se cobró S/${(charge.amount / 100).toFixed(2)} (ref ${ref}) pero no existe ningún ${orderRef ? "pedido" : "Plan Semanal"} con ese cargo. Verifica en Culqi y contacta al cliente.`,
        url: "./index.html",
        tag: "sndwch-orphan-charge-" + charge.id,
      });
    } catch (e) {
      console.error("reconcile-culqi-charges failed for", charge.id, e);
    }
  }
  return { success: true, checked: candidates.length, orphaned };
}

// A diferencia de alertLowStockCrossing (avisa solo el instante en que un producto CRUZA
// su umbral), este cron diario re-revisa todo el inventario y manda un resumen si algo
// SIGUE bajo/agotado — antes, si el dueño ignoraba el aviso de cruce inicial (o no vio la
// notificación en el momento), un producto podía quedar agotado por días sin ningún
// recordatorio adicional (hallazgo de la re-auditoría de automatización).
export async function actRemindLowStock(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const rows = await sbGet("inventory", "select=product_code,product_name,in_stock,stock_qty,low_stock_threshold");
  const outOfStock = rows.filter((r: any) => r.in_stock === false || (r.stock_qty != null && r.stock_qty <= 0));
  const low = rows.filter((r: any) => r.stock_qty != null && r.stock_qty > 0 && r.stock_qty <= (r.low_stock_threshold || 5));
  if (!outOfStock.length && !low.length) return { success: true, alerted: false };
  const parts: string[] = [];
  if (outOfStock.length) parts.push(outOfStock.length + " agotado(s)");
  if (low.length) parts.push(low.length + " con stock bajo");
  const names = [...outOfStock, ...low].slice(0, 6).map((r: any) => r.product_name || r.product_code).join(", ");
  await sendPushToAdmins({
    title: "Recordatorio de inventario 📦",
    body: parts.join(" y ") + ": " + names + (outOfStock.length + low.length > 6 ? "…" : "") + ".",
    url: "./index.html",
    tag: "sndwch-daily-low-stock",
    renotify: true,
  });
  return { success: true, alerted: true, outOfStock: outOfStock.length, low: low.length };
}

// ── Caducidad de tanda (#5) ──────────────────────────────────────────────────────────────
//
// SEGURIDAD ALIMENTARIA, no optimización de merma. El método de trabajo real del dueño es
// cocinar por tandas 1-2 veces por semana y en hora de servicio solo ARMAR: eso significa
// que hay proteína cocida esperando en frío durante días. Hasta acá el sistema sabía cuánto
// queda de cada insumo pero no CUÁNDO se cocinó, así que una tanda de hace cinco días y una
// de hoy eran el mismo número — y la única defensa era que una persona sola se acordara,
// justo mientras está armando pedidos.
//
// El cálculo se extrae aparte de la acción que toca la base para poder probarlo de verdad
// en `tests-api/` (mismo patrón que `cancellationDeltas`). Un caso límite mal resuelto acá
// no se manifiesta como un error: se manifiesta como una alerta que no salió.

// Se avisa un día antes de la fecha límite, no el mismo día: la próxima tanda hay que
// planificarla y cocinarla, y enterarse cuando ya venció no sirve para nada.
export const BATCH_EXPIRY_WARN_HOURS = 24;
// Espejo del default de la columna `shelf_life_days` (migración 20260829151516): extremo
// conservador de la guía USDA/foodsafety.gov para carne y pollo cocidos a <=4 °C (3-4 días).
export const BATCH_SHELF_LIFE_DEFAULT_DAYS = 3;

export type BatchRow = {
  product_code: string;
  product_name?: string | null;
  stock_qty?: number | null;
  in_stock?: boolean | null;
  batch_cooked_at?: string | null;
  shelf_life_days?: number | null;
};
export type BatchAlert = { code: string; name: string; horas: number; limite: string };

export function batchExpiryStatus(rows: BatchRow[], nowMs: number): { vencidos: BatchAlert[]; porVencer: BatchAlert[] } {
  const vencidos: BatchAlert[] = [];
  const porVencer: BatchAlert[] = [];
  for (const r of rows || []) {
    // Sin tanda registrada no hay nada que vencer: es un insumo que se compra ya listo, o
    // uno repuesto antes de que existiera la columna. Inventar una fecha acá sería
    // exactamente el error que esta alerta viene a evitar.
    if (!r.batch_cooked_at) continue;
    // Si no queda nada, la tanda se consumió. Alertar sobre un insumo en cero sería ruido
    // diario permanente, y una alarma que suena siempre deja de mirarse.
    const qty = r.stock_qty == null ? null : Number(r.stock_qty);
    if (qty == null || !(qty > 0)) continue;
    if (r.in_stock === false) continue;

    const cocinado = new Date(r.batch_cooked_at).getTime();
    if (!Number.isFinite(cocinado)) continue;
    const dias = Number(r.shelf_life_days);
    const vida = Number.isFinite(dias) && dias > 0 ? dias : BATCH_SHELF_LIFE_DEFAULT_DAYS;
    const limiteMs = cocinado + vida * 24 * 60 * 60 * 1000;
    const horas = Math.round((limiteMs - nowMs) / (60 * 60 * 1000));
    const item: BatchAlert = {
      code: r.product_code,
      name: r.product_name || r.product_code,
      horas,
      limite: new Date(limiteMs).toISOString(),
    };
    if (nowMs >= limiteMs) vencidos.push(item);
    else if (nowMs >= limiteMs - BATCH_EXPIRY_WARN_HOURS * 60 * 60 * 1000) porVencer.push(item);
  }
  // Lo más urgente primero: si el aviso se corta por longitud, tiene que cortar por la cola.
  vencidos.sort((a, b) => a.horas - b.horas);
  porVencer.sort((a, b) => a.horas - b.horas);
  return { vencidos, porVencer };
}

const BATCH_EXPIRY_MAX_NOMBRES = 6;

export async function actAlertBatchExpiry(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const rows = await sbGet(
    "inventory",
    "select=product_code,product_name,in_stock,stock_qty,batch_cooked_at,shelf_life_days&limit=500",
  );
  const { vencidos, porVencer } = batchExpiryStatus(rows, Date.now());
  if (!vencidos.length && !porVencer.length) return { success: true, alerted: false };

  const nombres = (xs: BatchAlert[]) =>
    xs.slice(0, BATCH_EXPIRY_MAX_NOMBRES).map((x) => x.name).join(", ") + (xs.length > BATCH_EXPIRY_MAX_NOMBRES ? "…" : "");
  const partes: string[] = [];
  if (vencidos.length) partes.push(`PASARON su fecha límite: ${nombres(vencidos)}`);
  if (porVencer.length) partes.push(`vencen en menos de ${BATCH_EXPIRY_WARN_HOURS} h: ${nombres(porVencer)}`);

  await sendPushToAdmins({
    // El título cambia según haya algo ya vencido o solo por vencer: no es lo mismo "hay
    // que cocinar mañana" que "hay que sacar eso de la refri ahora".
    title: vencidos.length ? "🚫 Tanda vencida — no usar" : "⏳ Tanda por vencer",
    body: partes.join(". ") + ".",
    url: "./index.html",
    tag: "sndwch-batch-expiry",
    renotify: true,
  });
  return { success: true, alerted: true, vencidos: vencidos.length, porVencer: porVencer.length };
}
