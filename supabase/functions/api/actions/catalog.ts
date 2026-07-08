// SND//WCH — api / actions/catalog
// Exponer el catálogo de precios vigente al cliente, y la edición admin de precios
// (ver la tabla catalog_prices y loadCatalogPrices en ../catalog.ts).
import { sbUpdate } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { loadCatalogPrices, PROT_PRICE, SIG_DATA, SIDE_PRICE, REWARDS } from "../catalog.ts";

// Acción pública (sin sesión) para que el cliente sepa los precios vigentes sin tener
// que redesplegar el sitio estático cada vez que el dueño cambia uno desde el panel.
export async function actGetCatalog(_b: any) {
  await loadCatalogPrices();
  const sigs: Record<string, { p15: number; p30: number }> = {};
  for (const code of Object.keys(SIG_DATA)) sigs[code] = { p15: SIG_DATA[code].p15, p30: SIG_DATA[code].p30 };
  const rewardPts: Record<string, number> = {};
  for (const code of Object.keys(REWARDS)) rewardPts[code] = REWARDS[code].pts;
  return { proteins: PROT_PRICE, sigs, sides: SIDE_PRICE, rewardPts };
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
    if (typeof values.p15 !== "number" || typeof values.p30 !== "number" || typeof values.pDbl !== "number" || values.p15 < 0 || values.p30 < 0 || values.pDbl < 0) {
      throw new ApiError("Precio inválido.");
    }
  } else if (category === "sig") {
    if (!SIG_DATA[code]) throw new ApiError("Signature desconocida.");
    if (typeof values.p15 !== "number" || typeof values.p30 !== "number" || values.p15 < 0 || values.p30 < 0) throw new ApiError("Precio inválido.");
  } else if (category === "side") {
    if (!(code in SIDE_PRICE)) throw new ApiError("Bebida/side desconocido.");
    if (typeof values.price !== "number" || values.price < 0) throw new ApiError("Precio inválido.");
  } else if (category === "reward") {
    if (!REWARDS[code]) throw new ApiError("Recompensa desconocida.");
    if (typeof values.pts !== "number" || values.pts < 1) throw new ApiError("Costo en puntos inválido.");
  } else {
    throw new ApiError("Categoría inválida.");
  }
  await sbUpdate("catalog_prices", `code=eq.${encodeURIComponent(code)}`, { values, updated_at: new Date().toISOString() });
  await logAdminAction(s.phone, "catalog-set-price", code, values);
  await loadCatalogPrices();
  return { success: true };
}
