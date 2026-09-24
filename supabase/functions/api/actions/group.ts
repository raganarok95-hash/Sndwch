// SND//WCH — api / actions/group
// Pedido grupal / de oficina: una persona organiza, comparte un código, cualquiera con el
// link agrega SU propio Signature bajo su nombre (sin necesitar cuenta), y quien organizó
// cierra y paga todo junto — reutiliza el flujo de carrito/checkout normal en vez de
// duplicar la lógica de pago: actCloseGroupOrder solo devuelve los items ya agregados para
// que el cliente los cargue con loadCart() y pague exactamente como cualquier pedido
// multi-item (con combo/gating de menú secreto ya validados por ese mismo camino).
import { sbGet, sbInsert, sbUpdate, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, verifyActiveSession, verifyCronSecret } from "../session.ts";
import { loadCatalogPrices, priceCartItem, assertCartGatesAllowed, deriveCart, ORGANIZER_FREE_MIN_SANDWICHES } from "../catalog.ts";
import { sendPushToPhone, sendPushToAdmins } from "../push.ts";
import { finalizeAndInsertOrder, restockOrderItems, restockBestEffort, resolveDeliveryFee } from "./orders.ts";

// Ventana corta a propósito (pedido rápido de oficina, no algo para dejar abierto todo
// el día) — ver GROUP_ORDER_WINDOW_MINUTES en src/app.ts para el countdown que ve el
// cliente; ese lado es solo informativo, este es el que de verdad cierra el grupo.
const GROUP_ORDER_WINDOW_MINUTES = 15;
const MAX_GROUP_ITEMS = 60;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I/L — se confunden al compartirlo de palabra

function genGroupCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export async function actCreateGroupOrder(b: any) {
  const s = await requireSession(b.token);
  const rows = await sbGet("customers", `phone=eq.${encodeURIComponent(s.phone)}&select=name`);
  const organizerName = rows[0]?.name || "Alguien";
  const expiresAt = new Date(Date.now() + GROUP_ORDER_WINDOW_MINUTES * 60000).toISOString();
  // Colisión de código (6 chars de un alfabeto de 32 = ~1 mil millones de combinaciones)
  // es prácticamente imposible, pero el reintento es gratis y evita un 500 feo en el
  // caso extremo.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genGroupCode();
    try {
      await sbInsert("group_orders", { code, organizer_phone: s.phone, organizer_name: organizerName, expires_at: expiresAt });
      return { success: true, code, expiresAt };
    } catch (e) {
      if (e instanceof Error && e.message.includes("23505")) continue;
      throw e;
    }
  }
  throw new ApiError("No se pudo crear el pedido grupal. Intenta de nuevo.", 500);
}

async function fetchGroupOrder(code: string) {
  const rows = await sbGet("group_orders", `code=eq.${encodeURIComponent(code)}&select=*`);
  const g = rows[0];
  if (!g) throw new ApiError("No encontramos ese pedido grupal. Verifica el código.", 404);
  return g;
}

