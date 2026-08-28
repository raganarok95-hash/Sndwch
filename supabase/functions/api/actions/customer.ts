// SND//WCH — api / actions/customer
// Acciones de cuenta autenticada que no son ni auth ni pedidos: direcciones guardadas,
// favoritos, calificaciones, el reto mensual, regalar crédito, y suscripciones push.
import { sbGet, sbInsert, sbUpdate, sbDelete, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, safeCustomer, verifyCronSecret, verifyActiveSession } from "../session.ts";
import { loadCatalogPrices, deriveOrder, buildFromOrder, SIG_DATA, sigGateError } from "../catalog.ts";
import { limaMonthKey, limaMonthStartIso, limaDayStartIso, computeRankName, WELCOME_BONUS_POINTS } from "../env.ts";
import { sendPushToPhone, sendPushToAdmins } from "../push.ts";
import { debugLog } from "../logging.ts";
import { verifyCulqiCharge } from "./orders.ts";

// Freno de seguridad para TODOS los recordatorios que van al CLIENTE. Los ~21 crons de
// retención corren en producción desde antes de abrir, sin verificar que el negocio ya
// esté operando — y ya existe al menos un dispositivo real suscrito a notificaciones. Sin
// esta guardia, cualquier sesión de QA que cree pedidos de prueba (para probar el reto
// mensual, por ejemplo) dispara push REALES a clientes reales anunciando promociones de un
// negocio que todavía no abre (hallazgo de auditoría de automatización).
//
// Solo frena avisos al CLIENTE. Las alertas al DUEÑO (pedido estancado, stock bajo, plazo
// de reclamo) y la limpieza de dinero (expirar cobros, conciliar Culqi) siguen corriendo
// siempre: esas sí tienen que funcionar antes de abrir.
async function customerRemindersEnabled(): Promise<boolean> {
  try {
    const rows = await sbGet("app_settings", "select=business_launched&id=eq.true");
    return rows?.[0]?.business_launched === true;
  } catch (e) {
    // Ante un fallo de lectura, NO enviar: el costo de callarse un recordatorio es
    // trivial; el de mandar promociones antes de abrir, no.
    console.error("customerRemindersEnabled failed:", e);
    return false;
  }
}

// Log de campañas de marketing (`marketing_touches`) — antes ningún cron de re-enganche
// dejaba rastro de a quién se le mandó qué, así que era imposible medir si un recordatorio
// de verdad trae de vuelta al cliente (solo se sabía "se mandó", nunca "funcionó"). Este
// helper es best-effort a propósito: si el insert falla, NUNCA debe tumbar el envío real
// del push que ya se disparó — el log es observabilidad, no la operación en sí.
async function logMarketingTouch(phone: string, campaignType: string): Promise<void> {
  try {
    await sbInsert("marketing_touches", { customer_phone: phone, campaign_type: campaignType, channel: "push" });
  } catch (e) {
    console.error("logMarketingTouch failed for", campaignType, phone, e);
  }
}

