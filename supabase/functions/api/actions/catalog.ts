// SND//WCH — api / actions/catalog
// Exponer el catálogo de precios vigente al cliente, y la edición admin de precios
// (ver la tabla catalog_prices y loadCatalogPrices en ../catalog.ts).
import type { Entrada } from "../../_shared/contrato.ts";
import { sbUpsert, sbGet, sbInsert } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { loadCatalogPrices, loadCatalogItems, PROT_PRICE, SIG_DATA, SIG_CONTENT, SIG_GATES, SIDE_PRICE, REWARDS, VALID_BASES, VALID_TOPS, VALID_SAUCES, VALID_CHEESE, SIG_ONLY_PROTS, SIG_ONLY_TOPS, SIG_ONLY_SAUCES, VAULT_ONLY_PROTS, VAULT_ONLY_TOPS, VAULT_ONLY_SAUCES, SECRET_SIGNATURE_NAME, SECRET_EXTRA } from "../catalog.ts";
import { ID_SECRETO, esSecreto } from "../../_shared/carta.ts";

// Acción pública (sin sesión) para que el cliente sepa los precios vigentes sin tener
// que redesplegar el sitio estático cada vez que el dueño cambia uno desde el panel.
export async function actGetCatalog(_b: Entrada<"get-catalog">) {
  await loadCatalogPrices();
  const sigs: Record<string, { p15: number; p30: number }> = {};
  for (const code of Object.keys(SIG_DATA)) sigs[code] = { p15: SIG_DATA[code].p15, p30: SIG_DATA[code].p30 };
  const rewardPts: Record<string, number> = {};
  for (const code of Object.keys(REWARDS)) rewardPts[code] = REWARDS[code].pts;
  // Sándwich secreto con rotación mensual (ver loadSecretSignature en ../catalog.ts) — se
  // manda la composición completa igual que ya pasaba con el literal estático de SIGS en
  // src/app.ts (nunca fue un secreto a nivel de red, la UI simplemente nunca la muestra;
  // el servidor jamás confía en lo que el cliente mande de vuelta, siempre re-tasa/valida
  // contra SIG_DATA/VAULT_ONLY_* acá). Sin esto, el cliente no tendría forma de armar la
  // línea de carrito, mostrar el nombre del mes, ni saber qué proteína/tops/salsas quedan
  // excluidas de ARMA EL TUYO este ciclo. El nombre se manda aparte (SIG_LABEL.SIG05 trae
  // el sufijo " // RESERVE" pegado, que no es el que se muestra en la tarjeta del cliente).
  // Signatures públicos editables desde el panel (ver loadCatalogItems en ../catalog.ts).
  // Se manda el contenido COMPLETO — nombre, subtítulo, badge, pitch, foto, composición y
  // si sigue activo — porque desde el 2026-08-27 el array SIGS de src/app.ts pasó a ser
  // semilla: el cliente lo sobreescribe con esto apenas resuelve el fetch. Sin mandar el
  // contenido, cambiar un nombre desde el panel no se vería hasta el próximo despliegue,
  // que es exactamente lo que este cambio viene a eliminar.
  const items: Record<string, unknown> = {};
  for (const code of Object.keys(SIG_CONTENT)) {
    const d = SIG_DATA[code];
    if (!d) continue;
    const c = SIG_CONTENT[code];
    items[code] = {
      n: c.n, s: c.s, badge: c.badge, pitch: c.pitch, img: c.img, active: c.active,
      base: d.base, prot: d.prot, tops: d.tops, sauces: d.sauces, p15: d.p15, p30: d.p30,
      fixedCheese: d.fixedCheese ?? null, cheeseOptional: d.cheeseOptional === true, sinEnvio: d.sinEnvio === true,
    };
  }
  // Disponibilidad de ingredientes. El cliente la leía por PostgREST DIRECTO contra
  // `inventory` con la anon key, pero esa tabla tiene RLS activada sin políticas: PostgREST
  // responde `200 []` — no un error — así que el catch del cliente nunca veía nada y
  // `invStock` quedaba vacío para todos. Con el objeto vacío, `isAvail()` daba true
  // siempre: lo que el dueño marcaba SIN STOCK desde el panel se seguía mostrando
  // disponible y se seguía pudiendo pedir. Se manda desde acá, que corre con service role.
  let inventory: Record<string, { inStock: boolean; qty: number | null }> = {};
  try {
    const rows = await sbGet("inventory", "select=product_code,in_stock,stock_qty&limit=500");
    for (const r of rows) {
      inventory[String(r.product_code)] = {
        inStock: r.in_stock !== false,
        qty: r.stock_qty === null || r.stock_qty === undefined ? null : Number(r.stock_qty),
      };
    }
  } catch (e) {
    // Un fallo leyendo inventario no puede tumbar el catálogo entero: sin el dato, el
    // cliente muestra todo disponible y el servidor igual rechaza al pedir
    // (reserve_inventory valida in_stock y stock_qty). Peor experiencia, nunca venta mal
    // cobrada.
    console.error("actGetCatalog inventory failed:", e);
    inventory = {};
  }
  return {
    proteins: PROT_PRICE,
    sigs,
    sigItems: items,
    sides: SIDE_PRICE,
    inventory,
    rewardPts,
    secretSignature: SIG_DATA[ID_SECRETO]
      ? {
          name: SECRET_SIGNATURE_NAME,
          base: SIG_DATA[ID_SECRETO].base,
          prot: SIG_DATA[ID_SECRETO].prot,
          tops: SIG_DATA[ID_SECRETO].tops,
          sauces: SIG_DATA[ID_SECRETO].sauces,
          p15: SIG_DATA[ID_SECRETO].p15,
          p30: SIG_DATA[ID_SECRETO].p30,
          minOrders: SIG_GATES[ID_SECRETO] ? SIG_GATES[ID_SECRETO].minOrders : 5,
          vaultOnlyProts: [...VAULT_ONLY_PROTS],
          vaultOnlyTops: [...VAULT_ONLY_TOPS],
          vaultOnlySauces: [...VAULT_ONLY_SAUCES],
          endsAt: SECRET_EXTRA.endsAt,
          hints: SECRET_EXTRA.hints,
          past: SECRET_EXTRA.past,
        }
      : null,
  };
}
// Un precio del panel: positivo, con dos decimales, bajo un techo, y sin saltar más de 3 veces
// respecto al vigente. Sin esto, un campo vacío llegaba como 0 (el producto quedaba gratis) y un
// tipeo como 2290 por 22.90 se guardaba igual: dinero perdido o clientes espantados, en silencio.
export const PRECIO_MAX = 150;
export const PUNTOS_MAX = 5000;
const SALTO_MAX = 3;
function precioDelPanel(v: unknown, campo: string, actual: number | undefined): number {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) throw new ApiError(`${campo}: escribe un precio mayor que 0.`);
  if (v > PRECIO_MAX) throw new ApiError(`${campo}: S/${v} pasa el tope de S/${PRECIO_MAX}. ¿Sobra un cero?`);
  const n = Math.round(v * 100) / 100;
  if (actual && actual > 0 && (n > actual * SALTO_MAX || n < actual / SALTO_MAX)) {
    throw new ApiError(`${campo}: de S/${actual} a S/${n} es más de ${SALTO_MAX} veces. Revisa la cifra.`);
  }
  return n;
}
/** Lo que se guarda en catalog_prices.values: SOLO los campos de la categoría, ya validados. */
export function valoresDePrecio(category: string, code: string, values: unknown): Record<string, number> {
  if (!values || typeof values !== "object") throw new ApiError("Faltan los valores del precio.");
  const v = values as Record<string, unknown>;
  if (category === "protein") {
    const actual = PROT_PRICE[code];
    if (!actual) throw new ApiError("Proteína desconocida.");
    // pDbl30 se agregó el 2026-08-22 (el recargo de doble proteína dejó de ser plano): sin él,
    // el 30CM quedaba con el literal del código y el 15CM con el del panel.
    return {
      p15: precioDelPanel(v.p15, "15CM", actual.p15),
      p30: precioDelPanel(v.p30, "30CM", actual.p30),
      pDbl: precioDelPanel(v.pDbl, "Doble 15CM", actual.pDbl),
      pDbl30: precioDelPanel(v.pDbl30, "Doble 30CM", actual.pDbl30),
    };
  }
  if (category === "sig") {
    // Desde el 2026-08-27 el precio de un Signature vive en `catalog_items`: guardarlo acá
    // diría "guardado" y loadCatalogItems() lo pisaría un instante después.
    throw new ApiError("El precio de un Signature se edita en Admin // Catálogo // Signatures, no acá.");
  }
  if (category === "side") {
    if (!(code in SIDE_PRICE)) throw new ApiError("Bebida/side desconocido.");
    return { price: precioDelPanel(v.price, "Precio", SIDE_PRICE[code]) };
  }
  if (category === "reward") {
    if (!REWARDS[code]) throw new ApiError("Recompensa desconocida.");
    const pts = v.pts;
    if (typeof pts !== "number" || !Number.isInteger(pts) || pts < 1 || pts > PUNTOS_MAX) {
      throw new ApiError(`Puntos: un entero entre 1 y ${PUNTOS_MAX}.`);
    }
    return { pts };
  }
  throw new ApiError("Categoría inválida.");
}

