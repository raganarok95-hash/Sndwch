// SND//WCH — api / catalog
// Catálogo de productos (proteínas, signatures, bebidas/sides, recompensas) y toda la
// lógica de tasación/validación de un pedido — nunca confía en precios/etiquetas que
// reporte el cliente, todo se recalcula aquí a partir de estos datos.
import { sbGet } from "./db.ts";
import { ApiError } from "./types.ts";
import { computeRankName } from "./env.ts";

// Reestructurado en esta sesión — el original (R01-R06, fijado casi al inicio del
// proyecto) tenía 3 de 6 recompensas que cobraban puntos reales sin entregar ningún
// valor real a cambio (hallazgo de auditoría): R01 (topping extra) ya es gratis e
// ilimitado para todos desde hace tiempo, sin nada que "desbloquear"; R02 (4ta salsa)
// nunca tuvo implementado el descuento; R05 (bebida gratis) tampoco. R01 se retira (no
// hay ningún topping premium real que ofrecer sin inventar un ingrediente/costo que no
// existe). El resto queda repreciado contra el "tipo de cambio" real que ya usaban R04/
// R06 (~20-30 pts por cada sol de valor entregado, ver waiver real en deriveCart):
// R02 ahora perdona el cargo real de "SALSA EXTRA" (S/2) — antes de esto la recompensa
// no tenía ningún efecto en el precio. R03 (antes "SAUCE // SET", sin precio ni
// implementación en ningún lado) se reemplaza por "sube a 30CM gratis" — perdona la
// diferencia real p30-p15 del sándwich elegido. R05 ahora perdona el precio real de una
// bebida (S/3-6) en vez de no hacer nada.
//
// Puntos de R03/R04/R05/R06 subidos ~1.8x (R02 queda igual, ya estaba bien calibrada) —
// la "tasa de cambio" de arriba se fijó asumiendo un costo real de insumo de ~20-30% del
// valor perdonado. Con precios reales de Perú investigados después, el costo real de
// honrar cada canje resultó ser ~45% del valor perdonado (el insumo se gasta igual al
// preparar el producto "gratis", sin importar el margen nominal) — sin subir los puntos,
// cada canje le costaba al negocio bastante más de lo que su propio diseño asumía
// (hallazgo de auditoría financiera, ronda de recalibración de márgenes).
//
// R02 se deja deliberadamente por debajo de la "tasa de cambio" del resto (recalculando
// bajo el estándar de 45%, cuesta ~1.7-2.5x más por punto que R03-R06) — es una
// recompensa de bajo umbral a propósito, para dar un primer canje rápido a un cliente
// recién registrado, no un descuido de la recalibración (hallazgo de auditoría
// financiera de esta ronda, que pidió documentar la intención en vez de subirla).
export const REWARDS: Record<string, { pts: number; label: string }> = {
  R02: { pts: 40, label: "4TA // SALSA" },
  R05: { pts: 220, label: "BEBIDA // GRATIS" },
  R03: { pts: 270, label: "SUBE A 30CM // GRATIS" },
  R04: { pts: 320, label: "DOBLE // PROTEÍNA" },
  R06: { pts: 720, label: "SÁNDWICH // GRATIS" },
};

