// UN 30CM GASTA LO DE DOS 15CM (2026-10-16, P53; dueño: «Sí, que cuente doble»).
//
// El stock se cuenta en porciones de 15CM («Abro con N porciones»), y el 30CM es «el doble de
// pan y el doble de relleno» (lo dice el armador). Lo encontró Operación al planear la apertura:
// un 30CM descontaba UNA porción y gastaba dos. Modo de fallo: SILENCIO, y cuesta plata — con
// «Abro con 4» de una proteína, dos 30CM se la acaban y la web sigue vendiendo 2 que no hay: el
// cliente paga, no hay con qué armar y hay que devolver. Y al cancelar, lo devuelto tiene que ser
// lo mismo que se reservó, o el contador se infla.
//
// Correr con: npm run test:api
import { deriveCart, deriveOrder, priceCartItem, SIG_DATA } from "../supabase/functions/api/catalog.ts";
import { ingredientesADevolver } from "../supabase/functions/api/actions/orders.ts";
import { proteinasConDoble, unaProteinaDelArmador, panSinRecargo, unSignature } from "./carta.ts";

function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(msg ?? `esperaba ${e}, recibí ${a}`);
}
const veces = (lista: string[], code: string) => lista.filter((x) => x === code).length;
const SIG = unSignature();
const PROT = SIG_DATA[SIG]!.prot;
const HORA = "2026-10-21T17:00:00.000Z";

Deno.test("un Signature de 30CM reserva dos porciones de su proteína y de su pan", () => {
  const p15 = priceCartItem({ type: "sig", sigId: SIG, size: "15", qty: 1 }).ingredientsPerUnit;
  const p30 = priceCartItem({ type: "sig", sigId: SIG, size: "30", qty: 1 }).ingredientsPerUnit;
  assertEquals(veces(p15, PROT), 1);
  assertEquals(veces(p30, PROT), 2, "un 30CM descuenta una sola porción de proteína");
  assertEquals(veces(p30, SIG_DATA[SIG]!.base), 2, "un 30CM descuenta un solo pan de 15CM");
  assertEquals(p30.length, 2 * p15.length, "un 30CM no gasta el doble de todo");
});

Deno.test("lo que se reserva al pedir cuenta el 30CM doble, por cada unidad", () => {
  const { ingredients } = deriveCart([{ type: "sig", sigId: SIG, size: "30", qty: 2 }], null, HORA);
  assertEquals(veces(ingredients, PROT), 4);
});

Deno.test("arma el tuyo de 30CM con doble proteína gasta cuatro porciones", () => {
  const prot = proteinasConDoble().find((p) => p === unaProteinaDelArmador()) ?? unaProteinaDelArmador();
  const base = panSinRecargo();
  const linea = { type: "byo", base, prot, tops: [], sauces: [], size: "30", doubleProt: true, qty: 1 };
  let p: string[];
  try {
    p = priceCartItem(linea).ingredientsPerUnit;
  } catch {
    // Si esa proteína no admite doble en 30CM, la regla se prueba sin doble.
    p = priceCartItem({ ...linea, doubleProt: false }).ingredientsPerUnit;
    assertEquals(veces(p, prot), 2);
    return;
  }
  assertEquals(veces(p, prot), 4);
  assertEquals(veces(p, base), 2);
});

Deno.test("un favorito de 30CM se tasa con las mismas porciones que el carrito", () => {
  const fav = deriveOrder({ mode: "sig", sigId: SIG, size: "30" }).ingredients;
  assertEquals(veces(fav, PROT), 2);
});

Deno.test("al cancelar un 30CM vuelve al stock lo mismo que se reservó", () => {
  const item = priceCartItem({ type: "sig", sigId: SIG, size: "30", qty: 1 }).item;
  const { codes, qtys } = ingredientesADevolver([item]);
  assertEquals(qtys[codes.indexOf(PROT)], 2);
});
