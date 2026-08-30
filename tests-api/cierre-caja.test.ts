// Pruebas del cierre de caja diario (#40), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Este es el número con el que el dueño va a decidir si el día le alcanzó, y
// se equivoca EN SILENCIO en tres direcciones que este negocio tiene todas a la vez:
//
//   1. El delivery no es suyo — lo cobra y se lo entrega al motorizado. Sumarlo hace creer
//      que ganó entre S/6 y S/15 más por pedido.
//   2. Un pedido pagado con crédito interno no trajo plata hoy: entró cuando se vendió el
//      Plan Semanal, quizá semanas antes. Contarlo hoy lo cuenta dos veces.
//   3. La tarjeta no llega entera: Culqi se queda 5.5%.
//
// Ninguno de los tres produce un error. Producen un número optimista, que es la única
// dirección en la que un cierre de caja no se puede equivocar.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { cashClose } from "../supabase/functions/api/actions/admin.ts";

const FEE = 0.055;
const pedido = (metodo: string, total: number, delivery = 6, extra: Record<string, unknown> = {}) =>
  ({ payment_method: metodo, payment_status: "paid", status: "ENTREGADO", total, delivery_fee: delivery, ...extra });

Deno.test("un día simple de Yape cuadra: bruto, reparto y lo que queda", () => {
  // Dos pedidos de S/26.90 con S/6 de reparto. Yape no paga comisión.
  const c = cashClose([pedido("yape", 26.9), pedido("yape", 26.9)], FEE);
  assertEquals(c.orders, 2);
  assertEquals(c.gross, 53.8);
  assertEquals(c.deliveryPassThrough, 12);
  assertEquals(c.cardFees, 0);
  assertEquals(c.cashIn, 53.8);
  assertEquals(c.businessRevenue, 41.8);
});

Deno.test("la comisión de Culqi se aplica SOLO a la tarjeta", () => {
  // Aplicarla a todo restaría 5.5% de los pagos por Yape, que no la pagan — y ese error va
  // en contra del dueño, que es la dirección menos peligrosa pero igual de falsa.
  const c = cashClose([pedido("card", 100, 0), pedido("yape", 100, 0)], FEE);
  assertEquals(c.cardFees, 5.5);
  assertEquals(c.cashIn, 194.5);
});

Deno.test("un pedido pagado con crédito interno NO cuenta como plata que entró hoy", () => {
  // Es el error más caro de los tres: esa venta ya se cobró cuando se vendió el Plan
  // Semanal. Contarla otra vez infla el día y descuadra el mes.
  const c = cashClose([pedido("credit", 30, 6)], FEE);
  assertEquals(c.creditUsed, 30);
  assertEquals(c.cashIn, 0);
});

Deno.test("el reparto de un pedido pagado con crédito TAMBIÉN sale de la caja", () => {
  // Al motorizado se le paga igual: no le importa de qué bolsillo salió la venta. Descontar
  // solo el reparto de los pedidos que trajeron efectivo dejaría fuera una salida real.
  const c = cashClose([pedido("credit", 30, 6)], FEE);
  assertEquals(c.deliveryPassThrough, 6);
  assertEquals(c.businessRevenue, -6, "ese día el reparto salió del bolsillo del dueño");
});

Deno.test("los cancelados no entran en el cierre", () => {
  const c = cashClose([
    pedido("yape", 26.9),
    pedido("yape", 100, 6, { status: "CANCELADO" }),
  ], FEE);
  assertEquals(c.orders, 1);
  assertEquals(c.gross, 26.9);
});

Deno.test("lo que está sin confirmar va aparte y NO suma", () => {
  // El cliente dijo que pagó y nadie miró la cuenta. El día que esto sume una vez, la
  // pantalla deja de servir para cuadrar contra el banco.
  const c = cashClose([
    pedido("yape", 26.9),
    { payment_method: "yape", payment_status: "pending", status: "RECIBIDO", total: 40, delivery_fee: 6 },
  ], FEE);
  assertEquals(c.gross, 26.9);
  assertEquals(c.pendingConfirmation.orders, 1);
  assertEquals(c.pendingConfirmation.amount, 40);
});

Deno.test("el desglose por método suma exactamente el bruto", () => {
  // Si el desglose y el total no cuadran, la pantalla se contradice a sí misma y no hay
  // forma de saber a cuál creerle.
  const c = cashClose([pedido("card", 30), pedido("yape", 25), pedido("credit", 20), pedido("plin", 15)], FEE);
  const suma = c.byMethod.reduce((a, m) => a + m.gross, 0);
  assertEquals(Math.round(suma * 100) / 100, c.gross);
});

Deno.test("el desglose separa la comida del total: el reparto no es venta", () => {
  const c = cashClose([pedido("yape", 26.9, 6)], FEE);
  assertEquals(c.byMethod[0].gross, 26.9);
  assertEquals(c.byMethod[0].net, 20.9);
});

Deno.test("los métodos vienen ordenados por monto, no por nombre", () => {
  const c = cashClose([pedido("plin", 10), pedido("card", 200), pedido("yape", 50)], FEE);
  assertEquals(c.byMethod.map((m) => m.method).join(","), "card,yape,plin");
});

Deno.test("cada método sale con su etiqueta legible, no con el código interno", () => {
  const c = cashClose([pedido("card", 30), pedido("credit", 20)], FEE);
  assertEquals(c.byMethod.some((m) => m.label === "Tarjeta (Culqi)"), true);
  assertEquals(c.byMethod.some((m) => m.label === "Crédito interno"), true);
});

Deno.test("un método desconocido no se pierde ni rompe el cuadre", () => {
  // Un pedido legado con un método que ya no existe tiene que seguir sumando: perderlo
  // descuadraría la caja en silencio.
  const c = cashClose([pedido("transferencia_rara", 40, 0)], FEE);
  assertEquals(c.gross, 40);
  assertEquals(c.byMethod[0].label, "transferencia_rara");
});

Deno.test("un total nulo o basura no produce NaN en toda la caja", () => {
  const c = cashClose([
    { payment_method: "yape", payment_status: "paid", status: "ENTREGADO", total: null, delivery_fee: null },
    { payment_method: "yape", payment_status: "paid", status: "ENTREGADO", total: "veinte" as never, delivery_fee: 6 },
  ], FEE);
  assertEquals(Number.isFinite(c.gross), true);
  assertEquals(Number.isFinite(c.businessRevenue), true);
});

Deno.test("un día sin ventas devuelve ceros, no una excepción", () => {
  const c = cashClose([], FEE);
  assertEquals(c.orders, 0);
  assertEquals(c.gross, 0);
  assertEquals(c.businessRevenue, 0);
  assertEquals(cashClose(null as never, FEE).orders, 0);
});