export const VALID_BASES = new Set(["B01", "B02", "B03"]);
export const VALID_TOPS = new Set(["T01", "T02", "T03", "T04", "T05", "T06", "T07"]);
export const VALID_CHEESE = new Set(["C01", "C02", "C03"]);
export const VALID_SAUCES = new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13"]);
// P04/P05 p30 subido (22→25, 26→30) — el salto de precio 15CM→30CM era un monto fijo
// por proteína sin importar su costo real; el atún y el embutido italiano cuestan casi
// el doble por kilo que pollo/res, así que duplicar su porción a 30CM subía el costo
// real bastante más de lo que el precio fijo alcanzaba a cubrir (hallazgo de costeo real
// con precios de insumos de Perú). Mismo criterio en pDbl de P04: atún (~S/38/kg) cuesta
// igual que el embutido italiano de P05 (~S/38/kg, pDbl:9) pero antes cobraba solo S/5 —
// menos que P01/P02 (pollo/res, más baratos) — subido a 9 para igualar a P05. DEBE
// coincidir con PROTS en src/app.ts.
export const PROT_PRICE: Record<string, { p15: number; p30: number; pDbl: number }> = {
  P01: { p15: 14, p30: 22, pDbl: 6 },
  P02: { p15: 13, p30: 21, pDbl: 6 },
  P03: { p15: 13, p30: 21, pDbl: 6 },
  P04: { p15: 14, p30: 25, pDbl: 9 },
  P05: { p15: 16, p30: 30, pDbl: 9 },
  P06: { p15: 14, p30: 24, pDbl: 7 },
};
// Proteínas exclusivas de un signature secreto (hoy solo P03 → SIG05 "THE VAULT") — no
// se pueden pedir por BUILD YOUR OWN aunque sigan en PROT_PRICE (deriveCart/deriveOrder
// las siguen necesitando para tasar SIG05). Es lo que hace que el precio del VAULT sea
// justificable: no existe forma de armar el mismo sándwich más barato fuera de él.
export const VAULT_ONLY_PROTS = new Set(["P03"]);
// Signatures de menú secreto/premium ("RESERVE" en el tag del cliente) — excluidas de
// R06 ("SÁNDWICH 15CM // GRATIS") para que esa recompensa no pueda gamearse eligiendo el
// Signature más caro disponible (SIG05 THE VAULT S/24, SIG07 CHICAGO ITALIAN BEEF S/25)
// muy por encima del resto del catálogo (S/16-21) — mismo criterio que R03_FLAT_WAIVER.
export const RESERVE_SIGS = new Set(["SIG05", "SIG07"]);
export const SIG_DATA: Record<string, { base: string; prot: string; tops: string[]; sauces: string[]; p15: number; p30: number; cheeseOptional?: boolean }> = {
  SIG01: { base: "B01", prot: "P01", tops: ["T01", "T02", "T03"], sauces: ["S01", "S04"], p15: 18, p30: 22 },
  // RANCH (S07) retirada esta sesión — no encajaba con el resto (ver mismo cambio en
  // src/app.ts, DEBE coincidir).
  // cheeseOptional: único Signature con queso a elección — DEBE coincidir con SIGS en
  // src/app.ts (mismo hallazgo/razonamiento ahí).
  SIG02: { base: "B02", prot: "P06", tops: ["T01", "T03", "T05"], sauces: ["S06"], p15: 19, p30: 24, cheeseOptional: true },
  // TERIYAKI (S08) retirada esta sesión — perfil asiático ajeno a "fiambres italianos"
  // (ver mismo cambio en src/app.ts, DEBE coincidir).
  // p30 subido de 26 a 30 (mismo motivo que P05 en PROT_PRICE arriba: el embutido
  // italiano cuesta casi el doble por kilo que pollo/res, duplicar su porción a 30CM
  // costaba más de lo que el precio fijo anterior cubría) — mantiene el criterio de
  // premio S/0 a 30CM frente a armarlo en BUILD YOUR OWN.
  SIG03: { base: "B03", prot: "P05", tops: ["T03", "T02", "T01"], sauces: ["S03"], p15: 21, p30: 30 },
  // p30 subido de 22 a 25 (mismo motivo — atún cuesta casi el doble por kilo que pollo,
  // ver PROT_PRICE.P04) — mantiene el criterio de premio S/0 a 30CM ya aceptado para
  // THE ORIGINAL/THE MEATBALL/THE SMOKE.
  SIG04: { base: "B01", prot: "P04", tops: ["T01", "T02", "T06"], sauces: ["S01", "S11"], p15: 16, p30: 25 },
  // p30 bajado de 22 a 21 (decisión del dueño) — quedaba S/1 por encima de armarlo en
  // BUILD YOUR OWN (P02 cuesta S/21 a 30CM), rompiendo por poco el criterio de premio
  // S/0 a 30CM ya aplicado a THE ORIGINAL/THE MEATBALL/THE SMOKE/THE FRESH.
  SIG06: { base: "B01", prot: "P02", tops: ["T01", "T02", "T06"], sauces: ["S10", "S05"], p15: 17, p30: 21 },
  SIG07: { base: "B01", prot: "P01", tops: ["T07"], sauces: ["S13"], p15: 25, p30: 25 },
  // Menú secreto — ver SIG_GATES. Nunca aparece en el menú público; solo un cliente que
  // ya alcanzó el rango exigido lo ve/puede pedirlo (ver sigGateError).
  SIG05: { base: "B03", prot: "P03", tops: ["T04", "T06", "T03"], sauces: ["S02", "S12"], p15: 24, p30: 30 },
};
// Sabores con acceso restringido — hoy solo el menú secreto (permanente), pero el mismo
// campo earlyAccessUntil sirve para abrir un Signature nuevo antes al Círculo Interno y
// recién después a todos (poner una fecha ISO ahí en vez de dejarlo indefinido). Se
// compara contra customers.total_orders de la SESIÓN que hace el pedido — un invitado
// (sin sesión) nunca puede pedirlos, sin importar qué diga el carrito.
// Bajado de 15 a 5 pedidos (decisión de negocio) para que el menú secreto se desbloquee
// mucho antes en la vida del cliente — DEBE coincidir con SIG05.minOrders en src/app.ts.
export const SIG_GATES: Record<string, { minOrders: number; earlyAccessUntil?: string }> = {
  SIG05: { minOrders: 5 },
};
export function sigGateError(sigId: string, totalOrders: number): string | null {
  const gate = SIG_GATES[sigId];
  if (!gate) return null;
  if (gate.earlyAccessUntil && Date.now() >= new Date(gate.earlyAccessUntil).getTime()) return null;
  if (totalOrders >= gate.minOrders) return null;
  // El nombre de rango se deriva de RANKS (computeRankName) en vez de estar escrito a
  // mano acá — antes decía "Círculo Interno" fijo, que dejó de ser cierto en cuanto el
  // umbral bajó a 5 pedidos (ese número corresponde a "DE LA CASA", no a Círculo Interno).
  return `Ese sabor es exclusivo de ${computeRankName(gate.minOrders)} — sigue pidiendo para desbloquearlo.`;
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
  SIG02: "THE MEATBALL // BUILD",
  SIG03: "THE SMOKE // BUILD",
  SIG04: "THE FRESH // BUILD",
  SIG05: "THE VAULT // RESERVE",
  SIG06: "THE TERIYAKI // BUILD",
  SIG07: "CHICAGO ITALIAN BEEF // RESERVE",
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
  P05: "EMBUTIDO // ITALIANO",
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
  // Diferencia real p30-p15 de este mismo producto — solo tiene sentido cuando size es
  // "15" (¿cuánto costaría subir ESTE sándwich a 30CM?) y cuando esa diferencia es
  // positiva; queda en 0 si ya es 30CM o si el producto cobra lo mismo en ambos tamaños
  // (ej. SIG07, precio único). Usado por R03 ("SUBE A 30CM // GRATIS", ver deriveCart).
  sizeUpgradeDiff: number;
  ingredientsPerUnit: string[];
  label: string;
};