export async function actAdminCatalogSetPrice(b: Entrada<"admin-catalog-set-price"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const code = b.code;
  const category = b.category;
  const values = valoresDePrecio(category, code, b.values);
  // sbUpsert (no sbUpdate): un PATCH de PostgREST que no encuentra ninguna fila devuelve
  // 200 con `[]` — es decir, editar el precio de un código SIN fila previa en
  // `catalog_prices` respondía "success" al panel admin sin haber guardado absolutamente
  // nada, y el precio seguía saliendo del literal del código. Pasaba de verdad con P07,
  // SIG05 y SIG08, que nunca tuvieron fila (hallazgo de auditoría de menú). Con upsert, la
  // primera edición crea la fila y las siguientes la actualizan.
  await sbUpsert("catalog_prices", { code, category, values, updated_at: new Date().toISOString() }, "code");
  await logAdminAction(s.phone, "catalog-set-price", code, values);
  await loadCatalogPrices();
  return { success: true };
}

// ── Signatures editables desde el panel (2026-08-27) ────────────────────────────────────
//
// Contraparte de escritura de loadCatalogItems(). Mismo diseño que el menú secreto:
// APPEND-ONLY, cada publicación inserta una fila nueva y la de mayor id por item_id manda.
// Nunca se hace UPDATE, así queda historial de qué se cobraba en qué fecha.
const CATALOG_ITEMS_HISTORY_LIMIT = 40;

