// Pruebas del lote E5 (#38 costo por compra, #39 pasivo de crédito, #31/#34 conciliación y
// comisiones de Culqi, #35 margen por pedido), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Los cinco producen números sobre los que se toman decisiones de PRECIO, y
// ninguno falla con una excepción: fallan con una cifra plausible. Un costo por porción mal
// derivado no se nota — se nota tres meses después, cuando el margen real no coincide con el
// que decía la pantalla y ya se vendieron mil sándwiches a ese precio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { ingredientCosts, recipeCost, creditLiability, culqiReconciliation } from "../supabase/functions/api/actions/admin.ts";
import { orderMargin } from "../supabase/functions/api/actions/orders.ts";

const compra = (code: string, qty: number, total: number, fecha: string, unit = "g") =>
  ({ product_code: code, qty, unit, total_paid: total, purchased_at: fecha });

// ── #38: costo por compra ──────────────────────────────────────────────────────────────

Deno.test("el costo unitario sale de la boleta, no se pide aparte", () => {
  // El dueño tiene el total pagado y la cantidad; el precio unitario lo deriva el sistema.
  const c = ingredientCosts([compra("P01", 6000, 120, "2026-09-01")]).get("P01")!;
  assertEquals(c.lastUnitCost, 0.02);
  assertEquals(c.avgUnitCost, 0.02);
});

Deno.test("el promedio es PONDERADO por cantidad, no promedio de precios", () => {
  // 6 kg a S/20/kg y 0.5 kg a S/30/kg no cuestan S/25 el kilo: cuestan S/20.77. El promedio
  // simple sobrevalora la compra chica y con eso sube el costo de todo el menú.
  const c = ingredientCosts([
    compra("P01", 6000, 120, "2026-09-01"),
    compra("P01", 500, 15, "2026-09-02"),
  ]).get("P01")!;
  assertEquals(c.avgUnitCost, 0.0208);
  assertEquals(c.lastUnitCost, 0.03, "la última compra sí fue más cara");
});

Deno.test("solo entran las últimas compras en el promedio", () => {
  // Promediar seis meses con inflación da un costo que ya no existe.
  const c = ingredientCosts([
    compra("P01", 1000, 100, "2026-09-04"),
    compra("P01", 1000, 100, "2026-09-03"),
    compra("P01", 1000, 100, "2026-09-02"),
    compra("P01", 1000, 10, "2026-01-01"),
  ]).get("P01")!;
  assertEquals(c.avgUnitCost, 0.1, "la compra vieja y barata no debe arrastrar el promedio");
  assertEquals(c.purchases, 4);
});

Deno.test("marca cuánto subió respecto de la compra anterior", () => {
  const c = ingredientCosts([
    compra("P01", 1000, 120, "2026-09-02"),
    compra("P01", 1000, 100, "2026-09-01"),
  ]).get("P01")!;
  assertEquals(c.spikePct, 0.2);
});

Deno.test("con UNA sola compra no se inventa una variación de 0%", () => {
  // 0% sugeriría que el precio está estable, cuando en realidad no hay contra qué comparar.
  assertEquals(ingredientCosts([compra("P01", 1000, 100, "2026-09-01")]).get("P01")!.spikePct, null);
});

Deno.test("una compra con cantidad cero se descarta en vez de dar Infinity", () => {
  // Ese Infinity se propagaría al costo de todo el menú sin ningún error visible.
  const m = ingredientCosts([compra("P01", 0, 100, "2026-09-01")]);
  assertEquals(m.has("P01"), false);
});

Deno.test("el orden de las filas no cambia el resultado", () => {
  const asc = ingredientCosts([compra("P01", 1000, 100, "2026-09-01"), compra("P01", 1000, 120, "2026-09-02")]).get("P01")!;
  const desc = ingredientCosts([compra("P01", 1000, 120, "2026-09-02"), compra("P01", 1000, 100, "2026-09-01")]).get("P01")!;
  assertEquals(asc.lastUnitCost, desc.lastUnitCost);
});

// ── #38: costo por porción derivado de la receta ───────────────────────────────────────

const RECETA = {
  recipe_code: "P01",
  name: "Res asada mechada",
  yield_portions: 38,
  ingredients: [
    { item: "Punta de pecho", qty: 6000, unit: "g" },
    { item: "Sal", qty: 72, unit: "g" },
  ],
};

