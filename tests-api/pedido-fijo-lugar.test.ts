// Pruebas del LUGAR APARTADO del pedido fijo (franja.ts, capacidad.ts) y de cómo se reconoce
// «el mismo pedido» (customer.ts).
//
// POR QUÉ EXISTE. Todo esto falla en silencio. Un lugar que no se suelta le quita una venta a
// otro sin que nada lo diga; uno que se aparta sin hábito probado cierra una hora por una
// intención; un aviso que promete «guardado hasta las 12:00» cuando ya se soltó rompe la
// promesa justo cuando el cliente decidió. Ninguno lanza una excepción.
//
// Las fechas son reales: el 2026-10-01 es jueves. Lima es UTC-5, así que las 13:30 de Lima
// son las 18:30Z.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
import {
  apartadosPorHora, confirmaciones, estadoFranja, franjaSugerida, habitoDe, momentoDelAviso, proximaVez,
  textoAvisoFijo, FRANJA_DESDE_CONFIRMADOS,
} from "../supabase/functions/api/franja.ts";
import { horaLlena, siguienteLibreDelDia } from "../supabase/functions/api/capacidad.ts";
import { firmaDeItems } from "../supabase/functions/api/actions/customer.ts";
import { unSignature } from "./carta.ts";

// Un Signature vigente cualquiera: la prueba no depende de qué sándwich haya en la carta.
const UN_SIGNATURE = unSignature();

const Z = (iso: string) => Date.parse(iso);
const FIJO = { id: "f1", weekday: 4, slot: "13:30", active: true, skip_on: null };
const MIE_10AM = Z("2026-09-30T15:00:00Z"); // miércoles 10:00 Lima: ya es «el día antes»
const VEZ = Z("2026-10-01T18:30:00Z"); // jueves 13:30 Lima
const pagado = (iso: string) => ({ created_at: iso, delivery_time: null, status: "ENTREGADO", payment_status: "paid" });
const DOS_JUEVES = [pagado("2026-09-17T18:20:00Z"), pagado("2026-09-24T18:40:00Z")];

Deno.test("la próxima vez es hoy si la hora no pasó, y la semana que viene si ya pasó", () => {
  assertEquals(proximaVez(FIJO, MIE_10AM), VEZ);
  assertEquals(proximaVez(FIJO, Z("2026-10-01T19:00:00Z")), Z("2026-10-08T18:30:00Z"));
});

Deno.test("confirmaciones: días distintos PAGADOS; ni el Yape pendiente ni el cancelado prueban nada", () => {
  assertEquals(confirmaciones(DOS_JUEVES), 2);
  assertEquals(confirmaciones([pagado("2026-09-24T18:00:00Z"), pagado("2026-09-24T19:00:00Z")]), 1);
  assertEquals(confirmaciones([{ ...pagado("2026-09-17T18:00:00Z"), payment_status: "pending" }]), 0);
  assertEquals(confirmaciones([{ ...pagado("2026-09-17T18:00:00Z"), status: "CANCELADO" }]), 0);
});

Deno.test(`solo aparta lugar desde ${FRANJA_DESDE_CONFIRMADOS} confirmaciones: una intención no aparta`, () => {
  const uno = estadoFranja(FIJO, [DOS_JUEVES[0]], MIE_10AM, true);
  assertEquals(uno.estado, "faltan-confirmaciones");
  assertEquals(uno.apartada, false);
  const dos = estadoFranja(FIJO, DOS_JUEVES, MIE_10AM, true);
  assertEquals(dos.estado, "apartada");
  assertEquals(dos.apartada, true);
});

Deno.test("el lugar vale desde la medianoche del día antes y se suelta solo 90 minutos antes", () => {
  // Martes 23:59 Lima: todavía no es «el día antes».
  assertEquals(estadoFranja(FIJO, DOS_JUEVES, Z("2026-09-30T04:59:00Z"), true).estado, "aun-no-toca");
  assertEquals(estadoFranja(FIJO, DOS_JUEVES, Z("2026-09-30T05:00:00Z"), true).estado, "apartada");
  // 11:59 Lima: apartado. 12:00 Lima (90 min antes de las 13:30): suelto.
  assertEquals(estadoFranja(FIJO, DOS_JUEVES, Z("2026-10-01T16:59:00Z"), true).estado, "apartada");
  const suelta = estadoFranja(FIJO, DOS_JUEVES, Z("2026-10-01T17:00:00Z"), true);
  assertEquals(suelta.estado, "soltada");
  assertEquals(suelta.apartada, false);
});

Deno.test("«esta semana no», un pedido ya hecho o la tienda cerrada: no hay lugar apartado", () => {
  assertEquals(estadoFranja({ ...FIJO, skip_on: "2026-10-01" }, DOS_JUEVES, MIE_10AM, true).estado, "saltada");
  // Saltar OTRO día no suelta este.
  assertEquals(estadoFranja({ ...FIJO, skip_on: "2026-09-24" }, DOS_JUEVES, MIE_10AM, true).estado, "apartada");
  // Ya lo pidió para el jueves (aunque el Yape siga pendiente): su pedido ocupa la hora; seguir
  // apartando lo contaría dos veces contra el tope.
  const pedido = { created_at: "2026-09-30T15:00:00Z", delivery_time: "2026-10-01T18:30:00Z", status: "RECIBIDO", payment_status: "pending" };
  assertEquals(estadoFranja(FIJO, [...DOS_JUEVES, pedido], MIE_10AM, true).estado, "usada");
  assertEquals(estadoFranja(FIJO, DOS_JUEVES, MIE_10AM, false).estado, "cerrado");
  assertEquals(estadoFranja({ ...FIJO, active: false }, DOS_JUEVES, MIE_10AM, true).estado, "inactivo");
});

