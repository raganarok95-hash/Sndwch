// SND//WCH — api / actions/orders
// Colocar pedido, historial de pedidos (cliente + invitado), y todo el flujo admin de
// cola de pedidos: avanzar estado, confirmar pago manual (Yape/Plin/COD), cancelar, y
// la expiración automática de pagos manuales nunca confirmados.
import {
  CULQI_SECRET_KEY, REFERRAL_BONUS_POINTS, VIP_POINTS_MULTIPLIER, STALE_MANUAL_PAYMENT_HOURS,
  isWithinStoreHours,
} from "../env.ts";
import { sbGet, sbInsert, sbUpdate, rpc } from "../db.ts";
import { ApiError, SessionPayload } from "../types.ts";
import { verifyActiveSession, requireSession, requireAdmin, safeCustomer, verifyCronSecret } from "../session.ts";
import { loadCatalogPrices, deriveCart, priceCartItem, tierName, REWARDS } from "../catalog.ts";
import { sendPushToPhone, STATUS_PUSH_MESSAGES, etaWindowText } from "../push.ts";
import { logAdminAction } from "../logging.ts";

async function verifyCulqiCharge(chargeId: string, expectedAmountCents: number): Promise<boolean> {
  if (!CULQI_SECRET_KEY) return false;
  try {
    const r = await fetch(`https://api.culqi.com/v2/charges/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
    });
    if (!r.ok) return false;
    const data = await r.json();
    const successful = data?.outcome?.type === "venta_exitosa";
    const amountMatches = Number(data?.amount) === expectedAmountCents;
    return successful && amountMatches;
  } catch {
    return false;
  }
}

export async function actPlaceOrder(b: any) {
  const ref = String(b.ref || "").trim();
  const name = String(b.name || "").trim();
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
  if (!ref || !name || !address || clientTotal < 0) throw new ApiError("Faltan datos del pedido.");
  if (manualMethod && rewardId) throw new ApiError("Las recompensas no se pueden usar con Yape/Plin hasta confirmar el pago.", 400);

  const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
  if (scheduledFor) {
    const schedDate = new Date(scheduledFor);
    const t = schedDate.getTime();
    if (!t || t < Date.now() - 60000) throw new ApiError("La hora programada no es válida.", 400);
    if (!isWithinStoreHours(schedDate)) throw new ApiError("Esa hora está fuera de nuestro horario de atención.", 400);
  }

  // Precios vigentes (pueden haber cambiado desde el panel admin sin redeploy) —
  // ver loadCatalogPrices/catalog_prices.
  await loadCatalogPrices();
  const { ingredients, expectedTotal, sanitizedItems } = deriveCart(b.items, rewardId);
  if (Math.round(expectedTotal) !== Math.round(clientTotal)) {
    throw new ApiError("El total no coincide con los productos del pedido.", 400);
  }

  // verifyActiveSession no depende de la reserva de stock (ni viceversa) — se lanza ya
  // mismo y se resuelve más abajo justo donde se usa, en vez de esperar a que
  // reserve_inventory termine primero para recién empezarla.
  const sessionPromise: Promise<{ payload: SessionPayload; row: any } | null> = b.token
    ? verifyActiveSession(b.token)
    : Promise.resolve(null);

  // Reserva de stock ANTES de cobrar/registrar nada: reserve_inventory revisa Y descuenta
  // en una sola transacción atómica (con bloqueo de fila), así que dos pedidos concurrentes
  // por el último ingrediente disponible no pueden ambos "pasar" — el que llega segundo
  // rechaza limpio en vez de sobrevender. Antes esto se hacía leyendo el stock y
  // escribiéndolo de vuelta al final del todo, sin rechazar el pedido ni protegerlo de
  // condiciones de carrera.
  if (ingredients.length) {
    const codes = Array.from(new Set(ingredients));
    const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
    try {
      await rpc("reserve_inventory", { p_codes: codes, p_qtys: qtys });
    } catch (e) {
      throw new ApiError("Uno o más productos de tu pedido se agotaron. Actualiza tu carrito e intenta de nuevo.", 409);
    }
  }
  // A partir de aquí, `total` es SIEMPRE el valor recalculado por el servidor — nunca el
  // que mandó el cliente. Todo lo que mueve dinero (orders.total, cobro a Culqi, puntos,
  // crédito) debe basarse en esta fuente de verdad, no en `clientTotal` (que solo sirvió
  // para detectar un descuadre grosero arriba; confiar en él aquí abajo permitiría pagar
  // centavos menos del precio real vía devtools).
  const total = expectedTotal;
  const chargeId = useCredit || manualMethod || total === 0 ? "" : String(b.chargeId || "").trim();
  if (total > 0 && !useCredit && !manualMethod && !chargeId) throw new ApiError("Faltan datos del pedido.");

  let phone: string | null = null;
  let custRow: any = null;
  const active = await sessionPromise;
  if (active) {
    phone = active.payload.phone;
    custRow = active.row;
  }

  let reward: { pts: number; label: string } | null = null;
  if (rewardId) {
    if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para usar una recompensa.", 401);
    reward = REWARDS[rewardId] || null;
    if (!reward) throw new ApiError("Recompensa inválida.");
    if ((custRow.points || 0) < reward.pts) throw new ApiError("No tienes puntos suficientes para esta recompensa.", 402);
  }

  let paymentMethod = "culqi";
  let paymentId: string | null = null;
  let paymentStatus = "paid";
  if (total === 0) {
    paymentMethod = "reward";
  } else if (useCredit) {
    if (!phone || !custRow) throw new ApiError("Debes iniciar sesión para pagar con tu crédito.", 401);
    if ((custRow.credit_balance || 0) < total) throw new ApiError("No tienes crédito suficiente para cubrir este pedido.", 402);
    paymentMethod = "credit";
  } else if (manualMethod) {
    paymentMethod = manualMethod;
    paymentStatus = "pending";
  } else {
    const amountCents = Math.round(total * 100);
    const paymentOk = await verifyCulqiCharge(chargeId, amountCents);
    if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);
    paymentId = chargeId;
  }

  async function insertOrder() {
    return sbInsert("orders", {
      ref,
      customer_phone: phone,
      customer_name: name,
      customer_email: email || null,
      customer_address: address,
      summary: b.summary || "",
      notes: b.notes || null,
      total,
      status: "RECIBIDO",
      payment_status: paymentStatus,
      payment_id: paymentId,
      payment_method: paymentMethod,
      mode: null,
      product_key: null,
      size: null,
      build: null,
      items: sanitizedItems,
      delivery_time: scheduledFor,
      redeemed_reward: reward ? reward.label : null,
    });
  }

  let customer = null;
  let orderRows: any[];
  if (phone && custRow && paymentStatus === "paid") {
    const c = custRow;
    const isFirstOrder = (c.total_orders || 0) === 0;
    const isReferral = isFirstOrder && !!c.referred_by;
    // Perk real de tier (antes los tiers eran solo una etiqueta/color sin ningún beneficio
    // tangible): VIP gana puntos 1.25x sobre el total del pedido. Se calcula sobre el tier
    // ANTES de este pedido (el que ya tenía el cliente al entrar), no el que tendría después.
    let basePoints = total;
    if (tierName(c.points || 0) === "VIP") basePoints = Math.round(basePoints * VIP_POINTS_MULTIPLIER);
    let pointsDelta = basePoints;
    if (reward) pointsDelta -= reward.pts;

    // Actualiza el saldo del cliente ANTES de insertar el pedido: si el crédito o los
    // puntos resultan insuficientes por una carrera con otra solicitud concurrente del
    // mismo cliente, finalize_order_customer_update (migración del mismo nombre) lanza
    // una excepción y el pedido NUNCA llega a crearse — en vez de quedar un pedido
    // marcado "pagado" sin el débito real detrás. La función aplica puntos + crédito +
    // contador de pedidos + última dirección + canje + bono de referido en UNA sola
    // transacción de Postgres.
    const updated = await rpc("finalize_order_customer_update", {
      p_phone: phone,
      p_points_delta: pointsDelta,
      p_credit_delta: useCredit ? -total : 0,
      p_total_orders_delta: 1,
      p_last_address: address,
      p_total_redeemed_delta: reward ? 1 : 0,
      p_referrer_phone: isReferral ? c.referred_by : null,
      p_referral_bonus: isReferral ? REFERRAL_BONUS_POINTS : 0,
    });
    customer = safeCustomer(updated);

    orderRows = await insertOrder();

    // Registro de auditoría (tabla transactions) — se hace DESPUÉS de que el saldo y el
    // pedido ya quedaron correctos arriba; si algo aquí falla, ambos siguen siendo la
    // fuente de verdad y solo falta una línea de historial, no un descuadre de dinero.
    // Los inserts de abajo no dependen entre sí, así que corren en paralelo en vez de serie.
    const auditInserts: Promise<unknown>[] = [
      sbInsert("transactions", {
        customer_phone: phone,
        type: "earn_confirmed",
        // basePoints (no `total`): ya incluye el multiplicador VIP — usar `total` acá
        // desalinearía el historial visible del cliente con lo que finalize_order_customer_update
        // realmente le acreditó arriba (el costo de canje de recompensa, si hay, se refleja
        // aparte como su propia transacción "redeem" más abajo).
        points: basePoints,
        description: useCredit ? "Pedido SND//WCH (pagado con crédito)" : "Pedido SND//WCH (pago con tarjeta)",
        order_ref: ref,
        confirmed: true,
      }),
    ];
    if (useCredit) {
      auditInserts.push(sbInsert("credit_ledger", {
        customer_phone: phone,
        delta: -total,
        reason: "Pedido pagado con crédito (" + ref + ")",
      }));
    }
    if (reward) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: phone,
        type: "redeem",
        points: -reward.pts,
        description: reward.label + " canjeado en pedido " + ref,
        order_ref: ref,
        confirmed: true,
      }));
    }
    if (isReferral) {
      auditInserts.push(sbInsert("transactions", {
        customer_phone: phone,
        type: "earn_confirmed",
        points: REFERRAL_BONUS_POINTS,
        description: "Bono por referido",
        confirmed: true,
      }));
      auditInserts.push(sbInsert("transactions", {
        customer_phone: c.referred_by,
        type: "earn_confirmed",
        points: REFERRAL_BONUS_POINTS,
        description: "Bono por invitar a " + name,
        confirmed: true,
      }));
    }
    await Promise.all(auditInserts);
  } else {
    orderRows = await insertOrder();
  }

  return { success: true, order: orderRows[0], customer };
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
export async function actAdminOrders(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("orders", `status=in.(RECIBIDO,PREPARANDO,EN+CAMINO)&order=created_at.desc&limit=${ADMIN_ORDERS_LIMIT + 1}`);
  return { orders: rows.slice(0, ADMIN_ORDERS_LIMIT), truncated: rows.length > ADMIN_ORDERS_LIMIT };
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
  const isFirstOrder = (c.total_orders || 0) === 0;
  const methodLabel = order.payment_method === "yape" ? "Yape" : order.payment_method === "plin" ? "Plin" : "pago contra entrega";

  let referrerPhone: string | null = null;
  if (isFirstOrder && c.referred_by) {
    const referrerRows = await sbGet("customers", `phone=eq.${encodeURIComponent(c.referred_by)}&select=phone`);
    if (referrerRows.length) referrerPhone = c.referred_by;
  }

  // Una sola llamada atómica (ver migración finalize_order_customer_update) en vez de
  // varias secuenciales — mismo motivo que en actPlaceOrder.
  await rpc("finalize_order_customer_update", {
    p_phone: order.customer_phone,
    p_points_delta: order.total,
    p_credit_delta: 0,
    p_total_orders_delta: 1,
    p_last_address: order.customer_address,
    p_total_redeemed_delta: 0,
    p_referrer_phone: referrerPhone,
    p_referral_bonus: referrerPhone ? REFERRAL_BONUS_POINTS : 0,
  });

  await sbInsert("transactions", {
    customer_phone: order.customer_phone,
    type: "earn_confirmed",
    points: order.total,
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
      points: REFERRAL_BONUS_POINTS,
      description: "Bono por invitar a " + order.customer_name,
      confirmed: true,
    });
  }
}

// CANCELADO deliberadamente NO está aquí: solo se llega a ese estado a través de
// actAdminCancelOrder, que además restituye el inventario descontado — si se agregara
// aquí, este endpoint genérico permitiría "cancelar" un pedido sin devolver el stock.
const VALID_ORDER_STATUSES = new Set(["RECIBIDO", "PREPARANDO", "EN CAMINO", "ENTREGADO"]);
export async function actAdminUpdateStatus(b: any) {
  await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  const status = String(b.status || "");
  if (!orderId || !status) throw new ApiError("Faltan datos.");
  if (!VALID_ORDER_STATUSES.has(status)) throw new ApiError("Estado de pedido inválido.", 400);
  const upd: Record<string, unknown> = { status };
  if (b.etaMinutes) {
    const eta = Number(b.etaMinutes);
    if (!Number.isFinite(eta) || eta < 0 || eta > 240) throw new ApiError("ETA inválida.", 400);
    upd.eta_minutes = eta;
  }

  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,total,customer_phone,customer_name,customer_address,payment_method,payment_status`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);

  // Yape/Plin sin confirmar: no se puede avanzar el pedido de RECIBIDO — evita que
  // cocina empiece a preparar un pedido que en realidad nunca se pagó.
  if (order && (order.payment_method === "yape" || order.payment_method === "plin") && order.payment_status !== "paid" && status !== "RECIBIDO") {
    throw new ApiError("Confirma que el pago llegó antes de avanzar el estado del pedido.", 400);
  }

  if (status === "ENTREGADO" && order && order.payment_method === "cod" && order.payment_status !== "paid") {
    // Reclamo atómico: el filtro payment_status=neq.paid en la MISMA sentencia hace que,
    // si dos solicitudes llegan casi juntas (doble clic en "ENTREGADO"), solo una de ellas
    // encuentre la fila para actualizar — la otra recibe un array vacío y no vuelve a
    // otorgar puntos por el mismo pedido (ver el mismo patrón en actAdminConfirmPayment).
    const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid`, { payment_status: "paid" });
    if (claim.length) await confirmManualPayment(order);
  }

  const rows = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, upd);

  if (order?.customer_phone && STATUS_PUSH_MESSAGES[status]) {
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

  return { success: true, order: rows[0] };
}

// El operador revisa su propia app de Yape/Plin y confirma aquí que el dinero llegó
// antes de que el pedido pueda avanzar a cocina. Solo entonces se otorgan los puntos.
export async function actAdminConfirmPayment(b: any) {
  await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=ref,total,customer_phone,customer_name,customer_address,payment_method,payment_status`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (!["yape", "plin", "cod"].includes(order.payment_method)) {
    throw new ApiError("Este pedido no requiere confirmación manual de pago.", 400);
  }
  // Reclamo atómico ANTES de otorgar puntos: el filtro payment_status=neq.paid en la misma
  // sentencia hace que un doble clic o un reintento de red en "confirmar pago" solo pueda
  // ganarlo UNA vez — antes se leía payment_status, se otorgaban puntos, y RECIÉN AL FINAL
  // se marcaba paid, dejando una ventana donde dos solicitudes casi simultáneas otorgaban
  // el bono/puntos dos veces para el mismo pedido (confirmado en vivo durante la auditoría).
  const claim = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}&payment_status=neq.paid`, { payment_status: "paid" });
  if (!claim.length) throw new ApiError("Este pedido ya estaba confirmado.", 409);
  await confirmManualPayment(order);
  return { success: true, order: claim[0] };
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

export async function actAdminCancelOrder(b: any) {
  const s = await requireAdmin(b.token);
  const orderId = String(b.orderId || "");
  if (!orderId) throw new ApiError("Falta el pedido.");
  const orderRows = await sbGet("orders", `id=eq.${encodeURIComponent(orderId)}&select=id,status,payment_status,items`);
  const order = orderRows[0];
  if (!order) throw new ApiError("Pedido no encontrado.", 404);
  if (order.status === "ENTREGADO") throw new ApiError("Un pedido ya entregado no se puede cancelar.", 400);
  if (order.status === "CANCELADO") throw new ApiError("Este pedido ya está cancelado.", 409);
  if (order.payment_status === "paid") {
    throw new ApiError("Este pedido ya fue pagado — coordina un reembolso manual si corresponde antes de cancelarlo.", 400);
  }

  await restockOrderItems(order.items);

  const rows = await sbUpdate("orders", `id=eq.${encodeURIComponent(orderId)}`, { status: "CANCELADO" });
  await logAdminAction(s.phone, "cancel-order", orderId);
  return { success: true, order: rows[0] };
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
    `payment_method=in.(yape,plin)&payment_status=neq.paid&status=eq.RECIBIDO&created_at=lt.${encodeURIComponent(cutoff)}&select=id,items`,
  );
  let cancelled = 0;
  for (const order of stale) {
    try {
      await restockOrderItems(order.items);
      await sbUpdate("orders", `id=eq.${encodeURIComponent(order.id)}`, { status: "CANCELADO" });
      cancelled++;
    } catch (e) {
      console.error("expire-stale-manual-payments failed for order", order.id, e);
    }
  }
  return { success: true, cancelled };
}