// Tasación/validación de UN sándwich (signature o build-your-own), sin qty ni tipo de
// carrito — deriveOrder (favoritos, un solo build) y priceCartItem (una línea de
// carrito) repetían este mismo cálculo carácter por carácter, cada uno con su propia
// copia (hallazgo de la auditoría de código).
function priceSigBuild(sigId: string, size: "15" | "30", doubleProt: boolean, extraSauce: boolean, cheese: string | null = null): PricedBuild {
  const sig = SIG_DATA[sigId];
  if (!sig) throw new ApiError("Signature inválida.");
  const protInfo = PROT_PRICE[sig.prot];
  const basePrice = size === "15" ? sig.p15 : sig.p30;
  const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
  const sizeUpgradeDiff = size === "15" ? Math.max(0, sig.p30 - sig.p15) : 0;
  const ingredientsPerUnit = [sig.base, sig.prot, ...sig.tops, ...sig.sauces];
  if (doubleProt) ingredientsPerUnit.push(sig.prot);
  // Queso opcional y gratis (igual que en BUILD YOUR OWN) — solo en los Signatures que
  // lo declaran (hoy solo SIG02). Se ignora silenciosamente si un cliente lo manda para
  // un Signature que no lo permite, en vez de lanzar un error por un campo inofensivo.
  if (cheese && sig.cheeseOptional) {
    if (!VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
    ingredientsPerUnit.push(cheese);
  }
  // Igual que en BUILD YOUR OWN: la salsa extra es una porción doble de una de las
  // salsas ya incluidas en la receta del Signature (todas tienen al menos una), no una
  // salsa nueva sin especificar — antes no se descontaba ningún ingrediente real por
  // este cargo de S/2 (hallazgo de auditoría financiera).
  if (extraSauce) ingredientsPerUnit.push(sig.sauces[sig.sauces.length - 1]);
  return { basePrice, dblSurcharge, sauceSurcharge: extraSauce ? 2 : 0, sizeUpgradeDiff, ingredientsPerUnit, label: SIG_LABEL[sigId] || sigId };
}
function priceByoBuild(
  base: string, prot: string, cheese: string | null, tops: string[], sauces: string[],
  size: "15" | "30", doubleProt: boolean, extraSauce: boolean,
): PricedBuild {
  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.");
  const protInfo = PROT_PRICE[prot];
  if (!protInfo || VAULT_ONLY_PROTS.has(prot)) throw new ApiError("Proteína inválida.");
  if (cheese && !VALID_CHEESE.has(cheese)) throw new ApiError("Queso inválido.");
  // A diferencia de sauces (tope de 3), toppings no tiene tope de negocio ("Sin límite,
  // elige los que quieras" en el builder) — el tope real es "cada topping válido, como
  // máximo una vez", igual que hace el toggle del cliente (nunca push-duplicado). Sin
  // este chequeo, un cliente podía mandar el mismo topping miles de veces y cada
  // repetición se sumaba a ingredientsPerUnit, multiplicado por qty (hasta 20), sin tope
  // — una sola línea de carrito reservaba/descontaba miles de unidades de inventario de
  // ese topping por el precio de un sándwich normal (hallazgo de auditoría de QA).
  if (tops.length > VALID_TOPS.size || new Set(tops).size !== tops.length || tops.some((t) => !VALID_TOPS.has(t))) throw new ApiError("Topping inválido.");
  if (sauces.length > 3 || sauces.some((s) => !VALID_SAUCES.has(s))) throw new ApiError("Salsa inválida.");
  // "Extra" implica más de una salsa que ya elegiste — sin esto, un cliente podía pedir
  // SALSA EXTRA con 0 salsas base seleccionadas, lo cual no descontaba ningún ingrediente
  // real de inventario (el cargo de S/2 no mapeaba a ninguna salsa concreta) y además
  // dejaba a R02 ("4TA SALSA GRATIS") canjeable sin haber llegado siquiera a una 3ra
  // salsa (hallazgo de auditoría financiera).
  if (extraSauce && !sauces.length) throw new ApiError("Selecciona al menos una salsa antes de pedir salsa extra.");
  const basePrice = size === "15" ? protInfo.p15 : protInfo.p30;
  const dblSurcharge = doubleProt ? protInfo.pDbl : 0;
  const sizeUpgradeDiff = size === "15" ? Math.max(0, protInfo.p30 - protInfo.p15) : 0;
  const ingredientsPerUnit = [base, prot, ...tops, ...(cheese ? [cheese] : []), ...sauces];
  if (doubleProt) ingredientsPerUnit.push(prot);
  // La salsa extra es una porción doble de una salsa ya elegida (no una salsa nueva sin
  // especificar) — se descuenta del inventario real de esa misma salsa.
  if (extraSauce) ingredientsPerUnit.push(sauces[sauces.length - 1]);
  return { basePrice, dblSurcharge, sauceSurcharge: extraSauce ? 2 : 0, sizeUpgradeDiff, ingredientsPerUnit, label: PROT_LABEL[prot] || prot };
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
    ? priceSigBuild(String(b.sigId || ""), size, doubleProt, extraSauce, b.cheese ? String(b.cheese) : null)
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
  sauceSurcharge: number;
  sizeUpgradeDiff: number;
  ingredientsPerUnit: string[];
  label: string;
  eligibleR02: boolean;
  eligibleR03: boolean;
  eligibleR04: boolean;
  eligibleR05: boolean;
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
      sauceSurcharge: 0,
      sizeUpgradeDiff: 0,
      ingredientsPerUnit: [code],
      label: SIDE_LABEL[code] || code,
      eligibleR02: false,
      eligibleR03: false,
      eligibleR04: false,
      // Una bebida/side es lo único elegible para R05 ("BEBIDA // GRATIS") — un
      // sándwich nunca lo es, sin importar tamaño o proteína.
      eligibleR05: true,
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
    // Queso opcional y gratis, solo válido para los Signatures que lo declaran
    // (SIG_DATA[sigId].cheeseOptional, hoy solo SIG02) — priceSigBuild ya ignora
    // silenciosamente cheese si el Signature no lo permite.
    const cheese = raw.cheese ? String(raw.cheese) : null;
    const priced = priceSigBuild(String(raw.sigId || ""), size, doubleProt, extraSauce, cheese);
    return {
      item: { type: "sig", sigId: raw.sigId, size, doubleProt, extraSauce, cheese, note, qty },
      qty,
      unitPrice: priced.basePrice + priced.dblSurcharge + priced.sauceSurcharge,
      basePrice: priced.basePrice,
      dblSurcharge: priced.dblSurcharge,
      sauceSurcharge: priced.sauceSurcharge,
      sizeUpgradeDiff: priced.sizeUpgradeDiff,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      // R02 ("4TA // SALSA") perdona el cargo real de SALSA EXTRA — solo elegible si
      // el cliente ya activó ese extra pagado en esta línea (mismo criterio que R04
      // exige doubleProt activado: la recompensa perdona un cargo que el cliente ya
      // pidió, no lo agrega de la nada).
      eligibleR02: extraSauce,
      eligibleR03: priced.sizeUpgradeDiff > 0,
      eligibleR04: doubleProt,
      eligibleR05: false,
      // Excluye Signatures RESERVE (SIG05/SIG07) para que R06 no pueda gamearse eligiendo
      // el sándwich más caro del catálogo — ver comentario de RESERVE_SIGS arriba.
      eligibleR06: size === "15" && !RESERVE_SIGS.has(String(raw.sigId || "")),
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
      sauceSurcharge: priced.sauceSurcharge,
      sizeUpgradeDiff: priced.sizeUpgradeDiff,
      ingredientsPerUnit: priced.ingredientsPerUnit,
      label: priced.label,
      // A diferencia de un Signature (salsas fijas de receta, "extra" siempre es de
      // verdad extra), en BUILD YOUR OWN el cliente elige sus propias salsas (tope 3) —
      // R02 ("4TA SALSA GRATIS") solo tiene sentido real si ya llegó al tope de 3 antes
      // de pagar por una 4ta (hallazgo de auditoría financiera: antes calificaba incluso
      // con 0 salsas base seleccionadas).
      eligibleR02: extraSauce && sauces.length === 3,
      eligibleR03: priced.sizeUpgradeDiff > 0,
      eligibleR04: doubleProt,
      eligibleR05: false,
      eligibleR06: size === "15",
    };
  }

  throw new ApiError("Tipo de producto inválido.");
}