// Supresión CRUZADA entre campañas. Cada cron respetaba su propio límite ("no le mandes
// este mismo recordatorio dos veces"), pero ninguno miraba si OTRO cron ya le había
// escrito hoy al mismo cliente. Casos reales de solapamiento: un cliente frecuente que
// abandona un carrito en hora pico califica a la vez para "hora pico" y "carrito
// abandonado"; el día 28 de cada mes, "aniversario" y "reto sin reclamar" corren a la
// misma hora exacta. El resultado era varios push el mismo día, que es la forma más
// rápida de que alguien desactive las notificaciones para siempre (hallazgo de auditoría
// de automatización).
//
// Devuelve el conjunto de teléfonos que YA recibieron algún aviso hoy — se consulta una
// sola vez por corrida de cron, no una por cliente.
//
// ORDEN IMPORTANTE: este chequeo va SIEMPRE antes de `check_rate_limit`, nunca después.
// La RPC `check_rate_limit` incrementa el contador y recién entonces compara contra el
// límite, así que llamarla consume el cupo aunque el aviso no llegue a enviarse. Con el
// orden invertido (como estaba hasta esta corrección), si el cliente ya había recibido
// otro push ese día el cupo se gastaba igual y el aviso se perdía PARA SIEMPRE — el
// bounce-back del primer pedido tiene ventana de 1 año, así que ese cliente nunca volvía
// a calificar. No era teórico: el cron de carrito abandonado corre cada 10 minutos, de
// modo que la colisión con cualquier otro recordatorio del mismo día era frecuente.
async function phonesTouchedToday(): Promise<Set<string>> {
  try {
    const since = limaDayStartIso(new Date());
    const rows = await sbGet(
      "marketing_touches",
      `sent_at=gte.${encodeURIComponent(since)}&select=customer_phone&limit=20000`,
    );
    return new Set(rows.map((r: any) => String(r.customer_phone)));
  } catch (e) {
    // Ante un fallo de lectura se prefiere ENVIAR (perder un recordatorio útil es peor
    // que arriesgar un segundo aviso) — el criterio opuesto al de customerRemindersEnabled,
    // porque aquí el peor caso es un push de más, no una promoción antes de abrir.
    console.error("phonesTouchedToday failed:", e);
    return new Set();
  }
}

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
// Antes solo se podía agregar/eliminar — un typo en la dirección obligaba a borrar y
// crear de nuevo en vez de corregirla in-place (hallazgo de auditoría UX, BAJO).
export async function actAddressesUpdate(b: any) {
  const s = await requireSession(b.token);
  const id = String(b.id || "");
  const label = String(b.label || "").trim();
  const address = String(b.address || "").trim();
  if (!id) throw new ApiError("Falta la dirección.");
  if (!label || !address) throw new ApiError("Ingresa un nombre y la dirección.");
  const rows = await sbUpdate(
    "saved_addresses",
    `id=eq.${encodeURIComponent(id)}&customer_phone=eq.${encodeURIComponent(s.phone)}`,
    { label, address },
  );
  if (!rows.length) throw new ApiError("Dirección no encontrada.", 404);
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
  // verifyActiveSession (no requireSession) porque necesitamos total_orders real de la
  // fila del cliente para el gate de rango de abajo — el payload del token no lo trae.
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  const s = active.payload;
  // Antes sin tope de largo — un nombre muy largo podía tapar el botón ELIMINAR en la
  // lista de favoritos (hallazgo de auditoría UX). Mismo tope que otros campos de texto
  // libre del cliente (ej. nota de pedido).
  const name = String(b.name || "").trim().slice(0, 40);
  if (!name) throw new ApiError("Ponle un nombre a tu favorito.");
  await assertUnderLimit("favorites", s.phone, MAX_FAVORITES, "favoritos guardados");
  await loadCatalogPrices();
  // Antes faltaba acá — actPrepareOrder/actPlaceOrder/actAddGroupItem ya validaban el
  // gate de rango (ej. menú secreto solo para INICIADO+) antes de tasar, pero
  // actFavoritesAdd tasaba con deriveOrder() sin pasar por sigGateError primero: un
  // cliente con 0 pedidos podía GUARDAR el menú secreto como favorito llamando a la API
  // directo, aunque el checkout normal lo siga rechazando al intentar pedirlo de verdad
  // (hallazgo de auditoría de composición/exclusividad, ALTO).
  if (b.mode === "sig") {
    const gateErr = sigGateError(String(b.sigId || ""), active.row.total_orders || 0);
    if (gateErr) throw new ApiError(gateErr, 403);
  }
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
    // Consentimiento explícito para reutilizar la reseña como testimonio público (redes
    // sociales, web) — nunca asumido por defecto, solo si el cliente marca el checkbox.
    testimonial_consent: !!b.testimonialConsent,
  });
  // Una calificación mala entraba a la tabla y nadie se enteraba hasta que alguien
  // abriera la pantalla de calificaciones a mano. Ese es justo el cliente que se va en
  // silencio: no usa el Libro de Reclamaciones (que sí alerta, pero tiene plazo legal y
  // solo se llena cuando el cliente ya está molesto de verdad), simplemente no vuelve.
  // Y con solo ~30% de clientes haciendo un segundo pedido, perder uno que ya pidió una
  // vez cuesta toda su vida útil restante.
  //
  // Solo avisa, no compensa: cuánto y cómo se compensa lo decide el dueño desde el panel
  // (actAdminManualCredit) mirando el caso real — un crédito automático por estrellas es
  // trivial de abusar y no distingue "llegó frío" de "no me gustó el sabor".
  if (stars <= LOW_RATING_ALERT_THRESHOLD) {
    try {
      await sendPushToAdmins({
        title: `⚠ Calificación de ${stars} estrella${stars === 1 ? "" : "s"}`,
        body: `Pedido ${ref}${b.comment ? ": " + String(b.comment).trim().slice(0, 90) : " — sin comentario"}`,
        url: "./index.html",
        tag: "sndwch-low-rating-" + ref,
      });
    } catch {
      // un push fallido nunca debe hacer que la calificación del cliente se pierda
    }
  }
  return { success: true };
}
const LOW_RATING_ALERT_THRESHOLD = 2;

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
  // status=neq.CANCELADO (hallazgo de la re-auditoría de 10 agentes, MEDIA-ALTA): cancelar
  // un pedido revierte el pago/puntos pero NUNCA toca payment_status (se queda 'paid') —
  // sin este filtro, pagar 3 pedidos con crédito propio y cancelarlos de inmediato (con
  // reembolso automático completo) reclamaba el bono gratis, repetible cada mes.
  const orders = await sbGet(
    "orders",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&payment_status=eq.paid&status=neq.CANCELADO&created_at=gte.${encodeURIComponent(monthStart)}&select=id`,
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
  // status=neq.CANCELADO — mismo hallazgo/motivo que actClaimChallenge arriba.
  const orders = await sbGet(
    "orders",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&payment_status=eq.paid&status=neq.CANCELADO&created_at=gte.${encodeURIComponent(monthStart)}&select=items`,
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
// Esta acción es un oráculo de teléfono → NOMBRE REAL: dice si existe cuenta con ese número
// y cómo se llama su titular. Basta registrarse una vez para consultar números arbitrarios,
// y a diferencia de actCreditGift/actGiftCardPurchase no cuesta puntos ni crédito, así que
// no tenía ningún freno: se podía barrer el padrón de números de Trujillo con un script.
// Login y recuperación de PIN ya tienen bloqueo por teléfono justamente para no delatar qué
// cuentas existen; esta quedó fuera de ese criterio. El límite es por quien CONSULTA (la
// sesión), no por el número consultado — si no, el atacante solo tendría que cambiar de
// objetivo para seguir barriendo.
const CREDIT_LOOKUP_RATE_LIMIT = 20;
const CREDIT_LOOKUP_RATE_WINDOW_MINUTES = 60;
export async function actCreditLookup(b: any) {
  const s = await requireSession(b.token);
  const toPhone = String(b.toPhone || "").trim();
  if (!toPhone) throw new ApiError("Ingresa un teléfono.");
  if (toPhone === s.phone) throw new ApiError("No puedes regalarte crédito a ti mismo.");
  const withinLimit = await rpc("check_rate_limit", {
    p_key: `credit-lookup:${s.phone}`,
    p_limit: CREDIT_LOOKUP_RATE_LIMIT,
    p_window_minutes: CREDIT_LOOKUP_RATE_WINDOW_MINUTES,
  });
  if (!withinLimit) throw new ApiError("Demasiadas búsquedas. Espera un momento.", 429);
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
  // Antes este flujo no avisaba al receptor de ninguna forma — a diferencia de la
  // tarjeta de regalo (actGiftCardPurchase, misma acción conceptual: mover saldo a otro
  // cliente), que sí notifica. El saldo regalado podía quedar sin usarse simplemente
  // porque el receptor nunca se enteró (hallazgo de auditoría UX, MEDIO).
  try {
    await sendPushToPhone(toPhone, {
      title: "¡Recibiste crédito de un amigo! 🎁",
      body: `Alguien te regaló S/${amount.toFixed(2)} de crédito SND//WCH.`,
      url: "./index.html",
      tag: "sndwch-credit-gift-received-" + Date.now(),
    });
  } catch {
    // un push fallido no debe bloquear la confirmación del regalo
  }
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
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  const now = new Date();
  const thisMonth = limaMonthKey(now);
  const monthStart = limaMonthStartIso(now);
  // limit explícito (cap de seguridad) — sin esto, PostgREST trunca en silencio a 1000
  // filas por defecto una vez que el negocio tenga suficiente volumen mensual (hallazgo
  // de auditoría 2026-08-07).
  const orders = await sbGet(
    "orders",
    `payment_status=eq.paid&created_at=gte.${encodeURIComponent(monthStart)}&customer_phone=not.is.null&select=customer_phone&limit=20000`,
  );
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.customer_phone, (counts.get(o.customer_phone) || 0) + 1);
  const qualifyingPhones = [...counts.entries()].filter(([, n]) => n >= CHALLENGE_TARGET_ORDERS).map(([phone]) => phone);
  if (!qualifyingPhones.length) return { success: true, reminded: 0 };
  // phone es texto libre en el registro (sin restricción de charset) — escapar comillas/backslash
  // antes de interpolar en un literal de lista in.() de PostgREST evita que un valor malicioso
  // rompa fuera de su literal y altere el filtro (hallazgo de auditoría 2026-08-07).
  const phonesList = qualifyingPhones.map((p) => `"${String(p).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  const customers = await sbGet("customers", `phone=in.(${phonesList})&select=phone,challenge_claimed_month`);
  let reminded = 0;
  for (const c of customers) {
    if (c.challenge_claimed_month === thisMonth) continue;
    try {
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `challenge-reminder:${c.phone}:${thisMonth}`, p_limit: 1, p_window_minutes: 60 * 24 * 31 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "¡Ya ganaste tu reto mensual! 🏆",
        body: `Hiciste ${CHALLENGE_TARGET_ORDERS} pedidos este mes — entra a tu perfil y toca "Reclamar recompensa" para sumar tus ${CHALLENGE_BONUS_POINTS} puntos antes de que termine el mes.`,
        url: "./index.html",
        tag: "sndwch-challenge-reminder-" + thisMonth,
      });
      await logMarketingTouch(c.phone, "challenge_unclaimed");
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
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  const slot: "lunch" | "dinner" = b.slot === "dinner" ? "dinner" : "lunch";
  const now = new Date();
  const windowStart = new Date(now.getTime() - FREQUENT_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
  const todayStart = limaDayStartIso(now);
  const todayStartMs = new Date(todayStart).getTime();
  // limit explícito (cap de seguridad) — mismo motivo que actRemindUnclaimedChallenge.
  const orders = await sbGet(
    "orders",
    `payment_status=eq.paid&created_at=gte.${encodeURIComponent(windowStart)}&customer_phone=not.is.null&select=customer_phone,created_at&limit=20000`,
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
      if (touchedToday.has(String(phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `peak-reminder:${phone}:${dateKey}:${slot}`, p_limit: 1, p_window_minutes: 60 * 24 });
      if (!withinLimit) continue;
      await sendPushToPhone(phone, {
        title: copy.title,
        body: copy.body,
        url: "./index.html",
        tag: "sndwch-peak-" + slot + "-" + dateKey,
      });
      await logMarketingTouch(phone, "peak_hour_" + slot);
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
// entre 10 min y 3h sin cambios, un solo push. Menos de 10 min es normal (sigue armando el
// pedido); más de 3h ya no vale la pena recordar (probablemente ni se acuerda de qué
// armó). reminded_at evita reenviar el mismo aviso en cada corrida de este cron mientras
// el carrito sigue sin tocarse.
// Piso bajado de 20 a 10 min (investigación de mercado 2026-08-04): en food delivery la
// ventana ideal de recuperación es 8-15 min, con 20 min ya como límite duro de "tarde" —
// el producto es perecedero, a diferencia de e-commerce genérico donde 20-60 min es normal.
const ABANDONED_CART_MIN_MINUTES = 10;
const ABANDONED_CART_MAX_MINUTES = 180;
export async function actRemindAbandonedCart(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
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
      if (touchedToday.has(String(row.customer_phone))) continue;
      await sendPushToPhone(row.customer_phone, {
        title: "🛒 Tu carrito te espera",
        body: "Dejaste productos en tu carrito — termina tu pedido antes de que se te antoje otra cosa 😉",
        url: "./index.html",
        tag: "sndwch-cart-abandoned",
      });
      await sbUpdate("cart_snapshots", `customer_phone=eq.${encodeURIComponent(row.customer_phone)}`, { reminded_at: new Date().toISOString() });
      await logMarketingTouch(row.customer_phone, "cart_abandoned");
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
// Ventana recalibrada 2026-08-04 (investigación de mercado: el reorden mediano en food
// delivery ocurre ~día 9, no día 3-5) — antes disparaba antes de que la mayoría de
// clientes reales estuviera lista para su segundo pedido. El horario del cron (ver
// cron.job en Supabase, no en este archivo) también se movió de 10am a la ventana de
// cena Lima, mismo motivo.
const SECOND_ORDER_MIN_DAYS = 7;
const SECOND_ORDER_MAX_DAYS = 10;

// "Bounce-back" a las 24 horas de la PRIMERA entrega. Complementa (no reemplaza) el
// recordatorio de día 7-10 de arriba: la evidencia del sector dice que el reorden mediano
// ocurre ~día 9 —por eso ese sigue existiendo— pero también que los restaurantes que
// contactan dentro de las primeras 24 h del primer pedido ven tasas de recompra bastante
// mayores, y que la mayoría de los clientes se pierde en los primeros 14 días. Son dos
// momentos distintos: este es el agradecimiento con un regalo; aquel es el recordatorio.
//
// Se regala una BEBIDA (puntos suficientes para canjear R05), no un descuento porcentual:
// un add-on gratis genera ~3x más canjes que un % de descuento y sube ~18% las visitas de
// retorno SIN bajar el ticket promedio. Costo real de honrarlo ~S/1.80 contra un LTV de
// S/35.67 por cliente — pero es un costo real y automático, así que vive en una constante
// única y fácil de ajustar (ponerla en 0 desactiva el regalo sin tocar el resto).
const BOUNCE_BACK_POINTS = 120;   // = R05 "BEBIDA // GRATIS" (bajó de 220 al recalibrar R05)
const BOUNCE_BACK_MIN_HOURS = 20;
const BOUNCE_BACK_MAX_HOURS = 48;

export async function actBounceBackFirstOrder(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  const now = Date.now();
  const from = new Date(now - BOUNCE_BACK_MAX_HOURS * 3600000).toISOString();
  const to = new Date(now - BOUNCE_BACK_MIN_HOURS * 3600000).toISOString();
  // Solo primeras entregas REALES: status ENTREGADO (no basta con haber pagado — el
  // agradecimiento tiene sentido cuando ya probó el producto) y pago confirmado.
  const orders = await sbGet(
    "orders",
    `status=eq.ENTREGADO&payment_status=eq.paid&customer_phone=not.is.null` +
    `&created_at=gte.${encodeURIComponent(from)}&created_at=lt.${encodeURIComponent(to)}` +
    `&select=customer_phone,created_at&limit=5000`,
  );
  if (!orders.length) return { success: true, sent: 0 };
  const phones: string[] = Array.from(new Set(orders.map((o: any) => String(o.customer_phone))));
  const phonesList = phones.map((p: string) => `"${p.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  // total_orders=1 asegura que es su PRIMER pedido, no una entrega cualquiera.
  const customers = await sbGet("customers", `phone=in.(${phonesList})&total_orders=eq.1&select=phone,name`);
  let sent = 0;
  for (const c of customers) {
    try {
      // Una sola vez en la vida del cliente (ventana de 1 año) — este momento no se repite.
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `bounce-back:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 365 });
      if (!withinLimit) continue;
      if (BOUNCE_BACK_POINTS > 0) {
        await rpc("increment_customer_points", { p_phone: c.phone, p_delta: BOUNCE_BACK_POINTS });
        // Mismo criterio que el bono de bienvenida: todo ingreso de puntos deja rastro en
        // el historial del cliente, nunca se suma en silencio.
        await sbInsert("transactions", {
          customer_phone: c.phone,
          type: "earn_confirmed",
          points: BOUNCE_BACK_POINTS,
          description: "Gracias por tu primer pedido — bebida de cortesía",
          confirmed: true,
        });
      }
      await sendPushToPhone(c.phone, {
        title: "Gracias por tu primer pedido 🙌",
        // "Va por nosotros" decía regalo y "canjear en tus puntos" decía que paga con su
        // saldo — una de las dos era mentira. Lo que de verdad pasa es que le sumamos
        // los puntos y él canjea, así que el texto lo dice tal cual.
        body: "Te sumamos puntos suficientes para canjear una bebida de la casa. Entra a Recompensas y es tuya.",
        url: "./index.html",
        tag: "sndwch-bounce-back",
      });
      await logMarketingTouch(c.phone, "bounce_back_first_order");
      sent++;
    } catch (e) {
      console.error("bounce-back-first-order failed for", c.phone, e);
      await debugLog({ stage: "bounce-back-first-order", phone: c.phone, error: String(e) });
    }
  }
  return { success: true, sent };
}
export async function actRemindSecondOrder(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  // limit explícito (cap de seguridad, mismo criterio que actAnniversaryGreeting) — sin
  // esto, PostgREST trunca en silencio a 1000 filas por defecto (hallazgo de auditoría
  // 2026-08-07).
  const customers = await sbGet("customers", "select=phone,total_orders&total_orders=eq.1&limit=20000");
  if (!customers.length) return { success: true, reminded: 0 };
  const phones = customers.map((c: any) => `"${String(c.phone).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  const orders = await sbGet("orders", `customer_phone=in.(${phones})&payment_status=eq.paid&select=customer_phone,created_at&limit=20000`);
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
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `second-order:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 60 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "¿Qué tal tu primer sándwich? 🥪",
        body: "Vuelve a pedir tu favorito — o prueba otro Signature esta vez.",
        url: "./index.html",
        tag: "sndwch-second-order",
      });
      await logMarketingTouch(c.phone, "second_order");
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
// Win-back escalonado para CUALQUIER cliente inactivo. El re-enganche que ya existía solo
// cubría dos extremos: rango alto (15+ pedidos) y "nunca pidió" — quedaba fuera justo el
// grueso de la base: quien pidió 1-14 veces y dejó de pedir. La evidencia del sector marca
// dos ventanas distintas: 30-60 días es lapso TEMPRANO (todavía te recuerdan, basta
// reconocimiento + recordatorio) y 60-90 días es lapso MEDIO (ya encontraron alternativa,
// hace falta una razón concreta para volver). Las campañas automatizadas de este tipo
// recuperan 10-18% de los inactivos.
//
// Cada etapa lidera con RECONOCIMIENTO antes que con oferta: la evidencia dice que da
// mejor retención de largo plazo que el descuento puro, y no cuesta margen.
const WINBACK_STAGES: { key: string; minDays: number; maxDays: number; title: string; body: string }[] = [
  { key: "30d", minDays: 30, maxDays: 59, title: "¿Todo bien por allá? 👋",
    body: "Hace un mes que no te vemos. Tu sándwich de siempre sigue en el menú." },
  { key: "60d", minDays: 60, maxDays: 89, title: "Seguimos guardándote el sitio 🥪",
    body: "Cambiamos el sándwich secreto del mes. ¿Le das una oportunidad?" },
  { key: "90d", minDays: 90, maxDays: 180, title: "Tus puntos siguen ahí 💛",
    body: "Tus puntos siguen ahí, intactos. Están esperando que vuelvas." },
];
export async function actRemindLapsedCustomers(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  // 1..14 pedidos: los de 15+ ya los cubre actRemindHighRankWinback con su propio mensaje
  // de rango, y los de 0 los cubre actRemindNeverOrdered. Sin solapamiento.
  const customers = await sbGet("customers", "select=phone,total_orders&total_orders=gte.1&total_orders=lte.14&limit=20000");
  if (!customers.length) return { success: true, reminded: 0 };
  const phones = customers.map((c: any) => `"${String(c.phone).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  const orders = await sbGet("orders", `customer_phone=in.(${phones})&payment_status=eq.paid&select=customer_phone,created_at&limit=20000`);
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
    const stage = WINBACK_STAGES.find((st) => daysSince >= st.minDays && daysSince <= st.maxDays);
    if (!stage) continue;
    try {
      // Una vez por etapa y por cliente: pasada la ventana de 90 días no se insiste más
      // (más allá de eso el cliente ya no se recupera por recordatorio y solo molesta).
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `lapsed-${stage.key}:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 200 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: stage.title,
        body: stage.body,
        url: "./index.html",
        tag: "sndwch-lapsed-" + stage.key,
      });
      await logMarketingTouch(c.phone, "lapsed_" + stage.key);
      reminded++;
    } catch (e) {
      console.error("remind-lapsed-customers failed for", c.phone, e);
    }
  }
  return { success: true, reminded };
}

const HIGH_RANK_INACTIVE_DAYS = 15;
export async function actRemindHighRankWinback(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  // total_orders>=15 ya implica rango CÍRCULO INTERNO o MESA FUNDADORA (ver RANKS/env.ts)
  // — no hace falta filtrar de nuevo con computeRankName, solo usarlo para el texto.
  // limit explícito (cap de seguridad, mismo criterio que actAnniversaryGreeting) — sin
  // esto, PostgREST trunca en silencio a 1000 filas por defecto. Acá NO se puede acotar
  // por fecha reciente como en winback-campaign porque este cron necesita la fecha del
  // ÚLTIMO pedido de clientes que llevan MUCHO sin pedir — filtrar por ventana reciente
  // los dejaría fuera del todo (hallazgo de auditoría 2026-08-07).
  const customers = await sbGet("customers", "select=phone,total_orders&total_orders=gte.15&limit=20000");
  if (!customers.length) return { success: true, reminded: 0 };
  const phones = customers.map((c: any) => `"${String(c.phone).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  const orders = await sbGet("orders", `customer_phone=in.(${phones})&payment_status=eq.paid&select=customer_phone,created_at&limit=20000`);
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
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `high-rank-winback:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * 20 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "Te extrañamos por acá 🎖️",
        body: `Como cliente ${computeRankName(c.total_orders || 0)}, tu próximo pedido te está esperando.`,
        url: "./index.html",
        tag: "sndwch-high-rank-winback",
      });
      await logMarketingTouch(c.phone, "high_rank_winback");
      reminded++;
    } catch (e) {
      console.error("remind-high-rank-winback failed for", c.phone, e);
    }
  }
  return { success: true, reminded };
}

// Cuenta creada pero nunca un pedido pagado — distinto del carrito abandonado (que exige
// que haya un carrito con productos): esto es demanda "casi capturada" que antes no tenía
// ningún seguimiento más que un único aviso genérico. Inspirado en el patrón de onboarding
// de Grubhub Campus (secuencia de varios toques con UN objetivo concreto cada uno, no un
// solo mensaje de bienvenida y silencio después): 3 etapas a distintos días, cada una con
// un gancho distinto (el bono ya ganado, la insignia que se está perdiendo, el último
// aviso). Cada etapa corre en la misma llamada diaria del cron; la ventana de un día por
// etapa hace que alcance a cada cliente una sola vez de forma natural, y el rate limit
// (con su propia llave por etapa) es solo la red de seguridad si el cron se reintenta.
const NEVER_ORDERED_MAX_DAYS = 14;
const NEVER_ORDERED_STAGES = [
  { key: "1", minDays: 2, maxDays: 3, title: "Tus " + WELCOME_BONUS_POINTS + " puntos de bienvenida te esperan", body: "Ya los ganaste al registrarte — solo falta tu primer pedido para poder usarlos.", tag: "sndwch-never-ordered-1" },
  { key: "2", minDays: 5, maxDays: 6, title: "Te falta una insignia por desbloquear", body: "Tu primer pedido en SND//WCH te da tu primera insignia de perfil. Fácil de conseguir, fácil de armar.", tag: "sndwch-never-ordered-2" },
  // Ni "último recordatorio" ni "no te lo volvemos a recordar" eran ciertos: después de
  // estos avisos siguen activos los crons de hora pico, carrito abandonado, aniversario y
  // re-enganche de rango. Prometer que es el último es una mentira que el propio cliente
  // verifica en su pantalla de bloqueo, y es la forma más rápida de que desactive los
  // avisos para siempre.
  { key: "3", minDays: 10, maxDays: 11, title: "Tu cuenta SND//WCH sigue lista", body: "Arma tu primer Signature en menos de un minuto. Es el paso que falta.", tag: "sndwch-never-ordered-3" },
];
export async function actRemindNeverOrdered(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  let reminded = 0;
  for (const stage of NEVER_ORDERED_STAGES) {
    const minCreatedIso = new Date(Date.now() - stage.maxDays * 86400000).toISOString();
    const maxCreatedIso = new Date(Date.now() - stage.minDays * 86400000).toISOString();
    const customers = await sbGet(
      "customers",
      `total_orders=eq.0&created_at=gte.${encodeURIComponent(minCreatedIso)}&created_at=lte.${encodeURIComponent(maxCreatedIso)}&select=phone,name`,
    );
    for (const c of customers) {
      try {
        if (touchedToday.has(String(c.phone))) continue;
        const withinLimit = await rpc("check_rate_limit", { p_key: `never-ordered-${stage.key}:${c.phone}`, p_limit: 1, p_window_minutes: 60 * 24 * NEVER_ORDERED_MAX_DAYS });
        if (!withinLimit) continue;
        await sendPushToPhone(c.phone, {
          title: stage.title,
          body: stage.body,
          url: "./index.html",
          tag: stage.tag,
        });
        await logMarketingTouch(c.phone, "never_ordered_" + stage.key);
        reminded++;
      } catch (e) {
        console.error("remind-never-ordered stage " + stage.key + " failed for", c.phone, e);
      }
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
  if (!(await customerRemindersEnabled())) return { success: true, skipped: "negocio aún no abierto" };
  const touchedToday = await phonesTouchedToday();
  const now = new Date();
  // Misma conversión simple a hora Lima que usa birthday-bonus (UTC-5 sin horario de
  // verano) — no hace falta la precisión de limaFields (env.ts) para comparar solo mes/día.
  const limaNow = new Date(now.getTime() - 5 * 3600000);
  const mm = String(limaNow.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(limaNow.getUTCDate()).padStart(2, "0");
  const year = limaNow.getUTCFullYear();
  // Cap de seguridad — este cron necesita revisar a todos los clientes (cualquiera podría
  // cumplir años hoy), pero sin ningún límite era una query totalmente sin techo a medida
  // que crece la base (hallazgo de auditoría de arquitectura backend). 20000 es muy por
  // encima de cualquier volumen realista de esta sandwichería para no perder cobertura real.
  const customers = await sbGet("customers", "select=phone,name,created_at&limit=20000");
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
      if (touchedToday.has(String(c.phone))) continue;
      const withinLimit = await rpc("check_rate_limit", { p_key: `anniversary:${c.phone}:${year}`, p_limit: 1, p_window_minutes: 60 * 24 * 31 });
      if (!withinLimit) continue;
      await sendPushToPhone(c.phone, {
        title: "🎉 ¡Feliz aniversario!",
        body: `Hace ${years} año${years === 1 ? "" : "s"} te uniste a SND//WCH. Gracias por seguir con nosotros.`,
        url: "./index.html",
        tag: "sndwch-anniversary-" + year,
      });
      await logMarketingTouch(c.phone, "anniversary");
      greeted++;
    } catch (e) {
      console.error("anniversary-greeting failed for", c.phone, e);
    }
  }
  return { success: true, greeted };
}

