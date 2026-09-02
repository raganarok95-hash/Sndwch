// Pruebas de la alerta de rechazo de tarjeta alto (#32), sobre el código real.
//
// POR QUÉ EXISTE. Esta alerta tiene dos formas de fallar y ninguna se ve como un error:
// suena por nada (y a la tercera vez el dueño deja de mirarla, justo antes del día que sí
// importa), o no suena mientras los pagos con tarjeta están rotos y se pierden ventas una
// por una sin que nadie lo note. El umbral y el mínimo de volumen son todo el diseño.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { declineStats } from "../supabase/functions/api/actions/admin.ts";

const rechazo = (msg?: string) => ({ detail: { event: "culqi-rejected", ...(msg ? { culqi: { user_message: msg } } : {}) } });
const exito = () => ({ detail: { event: "charge-succeeded" } });
const rep = (n: number, f: () => unknown) => Array.from({ length: n }, f);

Deno.test("cobros sanos no disparan nada", () => {
  const s = declineStats([...rep(9, exito), rechazo()]);
  assertEquals(s.total, 10);
  assertEquals(s.rejected, 1);
  assertEquals(s.alert, false);
});

Deno.test("la mitad rechazada con volumen suficiente sí dispara", () => {
  const s = declineStats([...rep(5, exito), ...rep(5, () => rechazo("Tarjeta no permite compras por internet"))]);
  assertEquals(s.rejected, 5);
  assertEquals(s.rate, 0.5);
  assertEquals(s.alert, true);
  assertEquals(s.reasons[0], "Tarjeta no permite compras por internet");
});

Deno.test("un rechazo de un solo intento NO es una alarma", () => {
  // 100% de rechazo con 1 intento es casi siempre una tarjeta sin fondos. Avisar acá
  // enseñaría al dueño a ignorar esta alerta antes de que signifique algo.
  const s = declineStats([rechazo()]);
  assertEquals(s.rate, 1);
  assertEquals(s.alert, false);
});

Deno.test("el mínimo de volumen es un borde, no una sugerencia", () => {
  // 4 intentos, todos rechazados: por debajo del mínimo, no alerta.
  assertEquals(declineStats(rep(4, () => rechazo())).alert, false);
  // 5, el mínimo exacto: sí.
  assertEquals(declineStats(rep(5, () => rechazo())).alert, true);
});

Deno.test("un fallo de RED con Culqi no cuenta como tarjeta rechazada", () => {
  // 'culqi-fetch-failed' es la conexión entre nosotros y Culqi, no una tarjeta. Mezclarlos
  // convertiría un corte de red en "tus clientes no pueden pagar", que manda a revisar el
  // lugar equivocado — y encima el porcentaje saldría inflado.
  const s = declineStats([...rep(6, () => ({ detail: { event: "culqi-fetch-failed" } })), ...rep(6, exito)]);
  assertEquals(s.total, 6);
  assertEquals(s.rejected, 0);
  assertEquals(s.alert, false);
});

Deno.test("eventos que no son de cobro se ignoran", () => {
  const s = declineStats([{ detail: { event: "otra-cosa" } }, { detail: null }, {}, ...rep(3, exito)]);
  assertEquals(s.total, 3);
  assertEquals(s.alert, false);
});

Deno.test("los motivos no se repiten y se acotan a tres", () => {
  // El cuerpo del push muestra el motivo: cinco veces "Fondos insuficientes" no aporta más
  // que una, y llenaría la notificación dejando fuera lo demás.
  const s = declineStats([
    ...rep(3, () => rechazo("Fondos insuficientes")),
    rechazo("Tarjeta vencida"),
    rechazo("Rechazada por el banco"),
    rechazo("Excede el límite"),
  ]);
  assertEquals(s.reasons.length, 3);
  assertEquals(s.reasons[0], "Fondos insuficientes");
});

Deno.test("el umbral se puede mover sin tocar el cálculo", () => {
  const filas = [...rep(7, exito), ...rep(3, () => rechazo())];
  assertEquals(declineStats(filas).alert, false);
  assertEquals(declineStats(filas, { threshold: 0.25 }).alert, true);
});

Deno.test("sin datos no hay división por cero ni alarma", () => {
  const s = declineStats([]);
  assertEquals(s.total, 0);
  assertEquals(s.rate, 0);
  assertEquals(s.alert, false);
  assertEquals(declineStats(null as never).alert, false);
});
