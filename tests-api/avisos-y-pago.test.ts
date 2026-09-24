// Pruebas de «Avisos» y «Cómo pagas» (Tu cuenta).
//
// POR QUÉ EXISTE. Apagar «Novedades y recordatorios» es una promesa (y, con la Ley 29733, una
// obligación): si un recordatorio se cuela igual, nada revienta, solo se incumple. Y al revés
// es peor: si «tu pedido salió» se clasifica como promo, quien apagó las promos deja de
// enterarse de su propio pedido. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { categoriaDelAviso, avisoPermitido } from "../supabase/functions/api/push.ts";
import { preferenciasValidas } from "../supabase/functions/api/actions/customer.ts";

Deno.test("los avisos del pedido son «pedido», nunca promo", () => {
  for (const t of ["sndwch-order-123", "sndwch-delivered-9", "sndwch-eta-missed-4", "sndwch-payment-confirmed-2", "sndwch-order-problem-resuelto-1", "sndwch-zona-abierta-el_porvenir"]) {
    assertEquals(categoriaDelAviso(t), "pedido", t);
  }
});

Deno.test("los recordatorios del negocio son promo", () => {
  for (const t of ["sndwch-cart-abandoned", "sndwch-lapsed-5", "sndwch-points-nudge", "sndwch-peak-almuerzo-2026-10-09", "sndwch-never-ordered-3"]) {
    assertEquals(categoriaDelAviso(t), "promo", t);
  }
});

Deno.test("un aviso sin etiqueta o desconocido cae en «pedido»: mejor de más que callar un pedido", () => {
  assertEquals(categoriaDelAviso(undefined), "pedido");
  assertEquals(categoriaDelAviso("sndwch-algo-nuevo"), "pedido");
});

Deno.test("apagar promo calla la promo y deja pasar el pedido", () => {
  const prefs = { pedido: true, promo: false };
  assertEquals(avisoPermitido(prefs, "sndwch-lapsed-5"), false);
  assertEquals(avisoPermitido(prefs, "sndwch-delivered-9"), true);
});

Deno.test("sin preferencias guardadas, todo pasa", () => {
  assertEquals(avisoPermitido(null, "sndwch-lapsed-5"), true);
});

Deno.test("preferencias: solo escribe lo que llega, y rechaza un método inventado", () => {
  assertEquals(JSON.stringify(preferenciasValidas({ preferredPayment: "yape" })), '{"preferred_payment":"yape"}');
  assertEquals(JSON.stringify(preferenciasValidas({ notifPrefs: { promo: false } })), '{"notif_prefs":{"pedido":true,"promo":false}}');
  let rechazo = false;
  try { preferenciasValidas({ preferredPayment: "plin" }); } catch { rechazo = true; }
  assertEquals(rechazo, true);
});
