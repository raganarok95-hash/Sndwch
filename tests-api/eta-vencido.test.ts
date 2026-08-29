// Pruebas del ETA vencido (#79), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Cuando un pedido sale EN CAMINO se le promete al cliente una VENTANA
// ("llega entre las X y las Y", ±5 min sobre eta_minutes). `etaMissed` decide cuándo esa
// promesa se rompió, y su modo de fallo no es un error: es silencio. Si el borde está mal,
// o el aviso no sale —y el cliente escribe primero, que es justo lo que se quiere evitar— o
// sale antes de tiempo tantas veces que deja de mirarse.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { etaMissed, ETA_GRACE_MINUTES } from "../supabase/functions/api/actions/orders.ts";

const AHORA = Date.parse("2026-09-10T20:00:00Z");
const MIN = 60000;
const salioHace = (m: number) => new Date(AHORA - m * MIN).toISOString();

const pedido = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  ref: "ORD-0001",
  customer_name: "Ana",
  eta_minutes: 30,
  status_changed_at: salioHace(10),
  ...over,
});

Deno.test("dentro del tiempo prometido no se avisa nada", () => {
  assertEquals(etaMissed([pedido()], AHORA).length, 0);
});

Deno.test("pasado el ETA más la ventana, se avisa y se dice por cuánto", () => {
  // 30 min prometidos + 5 de ventana = 35; salió hace 50, o sea 20 tarde sobre la promesa.
  const r = etaMissed([pedido({ status_changed_at: salioHace(50) })], AHORA);
  assertEquals(r.length, 1);
  assertEquals(r[0].ref, "ORD-0001");
  assertEquals(r[0].customerName, "Ana");
  assertEquals(r[0].lateMinutes, 20);
});

Deno.test("la ventana prometida al cliente se respeta: justo en el borde todavía no se avisa", () => {
  // Al cliente se le dijo "entre las X y las Y" (±5). Avisar antes de pasar el borde
  // superior sería avisar de algo que aún no incumple nada.
  const justoAntes = etaMissed([pedido({ status_changed_at: salioHace(30 + ETA_GRACE_MINUTES - 1) })], AHORA);
  assertEquals(justoAntes.length, 0);
  const justoDespues = etaMissed([pedido({ status_changed_at: salioHace(30 + ETA_GRACE_MINUTES) })], AHORA);
  assertEquals(justoDespues.length, 1);
});

Deno.test("sin ETA no hay promesa que romper", () => {
  for (const eta of [null, undefined, 0, -5, NaN] as (number | null | undefined)[]) {
    assertEquals(
      etaMissed([pedido({ eta_minutes: eta, status_changed_at: salioHace(600) })], AHORA).length,
      0,
      `con eta_minutes=${eta} se avisó sin haber prometido nada`,
    );
  }
});

Deno.test("sin marca de cuándo salió, no se inventa el momento", () => {
  // Suponer created_at sería fabricar el dato: un pedido programado se creó horas antes de
  // salir, y con esa cuenta TODO pedido programado saldría vencido apenas despacha.
  assertEquals(etaMissed([pedido({ status_changed_at: null })], AHORA).length, 0);
  assertEquals(etaMissed([pedido({ status_changed_at: "no-es-fecha" })], AHORA).length, 0);
});

Deno.test("sin nombre, el aviso igual sale — el cliente existe aunque falte el dato", () => {
  const r = etaMissed([pedido({ customer_name: null, status_changed_at: salioHace(90) })], AHORA);
  assertEquals(r.length, 1);
  assertEquals(r[0].customerName, "cliente");
});

Deno.test("el más atrasado va primero", () => {
  const r = etaMissed(
    [
      pedido({ id: "a", ref: "A", status_changed_at: salioHace(40) }),
      pedido({ id: "b", ref: "B", status_changed_at: salioHace(120) }),
      pedido({ id: "c", ref: "C", status_changed_at: salioHace(70) }),
    ],
    AHORA,
  );
  assertEquals(r.map((x) => x.ref).join(","), "B,C,A");
});

Deno.test("una lista vacía o nula no revienta el cron", () => {
  assertEquals(etaMissed([], AHORA).length, 0);
  assertEquals(etaMissed(null as never, AHORA).length, 0);
});
