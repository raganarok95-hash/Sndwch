// SND//WCH — api / actions/customer
// Acciones de cuenta autenticada que no son ni auth ni pedidos: direcciones guardadas,
// favoritos, calificaciones, el reto mensual, regalar crédito, y suscripciones push.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, safeCustomer, verifyCronSecret, verifyActiveSession } from "../session.ts";
import { loadCatalogPrices, deriveOrder, buildFromOrder } from "../catalog.ts";
import { limaMonthKey, limaMonthStartIso, limaDayStartIso, computeRankName } from "../env.ts";
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

// Reto de descubrimiento: probar DISCOVERY_TARGET_FLAVORS Signatures DISTINTOS en el mes
// (no repetir siempre el mismo) — a diferencia de actClaimChallenge (que solo cuenta
// CUÁNTOS pedidos hiciste), este empuja a explorar el menú en vez de fijarse en un solo
// sabor. Solo cuenta Signatures (sigId): un Build Your Own no tiene un "sabor" discreto
// que contar, lo arma el propio cliente. Mismo patrón atómico que claim_monthly_challenge
// (columna dedicada + RPC que marca el mes reclamado y suma el bono en un solo paso).
const DISCOVERY_TARGET_FLAVORS = 3;
const DISCOVERY_BONUS_POINTS = 50;
export async function actClaimDiscoveryChallenge(b: any) {
  const s = await requireSession(b.token);
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(s.phone)}`);
  if (!rows.length) throw new ApiError("Cliente no encontrado.", 404);
  const c = rows[0];
  const now = new Date();
  const thisMonth = limaMonthKey(now);
  if (c.discovery_claimed_month === thisMonth) throw new ApiError("Ya reclamaste este reto este mes.", 409);
  const monthStart = limaMonthStartIso(now);
  const orders = await sbGet(
    "orders",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&payment_status=eq.paid&created_at=gte.${encodeURIComponent(monthStart)}&select=items`,
  );
  const flavors = new Set<string>();
  for (const o of orders) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const it of items as any[]) {
      if (it && it.type === "sig" && it.sigId) flavors.add(String(it.sigId));
    }
  }
  if (flavors.size < DISCOVERY_TARGET_FLAVORS) {
    throw new ApiError(`Todavía te faltan sabores nuevos este mes (${flavors.size}/${DISCOVERY_TARGET_FLAVORS}).`, 400);
  }
  const claimed = await rpc("claim_discovery_challenge", { p_phone: s.phone, p_month: thisMonth, p_bonus: DISCOVERY_BONUS_POINTS });
  const finalRow = Array.isArray(claimed) ? claimed[0] : claimed;
  await sbInsert("transactions", {
    customer_phone: s.phone,
    type: "earn_confirmed",
    points: DISCOVERY_BONUS_POINTS,
    description: `Reto de descubrimiento completado (${DISCOVERY_TARGET_FLAVORS} sabores distintos)`,
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

// Sincroniza el carrito del cliente al servidor (debounced desde el cliente, ver
// scheduleCartSync/saveCart en app.ts) — solo para que remind-abandoned-cart sepa qué
// hay en un carrito sin terminar de pagar. No es la fuente de verdad del carrito (esa
// sigue siendo localStorage/el propio cliente); si el upsert falla, no bloquea nada más
// que el recordatorio.
export async function actSyncCart(b: any) {
  const s = await requireSession(b.token);
  const items = Array.isArray(b.items) ? b.items : [];
  const existing = await sbGet("cart_snapshots", `customer_phone=eq.${encodeURIComponent(s.phone)}&select=customer_phone`);
  const payload = { items, updated_at: new Date().toISOString(), reminded_at: null };
  if (existing.length) {
    await sbUpdate("cart_snapshots", `customer_phone=eq.${encodeURIComponent(s.phone)}`, payload);
  } else {
    await sbInsert("cart_snapshots", { customer_phone: s.phone, ...payload });
  }
  return { success: true };
}

// Recordatorio de carrito abandonado — si un carrito sincronizado (ver actSyncCart) lleva
// entre 20 min y 3h sin cambios, un solo push. Menos de 20 min es normal (sigue armando el
// pedido); más de 3h ya no vale la pena recordar (probablemente ni se acuerda de qué
// armó). reminded_at evita reenviar el mismo aviso en cada corrida de este cron mientras
// el carrito sigue sin tocarse.
const ABANDONED_CART_MIN_MINUTES = 20;
const ABANDONED_CART_MAX_MINUTES = 180;
export async function actRemindAbandonedCart(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const now = Date.now();
  const minCutoff = new Date(now - ABANDONED_CART_MIN_MINUTES * 60000).toISOString();
  const maxCutoff = new Date(now - ABANDONED_CART_MAX_MINUTES * 60000).toISOString();
  const rows = await sbGet(
    "cart_snapshots",
    `updated_at=lte.${encodeURIComponent(minCutoff)}&updated_at=gt.${encodeURIComponent(maxCutoff)}&reminded_at=is.null&select=customer_phone,items`,
  );
  let reminded = 0;
  for (const row of rows) {
    const items = Array.isArray(row.items) ? row.items : [];
    if (!items.length) continue;
    try {
      await sendPushToPhone(row.customer_phone, {
        title: "🛒 Tu carrito te espera",
        body: "Dejaste productos en tu carrito — termina tu pedido antes de que se te antoje otra cosa 😉",
        url: "./index.html",
        tag: "sndwch-cart-abandoned",
      });
      await sbUpdate("cart_snapshots", `customer_phone=eq.${encodeURIComponent(row.customer_phone)}`, { reminded_at: new Date().toISOString() });
      reminded++;
    } catch (e) {
      console.error("remind-abandoned-cart failed for", row.customer_phone, e);
    }
  }
  // Sin esto la tabla crece sin límite — nadie necesita un snapshot de hace más de un día,
  // se haya avisado o no.
  try {
    await sbDelete("cart_snapshots", `updated_at=lt.${encodeURIComponent(new Date(now - 24 * 3600000).toISOString())}`);
  } catch (e) {
    console.error("remind-abandoned-cart cleanup failed:", e);
  }
  return { success: true, reminded };
}

// Nudge de "segundo pedido" — el momento de mayor apalancamiento en retención es
// conseguir que un cliente nuevo vuelva una segunda vez (distinto del win-back genérico
// de la función winback-campaign, que solo mira inactividad de 30+ días sin importar
// cuántos pedidos tenga). No hay una columna "fecha del primer pedido" separada, así que
// se reconstruye el primer pedido pagado real desde `orders` para los clientes que hoy
// siguen en total_orders=1 — más preciso que usar customers.created_at como proxy.
const SECOND_ORDER_MIN_DAYS = 3;
const SECOND_ORDER_MAX_DAYS = 5;
export async function actRemindSecondOrder(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const customers = await sbGet("customers", "select=phone,total_orders&total_orders=eq.1");
  if (!customers.length) return { success: true, reminded: 0 };
  const phones = customers.map((c: any) => `"${c.phone}"`).join(",");
  const orders = await sbGet("orders", `customer_phone=in.(${phones})&payment_status=eq.paid&select=customer_phone,created_at`);
  const firstOrderByPhone = new Map<string, number>();
  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    const prev = firstOrderByPhone.get(o.customer_phone);
    if (prev === undefined || t < prev) firstOrderByPhone.set(o.customer_phone, t);
  }
  const now = Date.now();
  let reminded = 0;
  for (const c of customers) {
    const firstOrderAt = firstOrderByPhone.get(c.phone);
    if (firstOrderAt === undefined) continue;
    const daysSince = (now - firstOrderAt) / 86400000;
    if (daysSince < SECOND_ORDER_MIN_DAYS || daysSince > SECOND_ORDER_MAX_DAYS) continue;
    try {
      // Ventana amplia (60 días) porque este aviso solo tiene sentido UNA vez en la vida
      // del cliente para este momento específico, no algo que deba repetirse.
      const withinLimit = await rpc("check_rate_limit", { p_key: `second-order:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 60 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "¿Qué tal tu primer sándwich? 🥪",
        body: "Vuelve a pedir tu favorito — o prueba otro Signature esta vez.",
        url: "./index.html",
        tag: "sndwch-second-order",
      });
      reminded++;
    } catch (e) {
      console.error("remind-second-order failed for", c.phone, e);
    }
  }
  return { success: true, reminded };
}

// Re-enganche prioritario para rango alto — a diferencia de winback-campaign (trata a
// todos los inactivos igual), perder a un cliente CÍRCULO INTERNO o MESA FUNDADORA cuesta
// más que perder uno nuevo, así que se avisa antes (15 días vs. 30) y de forma recurrente
// mientras siga inactivo (no es un momento único como el nudge de segundo pedido).
const HIGH_RANK_INACTIVE_DAYS = 15;
export async function actRemindHighRankWinback(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  // total_orders>=15 ya implica rango CÍRCULO INTERNO o MESA FUNDADORA (ver RANKS/env.ts)
  // — no hace falta filtrar de nuevo con computeRankName, solo usarlo para el texto.
  const customers = await sbGet("customers", "select=phone,total_orders&total_orders=gte.15");
  if (!customers.length) return { success: true, reminded: 0 };
  const phones = customers.map((c: any) => `"${c.phone}"`).join(",");
  const orders = await sbGet("orders", `customer_phone=in.(${phones})&payment_status=eq.paid&select=customer_phone,created_at`);
  const lastOrderByPhone = new Map<string, number>();
  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    const prev = lastOrderByPhone.get(o.customer_phone);
    if (prev === undefined || t > prev) lastOrderByPhone.set(o.customer_phone, t);
  }
  const now = Date.now();
  let reminded = 0;
  for (const c of customers) {
    const lastOrderAt = lastOrderByPhone.get(c.phone);
    if (lastOrderAt === undefined) continue;
    const daysSince = (now - lastOrderAt) / 86400000;
    if (daysSince < HIGH_RANK_INACTIVE_DAYS) continue;
    try {
      const withinLimit = await rpc("check_rate_limit", { p_key: `high-rank-winback:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 20 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "Te extrañamos por acá 🎖️",
        body: `Como cliente ${computeRankName(c.total_orders || 0)}, tu próximo pedido te está esperando.`,
        url: "./index.html",
        tag: "sndwch-high-rank-winback",
      });
      reminded++;
    } catch (e) {
      console.error("remind-high-rank-winback failed for", c.phone, e);
    }
  }
  return { success: true, reminded };
}

// Aniversario de cuenta — puro cariño, sin puntos de por medio (a diferencia de
// birthday-bonus, que sí regala puntos): un push el día que se cumplen años desde que el
// cliente se registró. created_at es el único dato de "cuándo empezó todo esto" que
// existe hoy (no hay una columna de "fecha del primer pedido" separada), así que se usa
// como proxy — para la enorme mayoría de clientes coincide con su primer pedido de todas
// formas, ya que la cuenta se crea al comprar.
export async function actAnniversaryGreeting(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const now = new Date();
  // Misma conversión simple a hora Lima que usa birthday-bonus (UTC-5 sin horario de
  // verano) — no hace falta la precisión de limaFields (env.ts) para comparar solo mes/día.
  const limaNow = new Date(now.getTime() - 5 * 3600000);
  const mm = String(limaNow.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(limaNow.getUTCDate()).padStart(2, "0");
  const year = limaNow.getUTCFullYear();
  const customers = await sbGet("customers", "select=phone,name,created_at");
  let greeted = 0;
  for (const c of customers) {
    if (!c.created_at) continue;
    const created = new Date(c.created_at);
    const createdMM = String(created.getUTCMonth() + 1).padStart(2, "0");
    const createdDD = String(created.getUTCDate()).padStart(2, "0");
    if (createdMM !== mm || createdDD !== dd) continue;
    const years = year - created.getUTCFullYear();
    if (years < 1) continue;
    try {
      const withinLimit = await rpc("check_rate_limit", { p_key: `anniversary:${c.phone}:${year}`, p_limit: 1, p_window_minutes: 60 * 24 * 31 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "🎉 ¡Feliz aniversario!",
        body: `Hace ${years} año${years === 1 ? "" : "s"} te uniste a SND//WCH. Gracias por seguir con nosotros.`,
        url: "./index.html",
        tag: "sndwch-anniversary-" + year,
      });
      greeted++;
    } catch (e) {
      console.error("anniversary-greeting failed for", c.phone, e);
    }
  }
  return { success: true, greeted };
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

// PLAN SEMANAL — recarga de saldo propio con bono (a diferencia de actPrepareCreditPurchase,
// que es para REGALAR crédito a otro cliente, esto es un top-up del propio saldo). Paga
// S/90 hoy, recibe S/100 en saldo — ~11% de bono, calculado para que incluso con el costo
// de insumos más alto reportado por el dueño (~50% del precio de venta) siga quedando
// margen real, a cambio de meter caja hoy por consumo que de todas formas iba a pasar
// después. Usa su propia tabla (no pending_credit_purchases) porque no hay destinatario
// ni mensaje que guardar — mismo patrón de reserva atómica que el resto de cobros Culqi.
const WEEKLY_PLAN_PRICE = 90;
const WEEKLY_PLAN_CREDIT = 100;
const WEEKLY_PLAN_TTL_MINUTES = 15;

export async function actPrepareWeeklyPlan(b: any) {
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);

  const nowIso = new Date().toISOString();
  const existing = await sbGet(
    "pending_weekly_plans",
    `buyer_phone=eq.${encodeURIComponent(active.payload.phone)}&status=eq.pending&expires_at=gt.${encodeURIComponent(nowIso)}&select=id`,
  );
  if (existing.length) {
    throw new ApiError("Ya tienes un Plan Semanal en proceso. Espera un momento antes de intentar de nuevo.", 409);
  }

  const ref = "PLAN-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + WEEKLY_PLAN_TTL_MINUTES * 60000).toISOString();
  await sbInsert("pending_weekly_plans", {
    ref,
    buyer_phone: active.payload.phone,
    buyer_name: active.row.name || "",
    amount_paid: WEEKLY_PLAN_PRICE,
    credit_amount: WEEKLY_PLAN_CREDIT,
    expires_at: expiresAt,
  });
  return { success: true, ref, expiresAt, amountPaid: WEEKLY_PLAN_PRICE, creditAmount: WEEKLY_PLAN_CREDIT };
}

export async function actConfirmWeeklyPlan(b: any) {
  const s = await requireSession(b.token);
  const ref = String(b.ref || "").trim();
  const chargeId = String(b.chargeId || "").trim();
  if (!ref || !chargeId) throw new ApiError("Faltan datos de la compra.");
  const rows = await sbGet("pending_weekly_plans", `ref=eq.${encodeURIComponent(ref)}&select=*`);
  const pp = rows[0];
  if (!pp) throw new ApiError("No encontramos tu Plan Semanal. Vuelve a intentarlo.", 410);
  if (pp.buyer_phone !== s.phone) throw new ApiError("No autorizado.", 403);
  if (pp.status !== "pending") throw new ApiError("Este Plan Semanal ya fue procesado.", 409);
  if (new Date(pp.expires_at).getTime() < Date.now()) {
    throw new ApiError("Tu Plan Semanal expiró. Vuelve a intentarlo.", 410);
  }

  const amountCents = Math.round(Number(pp.amount_paid) * 100);
  const paymentOk = await verifyCulqiCharge(chargeId, amountCents);
  if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);

  const claim = await sbUpdate("pending_weekly_plans", `id=eq.${pp.id}&status=eq.pending`, { status: "consumed" });
  if (!claim.length) throw new ApiError("Este Plan Semanal ya fue procesado.", 409);

  await rpc("add_gifted_credit", { p_to_phone: pp.buyer_phone, p_amount: Number(pp.credit_amount) });
  await sbInsert("credit_ledger", {
    customer_phone: pp.buyer_phone,
    delta: Number(pp.credit_amount),
    reason: "Plan Semanal (pagó S/" + pp.amount_paid + ")",
  });
  return { success: true, creditAmount: pp.credit_amount };
}

// Igual que actExpirePendingCreditPurchases pero para la tabla del Plan Semanal.
export async function actExpirePendingWeeklyPlans(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const nowIso = new Date().toISOString();
  const stale = await sbGet(
    "pending_weekly_plans",
    `status=in.(pending,charging)&expires_at=lt.${encodeURIComponent(nowIso)}&select=id,status`,
  );
  let expired = 0;
  for (const pp of stale) {
    try {
      await sbUpdate("pending_weekly_plans", `id=eq.${pp.id}&status=eq.${pp.status}`, { status: "expired" });
      expired++;
    } catch (e) {
      console.error("expire-pending-weekly-plans failed for", pp.id, e);
    }
  }
  return { success: true, expired };
}
