// EL MÓDULO DE DINERO COMPARTIDO (supabase/functions/_shared/dinero.ts, 2026-09-24).
//
// Con él cobra el servidor (deriveCart) y con él calcula el cliente el total que muestra. Antes
// de mudar el cálculo acá se fotografió lo que cobraba `deriveCart` en 8 064 carritos
// (sándwiches, bebidas, cantidades, las cinco recompensas y el organizador) y el resultado
// después de mudarlo fue idéntico, céntimo por céntimo. Estas pruebas fijan los casos que
// importan, en especial los tres en que el cliente viejo se separaba del servidor.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { deriveCart, preciosVigentes, PROT_PRICE } from "../supabase/functions/api/catalog.ts";
import { REGLAS, resolverCarrito, type LineaDelCarrito } from "../supabase/functions/_shared/dinero.ts";
import { panConRecargo, panSinRecargo, recompensa, unSignature, unaBebida, unaProteinaDelArmador, unaSalsaDelArmador } from "./carta.ts";
import { recompensaDeTipo } from "../supabase/functions/_shared/carta.ts";

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const PAN_CON_RECARGO = panConRecargo();
const PAN_SIN_RECARGO = panSinRecargo();
const R_SANDWICH = recompensa("sandwich");
const R_SUBIR30 = recompensa("subir30");
const R_BEBIDA = recompensa("bebida");
const UNA_BEBIDA = unaBebida();

// Productos de la carta, no escritos (ver carta.ts).
const UN_SIGNATURE = unSignature();
const UNA_PROTEINA = unaProteinaDelArmador();
const UNA_SALSA = unaSalsaDelArmador();

const byo = (base: string, size: "15" | "30", extra: Record<string, unknown> = {}) =>
  ({ type: "byo", base, prot: UNA_PROTEINA, tops: [], cheese: null, sauces: [UNA_SALSA], size, qty: 1, ...extra }) as LineaDelCarrito;
const cobra = (items: LineaDelCarrito[], r: string | null = null, org = false) => deriveCart(items, r, null, org).expectedTotal;
const PROT = PROT_PRICE[UNA_PROTEINA]!;

Deno.test("focaccia 15CM con «15CM gratis»: el pan va dentro de lo que se regala", () => {
  assertEquals(cobra([byo(PAN_CON_RECARGO, "15")], R_SANDWICH), 0);
});

Deno.test("focaccia 15CM con «sube a 30CM»: se perdona también el salto del pan, hasta el tope", () => {
  const salto = (PROT.p30 + REGLAS.recargoPan[PAN_CON_RECARGO]!.p30) - (PROT.p15 + REGLAS.recargoPan[PAN_CON_RECARGO]!.p15);
  const esperado = Math.round((PROT.p15 + REGLAS.recargoPan[PAN_CON_RECARGO]!.p15 - Math.min(salto, recompensaDeTipo("subir30")!.tope ?? Infinity)) * 100) / 100;
  assertEquals(cobra([byo(PAN_CON_RECARGO, "15")], R_SUBIR30), esperado);
});

Deno.test("el organizador se lleva el 15CM más barato, con su pan, desde el umbral", () => {
  const n = REGLAS.organizadorDesde;
  const items = [byo(PAN_CON_RECARGO, "15"), { ...byo(PAN_SIN_RECARGO, "30"), qty: n - 1 } as LineaDelCarrito];
  const sin = cobra(items, null, false);
  assertEquals(Math.round((sin - cobra(items, null, true)) * 100), Math.round((PROT.p15 + REGLAS.recargoPan[PAN_CON_RECARGO]!.p15) * 100));
  const menos = [byo(PAN_CON_RECARGO, "15"), { ...byo(PAN_SIN_RECARGO, "30"), qty: n - 2 } as LineaDelCarrito];
  assertEquals(cobra(menos, null, true), cobra(menos, null, false), "por debajo del umbral no regala nada");
});

Deno.test("el combo descuenta por PAR, y la bebida que se regala no arma par", () => {
  const bebida = { type: "side", code: UNA_BEBIDA, qty: 1 } as LineaDelCarrito;
  const solo = cobra([byo(PAN_SIN_RECARGO, "15")]) + cobra([bebida]);
  assertEquals(Math.round((solo - cobra([byo(PAN_SIN_RECARGO, "15"), bebida])) * 100), Math.round(REGLAS.comboPorPar * 100));
  // Con R05 la bebida ya es gratis: el combo no puede descontar encima de ella.
  const conR05 = resolverCarrito([byo(PAN_SIN_RECARGO, "15"), bebida], { recompensa: R_BEBIDA }, preciosVigentes());
  assertEquals(conR05.combo, 0);
});

Deno.test("todo en céntimos: tres iguales no dan decimales infinitos", () => {
  const t = cobra([{ type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 3 } as LineaDelCarrito]);
  assertEquals(Math.round(t * 100) / 100, t);
});

Deno.test("una recompensa sin línea elegible se rechaza, no se ignora", () => {
  let msg = "";
  try { cobra([byo(PAN_SIN_RECARGO, "30")], R_SANDWICH); } catch (e) { msg = (e as Error).message; }
  assertEquals(msg.includes("ningún producto elegible"), true, msg);
});