export async function actGetGroupOrder(b: any) {
  const code = String(b.code || "").trim().toUpperCase();
  if (!code) throw new ApiError("Falta el código.");
  const g = await fetchGroupOrder(code);
  // Cierre perezoso al leer — nadie necesita un cron aparte solo para marcar 'closed' un
  // grupo que ya venció; el primer request que lo nota lo deja consistente para el resto.
  if (g.status === "open" && new Date(g.expires_at).getTime() < Date.now()) {
    await sbUpdate("group_orders", `id=eq.${g.id}&status=eq.open`, { status: "closed" });
    g.status = "closed";
  }
  const rows = await sbGet("group_order_items", `group_order_id=eq.${g.id}&order=created_at.asc`);
  await loadCatalogPrices();
  const items = rows.map((row: any) => {
    try {
      const priced = priceCartItem(row.item);
      return { id: row.id, contributorName: row.contributor_name, label: priced.label, qty: priced.qty, unitPrice: priced.unitPrice, isSandwich: row.item?.type !== "side" };
    } catch {
      // Un producto que dejó de existir (cambio de catálogo) no debe tumbar toda la
      // pantalla del grupo — se muestra marcado en vez de desaparecer en silencio.
      return { id: row.id, contributorName: row.contributor_name, label: "Producto no disponible", qty: 0, unitPrice: 0, isSandwich: false };
    }
  });
  const total = items.reduce((sum: number, it: any) => sum + it.unitPrice * it.qty, 0);
  let isOrganizer = false;
  if (b.token) {
    const active = await verifyActiveSession(b.token);
    if (active && active.payload.phone === g.organizer_phone) isOrganizer = true;
  }
  // sandwichQty/organizerFreeAt alimentan el avance del sándwich gratis del organizador
  // en la pantalla del grupo ("faltan 2 para que uno vaya gratis"). Se calculan acá y no
  // en el cliente para que el número que ve el que está juntando al grupo sea el mismo
  // que el servidor va a usar al cobrar.
  const sandwichQty = items.reduce((n: number, it: any) => n + (it.isSandwich ? it.qty : 0), 0);
  // `canPay` existe para que la pantalla no tenga que deducir de `status` si todavía hay
  // algo que hacer: un grupo vencido ('closed') SIGUE siendo pagable por su organizador
  // mientras nadie lo haya pagado. Deducirlo en el cliente fue justo lo que dejó al
  // organizador sin botón durante meses.
  const canPay = isOrganizer && (g.status === "open" || g.status === "closed") && items.length > 0;
  const partes = g.status === "splitting" || g.status === "paid" ? await partesDelGrupo(g.code) : [];
  return {
    partes, splitDeadline: g.split_deadline || null,
    code: g.code, status: g.status, organizerName: g.organizer_name, expiresAt: g.expires_at,
    items, total, isOrganizer, sandwichQty, organizerFreeAt: ORGANIZER_FREE_MIN_SANDWICHES,
    canPay, freeApplies: sandwichQty >= ORGANIZER_FREE_MIN_SANDWICHES,
    missingForFree: Math.max(0, ORGANIZER_FREE_MIN_SANDWICHES - sandwichQty),
  };
}

export async function actAddGroupItem(b: any) {
  const code = String(b.code || "").trim().toUpperCase();
  const contributorName = String(b.contributorName || "").trim().slice(0, 40);
  if (!code) throw new ApiError("Falta el código.");
  if (!contributorName) throw new ApiError("Ingresa tu nombre.");
  const g = await fetchGroupOrder(code);
  if (g.status !== "open" || new Date(g.expires_at).getTime() < Date.now()) {
    if (g.status === "open") await sbUpdate("group_orders", `id=eq.${g.id}&status=eq.open`, { status: "closed" });
    throw new ApiError("Este pedido grupal ya se cerró.", 409);
  }
  const withinLimit = await rpc("check_rate_limit", { p_key: `group-add:${code}`, p_limit: 30, p_window_minutes: 60 });
  if (!withinLimit) throw new ApiError("Demasiados productos agregados a este grupo en poco tiempo. Espera un momento.", 429);
  const existing = await sbGet("group_order_items", `group_order_id=eq.${g.id}&select=id`);
  if (existing.length >= MAX_GROUP_ITEMS) throw new ApiError("Este pedido grupal ya llegó al máximo de productos.", 400);
  await loadCatalogPrices();
  // Quien contribuye a un grupo nunca tiene sesión propia acá (solo pone su nombre), así
  // que su total_orders "efectivo" es 0 — el menú secreto nunca se puede colar por este
  // camino, sin importar quién sea. Si quien organiza sí califica, puede agregarlo desde
  // su propio carrito personal por separado.
  assertCartGatesAllowed([b.item], 0);
  const priced = priceCartItem(b.item); // valida el ítem — lanza ApiError si es inválido
  await sbInsert("group_order_items", { group_order_id: g.id, contributor_name: contributorName, item: priced.item });

  // Avisa a quien organizó que alguien más se sumó — antes tenía que quedarse mirando la
  // pantalla (o refrescar) para saber cuándo ya podía cerrar y pagar. Si quien organiza es
  // quien está agregando su propio pedido, no tiene sentido notificarse a sí mismo.
  let isOrganizerAdding = false;
  if (b.token) {
    const active = await verifyActiveSession(b.token);
    if (active && active.payload.phone === g.organizer_phone) isOrganizerAdding = true;
  }
  if (!isOrganizerAdding) {
    try {
      await sendPushToPhone(g.organizer_phone, {
        title: "Nuevo pedido en tu grupo",
        body: `${contributorName} agregó su pedido a tu pedido grupal.`,
        url: "./index.html?group=" + code,
        tag: "sndwch-group-add-" + code,
        renotify: true,
      });
    } catch {
      // un push fallido no debe bloquear que el pedido se agregue
    }
  }
  return { success: true };
}