// Tarjeta de regalo digital: regalar crédito a OTRO cliente gastando PUNTOS propios —
// distinto de actCreditGift (que transfiere saldo YA PROPIO, sin puntos de por medio).
// Se pensó para funcionar con puntos desde el diseño original, antes de que Culqi
// existiera en el proyecto — Culqi no tiene forma de "cobrar con puntos", así que por
// pragmatismo terminó implementada con un cobro real (dos pasos: reservar en
// pending_credit_purchases, luego cobrar por Culqi). El dueño pidió corregirlo: ahora es
// una sola operación atómica (mismo patrón que gift_credit), sin ningún cobro real,
// reserva, ni ventana de expiración — el crédito sale directo de los puntos del
// comprador.
const GIFT_CARD_AMOUNT_MIN = 10;
const GIFT_CARD_AMOUNT_MAX = 500;
// Tasa de canje: mismo criterio que las recompensas (REWARDS en catalog.ts) tras la
// recalibración contra el costo real de insumos (~45% del valor, no ~20-30% asumido
// originalmente) — 40 pts por sol de crédito regalado. DEBE coincidir con
// GIFT_CARD_POINTS_PER_SOL en src/app.ts.
//
// ⚠ PENDIENTE DE DECISIÓN DEL DUEÑO (2026-08-15): esta tasa se fijó igualando la de R06
// cuando R06 costaba 720 pts por un sándwich de ~S/18 (≈40 pts/sol). Al bajar R06 a 400
// pts, su tasa real pasó a ~22 pts/sol y la tarjeta de regalo quedó al doble de precio
// que canjear la recompensa. No se cambió a propósito: bajarla a 22 casi duplica lo que
// se regala por punto, y eso es plata real que no se aprobó. El orden actual (canjear
// recompensas rinde más que regalar crédito) no es incoherente — solo dejó de ser el
// mismo número, y conviene decidirlo explícitamente en vez de que se desincronice solo.
export const GIFT_CARD_POINTS_PER_SOL = 40;

