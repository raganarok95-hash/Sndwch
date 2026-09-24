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

const byo = (base: string, size: "15" | "30", extra: Record<string, unknown> = {}) =>
  ({ type: "byo", base, prot: "P02", tops: [], cheese: null, sauces: ["S01"], size, qty: 1, ...extra }) as LineaDelCarrito;
const cobra = (items: LineaDelCarrito[], r: string | null = null, org = false) => deriveCart(items, r, null, org).expectedTotal;
const P02 = PROT_PRICE.P02;

Deno.test("focaccia 15CM con «15CM gratis» (R06): el pan va dentro de lo que se regala", () => {
  assertEquals(cobra([byo("B03", "15")], "R06"), 0);
});

Deno.test("focaccia 15CM con «sube a 30CM» (R03): se perdona también el salto del pan, hasta el tope", () => {
  const salto = (P02.p30 + REGLAS.recargoPan.B03.p30) - (P02.p15 + REGLAS.recargoPan.B03.p15);
  const esperado = Math.round((P02.p15 + REGLAS.recargoPan.B03.p15 - Math.min(salto, REGLAS.topeR03)) * 100) / 100;
  assertEquals(cobra([byo("B03", "15")], "R03"), esperado);
});

Deno.test("el organizador se lleva el 15CM más barato, con su pan, desde el umbral", () => {
  const n = REGLAS.organizadorDesde;
  const items = [byo("B03", "15"), { ...byo("B01", "30"), qty: n - 1 } as LineaDelCarrito];
  const sin = cobra(items, null, false);
  assertEquals(Math.round((sin - cobra(items, null, true)) * 100), Math.round((P02.p15 + REGLAS.recargoPan.B03.p15) * 100));
  const menos = [byo("B03", "15"), { ...byo("B01", "30"), qty: n - 2 } as LineaDelCarrito];
  assertEquals(cobra(menos, null, true), cobra(menos, null, false), "por debajo del umbral no regala nada");
});

Deno.test("el combo descuenta por PAR, y la bebida que regala R05 no arma par", () => {
  const bebida = { type: "side", code: "D07", qty: 1 } as LineaDelCarrito;
  const solo = cobra([byo("B01", "15")]) + cobra([bebida]);
  assertEquals(Math.round((solo - cobra([byo("B01", "15"), bebida])) * 100), Math.round(REGLAS.comboPorPar * 100));
  // Con R05 la bebida ya es gratis: el combo no puede descontar encima de ella.
  const conR05 = resolverCarrito([byo("B01", "15"), bebida], { recompensa: "R05" }, preciosVigentes());
  assertEquals(conR05.combo, 0);
});

Deno.test("todo en céntimos: tres iguales no dan decimales infinitos", () => {
  const t = cobra([{ type: "sig", sigId: "SIG01", size: "15", qty: 3 } as LineaDelCarrito]);
  assertEquals(Math.round(t * 100) / 100, t);
});

Deno.test("una recompensa sin línea elegible se rechaza, no se ignora", () => {
  let msg = "";
  try { cobra([byo("B01", "30")], "R06"); } catch (e) { msg = (e as Error).message; }
  assertEquals(msg.includes("ningún producto elegible"), true, msg);
});