export async function actCancelGroupOrder(b: any) {
  const s = await requireSession(b.token);
  const code = String(b.code || "").trim().toUpperCase();
  const g = await fetchGroupOrder(code);
  if (g.organizer_phone !== s.phone) throw new ApiError("Solo quien organizó el pedido puede cancelarlo.", 403);
  await sbUpdate("group_orders", `id=eq.${g.id}`, { status: "cancelled" });
  return { success: true };
}

// ¿Corresponde el sándwich gratis del organizador para este carrito?
// Devuelve true SOLO si las cuatro cosas son ciertas, todas verificadas contra la base:
//   1. el código existe,
//   2. quien está pagando es el mismo que organizó el grupo,
//   3. el grupo tiene al menos ORGANIZER_FREE_MIN_SANDWICHES sándwiches (no ítems: un
//      grupo de 5 bebidas no destraba nada),
//   4. NINGÚN pedido se cobró todavía con ese código de grupo — sin esto, el organizador
//      podría pasar el mismo carrito por el checkout varias veces y farmear el descuento.
// El cliente manda `groupCode` en el cuerpo del pedido, pero eso es solo una pista de
// atribución: acá se vuelve a comprobar todo desde cero.
export async function organizerFreeSandwichApplies(code: string, phone: string | null): Promise<boolean> {
  if (!code || !phone) return false;
  try {
    const rows = await sbGet("group_orders", `code=eq.${encodeURIComponent(code)}&select=id,organizer_phone&limit=1`);
    const g = rows[0];
    if (!g || g.organizer_phone !== phone) return false;
    const items = await sbGet("group_order_items", `group_order_id=eq.${g.id}&select=item`);
    // Se suman UNIDADES (item.qty), no filas. `actAddGroupItem` acepta qty de 1 a 20, así
    // que una sola fila puede traer 3 sándwiches: contando filas, dos personas con qty 3 y
    // qty 2 dan 5 sándwiches en la pantalla del grupo (que sí suma qty, línea ~87) pero
    // solo 2 acá, y el pedido se rechazaba por "el total no coincide" justo en el caso que
    // el incentivo busca atraer.
    const sandwiches = items.reduce(
      (n: number, r: any) => n + (r.item && r.item.type !== "side" ? Number(r.item.qty) || 0 : 0),
      0,
    );
    if (sandwiches < ORGANIZER_FREE_MIN_SANDWICHES) return false;
    const yaCobrado = await sbGet("orders", `group_code=eq.${encodeURIComponent(code)}&select=id&limit=1`);
    return !yaCobrado.length;
  } catch (e) {
    // Ante cualquier duda, NO se regala nada. Un fallo de red no puede convertirse en un
    // descuento que el negocio no decidió.
    console.error("organizerFreeSandwichApplies failed:", e);
    return false;
  }
}