export async function actGiftCardPurchase(b: any) {
  const active = await verifyActiveSession(b.token);
  if (!active) throw new ApiError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  const s = active.payload;
  const toPhone = String(b.toPhone || "").trim();
  const amount = Number(b.amount || 0);
  if (!toPhone) throw new ApiError("Ingresa el teléfono del destinatario.");
  if (toPhone === s.phone) throw new ApiError("No puedes regalarte una tarjeta de regalo a ti mismo.");
  if (!amount || amount < GIFT_CARD_AMOUNT_MIN || amount > GIFT_CARD_AMOUNT_MAX) {
    throw new ApiError(`El monto debe estar entre S/${GIFT_CARD_AMOUNT_MIN} y S/${GIFT_CARD_AMOUNT_MAX}.`);
  }
  const receiverRows = await sbGet("customers", `phone=eq.${encodeURIComponent(toPhone)}&select=phone,name`);
  if (!receiverRows.length) throw new ApiError("No encontramos una cuenta con ese teléfono.", 404);

  const pointsNeeded = Math.round(amount * GIFT_CARD_POINTS_PER_SOL);
  // redeem_points_for_gift_credit (misma migración que esta redacción) debita los puntos
  // del comprador y acredita el saldo del destinatario en UNA sola transacción de
  // Postgres — si algo falla a la mitad, ambas mitades se revierten juntas.
  try {
    await rpc("redeem_points_for_gift_credit", { p_from: s.phone, p_to: toPhone, p_points: pointsNeeded, p_credit_amount: amount });
  } catch (e) {
    if (String((e as Error).message || e).includes("insufficient_points")) {
      throw new ApiError("No tienes puntos suficientes para este monto.", 402);
    }
    throw e;
  }
  await Promise.all([
    sbInsert("transactions", {
      customer_phone: s.phone,
      type: "redeem",
      points: -pointsNeeded,
      description: `Tarjeta de regalo enviada a ${receiverRows[0].name} (S/${amount})`,
      confirmed: true,
    }),
    sbInsert("credit_ledger", {
      customer_phone: toPhone,
      delta: amount,
      reason: "Tarjeta de regalo recibida",
      related_phone: s.phone,
    }),
  ]);
  try {
    await sendPushToPhone(toPhone, {
      title: "¡Recibiste una tarjeta de regalo! 🎁",
      body: `${active.row.name || "Alguien"} te regaló S/${amount.toFixed(2)} de crédito SND//WCH.`,
      url: "./index.html",
      tag: "sndwch-gift-received-" + Date.now(),
    });
  } catch {
    // un push fallido no debe bloquear la confirmación del regalo
  }
  return { success: true, toName: receiverRows[0].name };
}

