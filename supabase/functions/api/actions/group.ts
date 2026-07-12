// SND//WCH — api / actions/group
// Pedido grupal / de oficina: una persona organiza, comparte un código, cualquiera con el
// link agrega SU propio Signature bajo su nombre (sin necesitar cuenta), y quien organizó
// cierra y paga todo junto — reutiliza el flujo de carrito/checkout normal en vez de
// duplicar la lógica de pago: actCloseGroupOrder solo devuelve los items ya agregados para
// que el cliente los cargue con loadCart() y pague exactamente como cualquier pedido
// multi-item (con combo/gating de menú secreto ya validados por ese mismo camino).
import { sbGet, sbInsert, sbUpdate, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, verifyActiveSession } from "../session.ts";
import { loadCatalogPrices, priceCartItem, assertCartGatesAllowed } from "../catalog.ts";

const GROUP_ORDER_WINDOW_HOURS = 3;
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
  const expiresAt = new Date(Date.now() + GROUP_ORDER_WINDOW_HOURS * 3600000).toISOString();
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
      return { id: row.id, contributorName: row.contributor_name, label: priced.label, qty: priced.qty, unitPrice: priced.unitPrice };
    } catch {
      // Un producto que dejó de existir (cambio de catálogo) no debe tumbar toda la
      // pantalla del grupo — se muestra marcado en vez de desaparecer en silencio.
      return { id: row.id, contributorName: row.contributor_name, label: "Producto no disponible", qty: 0, unitPrice: 0 };
    }
  });
  const total = items.reduce((sum: number, it: any) => sum + it.unitPrice * it.qty, 0);
  let isOrganizer = false;
  if (b.token) {
    const active = await verifyActiveSession(b.token);
    if (active && active.payload.phone === g.organizer_phone) isOrganizer = true;
  }
  return { code: g.code, status: g.status, organizerName: g.organizer_name, expiresAt: g.expires_at, items, total, isOrganizer };
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

export async function actCloseGroupOrder(b: any) {
  const s = await requireSession(b.token);
  const code = String(b.code || "").trim().toUpperCase();
  const g = await fetchGroupOrder(code);
  if (g.organizer_phone !== s.phone) throw new ApiError("Solo quien organizó el pedido puede cerrarlo y pagar.", 403);
  if (g.status === "cancelled") throw new ApiError("Este pedido grupal fue cancelado.", 409);
  const rows = await sbGet("group_order_items", `group_order_id=eq.${g.id}&order=created_at.asc`);
  if (!rows.length) throw new ApiError("Nadie agregó productos todavía.", 400);
  await sbUpdate("group_orders", `id=eq.${g.id}`, { status: "closed" });
  return { success: true, items: rows.map((row: any) => row.item) };
}
