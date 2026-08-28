// Pruebas de la REVERSIÓN al cancelar un pedido, ejecutando el código real del servidor.
//
// POR QUÉ EXISTE. Cancelar es la única operación que DESHACE dinero y puntos ya
// aplicados, y su aritmética ya produjo un defecto real en producción: la reversión del
// bono de referido devolvía 50 de los 400 otorgados y dejaba 350 puntos regalados por un
// pedido que nunca existió. El resto de actAdminCancelOrder/actCancelMyOrder toca la base
// y no se puede ejecutar acá, pero el cálculo de cuánto revertir sí — y es justo la parte
// que falla en silencio: un número equivocado no lanza ningún error, solo deja la cuenta
// del cliente mal para siempre.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { cancellationDeltas, pointsFor } from "../supabase/functions/api/actions/orders.ts";

Deno.test("un pedido nunca pagado no revierte nada — no hay qué deshacer", () => {
  // Yape/Plin que el cliente dijo haber pagado pero el admin nunca confirmó: jamás pasó
  // por finalize_order_customer_update, así que revertir algo acá sería restarle puntos
  // que nunca ganó.
  const d = cancellationDeltas({
    payment_status: "pending",
    payment_method: "yape",
    total: 27.25,
    delivery_fee: 6.35,
    redeemed_reward_pts: 0,
  });
  assertEquals(d.creditToRefund, 0);
  assertEquals(d.pointsToRefund, 0);
  assertEquals(d.totalOrdersDelta, 0);
  assertEquals(d.totalRedeemedDelta, 0);
});

Deno.test("revierte EXACTAMENTE los puntos que se otorgaron, sin contar el delivery", () => {
  // The Original 15CM (20.90) + zona media engordada por Culqi. Los puntos se ganaron
  // sobre la comida sola; revertir sobre el total cobrado le quitaría al cliente puntos
  // que el delivery nunca le dio.
  const total = 27.25, fee = 6.35;
  const d = cancellationDeltas({
    payment_status: "paid",
    payment_method: "card",
    total,
    delivery_fee: fee,
    redeemed_reward_pts: 0,
  });
  assertEquals(d.pointsToRefund, -pointsFor(total, fee));
  assertEquals(d.pointsToRefund, -21);
  assertEquals(d.totalOrdersDelta, -1);
  // Tarjeta: el dinero real lo reembolsa el dueño a mano, esta función no mueve crédito.
  assertEquals(d.creditToRefund, 0);
  assertEquals(d.totalRedeemedDelta, 0);
});

Deno.test("con recompensa canjeada devuelve esos puntos y quita los ganados en el mismo neto", () => {
  // R06 (sándwich 15CM gratis, 400 pts) sobre un pedido que igual dejó comida pagada.
  const d = cancellationDeltas({
    payment_status: "paid",
    payment_method: "card",
    total: 27.25,
    delivery_fee: 6.35,
    redeemed_reward_pts: 400,
  });
  assertEquals(d.pointsToRefund, 400 - 21);
  // El contador de recompensas canjeadas también baja: si no, el cliente sube de "canjeó
  // N veces" con un canje que se deshizo.
  assertEquals(d.totalRedeemedDelta, -1);
});

Deno.test("pagado con crédito interno: se devuelve el total completo, delivery incluido", () => {
  // Acá sí entra el delivery: el cliente pagó ese monto con su saldo y el motorizado
  // nunca llegó a cobrarlo, así que devolverle solo la comida le comería la diferencia.
  const d = cancellationDeltas({
    payment_status: "paid",
    payment_method: "credit",
    total: 28.9,
    delivery_fee: 8,
    redeemed_reward_pts: 0,
  });
  assertEquals(d.creditToRefund, 28.9);
  assertEquals(d.pointsToRefund, -pointsFor(28.9, 8));
});

Deno.test("el neto de puntos es siempre entero — la columna es integer", () => {
  // Mismo motivo por el que existe la batería de pointsFor: con precios .90 y fees
  // engordados, un decimal acá revienta el UPDATE DESPUÉS de haber cancelado el pedido.
  const zonas = [0, 6, 6.35, 8, 8.47, 12, 12.7, 15, 15.87];
  const totales = [19.9, 20.9, 21.9, 23.9, 25.9, 26.9, 28.9, 30.9, 34.9, 62.7];
  const canjes = [0, 120, 400, 650];
  for (const t of totales) {
    for (const z of zonas) {
      for (const c of canjes) {
        const d = cancellationDeltas({
          payment_status: "paid",
          payment_method: "card",
          total: t + z,
          delivery_fee: z,
          redeemed_reward_pts: c,
        });
        assertEquals(
          Number.isInteger(d.pointsToRefund),
          true,
          `pointsToRefund de (${t + z}, ${z}, canje ${c}) = ${d.pointsToRefund} no es entero`,
        );
      }
    }
  }
});

Deno.test("tolera delivery_fee y redeemed_reward_pts nulos, como llegan de la base", () => {
  const d = cancellationDeltas({
    payment_status: "paid",
    payment_method: "card",
    total: 20.9,
    delivery_fee: null,
    redeemed_reward_pts: null,
  });
  assertEquals(d.pointsToRefund, -21);
  assertEquals(d.totalRedeemedDelta, 0);
});
