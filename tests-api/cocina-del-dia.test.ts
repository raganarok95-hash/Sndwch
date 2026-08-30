// Pruebas del bloque de cocina del lote E4 (#2 toca cocinar, #12 orden de armado,
// #10 mise en place), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Los tres tienen el mismo modo de fallo y no es un error: es el SILENCIO o
// el número callado. La alerta que no sale el día que se necesitaba deja al dueño sin
// proteína un viernes; un `startBy` mal calculado hace que el tercer pedido de las 8pm
// salga tarde SIEMPRE y nadie sepa por qué; un ingrediente que se cae del mise en place es
// un sándwich que no se puede armar. Nada de eso produce una excepción que alguien vea.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { batchPlanItems, cookNowItems, assemblyOrder, miseEnPlaceGroups } from "../supabase/functions/api/actions/admin.ts";

const inv = (rows: [string, string, number | null][]) =>
  new Map(rows.map(([code, name, qty]) => [code, { product_name: name, stock_qty: qty }]));

// ── #2: toca cocinar ───────────────────────────────────────────────────────────────────

Deno.test("daysLeft traduce el stock a la única unidad que sirve: días", () => {
  // 20 porciones consumidas en 10 días = 2/día. Con 6 en stock quedan 3 días.
  const items = batchPlanItems(new Map([["P01", 20]]), new Map(), inv([["P01", "Res", 6]]), 10, 4);
  assertEquals(items[0].daysLeft, 3);
});

Deno.test("sin consumo medido NO se inventa un plazo", () => {
  // Dividir entre cero daría Infinity y la pantalla diría que alcanza para siempre —
  // exactamente al revés de lo prudente.
  const items = batchPlanItems(new Map(), new Map([["P01", 4]]), inv([["P01", "Res", 6]]), 10, 4);
  assertEquals(items[0].daysLeft, null);
});

Deno.test("sin cantidad rastreada tampoco hay plazo, ni cero ni infinito", () => {
  // stock_qty null significa "solo tenemos el interruptor de agotado", no "hay 0".
  const items = batchPlanItems(new Map([["P01", 20]]), new Map(), inv([["P01", "Res", null]]), 10, 4);
  assertEquals(items[0].daysLeft, null);
  assertEquals(items[0].toCook, null);
  assertEquals(items[0].stockTracked, false);
});

Deno.test("avisa solo de lo que se acaba dentro del margen de producción", () => {
  const items = batchPlanItems(
    new Map([["P01", 20], ["P02", 20], ["P05", 20]]),
    new Map(),
    inv([["P01", "Res", 2], ["P02", "Pollo", 6], ["P05", "Embutido", 40]]),
    10,
    4,
  );
  // 2/día: P01 dura 1 día, P02 3 días, P05 20 días. Con margen de 2 solo entra P01.
  const urgentes = cookNowItems(items, 2);
  assertEquals(urgentes.length, 1);
  assertEquals(urgentes[0].code, "P01");
});

Deno.test("los más urgentes van primero, no los de mayor volumen", () => {
  // Si ordenara por cantidad, el insumo que se acaba mañana quedaría debajo del que se
  // acaba pasado — y el push solo muestra los tres primeros.
  const items = batchPlanItems(
    new Map([["P01", 10], ["P02", 100]]),
    new Map(),
    inv([["P01", "Res", 1], ["P02", "Pollo", 15]]),
    10,
    4,
  );
  assertEquals(cookNowItems(items, 3).map((u) => u.code).join(","), "P01,P02");
});

Deno.test("lo que ya se acabó entra con plazo cero o negativo, no se escapa", () => {
  const items = batchPlanItems(new Map([["P01", 20]]), new Map(), inv([["P01", "Res", 0]]), 10, 4);
  assertEquals(items[0].daysLeft, 0);
  assertEquals(cookNowItems(items, 2).length, 1);
});

Deno.test("una lista vacía o rota no dispara una alerta fantasma", () => {
  assertEquals(cookNowItems([]).length, 0);
  assertEquals(cookNowItems(null as never).length, 0);
});

Deno.test("los pedidos ya programados mandan sobre el promedio", () => {
  // Es demanda vendida: no se puede promediar algo que ya está comprometido.
  const items = batchPlanItems(new Map([["P01", 1]]), new Map([["P01", 30]]), inv([["P01", "Res", 0]]), 10, 4);
  assertEquals(items[0].needed, 30);
  assertEquals(items[0].toCook, 30);
});

// ── #12: orden de armado ───────────────────────────────────────────────────────────────

const AHORA = new Date("2026-09-10T18:00:00Z").getTime();