export async function actCloseGroupOrder(b: any) {
  const s = await requireSession(b.token);
  const code = String(b.code || "").trim().toUpperCase();
  const g = await fetchGroupOrder(code);
  if (g.organizer_phone !== s.phone) throw new ApiError("Solo quien organizó el pedido puede cerrarlo y pagar.", 403);
  if (g.status === "cancelled") throw new ApiError("Este pedido grupal fue cancelado.", 409);
  if (g.status === "paid") throw new ApiError("Este pedido grupal ya se pagó.", 409);
  const precheck = await sbGet("group_order_items", `group_order_id=eq.${g.id}&select=id&limit=1`);
  if (!precheck.length) throw new ApiError("Nadie agregó productos todavía.", 400);
  // Cierra con guard status=eq.open ANTES de leer la lista final de items (antes se leía
  // primero y se cerraba después, dejando una ventana en la que actAddGroupItem podía colar
  // un producto entre el SELECT y el UPDATE que nunca terminaba en el pedido que se cobra —
  // hallazgo de auditoría de arquitectura backend). El guard también evita reprocesar un
  // cierre doble-tap concurrente. Se relee después del UPDATE para cobrar exactamente lo que
  // quedó en la base al momento de cerrar, no la foto de arriba.
  // VENCER NO MATA EL PEDIDO (2026-09-23, decisión del dueño). Hasta hoy este guard era
  // `status=eq.open`, y `actGetGroupOrder` marca 'closed' en cuanto vence al leerlo. Las dos
  // cosas juntas daban el peor resultado posible: pasados los 15 minutos el organizador
  // abría la pantalla del grupo —lo que por sí solo lo cerraba— y al tocar "pagar" recibía
  // "ya se cerró". **Todo lo que los demás habían sumado se perdía, y se perdía porque el
  // organizador lo había mirado.** Sobre el pedido que más deja del negocio.
  //
  // Ahora 'closed' significa solo "ya no entra nadie más": se puede pagar con los que
  // alcanzaron a sumarse. Lo que decide si el incentivo aplica sigue siendo el CONTEO
  // (organizerFreeSandwichApplies), así que un grupo que no llegó a
  // ORGANIZER_FREE_MIN_SANDWICHES simplemente no regala nada — y el cliente se entera en la
  // pantalla, no al final.
  //
  // El estado terminal pasa a ser 'paid'. El guard sigue siendo atómico: entre dos toques
  // simultáneos gana uno solo, que es para lo que existía `status=eq.open`.
  const updated = await sbUpdate("group_orders", `id=eq.${g.id}&status=in.(open,closed)`, { status: "paid" });
  if (!updated.length) throw new ApiError("Este pedido grupal ya se pagó o fue cancelado.", 409);
  const rows = await sbGet("group_order_items", `group_order_id=eq.${g.id}&order=created_at.asc`);
  // Sin esto, el carrito final perdía por completo quién pidió qué — con dos personas
  // pidiendo el mismo Signature, cocina/admin no podía distinguir un sándwich del otro.
  // Reutiliza el campo `note` (ya soportado en sig/byo, ya se imprime en el ticket de
  // cocina y en el resumen de WhatsApp) en vez de inventar un campo nuevo de punta a
  // punta — hallazgo de auditoría UX, MEDIO.
  return {
    success: true,
    items: rows.map((row: any) => {
      const item = { ...row.item };
      if ((item.type === "sig" || item.type === "byo") && row.contributor_name) {
        const prefix = `De: ${row.contributor_name}`;
        item.note = item.note ? `${prefix} — ${item.note}` : prefix;
      }
      return item;
    }),
  };
}


// ══ «CERRAR Y PAGAR»: CADA UNO PAGA LO SUYO (decisión del dueño, 2026-09-24) ═══════════
//
// «Yo invito» sigue siendo actCloseGroupOrder: el organizador paga todo en un solo pedido.
// «Cerrar y pagar» reparte: cada persona recibe SU PROPIO pedido Yape —sus productos más su
// parte del envío— y lo paga desde el mismo enlace. No hay un sistema de cobro nuevo: cada
// parte es un pedido normal, con el mismo comprobante, la misma confirmación del dueño, el
// mismo inventario y la misma cancelación. Todos llevan `group_code`, así el panel sabe que
// salen juntos.
//
// Si alguien no paga antes de `split_deadline`, su parte se cancela (y su stock vuelve) y el
// resto sale igual. La parte de envío que no se pagó la absorbe el negocio: se decidió así
// para que un amigo que no paga no deje a los demás sin su pedido.
export const GROUP_SPLIT_MINUTES = 20;

