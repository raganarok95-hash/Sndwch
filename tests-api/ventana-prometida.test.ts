// Pruebas de la ventana de llegada que se promete al pagar (`ventanaPrometida`).
//
// POR QUÉ EXISTE. Las pantallas 30 G2, 31 y 06 dicen «llega 7:40 – 8:05» antes de que el
// pedido salga, y el detalle compara lo que llegó contra lo que «prometimos». Si la ventana
// sale mal no revienta nada: el cliente ve una hora que no se va a cumplir, o el detalle
// dice «dentro» cuando llegó tarde. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { ventanaPrometida, ESTIMATED_DELIVERY_RANGE, QUEUE_MINUTES_PER_ORDER } from "../supabase/functions/api/env.ts";

const AHORA = Date.parse("2026-10-09T00:00:00Z");
const MIN = 60000;
const min = (iso: string) => (Date.parse(iso) - AHORA) / MIN;

Deno.test("con la cocina vacía promete el rango de siempre", () => {
  const v = ventanaPrometida(AHORA, 0, null);
  assertEquals(min(v.desde), ESTIMATED_DELIVERY_RANGE[0]);
  assertEquals(min(v.hasta), ESTIMATED_DELIVERY_RANGE[1]);
});

Deno.test("cada pedido en cola corre la ventana entera, no solo un extremo", () => {
  const v = ventanaPrometida(AHORA, 3, null);
  assertEquals(min(v.desde), ESTIMATED_DELIVERY_RANGE[0] + 3 * QUEUE_MINUTES_PER_ORDER);
  assertEquals(min(v.hasta), ESTIMATED_DELIVERY_RANGE[1] + 3 * QUEUE_MINUTES_PER_ORDER);
});

Deno.test("un programado promete la hora que eligió, no ahora + cola", () => {
  const hora = "2026-10-09T03:00:00.000Z";
  const v = ventanaPrometida(AHORA, 8, hora);
  assertEquals(v.desde, hora);
  assertEquals(min(v.hasta) - min(v.desde), ESTIMATED_DELIVERY_RANGE[1] - ESTIMATED_DELIVERY_RANGE[0]);
});

Deno.test("una cola rara (negativa o texto) no adelanta la promesa", () => {
  assertEquals(min(ventanaPrometida(AHORA, -4, null).desde), ESTIMATED_DELIVERY_RANGE[0]);
  assertEquals(min(ventanaPrometida(AHORA, NaN, null).desde), ESTIMATED_DELIVERY_RANGE[0]);
});

Deno.test("una hora programada ilegible cae al pedido para ya", () => {
  assertEquals(min(ventanaPrometida(AHORA, 0, "mañana").desde), ESTIMATED_DELIVERY_RANGE[0]);
});
