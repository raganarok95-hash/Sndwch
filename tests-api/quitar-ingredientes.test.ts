// QUITAR INGREDIENTES DE UN SIGNATURE (dueño, 2026-09-30, del estudio de Subway: «sin cebolla»).
// Solo se quita lo que la receta lleva (vegetal, salsa, queso fijo); nunca el pan ni la
// proteína; el precio no cambia; lo quitado no se descuenta del inventario.
//
// Modo de fallo: SILENCIO. Si el servidor dejara caer `sin` al sanear el ítem, el cliente vería
// «sin cebolla» en su recibo y la cocina la pondría igual: nada revienta, el sándwich llega mal.
function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(msg ?? `esperaba ${e}, recibí ${a}`);
}
import { deriveCart, SIG_DATA } from "../supabase/functions/api/catalog.ts";
import { unSignature } from "./carta.ts";

const HORA_NORMAL = "2026-09-10T01:00:00.000Z";
const CON_VERDES = unSignature((d) => d.tops.length > 0);
const receta = SIG_DATA[CON_VERDES];
const verde = receta.tops[0];

Deno.test("quitar un vegetal: viaja en el ítem, sale de los ingredientes y el precio no cambia", () => {
  const sin = deriveCart([{ type: "sig", sigId: CON_VERDES, size: "15", qty: 1, sin: [verde] }], null, HORA_NORMAL);
  const con = deriveCart([{ type: "sig", sigId: CON_VERDES, size: "15", qty: 1 }], null, HORA_NORMAL);
  assertEquals(sin.sanitizedItems[0].sin, [verde], "el servidor perdió lo que el cliente quitó");
  assertEquals(sin.expectedTotal, con.expectedTotal, "quitar no cambia el precio");
  assertEquals((sin.sanitizedItems[0].snapIngredients as string[]).includes(verde), false, "lo quitado se sigue descontando del inventario");
  assertEquals(sin.ingredients.includes(verde), false);
});

Deno.test("el pan, la proteína o algo ajeno a la receta no se pueden quitar", () => {
  const r = deriveCart([{ type: "sig", sigId: CON_VERDES, size: "15", qty: 1, sin: [receta.base, receta.prot, "NO-EXISTE"] }], null, HORA_NORMAL);
  assertEquals(r.sanitizedItems[0].sin, undefined);
  assertEquals((r.sanitizedItems[0].snapIngredients as string[]).includes(receta.prot), true);
});