export type ParteDelGrupo = {
  name: string;
  items: Record<string, unknown>[];
  food: number;
  envio: number;
  total: number;
  esOrganizador: boolean;
};

// El reparto, puro para poder probarlo. El envío se parte en céntimos exactos: cada uno paga
// el piso de fee/N y los céntimos que sobran van al organizador, así la suma de las partes es
// EXACTAMENTE la tarifa (ni un céntimo de menos para el motorizado, ni uno de más a nadie).
// El sándwich gratis del organizador (≥ ORGANIZER_FREE_MIN_SANDWICHES en el grupo) se le
// descuenta de SU parte: es su incentivo, no un descuento para los demás.
export function repartirGrupo(
  personas: { name: string; items: any[] }[],
  fee: number,
  organizerName: string,
  organizerFree: boolean,
): ParteDelGrupo[] {
  const n = personas.length;
  if (!n) throw new ApiError("Nadie agregó productos todavía.", 400);
  const feeC = Math.round(fee * 100);
  const base = Math.floor(feeC / n);
  const sobra = feeC - base * n;
  let orgIdx = personas.findIndex((p) => p.name === organizerName);
  if (orgIdx < 0) orgIdx = 0;
  return personas.map((p, i) => {
    const esOrganizador = i === orgIdx;
    const { expectedTotal, sanitizedItems } = deriveCart(p.items, null, null, false);
    let comida = expectedTotal;
    // deriveCart no sirve para el incentivo acá: exige ORGANIZER_FREE_MIN_SANDWICHES en el
    // MISMO carrito, y la parte del organizador casi nunca los tiene (el grupo sí). Se quita
    // una unidad del 15CM más barato que él pidió y el resto se tasa aparte, así esa unidad
    // gratis tampoco cuenta para el combo (misma regla que las recompensas).
    if (esOrganizador && organizerFree) {
      let idx = -1, best = Infinity;
      p.items.forEach((it: any, k: number) => {
        const pr = priceCartItem(it);
        if (pr.eligibleR06 && pr.basePrice < best) { best = pr.basePrice; idx = k; }
      });
      if (idx >= 0) {
        const resto = p.items.map((it: any, k: number) => k === idx ? { ...it, qty: (Number(it.qty) || 1) - 1 } : it)
          .filter((it: any) => (Number(it.qty) || 0) > 0);
        comida = resto.length ? deriveCart(resto, null, null, false).expectedTotal : 0;
      }
    }
    const envioC = base + (esOrganizador ? sobra : 0);
    const food = Math.round(comida * 100) / 100;
    return {
      name: p.name,
      items: sanitizedItems,
      food,
      envio: envioC / 100,
      total: Math.round(comida * 100 + envioC) / 100,
      esOrganizador,
    };
  });
}

function refDeParte(code: string, i: number): string {
  let r = "";
  for (let k = 0; k < 3; k++) r += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `ORD-G${code}-${i + 1}${r}`;
}