Deno.test("con todos los precios registrados, da el costo por porción", () => {
  const costos = ingredientCosts([
    { product_code: "Punta de pecho", qty: 1000, unit: "g", total_paid: 20, purchased_at: "2026-09-01" },
    { product_code: "Sal", qty: 1000, unit: "g", total_paid: 2, purchased_at: "2026-09-01" },
  ]);
  const r = recipeCost(RECETA, costos);
  // 6000 g × 0.02 = 120 · 72 g × 0.002 = 0.144 → 120.14 / 38 porciones
  assertEquals(r.total, 120.14);
  assertEquals(r.costPerPortion, 3.16);
  assertEquals(r.missing.length, 0);
});

Deno.test("si falta UN precio, NO se muestra un costo parcial", () => {
  // Un total parcial que se ve completo es un dato con aspecto de medición, y sobre un costo
  // por porción se fija el precio de venta.
  const costos = ingredientCosts([
    { product_code: "Punta de pecho", qty: 1000, unit: "g", total_paid: 20, purchased_at: "2026-09-01" },
  ]);
  const r = recipeCost(RECETA, costos);
  assertEquals(r.costPerPortion, null);
  assertEquals(r.known, 1);
  assertEquals(r.missing.join(","), "Sal");
});

Deno.test("comprar en kg y pedir en g NO se mezcla en silencio", () => {
  // Sería un costo mil veces menor sin ningún error. Cuenta como faltante y dice por qué.
  const costos = ingredientCosts([
    { product_code: "Punta de pecho", qty: 6, unit: "kg", total_paid: 120, purchased_at: "2026-09-01" },
    { product_code: "Sal", qty: 1000, unit: "g", total_paid: 2, purchased_at: "2026-09-01" },
  ]);
  const r = recipeCost(RECETA, costos);
  assertEquals(r.costPerPortion, null);
  assertEquals(r.missing[0].includes("compraste en kg"), true);
});

Deno.test("una receta sin ingredientes no reporta costo cero", () => {
  // Cero sería una mentira barata: significaría que ese sándwich no cuesta nada.
  const r = recipeCost({ recipe_code: "X", name: "X", yield_portions: 10, ingredients: [] }, new Map());
  assertEquals(r.costPerPortion, null);
});

// ── #39: pasivo de crédito ─────────────────────────────────────────────────────────────

Deno.test("suma solo el crédito vivo, no los saldos en cero", () => {
  const l = creditLiability([{ credit_balance: 100 }, { credit_balance: 0 }, { credit_balance: 45.5 }]);
  assertEquals(l.customers, 2);
  assertEquals(l.total, 145.5);
  assertEquals(l.average, 72.75);
  assertEquals(l.largest, 100);
});

Deno.test("un saldo negativo no resta del pasivo", () => {
  // No debería existir, pero si la base tuviera uno, restarlo escondería deuda real.
  const l = creditLiability([{ credit_balance: 100 }, { credit_balance: -50 }]);
  assertEquals(l.total, 100);
});

Deno.test("sin nadie con crédito el pasivo es cero, no una excepción", () => {
  assertEquals(creditLiability([]).total, 0);
  assertEquals(creditLiability(null as never).total, 0);
});

// ── #31 / #34: conciliación y comisiones ───────────────────────────────────────────────

const log = (stage: string) => ({ detail: { stage } });
const pedidoCard = (total: number, extra: Record<string, unknown> = {}) =>
  ({ payment_method: "card", payment_status: "paid", status: "ENTREGADO", total, ...extra });

Deno.test("lo facturado por tarjeta y la comisión que se lleva Culqi", () => {
  const r = culqiReconciliation([pedidoCard(100), pedidoCard(200)], [], 0.055);
  assertEquals(r.orders, 2);
  assertEquals(r.invoiced, 300);
  assertEquals(r.fees, 16.5);
  assertEquals(r.netExpected, 283.5, "es el número contra el que se compara el depósito");
});

Deno.test("solo cuentan los cobros de TARJETA que se pagaron", () => {
  const r = culqiReconciliation([
    pedidoCard(100),
    pedidoCard(500, { status: "CANCELADO" }),
    pedidoCard(500, { payment_status: "pending" }),
    { payment_method: "yape", payment_status: "paid", status: "ENTREGADO", total: 999 },
  ], [], 0.055);
  assertEquals(r.invoiced, 100);
});

Deno.test("la tasa de rechazo cruza rechazos contra intentos, no contra pedidos", () => {
  const r = culqiReconciliation([pedidoCard(100)], [log("culqi-rejected"), log("charge-succeeded"), log("charge-succeeded")], 0.055);
  assertEquals(r.declines, 1);
  assertEquals(r.declineRate, 0.333);
});

