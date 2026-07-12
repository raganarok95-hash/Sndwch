// SND//WCH — api / catalog
// Catálogo de productos (proteínas, signatures, bebidas/sides, recompensas) y toda la
// lógica de tasación/validación de un pedido — nunca confía en precios/etiquetas que
// reporte el cliente, todo se recalcula aquí a partir de estos datos.
import { sbGet } from "./db.ts";
import { ApiError } from "./types.ts";

export const REWARDS: Record<string, { pts: number; label: string }> = {
  R01: { pts: 40, label: "TOPPING // EXTRA" },
  R02: { pts: 80, label: "4TA // SALSA" },
  R03: { pts: 140, label: "SAUCE // SET" },
  R04: { pts: 180, label: "DOBLE // PROTEÍNA" },
  R05: { pts: 250, label: "BEBIDA // GRATIS" },
  R06: { pts: 400, label: "SÁNDWICH // GRATIS" },
};

export const VALID_BASES = new Set(["B01", "B02", "B03"]);
export const VALID_TOPS = new Set(["T01", "T02", "T03", "T04", "T05", "T06"]);
export const VALID_CHEESE = new Set(["C01", "C02", "C03"]);
export const VALID_SAUCES = new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12"]);
export const PROT_PRICE: Record<string, { p15: number; p30: number; pDbl: number }> = {
  P01: { p15: 14, p30: 22, pDbl: 6 },
  P02: { p15: 13, p30: 21, pDbl: 6 },
  P03: { p15: 12, p30: 20, pDbl: 4 },
  P04: { p15: 12, p30: 20, pDbl: 5 },
  P05: { p15: 16, p30: 26, pDbl: 9 },
  P06: { p15: 14, p30: 24, pDbl: 7 },
};
export const SIG_DATA: Record<string, { base: string; prot: string; tops: string[]; sauces: string[]; p15: number; p30: number }> = {
  SIG01: { base: "B01", prot: "P01", tops: ["T01", "T02", "T03"], sauces: ["S01", "S04"], p15: 18, p30: 22 },
  SIG02: { base: "B02", prot: "P06", tops: ["T04", "T03", "T01"], sauces: ["S02", "S07"], p15: 19, p30: 24 },
  SIG03: { base: "B03", prot: "P05", tops: ["T03", "T02", "T01"], sauces: ["S03", "S08"], p15: 21, p30: 26 },
  SIG04: { base: "B01", prot: "P04", tops: ["T01", "T02", "T06"], sauces: ["S01", "S11"], p15: 16, p30: 20 },
  // Menú secreto — ver SIG_GATES. Nunca aparece en el menú público; solo un cliente que
  // ya alcanzó el rango exigido lo ve/puede pedirlo (ver sigGateError).
  SIG05: { base: "B02", prot: "P05", tops: ["T04", "T06", "T02"], sauces: ["S09", "S12"], p15: 24, p30: 30 },
};
// Sabores con acceso restringido — hoy solo el menú secreto (permanente), pero el mismo
// campo earlyAccessUntil sirve para abrir un Signature nuevo antes al Círculo Interno y
// recién después a todos (poner una fecha ISO ahí en vez de dejarlo indefinido). Se
// compara contra customers.total_orders de la SESIÓN que hace el pedido — un invitado
// (sin sesión) nunca puede pedirlos, sin importar qué diga el carrito.
export const SIG_GATES: Record<string, { minOrders: number; earlyAccessUntil?: string }> = {
  SIG05: { minOrders: 15 },
};
export function sigGateError(sigId: string, totalOrders: number): string | null {
  const gate = SIG_GATES[sigId];
  if (!gate) return null;
  if (gate.earlyAccessUntil && Date.now() >= new Date(gate.earlyAccessUntil).getTime()) return null;
  if (totalOrders >= gate.minOrders) return null;
  return "Ese sabor es exclusivo del Círculo Interno — sigue pidiendo para desbloquearlo.";
}
// Usado por actPrepareOrder/actPlaceOrder ANTES de reservar inventario o cobrar — un
// carrito con un sabor restringido para quien lo manda se rechaza igual que un producto
// agotado, nunca solo se "ignora" el ítem en silencio.
export function assertCartGatesAllowed(rawItems: any, totalOrders: number): void {
  if (!Array.isArray(rawItems)) return;
  for (const it of rawItems) {
    if (it && it.type === "sig" && typeof it.sigId === "string") {
      const err = sigGateError(it.sigId, totalOrders);
      if (err) throw new ApiError(err, 403);
    }
  }
}
// D01-D05 (chicha morada, inca kola, agua, papas, galleta) se retiraron del catálogo a
// pedido del dueño — solo era reventa de botellas/paquetes sin nada distinto a lo que
// vende cualquier otro local. Pedidos viejos que ya tenían estos códigos en su
// items[] siguen mostrando bien (ver statItemLabel/statUnitPrice más abajo, y el
// try/catch en restockOrderItems de orders.ts que ya contemplaba ítems legados que no
// encajan en el catálogo actual) — solo dejan de poder pedirse de nuevo.
export const SIDE_PRICE: Record<string, number> = { D06: 4, D07: 3, D08: 4, D09: 6 };
export const SIDE_LABEL: Record<string, string> = {
  // Catálogo de bebidas de la casa — sin jugos a propósito (decisión de negocio: los
  // jugos ya los vende cualquier juguería del barrio, esto busca diferenciarse).
  D06: "THE BLOOM // HIBISCUS",
  D07: "THE MIDNIGHT // BREW",
  D08: "THE COOL // MINT",
  D09: "THE SPICE // CHAI",
};
export const SIG_LABEL: Record<string, string> = {
  SIG01: "THE ORIGINAL // SIGNATURE",
  SIG02: "THE FIRE // BUILD",
  SIG03: "THE SMOKE // BUILD",
  SIG04: "THE FRESH // BUILD",
  SIG05: "THE VAULT // RESERVE",
};
// Antes cambiar un precio requería editar el mismo número en 2 lugares (index.html Y
// esta función) y redesplegar ambos — ver migración create_catalog_prices_table. Esto
// sobreescribe los números hardcodeados de arriba con lo que haya en la tabla, dejando
// nombres/ingredientes/composición sin tocar (siguen siendo criterio de un developer,
// cambian con mucha menos frecuencia). Se llama al inicio de cada acción sensible al
// precio — a esta escala de negocio, un round-trip extra por pedido es aceptable frente
// a la simplicidad de no tener que cachear/invalidar nada.
export async function loadCatalogPrices(): Promise<void> {
  try {
    const rows = await sbGet("catalog_prices", "select=code,category,values");
    for (const row of rows) {
      const v = row.values || {};
      if (row.category === "protein" && PROT_PRICE[row.code]) {
        if (typeof v.p15 === "number") PROT_PRICE[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") PROT_PRICE[row.code].p30 = v.p30;
        if (typeof v.pDbl === "number") PROT_PRICE[row.code].pDbl = v.pDbl;
      } else if (row.category === "sig" && SIG_DATA[row.code]) {
        if (typeof v.p15 === "number") SIG_DATA[row.code].p15 = v.p15;
        if (typeof v.p30 === "number") SIG_DATA[row.code].p30 = v.p30;
      } else if (row.category === "side" && row.code in SIDE_PRICE) {
        if (typeof v.price === "number") SIDE_PRICE[row.code] = v.price;
      } else if (row.category === "reward" && REWARDS[row.code]) {
        if (typeof v.pts === "number") REWARDS[row.code].pts = v.pts;
      }
    }
  } catch (e) {
    // Si falla, seguimos con los valores hardcodeados de arriba como respaldo — nunca
    // debe bloquear un pedido por un problema leyendo la tabla de precios.
    console.error("loadCatalogPrices failed:", e);
  }
}
export const PROT_LABEL: Record<string, string> = {
  P01: "ASADO // RES",
  P02: "POLLO // TERIYAKI",
  P03: "POLLO // CAJUN",
  P04: "ATÚN // HOUSE",
  P05: "THE ITALIAN",
  P06: "MEATBALL // MARINARA",
};

export function rewardWaiver(rewardId: string | null, b: any, basePrice: number, dblSurcharge: number): number {
  if (!rewardId) return 0;
  const reward = REWARDS[rewardId];
  if (!reward) throw new ApiError("Recompensa inválida.");
  if (rewardId === "R04") {
    if (!b.doubleProt) throw new ApiError("Selecciona doble proteína para usar esta recompensa.", 400);
    return dblSurcharge;
  }
  if (rewardId === "R06") {
    if (b.size !== "15") throw new ApiError("Esta recompensa solo es válida en tamaño 15CM.", 400);
    return basePrice;
  }
  return 0;
}

type PricedBuild = {
  basePrice: number;
  dblSurcharge: number;
  sauceSurcharge: number;
  ingredientsPerUnit: string[];
  label: string;
};

// Tasación/validación de UN sándwich (signature o build-your-own), sin qty ni tipo de
// carrito — deriveOrder (favoritos, un solo build) y priceCartItem (una línea de
// carrito) repetían este mismo cálculo carácter por carácter, cada uno con su propia
// copia (hallazgo de la auditoría de código).
function priceSigBuild(sigId: string, size: "15" | "30", doubleProt: boolean, extraSauce: boolean): PricedBuild {
  const sig = SIG_DATA[sigId];
  if (!sig) throw new ApiError("Signature inválida.");
  const protInfo = PROT_PRICE[sig.prot];
  const basePrice = size === "15" ? sig.p15 : sig.p30;
  const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
  const ingredientsPerUnit = [sig.base, sig.prot, ...sig.tops, ...sig.sauces];
  if (doubleProt) ingredientsPerUnit.push(sig.prot);
  return { basePrice, dblSurcharge, sauceSurcharge: extraSauce ? 2 : 0, ingredientsPerUnit, label: SIG_LABEL[sigId] || sigId };
}
function priceByoBuild(
  base: string, prot: string, cheese: string | null, tops: string[], sauces: string[],
  size: "15" | "30", doubleProt: boolean, extraSauce: boolean,
): PricedBuild {
  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.");
  const protInfo = PROT_PRICE[prot];
  if (!protInfo) throw new ApiError("Proteína inválida.");
  if (cheese && !VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
  if (tops.some((t) => !VALID_TOPS.has(t))) throw new ApiError("Topping inválido.");
  if (sauces.length > 3 || sauces.some((s) => !VALID_SAUCES.has(s))) throw new ApiError("Salsa inválida.");
  const basePrice = size === "15" ? protInfo.p15 : protInfo.p30;
  const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
  const ingredientsPerUnit = [base, prot, ...tops, ...(cheese ? [cheese] : []), ...sauces];
  if (doubleProt) ingredientsPerUnit.push(prot);
  return { basePrice, dblSurcharge, sauceSurcharge: extraSauce ? 2 : 0, ingredientsPerUnit, label: PROT_LABEL[prot] || prot };
}

// Valida y tasa un solo build (signature o build-your-own) — usado para favoritos,
// que por ahora solo guardan UN sándwich (no un carrito completo).
export function deriveOrder(b: any): { ingredients: string[]; expectedTotal: number } {
  const size = b.size === "15" ? "15" : b.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!b.doubleProt;
  const extraSauce = !!b.extraSauce;
  const rewardId = b.rewardId ? String(b.rewardId) : null;

  const priced = b.mode === "sig"
    ? priceSigBuild(String(b.sigId || ""), size, doubleProt, extraSauce)
    : priceByoBuild(
      String(b.base || ""), String(b.prot || ""), b.cheese ? String(b.cheese) : null,
      Array.isArray(b.tops) ? b.tops.filter((x: any) => typeof x === "string") : [],
      Array.isArray(b.sauces) ? b.sauces.filter((x: any) => typeof x === "string") : [],
      size, doubleProt, extraSauce,
    );
  const waiver = rewardWaiver(rewardId, b, priced.basePrice, priced.dblSurcharge);
  return {
    ingredients: priced.ingredientsPerUnit,
    expectedTotal: Math.max(0, priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge - waiver),
  };
}

export function buildFromOrder(b: any): Record<string, unknown> {
  if (b.mode === "sig") {
    return { mode: "sig", sigId: b.sigId, size: b.size, doubleProt: !!b.doubleProt, extraSauce: !!b.extraSauce };
  }
  return {
    mode: "byo",
    base: b.base,
    prot: b.prot,
    tops: Array.isArray(b.tops) ? b.tops : [],
    cheese: b.cheese || null,
    sauces: Array.isArray(b.sauces) ? b.sauces : [],
    size: b.size,
    doubleProt: !!b.doubleProt,
    extraSauce: !!b.extraSauce,
  };
}

export function validateQty(q: any): number {
  const n = parseInt(q, 10);
  if (!n || n < 1 || n > 20) throw new ApiError("Cantidad inválida.");
  return n;
}

export type PricedItem = {
  item: Record<string, unknown>;
  qty: number;
  unitPrice: number;
  basePrice: number;
  dblSurcharge: number;
  ingredientsPerUnit: string[];
  label: string;
  eligibleR04: boolean;
  eligibleR06: boolean;
};

// Tasa y valida UNA línea del carrito (sándwich signature/build o bebida/side).
// Nunca confía en el precio/etiqueta que reporte el cliente — todo se recalcula aquí
// a partir de los catálogos del servidor.
export function priceCartItem(raw: any): PricedItem {
  const qty = validateQty(raw?.qty);

  if (raw?.type === "side") {
    const code = String(raw.code || "");
    const price = SIDE_PRICE[code];
    if (price == null) throw new ApiError("Bebida/side inválido.");
    return {
      item: { type: "side", code, qty },
      qty,
      unitPrice: price,
      basePrice: price,
      dblSurcharge: 0,
      ingredientsPerUnit: [code],
      label: SIDE_LABEL[code] || code,
      eligibleR04: false,
      eligibleR06: false,
    };
  }

  const size = raw?.size === "15" ? "15" : raw?.size === "30" ? "30" : null;
  if (!size) throw new ApiError("Tamaño inválido.");
  const doubleProt = !!raw?.doubleProt;
  const extraSauce = !!raw?.extraSauce;
  // Nota libre del cliente para este producto (ej. "sin cebolla") — puramente
  // informativa para cocina, no afecta precio/ingredientes ni se valida.
  const note = raw?.note ? String(raw.note).trim().slice(0, 140) || null : null;

  if (raw?.type === "sig") {
    const priced = priceSigBuild(String(raw.sigId || ""), size, doubleProt, extraSauce);
    return {
      item: { type: "sig", sigId: raw.sigId, size, doubleProt, extraSauce, note, qty },
      qty,
      unitPrice: priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge,
      basePrice: priced.basePrice,
      dblSurcharge: priced.dblSurcharge,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      eligibleR04: doubleProt,
      eligibleR06: size === "15",
    };
  }

  if (raw?.type === "byo") {
    const base = String(raw.base || "");
    const prot = String(raw.prot || "");
    const cheese = raw.cheese ? String(raw.cheese) : null;
    const tops: string[] = Array.isArray(raw.tops) ? raw.tops.filter((x: any) => typeof x === "string") : [];
    const sauces: string[] = Array.isArray(raw.sauces) ? raw.sauces.filter((x: any) => typeof x === "string") : [];
    const priced = priceByoBuild(base, prot, cheese, tops, sauces, size, doubleProt, extraSauce);
    return {
      item: { type: "byo", base, prot, cheese, tops, sauces, size, doubleProt, extraSauce, note, qty },
      qty,
      unitPrice: priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge,
      basePrice: priced.basePrice,
      dblSurcharge: priced.dblSurcharge,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      eligibleR04: doubleProt,
      eligibleR06: size === "15",
    };
  }

  throw new ApiError("Tipo de producto inválido.");
}

// R04 (doble proteína gratis) solo aplica a la primera línea con doble proteína activada;
// R06 (15CM gratis) solo a la primera línea 15CM. El resto de recompensas no exige nada
// del carrito aparte de que no esté vacío — el servidor recalcula esto de forma
// independiente al índice que el cliente crea haber elegido.
export function findRewardTargetIndex(priced: PricedItem[], rewardId: string): number {
  if (rewardId === "R04") return priced.findIndex((p) => p.eligibleR04);
  if (rewardId === "R06") return priced.findIndex((p) => p.eligibleR06);
  return priced.length ? 0 : -1;
}

// Combo sándwich (Signature o Build Your Own) + bebida: S/3 menos que pedir ambos por
// separado, una vez por cada par sándwich+bebida en el carrito — DEBE coincidir con
// COMBO_DISCOUNT_PER_PAIR en src/app.ts (ese lado solo calcula el estimado que ve el
// cliente antes de pagar; este es el que de verdad determina cuánto se cobra).
const COMBO_DISCOUNT_PER_PAIR = 3;

// Bebida gratis (hasta S/4) de 2pm a 6pm hora Lima, la ventana de menor demanda entre el
// almuerzo y la cena (ver PEAK_HOURS_LIMA en orders.ts: [12,14] y [19,21]) — el costo
// marginal de atender un pedido en esa franja es prácticamente el mismo con o sin este
// descuento (cocina ya está montada), así que regalar la bebida más barata del carrito es
// casi puro margen incremental si convierte un pedido que hoy no existe. El tope de S/4
// evita que alguien elija la bebida más cara (S/6) y aun así se la regalemos completa.
// DEBE coincidir con OFFPEAK_DRINK_PROMO_HOURS_LIMA en src/app.ts (ese lado solo informa
// al cliente antes de pagar; este es el que de verdad aplica el descuento).
const OFFPEAK_DRINK_PROMO_HOURS_LIMA: [number, number][] = [[14, 18]];
const OFFPEAK_DRINK_PROMO_CAP = 4;
function isOffPeakDrinkPromoActiveNowLima(): boolean {
  const limaHour = new Date(Date.now() - 5 * 3600000).getUTCHours();
  return OFFPEAK_DRINK_PROMO_HOURS_LIMA.some(([start, end]) => limaHour >= start && limaHour < end);
}

export function deriveCart(rawItems: any, rewardId: string | null): { ingredients: string[]; expectedTotal: number; sanitizedItems: Record<string, unknown>[] } {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new ApiError("El carrito está vacío.", 400);
  if (rawItems.length > 30) throw new ApiError("Demasiados productos en el carrito.", 400);

  const priced = rawItems.map(priceCartItem);
  const totalQty = priced.reduce((s, p) => s + p.qty, 0);
  if (totalQty > 100) throw new ApiError("Cantidad total del carrito demasiado alta.", 400);

  let total = priced.reduce((s, p) => s + p.unitPrice * p.qty, 0);
  const ingredients: string[] = [];
  priced.forEach((p) => {
    for (let i = 0; i < p.qty; i++) ingredients.push(...p.ingredientsPerUnit);
  });

  const sandwichQty = priced.filter((p) => p.item.type !== "side").reduce((s, p) => s + p.qty, 0);
  const sideQty = priced.filter((p) => p.item.type === "side").reduce((s, p) => s + p.qty, 0);
  const comboCount = Math.min(sandwichQty, sideQty);
  total = Math.max(0, total - comboCount * COMBO_DISCOUNT_PER_PAIR);

  let offPeakDrinkDiscount = 0;
  if (isOffPeakDrinkPromoActiveNowLima()) {
    const sidePrices = priced.filter((p) => p.item.type === "side").flatMap((p) => Array(p.qty).fill(p.unitPrice));
    if (sidePrices.length) {
      offPeakDrinkDiscount = Math.min(Math.min(...sidePrices), OFFPEAK_DRINK_PROMO_CAP);
      total = Math.max(0, total - offPeakDrinkDiscount);
    }
  }

  if (rewardId) {
    const reward = REWARDS[rewardId];
    if (!reward) throw new ApiError("Recompensa inválida.");
    const targetIdx = findRewardTargetIndex(priced, rewardId);
    if (targetIdx < 0) throw new ApiError("No tienes ningún producto elegible para esta recompensa en tu carrito.", 400);
    const target = priced[targetIdx];
    const waiver = rewardId === "R04" ? target.dblSurcharge : rewardId === "R06" ? target.basePrice : 0;
    total = Math.max(0, total - waiver);
  }

  return { ingredients, expectedTotal: total, sanitizedItems: priced.map((p) => p.item) };
}

// Precio aproximado de una línea de carrito YA guardada en un pedido — usado solo para
// atribuir ingresos por producto en el dashboard (no revalida nada, los pedidos ya
// pasaron por deriveCart al crearse).
export function statUnitPrice(it: any): number {
  try {
    if (it.type === "side") return SIDE_PRICE[it.code] || 0;
    const size = it.size;
    if (it.type === "sig") {
      const sig = SIG_DATA[it.sigId];
      if (!sig) return 0;
      const pr = PROT_PRICE[sig.prot];
      const base = size === "15" ? sig.p15 : sig.p30;
      return base + (it.doubleProt && pr ? pr.pDbl : 0) + (it.extraSauce ? 2 : 0);
    }
    const pr2 = PROT_PRICE[it.prot];
    if (!pr2) return 0;
    const base2 = size === "15" ? pr2.p15 : pr2.p30;
    return base2 + (it.doubleProt ? pr2.pDbl : 0) + (it.extraSauce ? 2 : 0);
  } catch (e) {
    // Los códigos de producto desconocidos ya devuelven 0 explícitamente arriba (ítems
    // legados) — si esto revienta es por algo inesperado (ej. it no es un objeto), y
    // antes quedaba completamente silencioso, sin ningún rastro de que el dashboard
    // estaba subestimando ingresos para ese pedido (hallazgo de la re-auditoría de
    // código).
    console.error("statUnitPrice failed for item:", it, e);
    return 0;
  }
}
export function statItemLabel(it: any): string {
  if (it.type === "side") return SIDE_LABEL[it.code] || it.code || "otro";
  if (it.type === "sig") return SIG_LABEL[it.sigId] || it.sigId || "otro";
  return PROT_LABEL[it.prot] || it.prot || "otro";
}

// Antes actDashboardStats y actAdminRangeReport (admin.ts) repetían la misma agregación
// de "producto -> {count, revenue}" carácter por carácter, cada uno con su propio límite
// de resultados (hallazgo de la auditoría de código) — este helper la centraliza.
export function buildTopProducts(orders: any[], limit: number): { name: string; count: number; revenue: number }[] {
  const productMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o: any) => {
    if (Array.isArray(o.items) && o.items.length) {
      o.items.forEach((it: any) => {
        const key = statItemLabel(it);
        const qty = it.qty || 1;
        if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
        productMap[key].count += qty;
        productMap[key].revenue += statUnitPrice(it) * qty;
      });
      return;
    }
    const key = o.product_key || (o.summary || "").split(" S/")[0].split("·")[0].trim() || "otro";
    if (!productMap[key]) productMap[key] = { count: 0, revenue: 0 };
    productMap[key].count += 1;
    productMap[key].revenue += o.total || 0;
  });
  return Object.entries(productMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
