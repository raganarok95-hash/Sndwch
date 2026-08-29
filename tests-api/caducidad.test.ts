// Pruebas de la CADUCIDAD DE TANDA, ejecutando el código real del servidor.
//
// POR QUÉ EXISTE. Esto es seguridad alimentaria, y su modo de fallo no es un error: es
// SILENCIO. Si `batchExpiryStatus` se equivoca en un caso límite, nadie ve una excepción ni
// un log rojo — simplemente la alerta no sale, y una proteína cocida hace cinco días sigue
// pareciendo disponible en el panel mientras el dueño arma pedidos. Es exactamente la clase
// de defecto que ni el type-check ni los specs de Playwright pueden ver: los specs mockean
// el endpoint `api` entero y nunca ejecutan una línea de esta función.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { batchExpiryStatus, BATCH_EXPIRY_WARN_HOURS, BATCH_SHELF_LIFE_DEFAULT_DAYS } from "../supabase/functions/api/actions/orders.ts";

const AHORA = Date.parse("2026-09-10T15:00:00Z");
const HORA = 60 * 60 * 1000;
const haceHoras = (h: number) => new Date(AHORA - h * HORA).toISOString();

Deno.test("una tanda dentro de su vida útil no alerta", () => {
  const r = batchExpiryStatus(
    [{ product_code: "P01", product_name: "Res // Asado", stock_qty: 12, batch_cooked_at: haceHoras(10), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(r.vencidos.length, 0);
  assertEquals(r.porVencer.length, 0);
});

Deno.test("una tanda pasada de su fecha límite sale como VENCIDA", () => {
  const r = batchExpiryStatus(
    [{ product_code: "P01", product_name: "Res // Asado", stock_qty: 12, batch_cooked_at: haceHoras(80), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(r.vencidos.length, 1);
  assertEquals(r.vencidos[0].code, "P01");
  assertEquals(r.vencidos[0].name, "Res // Asado");
  // 3 días = 72 h, cocinada hace 80: venció hace 8.
  assertEquals(r.vencidos[0].horas, -8);
  assertEquals(r.porVencer.length, 0);
});

Deno.test("avisa un día antes, no el mismo día que vence", () => {
  // Justo dentro de la ventana de aviso: quedan 20 h de las 24 que se vigilan.
  const dentro = batchExpiryStatus(
    [{ product_code: "P02", stock_qty: 5, batch_cooked_at: haceHoras(52), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(dentro.porVencer.length, 1);
  assertEquals(dentro.porVencer[0].horas, 20);

  // Justo fuera: quedan 26 h. Avisar acá sería adelantarse y volver la alerta ruido.
  const fuera = batchExpiryStatus(
    [{ product_code: "P02", stock_qty: 5, batch_cooked_at: haceHoras(46), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(fuera.porVencer.length, 0);
  assertEquals(fuera.vencidos.length, 0);
});

Deno.test("el borde exacto de las 24 h entra en el aviso", () => {
  const r = batchExpiryStatus(
    [{ product_code: "P02", stock_qty: 5, batch_cooked_at: haceHoras(3 * 24 - BATCH_EXPIRY_WARN_HOURS), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(r.porVencer.length, 1);
  assertEquals(r.porVencer[0].horas, BATCH_EXPIRY_WARN_HOURS);
});

Deno.test("un insumo SIN tanda registrada nunca alerta", () => {
  // Insumo que se compra ya listo, o repuesto antes de que existiera la columna. Inventarle
  // una fecha de cocción sería fabricar el dato que esta alerta existe para vigilar.
  const r = batchExpiryStatus(
    [{ product_code: "D06", product_name: "Limonada", stock_qty: 30, batch_cooked_at: null, shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(r.vencidos.length, 0);
  assertEquals(r.porVencer.length, 0);
});

Deno.test("un insumo sin stock no alerta aunque su tanda sea vieja — ya se consumió", () => {
  // Si alertara, la notificación saldría todos los días para siempre por algo que no está
  // en la refri, y una alarma que suena siempre deja de mirarse.
  const cero = batchExpiryStatus([{ product_code: "P01", stock_qty: 0, batch_cooked_at: haceHoras(200), shelf_life_days: 3 }], AHORA);
  assertEquals(cero.vencidos.length, 0);

  const nulo = batchExpiryStatus([{ product_code: "P01", stock_qty: null, batch_cooked_at: haceHoras(200), shelf_life_days: 3 }], AHORA);
  assertEquals(nulo.vencidos.length, 0);

  const marcado = batchExpiryStatus(
    [{ product_code: "P01", stock_qty: 8, in_stock: false, batch_cooked_at: haceHoras(200), shelf_life_days: 3 }],
    AHORA,
  );
  assertEquals(marcado.vencidos.length, 0);
});

Deno.test("sin vida útil configurada usa el default conservador de 3 días", () => {
  assertEquals(BATCH_SHELF_LIFE_DEFAULT_DAYS, 3);
  // 80 h con el default de 72 h ya está vencida; con un valor inválido no puede quedar
  // "sin caducidad" — eso apagaría la alarma justo en el insumo peor configurado.
  for (const vida of [null, undefined, 0, -1, NaN] as (number | null | undefined)[]) {
    const r = batchExpiryStatus([{ product_code: "P01", stock_qty: 4, batch_cooked_at: haceHoras(80), shelf_life_days: vida }], AHORA);
    assertEquals(r.vencidos.length, 1, `con shelf_life_days=${vida} la tanda vencida no se detectó`);
  }
});

Deno.test("una vida útil más larga corre la fecha límite", () => {
  // Un insumo que aguanta 7 días no puede heredar el límite de 3: eso lo declararía vencido
  // a los 3 días y obligaría a tirar comida buena, que también es un fallo.
  const r = batchExpiryStatus([{ product_code: "S01", stock_qty: 4, batch_cooked_at: haceHoras(80), shelf_life_days: 7 }], AHORA);
  assertEquals(r.vencidos.length, 0);
  assertEquals(r.porVencer.length, 0);
});

Deno.test("lo más urgente va primero", () => {
  // El aviso corta la lista de nombres: si el orden fuera arbitrario, el insumo más vencido
  // podría quedar justo del lado que no se muestra.
  const r = batchExpiryStatus(
    [
      { product_code: "A", stock_qty: 1, batch_cooked_at: haceHoras(80), shelf_life_days: 3 },
      { product_code: "B", stock_qty: 1, batch_cooked_at: haceHoras(200), shelf_life_days: 3 },
      { product_code: "C", stock_qty: 1, batch_cooked_at: haceHoras(100), shelf_life_days: 3 },
    ],
    AHORA,
  );
  assertEquals(r.vencidos.map((v) => v.code).join(","), "B,C,A");
});

Deno.test("una fecha de tanda corrupta se ignora en vez de tumbar el cron", () => {
  // Un `Invalid Date` daría NaN en toda la aritmética y la comparación sería false, así que
  // el insumo se saltaría igual — pero conviene que sea explícito: el resto de la lista
  // tiene que seguir revisándose.
  const r = batchExpiryStatus(
    [
      { product_code: "MALA", stock_qty: 4, batch_cooked_at: "no-es-una-fecha", shelf_life_days: 3 },
      { product_code: "P01", stock_qty: 4, batch_cooked_at: haceHoras(80), shelf_life_days: 3 },
    ],
    AHORA,
  );
  assertEquals(r.vencidos.length, 1);
  assertEquals(r.vencidos[0].code, "P01");
});

Deno.test("una lista vacía o nula no revienta", () => {
  assertEquals(batchExpiryStatus([], AHORA).vencidos.length, 0);
  assertEquals(batchExpiryStatus(null as never, AHORA).porVencer.length, 0);
});
