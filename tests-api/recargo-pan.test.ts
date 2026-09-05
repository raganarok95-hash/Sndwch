// Recargo por pan de focaccia (2026-09-03), sobre el código real del servidor.
//
// POR QUÉ EXISTE. El tipo de pan era una elección GRATUITA del cliente y la focaccia cuesta
// más que el pan sub, así que el sobrecosto salía entero del margen sin que nadie lo viera.
// Ahora se cobra — y un cargo nuevo mal puesto se equivoca en las dos direcciones sin hacer
// ruido: de más, y el cliente paga por algo que no eligió; de menos, y vuelve la fuga.
//
// [MEDIDO] dueño 2026-09-03: de una focaccia de S/13 salen 10 de 15CM o 5 de 30CM → S/1.30 y
// S/2.60, contra S/1.00 y S/2.00 del pan sub. Sobrecosto real: +S/0.30 y +S/0.60.
// [DECISIÓN] se cobra S/0.50 y S/1.00.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { priceCartItem } from "../supabase/functions/api/catalog.ts";
import { BASE_SURCHARGE, baseSurcharge } from "../supabase/functions/api/env.ts";

// Costo real del pan, para que las pruebas comparen contra el hecho medido y no contra
// el propio número que están verificando.
const COSTO_FOCACCIA = { p15: 13 / 10, p30: 13 / 5 };
const COSTO_SUB = { p15: 1.0, p30: 2.0 };

// P02 y no P01: el 2026-09-05 la res pasó a `sigOnly` (sale de ARMA EL TUYO por
// rentabilidad) y el servidor rechaza armarla por BYO. Esta prueba mide el RECARGO DEL PAN,
// que no depende de la proteína — lo único que hacía falta era una que siga en el armador.
const byo = (base: string, size: "15" | "30") => priceCartItem({
  type: "byo", base, prot: "P02", tops: [], sauces: ["S01"], size, qty: 1,
});

Deno.test("el pan sub no cobra nada extra", () => {
  assertEquals(baseSurcharge("B01", "15"), 0);
  assertEquals(baseSurcharge("B01", "30"), 0);
});

Deno.test("un pan desconocido no inventa un recargo", () => {
  // Si mañana entra un pan nuevo al catálogo y nadie le pone precio, el cliente NO debe
  // pagar un recargo salido de la nada.
  assertEquals(baseSurcharge("B99", "15"), 0);
  assertEquals(baseSurcharge("", "15"), 0);
});

Deno.test("la focaccia cobra su recargo, y el 30CM el doble que el 15CM", () => {
  assertEquals(baseSurcharge("B03", "15"), 0.5);
  assertEquals(baseSurcharge("B03", "30"), 1);
});

Deno.test("el recargo CUBRE el sobrecosto real del pan, en los dos tamaños", () => {
  // La única forma en que este cargo no puede equivocarse: cobrar menos de lo que cuesta la
  // diferencia de pan. Si alguien baja el recargo por debajo del costo, vuelve la fuga.
  const extra15 = COSTO_FOCACCIA.p15 - COSTO_SUB.p15;   // +0.30
  const extra30 = COSTO_FOCACCIA.p30 - COSTO_SUB.p30;   // +0.60
  assertEquals(BASE_SURCHARGE.B03.p15 >= extra15, true, `cobra ${BASE_SURCHARGE.B03.p15}, cuesta ${extra15.toFixed(2)}`);
  assertEquals(BASE_SURCHARGE.B03.p30 >= extra30, true, `cobra ${BASE_SURCHARGE.B03.p30}, cuesta ${extra30.toFixed(2)}`);
});

Deno.test("el recargo entra al precio del sándwich, no queda como cargo suelto", () => {
  const sub15 = byo("B01", "15");
  const foc15 = byo("B03", "15");
  assertEquals(Math.round((foc15.unitPrice - sub15.unitPrice) * 100), 50);
  const sub30 = byo("B01", "30");
  const foc30 = byo("B03", "30");
  assertEquals(Math.round((foc30.unitPrice - sub30.unitPrice) * 100), 100);
});

Deno.test("el recargo va DENTRO de basePrice para que R06 lo perdone entero", () => {
  // R06 regala un 15CM completo. Si el recargo del pan quedara como un cargo aparte, la
  // recompensa dejaría al cliente pagando S/0.50 por un sándwich anunciado como gratis —
  // la misma clase de promesa rota que ya obligó a retirar dos badges del menú.
  const foc = byo("B03", "15");
  const sub = byo("B01", "15");
  assertEquals(Math.round((foc.basePrice - sub.basePrice) * 100), 50);
});

Deno.test("R03 (subir a 30CM gratis) también perdona el salto del pan", () => {
  // Sin esto, un cliente con focaccia canjeaba el upgrade y seguía debiendo los S/0.50 de
  // diferencia entre la focaccia de 15 y la de 30 — un cobro que aparece después de haber
  // canjeado algo "gratis".
  const foc = byo("B03", "15");
  const sub = byo("B01", "15");
  assertEquals(Math.round((foc.sizeUpgradeDiff - sub.sizeUpgradeDiff) * 100), 50);
});

Deno.test("el recargo se multiplica por la cantidad, como cualquier precio", () => {
  const tres = priceCartItem({ type: "byo", base: "B03", prot: "P02", tops: [], sauces: ["S01"], size: "15", qty: 3 });
  const uno = byo("B03", "15");
  assertEquals(Math.round((tres.unitPrice - uno.unitPrice) * 100), 0, "el unitario no cambia con la cantidad");
  assertEquals(tres.qty, 3);
});

Deno.test("un Signature no lleva recargo de pan, elija lo que elija el cliente", () => {
  // En un Signature la receta fija el pan: el cliente no lo elige, así que no hay nada que
  // recargar. Mandar un `base` en el cuerpo del pedido no debe cambiar el precio.
  const a = priceCartItem({ type: "sig", sigId: "SIG01", size: "15", qty: 1 });
  const b = priceCartItem({ type: "sig", sigId: "SIG01", size: "15", qty: 1, base: "B03" });
  assertEquals(a.unitPrice, b.unitPrice);
});
