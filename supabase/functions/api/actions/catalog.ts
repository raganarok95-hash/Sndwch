// SND//WCH — api / actions/catalog
// Exponer el catálogo de precios vigente al cliente, y la edición admin de precios
// (ver la tabla catalog_prices y loadCatalogPrices en ../catalog.ts).
import { sbUpsert } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { loadCatalogPrices, PROT_PRICE, SIG_DATA, SIG_CONTENT, SIG_GATES, SIDE_PRICE, REWARDS, VAULT_ONLY_PROTS, VAULT_ONLY_TOPS, VAULT_ONLY_SAUCES, SECRET_SIGNATURE_NAME } from "../catalog.ts";

// Acción pública (sin sesión) para que el cliente sepa los precios vigentes sin tener
// que redesplegar el sitio estático cada vez que el dueño cambia uno desde el panel.
export async function actGetCatalog(_b: any) {
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
      fixedCheese: d.fixedCheese ?? null, cheeseOptional: d.cheeseOptional === true,
    };
  }
  return {
    proteins: PROT_PRICE,
    sigs,
    sigItems: items,
    sides: SIDE_PRICE,
    rewardPts,
    secretSignature: SIG_DATA.SIG05
      ? {
          name: SECRET_SIGNATURE_NAME,
          base: SIG_DATA.SIG05.base,
          prot: SIG_DATA.SIG05.prot,
          tops: SIG_DATA.SIG05.tops,
          sauces: SIG_DATA.SIG05.sauces,
          p15: SIG_DATA.SIG05.p15,
          p30: SIG_DATA.SIG05.p30,
          minOrders: SIG_GATES.SIG05 ? SIG_GATES.SIG05.minOrders : 5,
          vaultOnlyProts: [...VAULT_ONLY_PROTS],
          vaultOnlyTops: [...VAULT_ONLY_TOPS],
          vaultOnlySauces: [...VAULT_ONLY_SAUCES],
        }
      : null,
  };
}
export async function actAdminCatalogSetPrice(b: any) {
  const s = await requireAdmin(b.token);
  const code = String(b.code || "").trim();
  const category = String(b.category || "").trim();
  const values = b.values;
  if (!values || typeof values !== "object") throw new ApiError("Faltan los valores del precio.");
  // Valida la forma exacta esperada por categoría antes de guardar — evita que un typo
  // en el panel guarde un jsonb con campos faltantes/de más que luego rompa el pricing.
  if (category === "protein") {
    if (!PROT_PRICE[code]) throw new ApiError("Proteína desconocida.");
    // pDbl30 se agregó el 2026-08-22 (el recargo de doble proteína dejó de ser plano, ver
    // PROT_PRICE en catalog.ts). Se valida igual que los otros tres — sin esto, el panel
    // admin podría guardar una fila sin pDbl30 y loadCatalogPrices dejaría el 30CM con el
    // literal del código mientras el 15CM sí se actualiza: precios de dos épocas en la
    // misma proteína.
    if (typeof values.p15 !== "number" || typeof values.p30 !== "number" || typeof values.pDbl !== "number" || typeof values.pDbl30 !== "number" || values.p15 < 0 || values.p30 < 0 || values.pDbl < 0 || values.pDbl30 < 0) {
      throw new ApiError("Precio inválido.");
    }
  } else if (category === "sig") {
    // Desde el 2026-08-27 el precio de un Signature vive en `catalog_items`, junto con su
    // composición, su nombre y su foto. Aceptarlo acá guardaría una fila en catalog_prices
    // que loadCatalogItems() pisa un instante después: el panel diría "guardado" y el
    // precio no cambiaría. Es exactamente el fallo silencioso que ya costó tres semanas de
    // precios fantasma, así que se rechaza con un mensaje que dice a dónde ir.
    throw new ApiError("El precio de un Signature se edita en Admin // Catálogo // Signatures, no acá.");
  } else if (category === "side") {
    if (!(code in SIDE_PRICE)) throw new ApiError("Bebida/side desconocido.");
    if (typeof values.price !== "number" || values.price < 0) throw new ApiError("Precio inválido.");
  } else if (category === "reward") {
    if (!REWARDS[code]) throw new ApiError("Recompensa desconocida.");
    if (typeof values.pts !== "number" || values.pts < 1) throw new ApiError("Costo en puntos inválido.");
  } else {
    throw new ApiError("Categoría inválida.");
  }
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