export async function actAdminCatalogItemsGet(b: Entrada<"admin-catalog-items-get"> & { _ip?: string }) {
  await requireAdmin(b.token);
  const rows = await sbGet("catalog_items", `select=*&order=id.desc&limit=${CATALOG_ITEMS_HISTORY_LIMIT}`);
  // La fila vigente de cada item_id es la primera que aparece (vienen por id descendente);
  // el resto es historial. Se separa acá y no en el cliente para que el panel no tenga que
  // reimplementar la misma regla de "la de mayor id gana" que ya usa el servidor al cargar.
  const current: Record<string, unknown> = {};
  const history: unknown[] = [];
  for (const row of rows) {
    const id = String(row.item_id || "");
    if (!id) continue;
    if (!current[id]) current[id] = row;
    else history.push(row);
  }
  return { current, history };
}

export async function actAdminCatalogItemsSet(b: Entrada<"admin-catalog-items-set"> & { _ip?: string }) {
  const s = await requireAdmin(b.token);
  const itemId = String(b.itemId || "").trim();
  if (!/^SIG\d{2}$/.test(itemId)) throw new ApiError("Id de Signature inválido.", 400);
  // SIG05 tiene tabla y panel propios (rotación mensual del menú secreto). Si se aceptara
  // acá, loadSecretSignature() pisaría lo publicado un instante después y el panel diría
  // "guardado" sin efecto — el mismo fallo silencioso que ya se corrigió en el editor de
  // precios. Se rechaza con un mensaje que dice a dónde ir.
  if (esSecreto(itemId)) throw new ApiError("El menú secreto se edita en Admin // Menú secreto, no acá.", 400);

  const name = String(b.name || "").trim();
  if (!name) throw new ApiError("Falta el nombre del Signature.", 400);
  const subtitle = String(b.subtitle || "Signature").trim() || "Signature";
  // badge y pitch pueden ir vacíos a propósito: un Signature sin badge es válido, y poder
  // QUITAR un badge desde el panel es justamente una de las cosas que esto viene a permitir.
  const badge = String(b.badge ?? "").trim().slice(0, 40);
  const pitch = String(b.pitch ?? "").trim().slice(0, 600);

  const base = String(b.base || "").trim();
  if (!VALID_BASES.has(base)) throw new ApiError("Pan inválido.", 400);

  const proteinId = String(b.proteinId || "").trim();
  if (!PROT_PRICE[proteinId]) throw new ApiError("Proteína inválida.", 400);

  const tops = Array.isArray(b.tops) ? b.tops.map(String) : [];
  if (tops.length > 3 || new Set(tops).size !== tops.length || tops.some((t: string) => !VALID_TOPS.has(t))) {
    throw new ApiError("Toppings inválidos (máximo 3, sin repetir, de la lista real).", 400);
  }
  const sauces = Array.isArray(b.sauces) ? b.sauces.map(String) : [];
  if (sauces.length > 2 || new Set(sauces).size !== sauces.length || sauces.some((sc: string) => !VALID_SAUCES.has(sc))) {
    throw new ApiError("Salsas inválidas (máximo 2, sin repetir, de la lista real).", 400);
  }
  // Al menos una salsa, por la misma razón que en el menú secreto: priceSigBuild duplica
  // la ÚLTIMA salsa de la receta cuando el cliente pide SALSA EXTRA. Sin ninguna, ese
  // extra no mapea a ningún ingrediente real y se cobraría un adicional que no existe.
  if (!sauces.length) throw new ApiError("Elige al menos una salsa para la receta.", 400);

  // Los ingredientes reservados al menú secreto de este ciclo no pueden aparecer en un
  // Signature público: eso rompería la exclusividad que hace secreto al secreto. Se valida
  // en el servidor y no solo en la UI, igual que la guarda espejo del otro panel.
  if (VAULT_ONLY_PROTS.has(proteinId)) throw new ApiError("Esa proteína está reservada al menú secreto este ciclo.", 400);
  if (tops.some((t: string) => VAULT_ONLY_TOPS.has(t))) throw new ApiError("Uno de esos toppings está reservado al menú secreto este ciclo.", 400);
  if (sauces.some((sc: string) => VAULT_ONLY_SAUCES.has(sc))) throw new ApiError("Una de esas salsas está reservada al menú secreto este ciclo.", 400);

  const fixedCheese = b.fixedCheese ? String(b.fixedCheese).trim() : null;
  if (fixedCheese && !VALID_CHEESE.has(fixedCheese)) throw new ApiError("Queso inválido.", 400);

  const price15 = Number(b.price15);
  const price30 = Number(b.price30);
  if (!(price15 > 0) || !(price30 > 0)) throw new ApiError("Precio inválido.", 400);
  // El 30CM no puede costar menos que el 15CM: R03 ("sube a 30CM gratis") perdona la
  // diferencia p30-p15, así que con p30 < p15 esa recompensa pasaría a COBRAR de más.
  if (price30 < price15) throw new ApiError("El precio de 30CM no puede ser menor que el de 15CM.", 400);

  const imagePath = b.imagePath ? String(b.imagePath).trim().slice(0, 300) : null;
  const active = b.active !== false;

  await sbInsert("catalog_items", {
    item_id: itemId,
    name,
    subtitle,
    badge: badge || null,
    pitch,
    base,
    protein_id: proteinId,
    tops,
    sauces,
    price_15: price15,
    price_30: price30,
    fixed_cheese: fixedCheese,
    cheese_optional: b.cheeseOptional === true,
    image_path: imagePath,
    active,
    created_by: s.phone,
  });
  await logAdminAction(s.phone, "catalog-item-set", itemId, { name, price15, price30, active });
  await loadCatalogItems();
  return { success: true };
}
