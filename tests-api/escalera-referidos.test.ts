// Pruebas de la escalera de referidos (#55), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Esta función decide CUÁNTOS PUNTOS regalar, y los puntos son dinero: 400
// de ellos son un sándwich 15CM. Se equivoca en silencio en las dos direcciones — pagar dos
// veces el mismo escalón regala producto sin venta detrás, y no pagarlo deja al mejor canal
// de adquisición del negocio sin la recompensa que se le prometió en pantalla.
//
// La escritura en la base (grant_referral_milestone) vuelve a comprobar el escalón contra la
// fila, así que un error acá no llegaría a pagar dos veces; pero sí dejaría de pagar, y ese
// modo de fallo es SILENCIO — no hay error que mirar. Por eso se prueba el cálculo.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { nextReferralMilestone } from "../supabase/functions/api/actions/orders.ts";
import { REFERRAL_MILESTONES, REFERRER_REWARD_POINTS } from "../supabase/functions/api/env.ts";

Deno.test("por debajo del primer escalón no se paga nada extra", () => {
  // Con 1 y 2 referidos el cliente igual cobró sus 400 puntos por cada uno — lo que no hay
  // todavía es premio de escalera.
  assertEquals(nextReferralMilestone(0, 0), null);
  assertEquals(nextReferralMilestone(1, 0), null);
  assertEquals(nextReferralMilestone(2, 0), null);
});

Deno.test("al llegar al escalón exacto se paga ese escalón", () => {
  assertEquals(nextReferralMilestone(3, 0)?.count, 3);
  assertEquals(nextReferralMilestone(5, 3)?.count, 5);
  assertEquals(nextReferralMilestone(10, 5)?.count, 10);
});

Deno.test("un escalón ya pagado no se vuelve a pagar", () => {
  // El modo de fallo más caro: cada referido nuevo dispara este cálculo, así que sin este
  // corte el cliente cobraría el mismo premio en el 4.º, el 6.º, el 7.º...
  assertEquals(nextReferralMilestone(3, 3), null);
  assertEquals(nextReferralMilestone(4, 3), null);
  assertEquals(nextReferralMilestone(9, 5), null);
  assertEquals(nextReferralMilestone(30, 10), null);
});

Deno.test("si se saltó un escalón, cobra el más alto que le corresponde", () => {
  // Pasa de verdad: si la llamada del 3.º falla (red, timeout), el cliente llega al 5.º con
  // el escalón 3 sin pagar. Se le da el 5, no el 3 — el 3 ya no describe dónde está.
  assertEquals(nextReferralMilestone(6, 0)?.count, 5);
  assertEquals(nextReferralMilestone(12, 0)?.count, 10);
  assertEquals(nextReferralMilestone(12, 3)?.count, 10);
});

Deno.test("pasado el último escalón ya no hay premios de escalera", () => {
  // Los 400 puntos por referido siguen cayendo — eso lo hace finalize_order_customer_update,
  // no esta función. Acá solo se acaba la escalera.
  assertEquals(nextReferralMilestone(11, 10), null);
  assertEquals(nextReferralMilestone(500, 10), null);
});

Deno.test("datos basura de la base terminan en 'no pagar', nunca en un premio inventado", () => {
  assertEquals(nextReferralMilestone(null as never, 0), null);
  assertEquals(nextReferralMilestone(undefined as never, 0), null);
  assertEquals(nextReferralMilestone(NaN, 0), null);
  assertEquals(nextReferralMilestone(-5, 0), null);
  // Un `referral_milestone_granted` nulo se trata como 0, que es lo que significa.
  assertEquals(nextReferralMilestone(3, null as never)?.count, 3);
});

Deno.test("una escalera vacía o rota no revienta ni regala puntos", () => {
  assertEquals(nextReferralMilestone(10, 0, []), null);
  assertEquals(nextReferralMilestone(10, 0, null as never), null);
  // Un escalón con 0 o menos puntos no es un premio: mandaría un push prometiendo "+0 pts".
  assertEquals(nextReferralMilestone(10, 0, [{ count: 3, points: 0, label: "nada" }]), null);
  assertEquals(nextReferralMilestone(10, 0, [{ count: 3, points: -50, label: "resta" }]), null);
});

Deno.test("cada escalón tiene etiqueta propia y puntos positivos", () => {
  // La etiqueta es lo que va dentro del push ("te llevas X: <etiqueta>"). Un escalón sin
  // ella mandaría una notificación que no dice qué se ganó.
  for (const m of REFERRAL_MILESTONES) {
    assertEquals(typeof m.label === "string" && m.label.length > 0, true, `escalón ${m.count} sin etiqueta`);
    assertEquals(m.points > 0, true, `escalón ${m.count} sin puntos`);
    assertEquals(m.count > 0, true);
  }
});

Deno.test("la escalera está ordenada y sin escalones repetidos", () => {
  // nextReferralMilestone toma el más alto que aplica, así que el orden del array no la
  // rompe — pero la PANTALLA sí lo recorre en orden para pintar la escalera, y dos
  // escalones con el mismo número dejarían dos filas idénticas y un premio inalcanzable.
  const cuentas = REFERRAL_MILESTONES.map((m) => m.count);
  assertEquals(JSON.stringify(cuentas), JSON.stringify([...cuentas].sort((a, b) => a - b)));
  assertEquals(new Set(cuentas).size, cuentas.length);
});

Deno.test("la escalera no cuesta más por cliente que el CAC más barato medido de Meta", () => {
  // El freno de dinero, escrito como prueba y no como comentario. 400 pts = un 15CM ≈ S/7.35
  // de insumo real (banda S/6.7-8 documentada en env.ts). El referidor que llega al último
  // escalón cobra 10×400 + la escalera entera; repartido entre los 10 clientes que trajo,
  // eso tiene que seguir por debajo de S/10.51, el CAC más BAJO de Meta Ads en Perú para
  // restaurantes (ver modelo/FUENTES.md). Si alguien sube un escalón hasta cruzar esa línea,
  // los referidos dejan de ser el canal barato y esta prueba lo dice antes de desplegarlo.
  const SOLES_POR_PUNTO = 7.35 / 400;
  const CAC_META_MAS_BAJO = 10.51;
  const ultimo = REFERRAL_MILESTONES[REFERRAL_MILESTONES.length - 1].count;
  const extra = REFERRAL_MILESTONES.reduce((a, m) => a + m.points, 0);
  const costePorCliente = ((ultimo * REFERRER_REWARD_POINTS) + extra) * SOLES_POR_PUNTO / ultimo;
  assertEquals(
    costePorCliente < CAC_META_MAS_BAJO,
    true,
    `la escalera cuesta S/${costePorCliente.toFixed(2)} por cliente adquirido, por encima del CAC de Meta (S/${CAC_META_MAS_BAJO})`,
  );
});