// R02 (perdona SALSA EXTRA) solo aplica a una línea que ya activó ese extra pagado; R03
// (sube a 30CM gratis) solo a una línea 15CM cuya versión 30CM cueste más; R04 (doble
// proteína gratis) solo a una línea con doble proteína activada; R05 (bebida gratis)
// solo a una línea de bebida/side; R06 (15CM gratis) solo a una línea 15CM. El servidor
// recalcula esto de forma independiente al índice que el cliente crea haber elegido.
export function findRewardTargetIndex(priced: PricedItem[], rewardId: string): number {
  if (rewardId === "R02") return priced.findIndex((p) => p.eligibleR02);
  if (rewardId === "R03") return priced.findIndex((p) => p.eligibleR03);
  if (rewardId === "R04") return priced.findIndex((p) => p.eligibleR04);
  if (rewardId === "R05") return priced.findIndex((p) => p.eligibleR05);
  if (rewardId === "R06") return priced.findIndex((p) => p.eligibleR06);
  return priced.length ? 0 : -1;
}

// Combo sándwich (Signature o Build Your Own) + bebida: S/2 menos que pedir ambos por
// separado, una vez por cada par sándwich+bebida en el carrito. Bajado de S/3 a S/2 — a
// S/3 el combo dejaba THE MIDNIGHT (D07, la bebida más barata, también S/3)
// completamente GRATIS con cualquier sándwich, a cualquier hora del día — a diferencia
// de la promo de hora valle (bebida gratis de verdad), que el negocio decidió a
// propósito limitar a la ventana de baja demanda porque regalar margen fuera de esa
// ventana no es "casi puro margen incremental" (ver isOffPeakDrinkPromoActiveLima más
// abajo; hallazgo de auditoría financiera). DEBE coincidir con COMBO_DISCOUNT_PER_PAIR
// en src/app.ts (ese lado solo calcula el estimado que ve el cliente antes de pagar;
// este es el que de verdad determina cuánto se cobra).
const COMBO_DISCOUNT_PER_PAIR = 2;