Deno.test("los apartados cuentan en su hora, salvo el de quien está pidiendo", () => {
  const f = estadoFranja(FIJO, DOS_JUEVES, MIE_10AM, true);
  const otros = [{ id: "f1", franja: f }, { id: "f2", franja: f }, { id: "f3", franja: { ...f, apartada: false } }];
  assertEquals(apartadosPorHora(otros).get("2026-10-01T18:00:00.000Z"), 2);
  assertEquals(apartadosPorHora(otros, "f1").get("2026-10-01T18:00:00.000Z"), 1);
});

Deno.test("el aviso sale una hora antes de SOLTAR si hay lugar, y una hora antes de la entrega si no", () => {
  assertEquals(momentoDelAviso(estadoFranja(FIJO, DOS_JUEVES, MIE_10AM, true)), Z("2026-10-01T16:00:00Z")); // 11:00 Lima
  assertEquals(momentoDelAviso(estadoFranja(FIJO, [], MIE_10AM, true)), Z("2026-10-01T17:30:00Z")); // 12:30 Lima
});

Deno.test("el texto del aviso promete lo que es cierto en ese momento, con horas calculadas", () => {
  const apartada = estadoFranja(FIJO, DOS_JUEVES, MIE_10AM, true);
  const a = textoAvisoFijo({ id: "f1", nombre: "The Original 15CM", franja: apartada, llena: false, alternativa: null });
  assert(a.title.includes("jueves"), a.title);
  assert(a.body.includes("hasta las 12:00") && a.body.includes("13:30"), a.body);
  assert(a.body.includes("No se cobra nada"), a.body);
  const libre = estadoFranja(FIJO, [], MIE_10AM, true);
  const alt = textoAvisoFijo({ id: "f1", nombre: "X", franja: libre, llena: true, alternativa: "14:00" });
  assert(alt.body.includes("14:00") && alt.url.includes("franja=14%3A00"), alt.url);
  assert(!/guardado/.test(alt.title + alt.body), "sin lugar apartado no puede decir «guardado»");
  const sin = textoAvisoFijo({ id: "f1", nombre: "X", franja: libre, llena: true, alternativa: null });
  assert(!sin.body.includes("confirmas en un toque"), "si no hay lugar, no puede prometer un toque");
});

Deno.test("si la hora está llena, se ofrece la siguiente media hora con lugar ese mismo día", () => {
  const pedidos = new Map([["2026-10-01T18:00:00.000Z", 10]]);
  const carga = { pedidos, apartados: new Map<string, number>() };
  assertEquals(horaLlena(carga, VEZ), true);
  assertEquals(siguienteLibreDelDia(carga, VEZ), "14:00");
  // La de las 14 también llena (9 pedidos + 1 apartado): salta a las 15.
  carga.pedidos.set("2026-10-01T19:00:00.000Z", 9);
  carga.apartados.set("2026-10-01T19:00:00.000Z", 1);
  assertEquals(siguienteLibreDelDia(carga, VEZ), "15:00");
});

Deno.test("hábito: la hora es la mediana (un pedido raro no la mueve) y el día el que más se repite", () => {
  const h = habitoDe([
    pagado("2026-09-10T00:20:00Z"), // miércoles 19:20 Lima
    pagado("2026-09-17T00:25:00Z"), // miércoles 19:25
    pagado("2026-09-24T00:10:00Z"), // miércoles 19:10
    pagado("2026-09-26T03:55:00Z"), // viernes 22:55: el raro
  ]);
  assertEquals(h.veces, 4);
  assertEquals(h.hora, "19:20");
  assertEquals(h.weekday, 3);
  assertEquals(habitoDe([]).veces, 0);
});

Deno.test("la franja sugerida cae en :00 o :30 y dentro del horario de ese día", () => {
  assertEquals(franjaSugerida(19 * 60 + 20, [11, 22]), "19:30");
  assertEquals(franjaSugerida(23 * 60, [11, 22]), "21:30");
  assertEquals(franjaSugerida(9 * 60, [11, 22]), "11:00");
  assertEquals(franjaSugerida(19 * 60, null), null);
});

Deno.test("el mismo pedido es el mismo aunque cambie el orden o venga en una línea de 2", () => {
  const sig = { type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 1 };
  const beb = { type: "side", code: "D07", qty: 1 };
  assertEquals(firmaDeItems([sig, beb]), firmaDeItems([beb, sig]));
  assertEquals(firmaDeItems([{ ...sig, qty: 2 }]), firmaDeItems([sig, sig]));
  assert(firmaDeItems([sig]) !== firmaDeItems([{ ...sig, size: "30" }]), "15 y 30 no son el mismo pedido");
  assertEquals(firmaDeItems([{ type: "sig", sigId: "NO-EXISTE", size: "15", qty: 1 }]), null);
});