// PLAN SEMANAL — recarga de saldo propio con bono (a diferencia de actPrepareCreditPurchase,
// que es para REGALAR crédito a otro cliente, esto es un top-up del propio saldo). Paga
// S/95 hoy, recibe S/100 en saldo — a cambio de meter caja hoy por consumo que de todas
// formas iba a pasar después. Usa su propia tabla (no pending_credit_purchases) porque no
// hay destinatario ni mensaje que guardar — mismo patrón de reserva atómica que el resto
// de cobros Culqi.
//
// Precio subido de S/90 a S/95 — la comisión de Culqi (~4% efectivo) sobre el cobro de
// S/90 dejaba al negocio recibiendo en realidad ~S/86.4, no los S/90 que el diseño
// original asumía como caja recibida. A S/95, el negocio recibe entre S/89.78 (extremo
// alto del rango de comisión real confirmado, 5.5%) y S/91.2 (extremo bajo, 4%) — cerca
// de los S/90 reales que se buscaban, pero no garantizado en todo el rango (revisado de
// nuevo en la ronda de auditoría de menú/negocio; decisión del dueño: dejar el precio en
// S/95 sin ajustar más — el crédito de S/100 que se entrega a cambio cuesta ~S/45 reales
// de honrar, así que el negocio sigue siendo rentable en términos absolutos incluso en el
// peor caso de comisión, solo no llega a cubrir el piso exacto de S/90 en ese extremo).
const WEEKLY_PLAN_PRICE = 95;
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
    // Antes decía "espera un momento" — subestimaba la espera real frente al TTL
    // verdadero de un plan pendiente (WEEKLY_PLAN_TTL_MINUTES=15). Un cliente cuyo primer
    // intento quedó a medias podía quedar bloqueado hasta 15 min leyendo un mensaje que
    // sonaba a segundos (hallazgo de auditoría UX, BAJO).
    throw new ApiError(`Ya tienes un Plan Semanal en proceso. Espera hasta ${WEEKLY_PLAN_TTL_MINUTES} minutos o contáctanos si el cobro ya se hizo.`, 409);
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
  const paymentOk = await verifyCulqiCharge(chargeId, amountCents, ref, "credit_ref");
  if (!paymentOk) throw new ApiError("No se pudo verificar el pago con Culqi.", 402);

  // claim + otorgar crédito + registrar en el ledger van en una sola transacción SQL
  // (confirm_weekly_plan_credit) — si cualquier paso falla, todo se revierte y la fila
  // queda en "pending" en vez de "consumed a medias", así actReconcileCulqiCharges la
  // detecta como huérfana en vez de darla por buena (ver comentario de la migración).
  try {
    await rpc("confirm_weekly_plan_credit", { p_plan_id: pp.id });
  } catch (e) {
    if (e instanceof Error && e.message.includes("already_processed")) {
      throw new ApiError("Este Plan Semanal ya fue procesado.", 409);
    }
    throw e;
  }
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
      // Fallos dentro de loops de cron solo iban a console.error — para los 3 crons que
      // mueven dinero real esto contradice la razón de ser de debug_logs (hallazgo de
      // auditoría de código, MEDIO).
      await debugLog({ stage: "expire-pending-weekly-plans", pendingPlanId: pp.id, error: String(e) });
    }
  }
  return { success: true, expired };
}