// Tope plano de R03 ("SUBE A 30CM // GRATIS") — antes perdonaba la diferencia p30-p15
// EXACTA de la proteína elegida (S/8 en P01/P02/P04, pero S/10 en P05/P06), lo que
// dejaba al cliente elegir la proteína más cara para maximizar el valor de la
// recompensa muy por encima de lo que sus mismos puntos (150) valen en el resto del
// programa (hallazgo de auditoría de rentabilidad). Ahora siempre perdona como máximo
// el valor de "un pan de 15CM" estándar (S/8, el caso mayoritario) sin importar qué
// proteína se elija — DEBE coincidir con R03_FLAT_WAIVER en src/app.ts.
const R03_FLAT_WAIVER = 8;

// Mismo criterio que R03_FLAT_WAIVER: R04 ("DOBLE PROTEÍNA // GRATIS") perdonaba antes el
// pDbl EXACTO de la proteína elegida (S/5-9 según proteína), dejando elegir la más cara
// (P04/P05, S/9 tras la recalibración de costo real) para maximizar el valor de una
// recompensa de 320 pts muy por encima del resto. Se topa al valor mayoritario (S/6,
// P01/P02) — DEBE coincidir con R04_FLAT_WAIVER en src/app.ts.
const R04_FLAT_WAIVER = 6;
// R05 ("BEBIDA // GRATIS") perdonaba antes el precio completo de la bebida elegida
// (S/3-6), permitiendo elegir siempre THE SPICE (S/6, la más cara) para maximizar el
// valor de la recompensa. Se topa al mismo valor ya establecido para la promo de hora
// valle (OFFPEAK_DRINK_PROMO_CAP=4) — incluso fuera de esa ventana, una bebida gratis no
// debería valer más que en la ventana en la que el negocio ya la regala gratis. DEBE
// coincidir con R05_FLAT_WAIVER en src/app.ts.
const R05_FLAT_WAIVER = 4;

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
// Antes esto siempre miraba la hora en la que llegaba el request, sin importar que el
// pedido fuera "para más tarde" (scheduledFor) — un pedido armado a las 3pm (hora valle)
// pero programado para entregarse a las 8pm (hora pico, ver PEAK_HOURS_LIMA en
// orders.ts) igual regalaba la bebida, aunque la cocina la fuera a preparar en hora
// pico, que es la justificación completa de este descuento (hallazgo de auditoría de
// rentabilidad). Ahora evalúa la hora en la que de verdad se va a preparar el pedido.
function isOffPeakDrinkPromoActiveLima(refDate: Date): boolean {
  const limaHour = new Date(refDate.getTime() - 5 * 3600000).getUTCHours();
  return OFFPEAK_DRINK_PROMO_HOURS_LIMA.some(([start, end]) => limaHour >= start && limaHour < end);
}

