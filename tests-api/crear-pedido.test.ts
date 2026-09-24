// CREAR UN PEDIDO ES UNA SOLA OPERACIÓN (paso 4, 2026-09-24).
//
// El pedido, el saldo del cliente y su historial se escriben en UNA transacción, dentro de la
// función de la base `crear_pedido` (migración 20260924173551). Esa función se probó contra la
// base real —invitado, pago con recompensa + crédito + bono de referido, segundo pedido sin
// bono repetido, falla a mitad sin dejar nada, saldo insuficiente— dentro de un bloque que se
// deshace al final. Acá se prueba lo que el servidor le MANDA, sin base.
//
// El modo de fallo que importa es silencioso: un campo que el código arma y la función no lee
// se pierde sin error. Por eso la primera prueba compara las dos listas.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { filaDelPedido, movimientoDeLaCuenta, pointsFor } from "../supabase/functions/api/actions/orders.ts";
import { REFERRAL_BONUS_POINTS, REFERRER_REWARD_POINTS } from "../supabase/functions/api/env.ts";
import { unSignature } from "./carta.ts";

// Un Signature vigente cualquiera: la prueba no depende de qué sándwich haya en la carta.
const UN_SIGNATURE = unSignature();

const SQL = Deno.readTextFileSync(new URL("../supabase/migrations/20260924173551_crear_pedido_transaccional.sql", import.meta.url));

const P = {
  ref: "R1", phone: "999", contactPhone: "999", name: "Ana", email: "", address: "Av. X 1", summary: "1x", notes: null,
  total: 42.5, deliveryFee: 6, deliveryKm: 3.2, deliveryZone: null, paymentStatus: "paid", paymentId: "chr_1",
  paymentMethod: "card", items: [{ type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 1 }], scheduledFor: null,
  reward: { pts: 160, label: "BEBIDA GRATIS" }, useCredit: false, lat: -8.1, lon: -79, groupCode: "G1", recurringId: null,
};

Deno.test("cada campo que el servidor arma lo lee crear_pedido, y viceversa", () => {
  const i = SQL.indexOf("insert into public.orders (");
  const cols = SQL.slice(SQL.indexOf("(", i) + 1, SQL.indexOf(")", i)).split(",").map((s) => s.trim()).filter(Boolean);
  // `status` y `customer_rank` los pone la función: un pedido nuevo siempre entra RECIBIDO, y el
  // rango se calcula con el conteo YA actualizado, dentro de la transacción.
  const lee = cols.filter((c) => c !== "status" && c !== "customer_rank").sort();
  const arma = Object.keys(filaDelPedido(P as any, { desde: null, hasta: null })).sort();
  assertEquals(arma, lee);
});

Deno.test("la cuenta: gana puntos solo por la comida y descuenta la recompensa", () => {
  const m = movimientoDeLaCuenta(P as any, null);
  const gana = pointsFor(P.total, P.deliveryFee);
  assertEquals(m.base_points, gana);
  assertEquals(m.points_delta, gana - 160);
  assertEquals(m.redeemed_delta, 1);
  assertEquals(m.credit_delta, 0);
  assertEquals(m.referral_bonus, 0, "sin quien invite no hay bono");
});

Deno.test("pagar con crédito descuenta el total del saldo", () => {
  const m = movimientoDeLaCuenta({ ...P, useCredit: true, reward: null } as any, null);
  assertEquals(m.credit_delta, -P.total);
  assertEquals(m.reward_label, null);
});

Deno.test("el bono de referido se PROPONE con quien invita; lo decide la base bajo lock", () => {
  const m = movimientoDeLaCuenta(P as any, "988");
  assertEquals([m.referrer_phone, m.referral_bonus, m.referrer_bonus], ["988", REFERRAL_BONUS_POINTS, REFERRER_REWARD_POINTS]);
});

Deno.test("la función de la base no se puede llamar con la clave pública", () => {
  assertEquals(/revoke all on function public\.crear_pedido\(jsonb, jsonb, jsonb\) from public, anon, authenticated/.test(SQL), true);
});
