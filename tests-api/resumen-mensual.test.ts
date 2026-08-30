// Pruebas del resumen mensual personal (#65), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Este es el único mensaje que el sistema le manda al cliente hablándole de
// SUS propios datos, y por eso es el que más caro sale equivocar: decirle "pediste 4 veces"
// a quien pidió 2, o "tu favorito fue X" cuando pidió X una sola vez, no es un error
// cosmético — es una razón para dejar de creerle a la app que además le maneja los puntos y
// el saldo. Y el modo de fallo es SILENCIO: el push sale igual, con el número mal.
//
// La ventana de fechas se prueba aparte porque es donde vive el error clásico: calcular "el
// mes pasado" con getMonth()-1 se rompe en enero y desfasa cinco horas en cada frontera de
// mes, que es exactamente cuando este cron corre.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { monthlyRecap } from "../supabase/functions/api/actions/customer.ts";
import { limaPrevMonthRange } from "../supabase/functions/api/env.ts";

// Un pedido tal como sale de la consulta del cron. `delivery_fee` va aparte a propósito: los
// puntos NUNCA se ganan sobre el reparto (es pass-through al motorizado), así que un resumen
// que sume el total completo le promete puntos que no tiene.
function pedido(sigId: string, total: number, deliveryFee = 6, qty = 1) {
  return { items: [{ type: "sig", sigId, qty }], total, delivery_fee: deliveryFee };
}

Deno.test("sin pedidos no se manda nada", () => {
  // Quien no pidió el mes pasado no recibe un resumen de cero pedidos: eso es un mensaje de
  // reconquista, y ese ya lo manda otro cron con otro texto.
  assertEquals(monthlyRecap([]), null);
  assertEquals(monthlyRecap(null as never), null);
  assertEquals(monthlyRecap(undefined as never), null);
});

Deno.test("cuenta los pedidos y suma solo los puntos de la comida", () => {
  // 3 pedidos de S/26.90 con S/6 de delivery: los puntos salen de S/20.90 cada uno.
  const r = monthlyRecap([pedido("SIG01", 26.9), pedido("SIG01", 26.9), pedido("SIG01", 26.9)]);
  assertEquals(r?.count, 3);
  assertEquals(r?.points, 63, "el delivery no da puntos: 3 × round(26.90 − 6) = 63");
});

Deno.test("el delivery nunca infla los puntos del resumen", () => {
  // El mismo pedido con reparto caro tiene que dar los MISMOS puntos. Si esta prueba falla,
  // el resumen le está prometiendo al cliente puntos que su saldo real no tiene.
  const barato = monthlyRecap([pedido("SIG01", 26.9, 6)]);
  const caro = monthlyRecap([pedido("SIG01", 32.9, 12)]);
  assertEquals(barato?.points, caro?.points);
});

Deno.test("el favorito es el que más veces pidió, no el primero ni el más caro", () => {
  const r = monthlyRecap([
    pedido("SIG03", 34.9),
    pedido("SIG01", 20.9),
    pedido("SIG01", 20.9),
    pedido("SIG01", 20.9),
  ]);
  assertEquals(r?.count, 4);
  assertEquals(typeof r?.favorite, "string");
  assertEquals(r?.favorite?.includes("SIG03"), false, "SIG03 fue el más caro pero solo se pidió una vez");
});

Deno.test("con un solo pedido no se inventa un 'favorito'", () => {
  // "Tu favorito fue X" a partir de una sola compra suena a que la app no lo conoce — y es
  // literalmente falso: no hay con qué comparar. El resumen igual sale, sin esa frase.
  const r = monthlyRecap([pedido("SIG01", 20.9)]);
  assertEquals(r?.count, 1);
  assertEquals(r?.favorite, null);
});

Deno.test("un empate tampoco produce un favorito falso... pero sí si alguno se repite", () => {
  // Dos productos distintos una vez cada uno: nadie es favorito.
  assertEquals(monthlyRecap([pedido("SIG01", 20.9), pedido("SIG03", 34.9)])?.favorite, null);
  // El mismo dos veces: ahí sí.
  assertEquals(typeof monthlyRecap([pedido("SIG01", 20.9), pedido("SIG01", 20.9)])?.favorite, "string");
});

Deno.test("un pedido con varias unidades del mismo ítem cuenta las unidades", () => {
  // Un pedido grupal de 3 del mismo Signature sí revela un favorito, aunque sea un pedido.
  const r = monthlyRecap([pedido("SIG01", 62.7, 6, 3)]);
  assertEquals(r?.count, 1);
  assertEquals(typeof r?.favorite, "string");
});

Deno.test("datos rotos no producen un resumen absurdo", () => {
  // Un total nulo o un pedido sin items no debe dar puntos negativos ni reventar el cron
  // entero para todos los demás clientes.
  const r = monthlyRecap([{ items: null, total: null, delivery_fee: null }]);
  assertEquals(r?.count, 1);
  assertEquals(r!.points >= 0, true);
  const r2 = monthlyRecap([{ items: [], total: 5, delivery_fee: 20 }]);
  assertEquals(r2!.points >= 0, true, "un delivery mayor que el total no puede dar puntos negativos");
});

Deno.test("la ventana del mes pasado es el mes pasado completo, en hora Lima", () => {
  // 3 de marzo de 2026, 15:20 UTC (10:20 Lima) — la hora real del cron.
  const r = limaPrevMonthRange(new Date("2026-03-03T15:20:00Z"));
  assertEquals(r.ym, 202602);
  // Medianoche del 1 de febrero en Lima = 05:00 UTC de ese día, no 00:00 UTC.
  assertEquals(r.startIso, "2026-02-01T05:00:00.000Z");
  assertEquals(r.endIso, "2026-03-01T05:00:00.000Z");
});

Deno.test("en enero el mes pasado es diciembre del año anterior", () => {
  // El error clásico: getMonth()-1 da -1 y la ventana se va a un mes que no existe. Un cron
  // mensual que falla solo en enero se descubre en enero, con el daño hecho.
  const r = limaPrevMonthRange(new Date("2027-01-02T15:20:00Z"));
  assertEquals(r.ym, 202612);
  assertEquals(r.startIso, "2026-12-01T05:00:00.000Z");
  assertEquals(r.endIso, "2027-01-01T05:00:00.000Z");
});

Deno.test("la primera hora del mes en UTC todavía es el mes anterior en Lima", () => {
  // 1 de marzo 02:00 UTC son las 21:00 del 28 de febrero en Lima. Si la ventana se calculara
  // en UTC, ese pedido de la noche del 28 quedaría fuera del resumen de febrero y dentro del
  // de marzo, o sea contado en el mes equivocado para todos los clientes que pidieron de
  // noche a fin de mes.
  const r = limaPrevMonthRange(new Date("2026-03-01T02:00:00Z"));
  assertEquals(r.ym, 202601, "en Lima todavía es 28 de febrero, así que el mes cerrado es enero");
  assertEquals(r.endIso, "2026-02-01T05:00:00.000Z");
});