export function deriveCart(rawItems: any, rewardId: string | null, scheduledFor?: string | null): { ingredients: string[]; expectedTotal: number; sanitizedItems: Record<string, unknown>[] } {
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

  // La recompensa se resuelve ANTES de combo/hora valle (no después, como antes) — R05
  // y R06 regalan una unidad COMPLETA (una bebida entera o un sándwich 15CM entero), a
  // diferencia de R02/R03/R04 que solo perdonan un extra parcial sobre un producto que
  // se sigue cobrando. Si esa unidad completa sigue contando para combo/hora valle,
  // esos dos mecanismos terminan regalando TAMBIÉN la otra mitad del par sobre algo que
  // ya es gratis — ej. sándwich 15CM (S/25) + bebida (S/3): combo -S/3, reward -S/25,
  // total S/0 — la bebida quedaba gratis de rebote. Hallazgo de auditoría de
  // rentabilidad, confirmado en vivo justo el día que se reestructuraron R02-R06.
  let rewardTargetIdx = -1;
  let reward: { pts: number; label: string } | null = null;
  if (rewardId) {
    reward = REWARDS[rewardId];
    if (!reward) throw new ApiError("Recompensa inválida.");
    rewardTargetIdx = findRewardTargetIndex(priced, rewardId);
    if (rewardTargetIdx < 0) throw new ApiError("No tienes ningún producto elegible para esta recompensa en tu carrito.", 400);
  }
  const fullyWaivedSandwich = rewardId === "R06" && rewardTargetIdx >= 0 && priced[rewardTargetIdx].item.type !== "side";
  const fullyWaivedSide = rewardId === "R05" && rewardTargetIdx >= 0 && priced[rewardTargetIdx].item.type === "side";

  let sandwichQty = priced.filter((p) => p.item.type !== "side").reduce((s, p) => s + p.qty, 0);
  let sideQty = priced.filter((p) => p.item.type === "side").reduce((s, p) => s + p.qty, 0);
  if (fullyWaivedSandwich) sandwichQty -= 1;
  if (fullyWaivedSide) sideQty -= 1;
  const comboCount = Math.min(sandwichQty, sideQty);
  const comboDiscount = comboCount * COMBO_DISCOUNT_PER_PAIR;

  let offPeakDrinkDiscount = 0;
  const refDate = scheduledFor ? new Date(scheduledFor) : new Date();
  if (isOffPeakDrinkPromoActiveLima(isNaN(refDate.getTime()) ? new Date() : refDate)) {
    const sidePrices = priced.flatMap((p, idx) => {
      if (p.item.type !== "side") return [];
      const qty = fullyWaivedSide && idx === rewardTargetIdx ? p.qty - 1 : p.qty;
      return Array(Math.max(0, qty)).fill(p.unitPrice);
    });
    if (sidePrices.length) {
      offPeakDrinkDiscount = Math.min(Math.min(...sidePrices), OFFPEAK_DRINK_PROMO_CAP);
    }
  }

  // Antes combo y hora valle se aplicaban los DOS a la vez sobre el mismo pedido
  // (sándwich+bebida en la ventana de hora valle podía perder S/3+S/4=S/7 sin usar
  // ningún punto) — con el margen real de insumos confirmado (~45-52%), apilar ambos
  // llegaba a comerse una fracción grande de la utilidad de ese pedido. Ninguno de los
  // dos deja de existir, pero ya no se suman: solo se aplica el mayor de los dos
  // (hallazgo de auditoría de rentabilidad, decisión del dueño) — DEBE coincidir con el
  // mismo criterio en src/app.ts.
  const stackedDiscount = Math.max(comboDiscount, offPeakDrinkDiscount);
  total = Math.max(0, total - stackedDiscount);

  if (rewardId && reward) {
    const target = priced[rewardTargetIdx];
    const waiver = rewardId === "R02" ? target.sauceSurcharge
      : rewardId === "R03" ? Math.min(target.sizeUpgradeDiff, R03_FLAT_WAIVER)
      : rewardId === "R04" ? Math.min(target.dblSurcharge, R04_FLAT_WAIVER)
      : rewardId === "R05" ? Math.min(target.basePrice, R05_FLAT_WAIVER)
      : rewardId === "R06" ? target.basePrice
      : 0;
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