// "Avísame cuando vuelva" para un Signature agotado (por base o proteína sin stock) — hoy
// la tarjeta AGOTADO ni siquiera deja intentar pedirlo, así que esa demanda se perdía en
// silencio sin ningún registro de quién lo quería. Ver notifyRestockedSignatures en
// admin.ts para el otro lado: qué pasa cuando el ingrediente vuelve a stock.
export async function actRequestRestockNotify(b: any) {
  const s = await requireSession(b.token);
  const sigId = String(b.sigId || "").trim();
  if (!SIG_DATA[sigId]) throw new ApiError("Signature inválida.");
  try {
    await sbInsert("restock_notify_requests", { customer_phone: s.phone, sig_id: sigId });
  } catch (e) {
    // Ya lo había pedido antes (unique customer_phone+sig_id) — no es un error real,
    // solo confirma que ya está anotado.
    if (!(e instanceof Error && e.message.includes("23505"))) throw e;
  }
  return { success: true };
}

// Lista de espera pre-lanzamiento (waitlist_signups) — el negocio aún no abre (ver
// CLAUDE.md, contexto de negocio), así que esta es la única acción de captación que existe
// hoy antes de tener catálogo real que ofrecer. Público a propósito (sin sesión: nadie
// tiene cuenta todavía) y de baja fricción (solo teléfono obligatorio) — cualquier fricción
// extra aquí compite directo contra la meta de la semana 5-6 del checklist de lanzamiento.
const WAITLIST_RATE_LIMIT = 3;
const WAITLIST_RATE_WINDOW_MINUTES = 60;
export async function actWaitlistJoin(b: any) {
  const phone = String(b.phone || "").trim();
  const name = String(b.name || "").trim().slice(0, 80) || null;
  const source = String(b.source || "").trim().slice(0, 40) || null;
  if (phone.replace(/\D/g, "").length < 6) throw new ApiError("Ingresa un teléfono válido.");
  const withinLimit = await rpc("check_rate_limit", {
    p_key: `waitlist:${phone}`,
    p_limit: WAITLIST_RATE_LIMIT,
    p_window_minutes: WAITLIST_RATE_WINDOW_MINUTES,
  });
  if (!withinLimit) throw new ApiError("Ya registramos tu teléfono. Espera un momento antes de reintentar.", 429);
  try {
    await sbInsert("waitlist_signups", { phone, name, source });
  } catch (e) {
    // Unique en phone — ya estaba anotado, no es un error real para quien reintenta.
    if (!(e instanceof Error && e.message.includes("23505"))) throw e;
  }
  return { success: true };
}
