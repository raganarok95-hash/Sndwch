// Pruebas del cruce "lo que hace falta contra lo que hay" (#26), sobre el código real.
//
// POR QUÉ EXISTE. `prepShortfall` decide dos cosas caras: si la pantalla de preparación
// marca un insumo en rojo, y si sale la alerta de pedido programado sin insumo. Sus dos
// modos de fallo son opuestos y los dos son malos: un falso negativo deja al dueño llegando
// a la hora de entrega sin con qué armar el pedido, y un falso positivo hace sonar la
// alarma por insumos que nunca quiso rastrear — hasta que deja de mirarla.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { prepShortfall } from "../supabase/functions/api/actions/admin.ts";

const cuenta = (pares: [string, number][]) => new Map<string, number>(pares);
const falta = (rs: { code: string; shortfall: boolean }[]) => rs.filter((r) => r.shortfall).map((r) => r.code);

Deno.test("con stock suficiente no falta nada", () => {
  const r = prepShortfall(cuenta([["P01", 3]]), [{ product_code: "P01", product_name: "Res // Asado", in_stock: true, stock_qty: 10 }]);
  assertEquals(falta(r).length, 0);
});

Deno.test("stock por DEBAJO de lo comprometido es un faltante", () => {
  // El caso que importa: los pedidos ya están pagados y programados, y una corrección
  // manual de stock dejó el número por debajo de lo que hace falta.
  const r = prepShortfall(cuenta([["P01", 5]]), [{ product_code: "P01", in_stock: true, stock_qty: 2 }]);
  assertEquals(falta(r).join(","), "P01");
});

Deno.test("el borde exacto NO es faltante — con lo justo alcanza", () => {
  const r = prepShortfall(cuenta([["P01", 4]]), [{ product_code: "P01", in_stock: true, stock_qty: 4 }]);
  assertEquals(falta(r).length, 0);
});

Deno.test("marcado agotado a mano cuenta como faltante aunque el número diga otra cosa", () => {
  // Un "no" explícito del dueño manda sobre cualquier cantidad — mismo criterio que
  // reserve_inventory, que rechaza por in_stock=false antes de mirar stock_qty.
  const r = prepShortfall(cuenta([["T01", 2]]), [{ product_code: "T01", in_stock: false, stock_qty: 99 }]);
  assertEquals(falta(r).join(","), "T01");
});

Deno.test("un insumo sin cantidad rastreada no se declara faltante", () => {
  // stock_qty nulo = el dueño nunca quiso llevar la cuenta de ese insumo. Inventar un
  // faltante acá haría sonar la alarma todos los días por algo que no se rastrea.
  const r = prepShortfall(cuenta([["S01", 8]]), [{ product_code: "S01", in_stock: true, stock_qty: null }]);
  assertEquals(falta(r).length, 0);
});

Deno.test("un insumo sin fila en inventario tampoco se declara faltante", () => {
  const r = prepShortfall(cuenta([["B01", 6]]), []);
  assertEquals(falta(r).length, 0);
  assertEquals(r[0].stockQty, null);
  // Sin nombre en la tabla, se muestra el código: peor etiqueta, nunca una fila perdida.
  assertEquals(r[0].label, "B01");
});

Deno.test("los faltantes van primero, y entre iguales manda la cantidad", () => {
  // La alerta y la pantalla cortan la lista: si el orden fuera arbitrario, justo el insumo
  // que falta podría quedar del lado que no se muestra.
  const r = prepShortfall(
    cuenta([["A", 1], ["B", 9], ["C", 5]]),
    [
      { product_code: "A", in_stock: true, stock_qty: 0 },
      { product_code: "B", in_stock: true, stock_qty: 50 },
      { product_code: "C", in_stock: true, stock_qty: 50 },
    ],
  );
  assertEquals(r.map((x) => x.code).join(","), "A,B,C");
  assertEquals(r[0].shortfall, true);
  assertEquals(r[1].shortfall, false);
});

Deno.test("stock en cero con demanda es faltante", () => {
  const r = prepShortfall(cuenta([["P02", 1]]), [{ product_code: "P02", in_stock: true, stock_qty: 0 }]);
  assertEquals(falta(r).join(","), "P02");
});

Deno.test("sin demanda no hay nada que revisar", () => {
  assertEquals(prepShortfall(cuenta([]), [{ product_code: "P01", in_stock: false, stock_qty: 0 }]).length, 0);
});

Deno.test("una lista de inventario nula no revienta el cálculo", () => {
  const r = prepShortfall(cuenta([["P01", 2]]), null as never);
  assertEquals(r.length, 1);
  assertEquals(r[0].shortfall, false);
});
