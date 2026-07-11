// SND//WCH — api / actions/customer
// Acciones de cuenta autenticada que no son ni auth ni pedidos: direcciones guardadas,
// favoritos, calificaciones, el reto mensual, regalar crédito, y suscripciones push.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, safeCustomer, verifyCronSecret, verifyActiveSession } from "../session.ts";
import { loadCatalogPrices, deriveOrder, buildFromOrder } from "../catalog.ts";
import { limaMonthKey, limaMonthStartIso, limaDayStartIso } from "../env.ts";
import { sendPushToPhone } from "../push.ts";
import { verifyCulqiCharge } from "./orders.ts";

// Antes actAddressesAdd y actFavoritesAdd repetían el mismo patrón de "cuenta las filas
// existentes, rechaza si ya llegó al máximo" cada uno con su propio mensaje casi idéntico
// (hallazgo de la auditoría de código) — este helper lo centraliza.
async function assertUnderLimit(table: string, phone: string, max: number, label: string): Promise<void> {
  const existing = await sbGet(table, `customer_phone=eq.${encodeURIComponent(phone)}&select=id`);
  if (existing.length >= max) throw new ApiError(`Ya tienes el máximo de ${label} (${max}).`, 400);
}

const MAX_ADDRESSES = 6;
export async function actAddressesList(b: any) {
  const s = await requireSession(b.token);
  return { addresses: await sbGet("saved_addresses", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.asc`) };
}
export async function actAddressesAdd(b: any) {
  const s = await requireSession(b.token);
  const label = String(b.label || "").trim();
  const address = String(b.address || "").trim();
  if (!label || !address) throw new ApiError("Ingresa un nombre y la dirección.");
  await assertUnderLimit("saved_addresses", s.phone, MAX_ADDRESSES, "direcciones guardadas");
  const rows = await sbInsert("saved_addresses", {
    customer_phone: s.phone,
    label,
    address,
    lat: typeof b.lat === "number" ? b.lat : null,
    lon: typeof b.lon === "number" ? b.lon : null,
  });
  return { success: true, address: rows[0] };
}
export async function actAddressesDelete(b: any) {
  const s = await requireSession(b.token);
  const id = String(b.id || "");
  if (!id) throw new ApiError("Falta la dirección.");
  await sbDelete("saved_addresses", `id=eq.${encodeURIComponent(id)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

const MAX_FAVORITES = 10;
export async function actFavoritesList(b: any) {
  const s = await requireSession(b.token);
  return { favorites: await sbGet("favorites", `customer_phone=eq.${encodeURIComponent(s.phone)}&order=created_at.desc`) };
}
export async function actFavoritesAdd(b: any) {
  const s = await requireSession(b.token);
  const name = String(b.name || "").trim();
  if (!name) throw new ApiError("Ponle un nombre a tu favorito.");
  await assertUnderLimit("favorites", s.phone, MAX_FAVORITES, "favoritos guardados");
  await loadCatalogPrices();
  deriveOrder(b);
  const rows = await sbInsert("favorites", { customer_phone: s.phone, name, build: buildFromOrder(b) });
  return { success: true, favorite: rows[0] };
}
export async function actFavoritesDelete(b: any) {
  const s = await requireSession(b.token);
  const id = String(b.id || "");
  if (!id) throw new ApiError("Falta el favorito.");
  await sbDelete("favorites", `id=eq.${encodeURIComponent(id)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

export async function actSubmitRating(b: any) {
  const ref = String(b.ref || "").trim();
  const stars = parseInt(b.stars, 10);
  if (!ref || !stars || stars < 1 || stars > 5) throw new ApiError("Calificación inválida.");
  const orders = await sbGet("orders", `ref=eq.${encodeURIComponent(ref)}&select=ref,customer_phone,status`);
  if (!orders.length) throw new ApiError("Pedido no encontrado.", 404);
  if (orders[0].status !== "ENTREGADO") throw new ApiError("Solo puedes calificar un pedido ya entregado.", 400);
  const existing = await sbGet("ratings", `order_ref=eq.${encodeURIComponent(ref)}&select=id`);
  if (existing.length) throw new ApiError("Este pedido ya fue calificado.", 409);
  await sbInsert("ratings", {
    order_ref: ref,
    customer_phone: orders[0].customer_phone || null,
    stars,
    comment: b.comment ? String(b.comment).trim().slice(0, 500) : null,
  });
  return { success: true };
}

const CHALLENGE_TARGET_ORDERS = 3;
const CHALLENGE_BONUS_POINTS = 50;
export async function actClaimChallenge(b: any) {
  const s = await requireSession(b.token);
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(s.phone)}`);
  if (!rows.length) throw new ApiError("Cliente no encontrado.", 404);
  const c = rows[0];
  const now = new Date();
  // Antes usaba new Date().getFullYear()/getMonth() (hora del SERVIDOR, Deno Deploy
  // corre en UTC) — mismo bug de zona horaria que tenía isWithinStoreHours: cerca de fin
  // de mes, el "mes" del servidor podía ir ~5h adelantado del mes real en Lima.
  const thisMonth = limaMonthKey(now);
  if (c.challenge_claimed_month === thisMonth) throw new ApiError("Ya reclamaste el reto de este mes.", 409);
  const monthStart = limaMonthStartIso(now);
  const orders = await sbGet(
    "orders",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&payment_status=eq.paid&created_at=gte.${encodeURIComponent(monthStart)}&select=id`,
  );
  if (orders.length < CHALLENGE_TARGET_ORDERS) throw new ApiError(`Todavía te faltan pedidos este mes (${orders.length}/${CHALLENGE_TARGET_ORDERS}).`, 400);
  // claim_monthly_challenge (marca el mes reclamado + suma el bono, atómico) va PRIMERO —
  // antes el insert de auditoría (transactions) se hacía antes que esto, así que un fallo
  // entre ambos dejaba un registro de bono sin el saldo real detrás (hallazgo de la
  // auditoría de backend, mismo patrón que actAdminManualPoints). Dos solicitudes
  // simultáneas no pueden ambas pasar el chequeo de arriba y duplicar el bono (la segunda
  // llega tarde y la función lanza 'already_claimed').
  const claimed = await rpc("claim_monthly_challenge", { p_phone: s.phone, p_month: thisMonth, p_bonus: CHALLENGE_BONUS_POINTS });
  const finalRow = Array.isArray(claimed) ? claimed[0] : claimed;
  await sbInsert("transactions", {
    customer_phone: s.phone,
    type: "earn_confirmed",
    points: CHALLENGE_BONUS_POINTS,
    description: "Reto mensual completado (" + CHALLENGE_TARGET_ORDERS + " pedidos)",
    confirmed: true,
  });
  return { success: true, customer: safeCustomer(finalRow) };
}

// Antes actCreditGift transfería crédito con un solo tap y sin mostrarle al cliente el
// nombre del destinatario — un typo en el teléfono mandaba dinero real a un desconocido
// sin ninguna forma de verificar antes de confirmar (hallazgo de la auditoría de flujo de
// pedidos). El cliente llama esto primero para mostrar "¿Enviar S/X a NOMBRE?" antes de
// llamar a actCreditGift.
export async function actCreditLookup(b: any) {
  const s = await requireSession(b.token);
  const toPhone = String(b.toPhone || "").trim();
  if (!toPhone) throw new ApiError("Ingresa un teléfono.");
  if (toPhone === s.phone) throw new ApiError("No puedes regalarte crédito a ti mismo.");
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(toPhone)}&select=name`);
  if (!rows.length) throw new ApiError("No encontramos una cuenta con ese teléfono.", 404);
  return { name: rows[0].name };
}

export async function actCreditGift(b: any) {
  const s = await requireSession(b.token);
  const toPhone = String(b.toPhone || "").trim();
  const amount = Number(b.amount || 0);
  if (!toPhone || !amount || amount <= 0) throw new ApiError("Ingresa un teléfono y un monto válido.");
  if (toPhone === s.phone) throw new ApiError("No puedes regalarte crédito a ti mismo.");
  const receiverRows = await sbGet("customers", `phone=eq.${encodeURIComponent(toPhone)}&select=phone`);
  if (!receiverRows.length) throw new ApiError("No encontramos una cuenta con ese teléfono.", 404);
  // gift_credit (migración atomic_balance_functions) debita al emisor y acredita al
  // receptor en UNA sola transacción de Postgres — si algo falla a la mitad, ambas
  // mitades se revierten juntas en vez de que el dinero "desaparezca".
  await rpc("gift_credit", { p_from: s.phone, p_to: toPhone, p_amount: amount });
  await Promise.all([
    sbInsert("credit_ledger", { customer_phone: s.phone, delta: -amount, reason: "Regalo enviado", related_phone: toPhone }),
    sbInsert("credit_ledger", { customer_phone: toPhone, delta: amount, reason: "Regalo recibido", related_phone: s.phone }),
  ]);
  return { success: true };
}

export async function actPushSubscribe(b: any) {
  const s = await requireSession(b.token);
  const endpoint = String(b.endpoint || "");
  const p256dh = String(b.p256dh || "");
  const auth = String(b.auth || "");
  if (!endpoint || !p256dh || !auth) throw new ApiError("Faltan datos de la suscripción.");
  // Antes reasignaba una suscripción existente scoped solo por endpoint, sin verificar que
  // ya perteneciera a este mismo cliente — si alguien llegara a conocer el endpoint push de
  // otra persona, podía secuestrar esa suscripción hacia su propio teléfono (hallazgo de la
  // re-auditoría de seguridad). El endpoint es opaco/impredecible (lo emite el navegador),
  // así que el riesgo práctico era bajo, pero el chequeo de dueño faltaba por completo.
  const existing = await sbGet("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}&select=id,customer_phone`);
  if (existing.length && existing[0].customer_phone && existing[0].customer_phone !== s.phone) {
    throw new ApiError("Este dispositivo ya está suscrito con otra cuenta.", 409);
  }
  if (existing.length) {
    await sbUpdate("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}`, { customer_phone: s.phone, p256dh, auth });
  } else {
    await sbInsert("push_subscriptions", { customer_phone: s.phone, endpoint, p256dh, auth });
  }
  return { success: true };
}

export async function actPushUnsubscribe(b: any) {
  const s = await requireSession(b.token);
  const endpoint = String(b.endpoint || "");
  if (!endpoint) throw new ApiError("Falta el endpoint.");
  await sbDelete("push_subscriptions", `endpoint=eq.${encodeURIComponent(endpoint)}&customer_phone=eq.${encodeURIComponent(s.phone)}`);
  return { success: true };
}

// Recuerda a los clientes que ya completaron el reto mensual (3+ pedidos pagados este
// mes) pero todavía no lo reclaman — antes, si alguien alcanzaba el objetivo sin volver a
// abrir la app antes de fin de mes, perdía el bono de 50 puntos en silencio, sin ningún
// aviso de que ya lo tenía ganado (hallazgo de la re-auditoría de automatización). Es solo
// un recordatorio: no otorga puntos por sí solo, el cliente sigue teniendo que tocar
// "RECLAMAR RECOMPENSA" en su perfil — así que no hay riesgo de inventar o duplicar saldo.
// check_rate_limit (misma RPC que usa reconcile-culqi-charges para "avisar una sola vez")
// evita reenviar el mismo recordatorio más de una vez por cliente en el mes, sin necesitar
// una columna nueva en customers.
export async function actRemindUnclaimedChallenge(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const now = new Date();
  const thisMonth = limaMonthKey(now);
  const monthStart = limaMonthStartIso(now);
  const orders = await sbGet(
    "orders",
    `payment_status=eq.paid&created_at=gte.${encodeURIComponent(monthStart)}&customer_phone=not.is.null&select=customer_phone`,
  );
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.customer_phone, (counts.get(o.customer_phone) || 0) + 1);
  const qualifyingPhones = [...counts.entries()].filter(([, n]) => n >= CHALLENGE_TARGET_ORDERS).map(([phone]) => phone);
  if (!qualifyingPhones.length) return { success: true, reminded: 0 };
  const phonesList = qualifyingPhones.map((p) => `"${p}"`).join(",");
  const customers = await sbGet("customers", `phone=in.(${phonesList})&select=phone,challenge_claimed_month`);
  let reminded = 0;
  for (const c of customers) {
    if (c.challenge_claimed_month === thisMonth) continue;
    try {
      const withinLimit = await rpc("check_rate_limit", { p_key: `challenge-reminder:${c.phone}:${thisMonth}`, p_limit: 1, p_window_minutes: 60 * 24 * 31 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "¡Ya ganaste tu reto mensual! 🏆",
        body: `Hiciste ${CHALLENGE_TARGET_ORDERS} pedidos este mes — entra a tu perfil y toca "Reclamar recompensa" para sumar tus ${CHALLENGE_BONUS_POINTS} puntos antes de que termine el mes.`,
        url: "./index.html",
        tag: "sndwch-challenge-reminder-" + thisMonth,
      });
      reminded++;
    } catch (e) {
      console.error("remind-unclaimed-challenge failed for", c.phone, e);
    }
  }
  return { success: true, reminded };
}

const FREQUENT_ORDER_THRESHOLD = 3;
const FREQUENT_WINDOW_DAYS = 30;
const PEAK_HOUR_COPY: Record<"lunch" | "dinner", { title: string; body: string }> = {
  lunch: { title: "¿Ya pensaste en tu almuerzo? 🥪", body: "Pide tu sándwich favorito ahora y recíbelo antes de que se te haga tarde." },
  dinner: { title: "Hora de la cena 🌙", body: "Cierra el día con un sándwich SND//WCH — pide ahora." },
};

// Recuerda a clientes frecuentes (3+ pedidos pagados en los últimos 30 días) que todavía
// no pidieron hoy, cerca del almuerzo o la cena — el cron manda `slot` ("lunch"/"dinner")
// en cada disparo, así que la misma acción cubre ambos horarios con copy distinto. Reusa
// check_rate_limit (clave con fecha+slot) para no duplicar el aviso si el cron se
// reintenta, sin necesitar una columna nueva.
export async function actRemindPeakHour(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const slot: "lunch" | "dinner" = b.slot === "dinner" ? "dinner" : "lunch";
  const now = new Date();
  const windowStart = new Date(now.getTime() - FREQUENT_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
  const todayStart = limaDayStartIso(now);
  const todayStartMs = new Date(todayStart).getTime();
  const orders = await sbGet(
    "orders",
    `payment_status=eq.paid&created_at=gte.${encodeURIComponent(windowStart)}&customer_phone=not.is.null&select=customer_phone,created_at`,
  );
  const counts = new Map<string, number>();
  const orderedToday = new Set<string>();
  for (const o of orders) {
    counts.set(o.customer_phone, (counts.get(o.customer_phone) || 0) + 1);
    if (new Date(o.created_at).getTime() >= todayStartMs) orderedToday.add(o.customer_phone);
  }
  const targets = [...counts.entries()]
    .filter(([phone, n]) => n >= FREQUENT_ORDER_THRESHOLD && !orderedToday.has(phone))
    .map(([phone]) => phone);
  if (!targets.length) return { success: true, reminded: 0 };
  const dateKey = todayStart.slice(0, 10);
  const copy = PEAK_HOUR_COPY[slot];
  let reminded = 0;
  for (const phone of targets) {
    try {
      const withinLimit = await rpc("check_rate_limit", { p_key: `peak-reminder:${phone}:${dateKey}:${slot}`, p_limit: 1, p_window_minutes: 60 * 24 });
      if (!withinLimit) continue;
      await sendPushToPhone(phone, {
        title: copy.title,
        body: copy.body,
        url: "./index.html",
        tag: "sndwch-peak-" + slot + "-" + dateKey,
      });
      reminded++;
    } catch (e) {
      console.error("remind-peak-hour failed for", phone, e);
    }
  }
  return { success: true, reminded };
}

// Tarjeta de regalo digital: comprar crédito con un cobro real (Culqi) para acreditárselo
// a OTRO cliente — distinto de actCreditGift (que transfiere saldo YA PROPIO, sin cobro
// nuevo de por medio). Sigue el mismo patrón de dos pasos que el pago de pedidos
// (actPrepareOrder/actConfirmCulqiOrder, ver orders.ts): primero se valida y reserva TODO
// en pending_credit_purchases, y solo si eso tuvo éxito el cliente abre el widget de
// Culqi — así nunca se cobra a alguien cuyo destinatario/monto de todas formas iba a ser
// rechazado. Usa su propia tabla (no pending_charges) porque ese cargo no reserva
// inventario ni crea un pedido — mezclar ambos casos en la misma tabla hubiera obligado a
// rellenar columnas de pedido (dirección, items) que aquí no aplican.
const CREDIT_PURCHASE_MIN = 10;
const CREDIT_PURCHASE_MAX = 500;
const CREDIT_PURCHASE_TTL_MINUTES = 15;

export async function actPrepareCreditPurchase(b: any) {
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  const toPhone = String(b.toPhone || "").trim();
  const amount = Number(b.amount || 0);
  const message = b.message ? String(b.message).trim().slice(0, 200) : null;
  if (!toPhone) throw new ApiError("Ingresa el teléfono del destinatario.");
  if (toPhone === active.payload.phone) throw new ApiError("No puedes comprarte una tarjeta de regalo a ti mismo.");
  if (!amount || amount < CREDIT_PURCHASE_MIN || amount > CREDIT_PURCHASE_MAX) {
    throw new ApiError(`El monto debe estar entre S/${CREDIT_PURCHASE_MIN} y S/${CREDIT_PURCHASE_MAX}.`);
  }
  const receiverRows = await sbGet("customers", `phone=eq.${encodeURIComponent(toPhone)}&select=phone,name`);
  if (!receiverRows.length) throw new ApiError("No encontramos una cuenta con ese teléfono.", 404);

  // Mismo bloqueo por concurrencia que actPrepareOrder: evita que el mismo comprador
  // dispare dos compras de crédito en simultáneo (dos pestañas, doble tap, reintento tras
  // un fallo de red ambiguo) generando dos cargos reales.
  const nowIso = new Date().toISOString();
  const existing = await sbGet(
    "pending_credit_purchases",
    `buyer_phone=eq.${encodeURIComponent(active.payload.phone)}&status=eq.pending&expires_at=gt.${encodeURIComponent(nowIso)}&select=id`,
  );
  if (existing.length) {
    throw new ApiError("Ya tienes una compra de tarjeta de regalo en proceso. Espera un momento antes de intentar de nuevo.", 409);
  }

  const ref = "GIFT-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + CREDIT_PURCHASE_TTL_MINUTES * 60000).toISOString();
  await sbInsert("pending_credit_purchases", {
    ref,
    buyer_phone: active.payload.phone,
    buyer_name: active.row.name || "",
    to_phone: toPhone,
    to_name: receiverRows[0].name,
    amount,
    message,
    expires_at: expiresAt,
  });
  return { success: true, ref, expiresAt, toName: receiverRows[0].name };
}

// Confirma un cobro de Culqi ya realizado contra la reserva creada por
// actPrepareCreditPurchase — mismo reclamo atómico pending -> consumed que
// actConfirmCulqiOrder para que un reintento del cliente no acredite el saldo dos veces.
export async function actConfirmCreditPurchase(b: any) {
  const s = await requireSession(b.token);
  const ref = String(b.ref || "").trim();
  const chargeId = String(b.chargeId || "").trim();
  if (!ref || !chargeId) throw new ApiError("Faltan datos de la compra.");
  const rows = await sbGet("pending_credit_purchases", `ref=eq.${encodeURIComponent(ref)}&select=*`);
  const pc = rows[0];
  if (!pc) throw new ApiError("No encontramos tu compra. Vuelve a intentarlo.", 410);
  if (pc.buyer_phone !== s.phone) throw new ApiError("No autorizado.", 403);
  if (pc.status !== "pending") throw new ApiError("Esta compra ya fue procesada.", 409);
  if (new Date(pc.expires_at).getTime() < Date.now()) {
    throw new ApiError("Tu compra expiró. Vuelve a intentarlo.", 410);
  }

  const amountCents = Math.round(Number(pc.amount) * 100);
  const paymentOk = await verifyCulqiCharge(chargeId, amountCents);
  if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);

  const claim = await sbUpdate("pending_credit_purchases", `id=eq.${pc.id}&status=eq.pending`, { status: "consumed" });
  if (!claim.length) throw new ApiError("Esta compra ya fue procesada.", 409);

  await rpc("add_gifted_credit", { p_to_phone: pc.to_phone, p_amount: Number(pc.amount) });
  await sbInsert("credit_ledger", {
    customer_phone: pc.to_phone,
    delta: Number(pc.amount),
    reason: "Tarjeta de regalo recibida",
    related_phone: pc.buyer_phone,
  });
  try {
    await sendPushToPhone(pc.to_phone, {
      title: "¡Recibiste una tarjeta de regalo! 🎁",
      body: `${pc.buyer_name || "Alguien"} te regaló S/${Number(pc.amount).toFixed(2)} de crédito SND//WCH.`,
      url: "./index.html",
      tag: "sndwch-gift-received-" + pc.ref,
    });
  } catch {
    // un push fallido no debe bloquear la confirmación de la compra
  }
  return { success: true, toName: pc.to_name };
}

// Igual que actExpirePendingCharges (orders.ts) pero para reservas de tarjeta de regalo
// nunca cobradas (cliente cerró la pestaña, se arrepintió, o Culqi rechazó el pago antes
// de que actConfirmCreditPurchase llegara a correr) — no hay inventario que devolver, solo
// marcar la fila 'expired' para no bloquear una nueva compra del mismo comprador.
export async function actExpirePendingCreditPurchases(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const nowIso = new Date().toISOString();
  const stale = await sbGet(
    "pending_credit_purchases",
    `status=in.(pending,charging)&expires_at=lt.${encodeURIComponent(nowIso)}&select=id,status`,
  );
  let expired = 0;
  for (const pc of stale) {
    try {
      await sbUpdate("pending_credit_purchases", `id=eq.${pc.id}&status=eq.${pc.status}`, { status: "expired" });
      expired++;
    } catch (e) {
      console.error("expire-pending-credit-purchases failed for", pc.id, e);
    }
  }
  return { success: true, expired };
}