export async function actSplitGroupOrder(b: any) {
  const s = await requireSession(b.token);
  const code = String(b.code || "").trim().toUpperCase();
  const g = await fetchGroupOrder(code);
  if (g.organizer_phone !== s.phone) throw new ApiError("Solo quien organizó el pedido puede cerrarlo.", 403);
  const address = String(b.address || "").trim().slice(0, 300);
  if (!address) throw new ApiError("Falta la dirección de entrega.");
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new ApiError("Marca en el mapa dónde lo dejamos.");
  const { fee, km } = resolveDeliveryFee(lat, lon, "");
  const contactPhone = String(b.contactPhone || s.phone).trim().slice(0, 20);

  // Guard atómico: open o closed (vencido) → splitting. Entre dos toques gana uno.
  const deadline = new Date(Date.now() + GROUP_SPLIT_MINUTES * 60000).toISOString();
  const updated = await sbUpdate("group_orders", `id=eq.${g.id}&status=in.(open,closed)`, { status: "splitting", split_deadline: deadline });
  if (!updated.length) throw new ApiError("Este pedido grupal ya se cerró o se pagó.", 409);

  const creados: { ref: string; items: any }[] = [];
  try {
    const rows = await sbGet("group_order_items", `group_order_id=eq.${g.id}&order=created_at.asc`);
    if (!rows.length) throw new ApiError("Nadie agregó productos todavía.", 400);
    await loadCatalogPrices();
    const porNombre = new Map<string, any[]>();
    for (const r of rows) {
      const k = String(r.contributor_name || "Alguien");
      if (!porNombre.has(k)) porNombre.set(k, []);
      porNombre.get(k)!.push(r.item);
    }
    const personas = [...porNombre.entries()].map(([name, items]) => ({ name, items }));
    const sandwiches = rows.reduce((n: number, r: any) => n + (r.item && r.item.type !== "side" ? Number(r.item.qty) || 0 : 0), 0);
    const partes = repartirGrupo(personas, fee, g.organizer_name, sandwiches >= ORGANIZER_FREE_MIN_SANDWICHES);

    for (let i = 0; i < partes.length; i++) {
      const p = partes[i];
      const ref = refDeParte(code, i);
      const { ingredients } = deriveCart(p.items, null, null, false);
      const codes = ingredients.length ? Array.from(new Set(ingredients)).sort() : [];
      const qtys = codes.map((c) => ingredients.filter((x) => x === c).length);
      if (codes.length) {
        try {
          await rpc("reserve_inventory", { p_codes: codes, p_qtys: qtys });
        } catch {
          throw new ApiError(`Se agotó algo de lo que pidió ${p.name}. Que lo cambie y vuelve a cerrar.`, 409);
        }
      }
      try {
        await finalizeAndInsertOrder({
          ref,
          phone: p.esOrganizador ? s.phone : null,
          contactPhone,
          name: p.name,
          email: "",
          address,
          summary: `Grupo ${code} · parte de ${p.name}`,
          notes: `Pedido grupal ${code}: sale junto con las demás partes.`,
          total: p.total,
          deliveryFee: p.envio,
          deliveryKm: km,
          deliveryZone: null,
          paymentStatus: "pending",
          paymentId: null,
          paymentMethod: "yape",
          items: p.items,
          scheduledFor: null,
          reward: null,
          useCredit: false,
          lat,
          lon,
          groupCode: code,
        });
      } catch (e) {
        await restockBestEffort(codes, qtys, "group-split");
        throw e;
      }
      creados.push({ ref, items: p.items });
    }
  } catch (e) {
    // Si una parte no se pudo crear, se deshace todo: las ya creadas se cancelan (y
    // devuelven su stock) y el grupo vuelve a quedar pagable. Mejor un error claro que
    // medio grupo cobrado.
    for (const c of creados) {
      try {
        const r = await sbUpdate("orders", `ref=eq.${encodeURIComponent(c.ref)}&payment_status=neq.paid`, { status: "CANCELADO", cancel_reason: "No se pudo repartir el pedido grupal" });
        if (r.length) await restockOrderItems(c.items);
      } catch (e2) { console.error("group split rollback", c.ref, e2); }
    }
    await sbUpdate("group_orders", `id=eq.${g.id}&status=eq.splitting`, { status: "closed", split_deadline: null });
    throw e;
  }
  try {
    await sendPushToAdmins({
      title: `Pedido grupal ${code} repartido`,
      body: `${creados.length} partes por pagar. Salen juntas; lo que no se pague en ${GROUP_SPLIT_MINUTES} min se cancela solo.`,
      url: "./index.html",
      tag: "sndwch-group-split-" + code,
    });
  } catch { /* el reparto ya está hecho */ }
  return { success: true, deadline, partes: creados.length };
}

