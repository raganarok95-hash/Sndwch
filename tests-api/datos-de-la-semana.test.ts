// LA SEMANA EN NÚMEROS PARA EL EQUIPO (2026-10-16).
//
// El ciclo del lunes y el cierre del domingo deciden qué pieza sigue, qué se corta y cuánto pauta
// se pone con `resumirSemana()`. Modo de fallo: SILENCIO, y cuesta plata: contar un pedido
// cancelado o sin pagar, o contar como «nuevo» a un cliente que ya había pedido, abarata el costo
// por cliente y deja seguir un anuncio que pierde plata. Y el archivo va a un repo PÚBLICO: si se
// cuela un teléfono o la venta total, se publica.
//
// Correr con: npm run test:api
import { resumirSemana, lunesDe } from "../scripts/datos/resumen.mjs";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
const pagado = (tel: string, origen: string | null, created_at = "2026-10-21T17:30:00Z", extra = {}) =>
  ({ created_at, total: 22.9, payment_status: "paid", status: "ENTREGADO", origen, customer_phone: tel, group_code: null, recurring_id: null, ...extra });
const base = { visitas: [] as any[], gasto: [] as any[], historia: [] as any[], desde: "2026-10-19", apertura: "2026-10-20" };

Deno.test("un pedido cancelado o sin pagar no cuenta", () => {
  const r = resumirSemana({ ...base, pedidos: [
    pagado("999111222", "meta-philly"),
    pagado("999111333", "meta-philly", undefined, { status: "CANCELADO" }),
    pagado("999111444", "meta-philly", undefined, { payment_status: "pending" }),
  ] });
  assertEquals(r.pedidos, 1);
  assertEquals(r.clientesNuevos, 1);
});

Deno.test("quien ya había pedido no es nuevo, aunque escriba su número distinto", () => {
  const r = resumirSemana({ ...base,
    historia: [{ customer_phone: "+51 999 111 222", payment_status: "paid", status: "ENTREGADO" }],
    pedidos: [pagado("999111222", "meta-philly"), pagado("51999111222", "meta-philly", "2026-10-22T17:30:00Z")] });
  assertEquals(r.clientesNuevos, 0);
  assertEquals(r.clientesQueVuelven, 1);
  assertEquals(r.pedidos, 2);
});

Deno.test("un cliente nuevo que pide dos veces en la semana cuenta una vez", () => {
  const r = resumirSemana({ ...base, pedidos: [pagado("999111222", "ig-dm"), pagado("999111222", "ig-dm", "2026-10-23T23:00:00Z")] });
  assertEquals(r.clientesNuevos, 1);
  assertEquals(r.porOrigen[0], { origen: "ig-dm", visitas: 0, pedidos: 2, nuevos: 1, conversion: null });
});

Deno.test("la conversión y el costo por cliente nuevo de Meta salen de su enlace", () => {
  const r = resumirSemana({ ...base,
    visitas: [{ dia: "2026-10-21", src: "meta-philly", visitas: 6 }, { dia: "2026-10-22", src: "meta-philly", visitas: 4 }],
    gasto: [{ spend_date: "2026-10-21", platform: "meta", amount: 30 }, { spend_date: "2026-10-22", platform: "meta", amount: 20 }],
    pedidos: [pagado("999111222", "meta-philly"), pagado("999111333", "meta-philly"), pagado("999111444", null)] });
  const philly = r.porOrigen.find((f: any) => f.origen === "meta-philly");
  assertEquals(philly.conversion, 0.2);
  assertEquals(r.gastoDePauta, { meta: 50 });
  assertEquals(r.costoPorClienteNuevoMeta, 25);
  assertEquals(r.porOrigen.find((f: any) => f.origen === "directo").pedidos, 1);
});

Deno.test("la hora y el día son los de Lima", () => {
  // 17:30 UTC del miércoles = 12:30 en Lima; 03:00 UTC del sábado = 22:00 del viernes en Lima.
  const r = resumirSemana({ ...base, pedidos: [pagado("999111222", null), pagado("999111333", null, "2026-10-24T03:00:00Z")] });
  assertEquals(r.porHora, { 12: 1, 22: 1 });
  assertEquals(r.porDia, { mie: 1, vie: 1 });
});

Deno.test("la semana que termina se encuentra aunque GitHub corra tarde", () => {
  assertEquals(lunesDe("2026-10-26T04:15:00Z"), "2026-10-19"); // domingo 23:15 de Lima
  assertEquals(lunesDe(new Date(Date.parse("2026-10-26T13:15:00Z") - 12 * 3600e3).toISOString()), "2026-10-19"); // 9 h tarde
});

Deno.test("antes de abrir, la semana se marca como prueba", () => {
  assertEquals(resumirSemana({ ...base, desde: "2026-10-12", pedidos: [] }).prueba, true);
  assertEquals(resumirSemana({ ...base, pedidos: [] }).prueba, false);
});

Deno.test("al repo público no va un teléfono ni la venta total", () => {
  const r = resumirSemana({ ...base, pedidos: [pagado("999111222", "meta-philly"), pagado("988777666", "wa")] });
  const texto = JSON.stringify(r);
  assertEquals(/999111222|988777666/.test(texto), false, "se coló un teléfono");
  assertEquals(["ventas", "total", "ingresos", "utilidad"].some((k) => k in r), false, "se coló la venta total");
});
