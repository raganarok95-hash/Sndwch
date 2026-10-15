// Durante la pausa, un pedido programado para cuando vuelves entra; uno «para ahora», no.
//
// POR QUÉ ESTE ARCHIVO. El dueño atiende desde su casa mientras trabaja (home office) y pausa la
// app para una reunión. Hasta el 2026-10-15 la pausa rechazaba TODO lo nuevo, también lo
// programado para después: el cliente veía «volvemos a las 3» y se iba. Dueño: «que se programe
// para cuando vuelva» (sí, 2026-10-15). El modo de fallo que cuesta es el silencioso: rechazar un
// pedido que sí se podía atender (venta perdida, nadie se entera) o aceptar uno «para ahora» en
// plena reunión (llega frío o tarde).
//
// La promesa: sin pausa, todo entra; con pausa, entra solo lo programado para la hora en que
// termina la pausa o después.
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

const { pedidoCabeEnPausa } = await import("../supabase/functions/api/actions/hours.ts");

const VUELVE = "2026-10-21T19:00:00.000Z"; // 14:00 en Lima

Deno.test("sin pausa entra todo: para ahora y programado", () => {
  assertEquals(pedidoCabeEnPausa(null, null), true);
  assertEquals(pedidoCabeEnPausa(null, "2026-10-21T18:00:00.000Z"), true);
});

Deno.test("con pausa, «para ahora» no entra: la cocina está en pausa", () => {
  assertEquals(pedidoCabeEnPausa(VUELVE, null), false);
});

Deno.test("con pausa, programado para cuando vuelve o después entra", () => {
  assertEquals(pedidoCabeEnPausa(VUELVE, VUELVE), true, "justo a la hora en que termina la pausa");
  assertEquals(pedidoCabeEnPausa(VUELVE, "2026-10-21T19:30:00.000Z"), true);
  assertEquals(pedidoCabeEnPausa(VUELVE, "2026-10-22T17:00:00.000Z"), true, "mañana");
});

Deno.test("con pausa, programado para antes de que termine no entra", () => {
  assertEquals(pedidoCabeEnPausa(VUELVE, "2026-10-21T18:30:00.000Z"), false);
  assertEquals(pedidoCabeEnPausa(VUELVE, "2026-10-21T18:59:00.000Z"), false);
});

Deno.test("una hora programada ilegible no entra durante la pausa", () => {
  assertEquals(pedidoCabeEnPausa(VUELVE, "no es una fecha"), false);
});
