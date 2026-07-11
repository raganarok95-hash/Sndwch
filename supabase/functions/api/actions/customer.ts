// SND//WCH — api / actions/customer
// Acciones de cuenta autenticada que no son ni auth ni pedidos: direcciones guardadas,
// favoritos, calificaciones, el reto mensual, regalar crédito, y suscripciones push.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, safeCustomer, verifyCronSecret } from "../session.ts";
import { loadCatalogPrices, deriveOrder, buildFromOrder } from "../catalog.ts";
import { limaMonthKey, limaMonthStartIso } from "../env.ts";
import { sendPushToPhone } from "../push.ts";

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