Deno.test("el tiempo de armado se ACUMULA: son secuenciales, cocina una persona", () => {
  // Tres pedidos para las 20:00. Restar 5 minutos a los tres haría empezar el tercero a las
  // 19:55 y entregarlo 19:55+15 = 20:10, tarde. Este es el defecto que el ítem describe.
  const plan = assemblyOrder([
    { ref: "A", deliveryTime: "2026-09-10T20:00:00Z" },
    { ref: "B", deliveryTime: "2026-09-10T20:00:00Z" },
    { ref: "C", deliveryTime: "2026-09-10T20:00:00Z" },
  ], AHORA, 5);
  assertEquals(plan.map((p) => p.startBy).join(","),
    "2026-09-10T19:55:00.000Z,2026-09-10T19:50:00.000Z,2026-09-10T19:45:00.000Z");
});

Deno.test("se ordena por hora de entrega aunque lleguen desordenados", () => {
  const plan = assemblyOrder([
    { ref: "TARDE", deliveryTime: "2026-09-10T21:00:00Z" },
    { ref: "TEMPRANO", deliveryTime: "2026-09-10T19:00:00Z" },
  ], AHORA, 5);
  assertEquals(plan.map((p) => p.ref).join(","), "TEMPRANO,TARDE");
});

Deno.test("marca el pedido que YA no llega a tiempo", () => {
  // Saberlo ahora permite avisarle al cliente; descubrirlo por el retraso no.
  const plan = assemblyOrder([
    { ref: "IMPOSIBLE", deliveryTime: "2026-09-10T18:02:00Z" },
    { ref: "OK", deliveryTime: "2026-09-10T21:00:00Z" },
  ], AHORA, 5);
  assertEquals(plan[0].late, true);
  assertEquals(plan[1].late, false);
});

Deno.test("una hora de entrega inválida se descarta sin tumbar el resto del plan", () => {
  const plan = assemblyOrder([
    { ref: "ROTO", deliveryTime: "mañana por la tarde" },
    { ref: "SIN", deliveryTime: "" },
    { ref: "OK", deliveryTime: "2026-09-10T21:00:00Z" },
  ], AHORA, 5);
  assertEquals(plan.map((p) => p.ref).join(","), "OK");
});

Deno.test("un tiempo de armado absurdo no produce horas negativas ni NaN", () => {
  const plan = assemblyOrder([{ ref: "A", deliveryTime: "2026-09-10T21:00:00Z" }], AHORA, 0);
  assertEquals(Number.isNaN(new Date(plan[0].startBy).getTime()), false);
  assertEquals(assemblyOrder(null as never, AHORA, 5).length, 0);
});

// ── #10: mise en place ─────────────────────────────────────────────────────────────────

const ing = (code: string, shortfall = false) =>
  ({ code, label: code, qty: 3, stockQty: 10, shortfall });

Deno.test("agrupa por dónde está cada cosa, no en una lista plana", () => {
  const g = miseEnPlaceGroups([ing("S01"), ing("P01"), ing("B01"), ing("T01"), ing("D01")]);
  assertEquals(g.map((x) => x.key).join(","), "prot,base,top,sauce,drink");
});

Deno.test("dentro del grupo mandan los faltantes", () => {
  // Es lo que hay que resolver ANTES de abrir; el resto solo hay que sacarlo.
  const g = miseEnPlaceGroups([ing("P01"), ing("P02", true), ing("P03")]);
  assertEquals(g[0].items[0].code, "P02");
});

Deno.test("un grupo sin nada no aparece vacío en la pantalla", () => {
  const g = miseEnPlaceGroups([ing("P01")]);
  assertEquals(g.length, 1);
  assertEquals(g[0].key, "prot");
});

Deno.test("un código que no encaja en ningún grupo NO se pierde", () => {
  // Perderlo en silencio sería peor que mostrarlo mal: es un insumo que igual hay que
  // preparar, y el que no está en la lista no se prepara.
  const g = miseEnPlaceGroups([ing("P01"), ing("X99"), ing("QUESO")]);
  const otros = g.find((x) => x.key === "otros");
  assertEquals(otros?.items.length, 2);
});

Deno.test("ningún ingrediente aparece en dos grupos a la vez", () => {
  const entrada = [ing("P01"), ing("B01"), ing("S01"), ing("T01"), ing("D01"), ing("Z1")];
  const g = miseEnPlaceGroups(entrada);
  const total = g.reduce((a, x) => a + x.items.length, 0);
  assertEquals(total, entrada.length, "duplicar un ingrediente haría preparar el doble");
});

Deno.test("una lista vacía o rota devuelve una pantalla vacía, no una excepción", () => {
  assertEquals(miseEnPlaceGroups([]).length, 0);
  assertEquals(miseEnPlaceGroups(null as never).length, 0);
});