// Las partes de un grupo repartido, para la pantalla del enlace: quién, cuánto, si ya pagó.
export async function partesDelGrupo(code: string) {
  const rows = await sbGet(
    "orders",
    `group_code=eq.${encodeURIComponent(code)}&select=ref,customer_name,total,delivery_fee,payment_status,status&order=created_at.asc`,
  );
  return rows.map((o: any) => ({
    ref: o.ref,
    name: o.customer_name,
    total: Number(o.total),
    envio: Number(o.delivery_fee) || 0,
    paid: o.payment_status === "paid",
    cancelled: o.status === "CANCELADO",
  }));
}

// Cron: los grupos repartidos cuyo plazo venció. Lo que no se pagó se cancela (vuelve su
// stock) y el grupo se cierra — 'paid' si alguien pagó, 'cancelled' si nadie.
export async function actExpireGroupShares(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const now = new Date().toISOString();
  const grupos = await sbGet("group_orders", `status=eq.splitting&split_deadline=lt.${encodeURIComponent(now)}&select=id,code,organizer_phone&limit=100`);
  let cerrados = 0, cancelados = 0;
  for (const g of grupos) {
    try {
      const pend = await sbGet("orders", `group_code=eq.${encodeURIComponent(g.code)}&payment_status=neq.paid&status=eq.RECIBIDO&select=id,ref,items`);
      for (const o of pend) {
        const r = await sbUpdate("orders", `id=eq.${encodeURIComponent(o.id)}&status=eq.RECIBIDO&payment_status=neq.paid`, { status: "CANCELADO", cancel_reason: "Parte del pedido grupal no pagada a tiempo" });
        if (r.length) { await restockOrderItems(o.items); cancelados++; }
      }
      const pagados = await sbGet("orders", `group_code=eq.${encodeURIComponent(g.code)}&payment_status=eq.paid&select=id&limit=1`);
      await sbUpdate("group_orders", `id=eq.${g.id}&status=eq.splitting`, { status: pagados.length ? "paid" : "cancelled" });
      cerrados++;
      try {
        await sendPushToPhone(g.organizer_phone, {
          title: pagados.length ? "Tu pedido grupal sale" : "Tu pedido grupal se canceló",
          body: pend.length
            ? (pagados.length ? `Sale con los que pagaron. ${pend.length} parte(s) no se pagaron a tiempo.` : "Nadie pagó su parte a tiempo.")
            : "Todos pagaron. Ya va a la cocina.",
          url: "./index.html?group=" + g.code,
          tag: "sndwch-group-split-fin-" + g.code,
        });
      } catch { /* sin push */ }
    } catch (e) {
      console.error("expire-group-shares", g.code, e);
    }
  }
  return { success: true, cerrados, cancelados };
}

// Si todas las partes vivas de un grupo repartido ya se pagaron, el grupo pasa a 'paid' y se
// avisa al organizador y a cocina: no hay por qué esperar al plazo.
export async function cerrarGrupoSiTodosPagaron(code: string): Promise<boolean> {
  const g = (await sbGet("group_orders", `code=eq.${encodeURIComponent(code)}&status=eq.splitting&select=id,organizer_phone`))[0];
  if (!g) return false;
  const vivas = await sbGet("orders", `group_code=eq.${encodeURIComponent(code)}&status=neq.CANCELADO&select=payment_status`);
  if (!vivas.length || vivas.some((o: any) => o.payment_status !== "paid")) return false;
  const r = await sbUpdate("group_orders", `id=eq.${g.id}&status=eq.splitting`, { status: "paid" });
  if (!r.length) return false;
  try {
    await sendPushToPhone(g.organizer_phone, { title: "Todos pagaron su parte", body: "Tu pedido grupal ya va a la cocina.", url: "./index.html?group=" + code, tag: "sndwch-group-split-fin-" + code });
  } catch { /* sin push */ }
  try {
    await sendPushToAdmins({ title: `Grupo ${code}: todos pagaron`, body: "Ya puedes armar todas las partes; salen juntas.", url: "./index.html", tag: "sndwch-group-split-ok-" + code });
  } catch { /* sin push */ }
  return true;
}
