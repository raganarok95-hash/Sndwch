// Pruebas de «Algo salió mal» (pantalla 35): el plazo de 48 h y la hora de respuesta.
//
// POR QUÉ EXISTE. El plazo es el de los Términos: si el código deja reportar menos tiempo,
// incumple lo que dice el texto legal; si deja más, promete algo que el texto no respalda.
// Y «Sando responde antes de las X» es una promesa de plazo: si la hora sale de madrugada o
// en el pasado, se rompe sin ningún error. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { puedeReportar, respondeAntesDe, REPORTE_PLAZO_HORAS } from "../supabase/functions/api/actions/problems.ts";

const H = 3600000;
const ENTREGA = Date.parse("2026-10-09T01:00:00Z"); // 8:00 p.m. en Lima

Deno.test("el plazo para reportar es el de los Términos: 48 horas", () => {
  assertEquals(REPORTE_PLAZO_HORAS, 48);
});

Deno.test("se puede reportar justo hasta las 48 h, y no un minuto después", () => {
  const iso = new Date(ENTREGA).toISOString();
  assertEquals(puedeReportar(iso, ENTREGA + 3 * H), true);
  assertEquals(puedeReportar(iso, ENTREGA + 48 * H), true);
  assertEquals(puedeReportar(iso, ENTREGA + 48 * H + 60000), false);
});

Deno.test("sin hora de entrega no se adivina: no se puede reportar", () => {
  assertEquals(puedeReportar(null, ENTREGA), false);
  assertEquals(puedeReportar("", ENTREGA), false);
});

const horaLima = (iso: string) => new Date(Date.parse(iso) - 5 * H).getUTCHours();

Deno.test("de día se promete responder hoy antes de las 9 p.m.", () => {
  const ahora = Date.parse("2026-10-08T18:00:00Z"); // 1:00 p.m. en Lima
  const r = respondeAntesDe(ahora);
  assertEquals(horaLima(r), 21);
  assertEquals(Date.parse(r) > ahora, true);
});

Deno.test("de noche nunca promete de madrugada: pasa a mañana a la 1 p.m.", () => {
  const ahora = Date.parse("2026-10-09T02:30:00Z"); // 9:30 p.m. en Lima
  const r = respondeAntesDe(ahora);
  assertEquals(horaLima(r), 13);
  assertEquals(Date.parse(r) - ahora > 12 * H, true);
});

Deno.test("la hora prometida nunca queda en el pasado", () => {
  for (let h = 0; h < 24; h++) {
    const ahora = Date.parse("2026-10-08T05:00:00Z") + h * H;
    assertEquals(Date.parse(respondeAntesDe(ahora)) > ahora, true, `a las ${h}:00 de Lima`);
  }
});