Deno.test("sin intentos la tasa es null, no 0%", () => {
  // 0% con cero cobros sugeriría que todo salió bien cuando no pasó nada.
  assertEquals(culqiReconciliation([], [], 0.055).declineRate, null);
});

Deno.test("un evento que no es de cobro no cuenta como intento", () => {
  const r = culqiReconciliation([], [log("culqi-fetch-failed"), log("done")], 0.055);
  assertEquals(r.declineRate, null);
});

// ── #35: margen por pedido ─────────────────────────────────────────────────────────────

Deno.test("el margen se calcula sobre la comida, nunca sobre el delivery", () => {
  // El reparto es pass-through: incluirlo inflaría el margen con plata que no es del negocio.
  const m = orderMargin({ ref: "A", total: 26.9, delivery_fee: 6 }, 0);
  assertEquals(m.chargedFood, 20.9);
  assertEquals(m.estimatedCost, 9.4);
  assertEquals(m.contribution, 11.5);
  assertEquals(m.belowFloor, false);
});

Deno.test("la comisión de tarjeta baja el margen del pedido", () => {
  const sinTarjeta = orderMargin({ ref: "A", total: 26.9, delivery_fee: 6 }, 0);
  const conTarjeta = orderMargin({ ref: "A", total: 26.9, delivery_fee: 6 }, 1.48);
  assertEquals(conTarjeta.contribution < sinTarjeta.contribution, true);
});

Deno.test("EL CASO DEL ÍTEM: los descuentos apilados salen enteros del margen", () => {
  // Sándwich de S/20.90 de carta, cobrado a S/10.90 tras apilar combo + recompensa + promo.
  // El costo NO baja: la proteína, el pan y la salsa son los mismos. 20.90 × 0.45 = S/9.41
  // de insumo contra S/10.90 cobrados deja S/1.49, un 14% — bajo el piso del 25%.
  const m = orderMargin({ ref: "B", total: 16.9, delivery_fee: 6, listFood: 20.9 }, 0);
  assertEquals(m.listFood, 20.9);
  assertEquals(m.chargedFood, 10.9);
  assertEquals(m.discount, 10);
  assertEquals(m.estimatedCost, 9.4);
  assertEquals(m.belowFloor, true);
});

Deno.test("sin descuento el mismo pedido NO se marca", () => {
  // El contraste importa: si saltara también sin promos, sonaría en cada pedido y se
  // apagaría antes del día que hay algo que corregir.
  const m = orderMargin({ ref: "C", total: 26.9, delivery_fee: 6, listFood: 20.9 }, 0);
  assertEquals(m.discount, 0);
  assertEquals(m.belowFloor, false);
});

Deno.test("anclar el costo al precio de carta es lo que hace que la alerta exista", () => {
  // Con el costo calculado sobre el precio YA descontado, el margen da 55% por construcción
  // y `belowFloor` no sería true nunca. Esta prueba falla si alguien "simplifica" el cálculo
  // quitando listFood — el aviso quedaría vivo en el código y muerto en la práctica.
  const anclado = orderMargin({ ref: "D", total: 16.9, delivery_fee: 6, listFood: 20.9 }, 0);
  const ingenuo = orderMargin({ ref: "D", total: 16.9, delivery_fee: 6 }, 0);
  assertEquals(anclado.belowFloor, true);
  assertEquals(ingenuo.belowFloor, false, "el cálculo ingenuo no detecta nada — por eso no se usa");
});

Deno.test("un pedido 100% cubierto por una recompensa NO se marca como mal margen", () => {
  // No tiene mal margen: es un premio ya pagado con puntos. Marcarlo enseñaría a ignorar
  // la alerta justo antes del día que sí importa.
  const m = orderMargin({ ref: "E", total: 6, delivery_fee: 6, listFood: 20.9 }, 0);
  assertEquals(m.chargedFood, 0);
  assertEquals(m.belowFloor, false);
});

Deno.test("sin precio de carta se cae al comportamiento anterior, no a cero", () => {
  // Un pedido legado sin ítems reconocibles no puede reportar costo cero: eso diría que
  // ese sándwich no costó nada.
  const m = orderMargin({ ref: "F", total: 26.9, delivery_fee: 6, listFood: 0 }, 0);
  assertEquals(m.listFood, 20.9);
  assertEquals(m.estimatedCost > 0, true);
});

Deno.test("totales rotos no producen un margen absurdo", () => {
  const m = orderMargin({ ref: "G", total: null, delivery_fee: null }, 0);
  assertEquals(Number.isFinite(m.contribution), true);
  assertEquals(m.belowFloor, false);
});
