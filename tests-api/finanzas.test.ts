// Las cuentas del dueño (_shared/finanzas.ts): costo real por pedido, cierre por canal, techo
// de 45% y conciliación de Culqi y Yape.
//
// PROMESA: el cierre que le llega al dueño resta el costo REAL de cada producto (del modelo),
// no un 45% plano; avisa cuando algo pasa su techo; y dice qué pago no cuadra.
// MODO DE FALLO: silencioso y en plata. Un costo plano hace que la alerta del techo no suene
// jamás; un pago de Yape sin operación o con otro monto es plata que puede no haber entrado.
//
// Correr con: npm run test:api
import {
  costoDeLinea, costoDelPedido, cierre, conciliar, canalDe, alertasDePlata, COMISION_APPS,
} from "../supabase/functions/_shared/finanzas.ts";
import { COSTOS } from "../supabase/functions/_shared/costos.ts";
import { CULQI_FEE_RATE } from "../supabase/functions/_shared/reglas.ts";
import { signaturesVigentes, unaProteinaDelArmador, panSinRecargo, unaBebida } from "./carta.ts";

function eq<T>(a: T, b: T, msg?: string) {
  if (!Object.is(a, b)) throw new Error(msg ?? `esperaba ${JSON.stringify(b)}, recibí ${JSON.stringify(a)}`);
}
function ok(c: unknown, msg: string) {
  if (!c) throw new Error(msg);
}
const cerca = (a: number, b: number) => Math.abs(a - b) < 0.011;

const SIG = signaturesVigentes().find((s) => s in COSTOS.sig)!;
const sigCosto = (COSTOS.sig as any)[SIG];
const PROT = Object.keys(COSTOS.byo).includes(unaProteinaDelArmador()) ? unaProteinaDelArmador() : Object.keys(COSTOS.byo)[0];
const PAN = panSinRecargo();
const BEB = Object.keys(COSTOS.bebida).includes(unaBebida()) ? unaBebida() : Object.keys(COSTOS.bebida)[0];

const lineaSig = (precio: number, extra: Record<string, unknown> = {}) => ({ type: "sig", sigId: SIG, size: "15", qty: 1, precio, ...extra });
const pedido = (items: unknown[], extra: Record<string, unknown> = {}) => ({
  ref: "ORD-1", total: 30, delivery_fee: 6, payment_method: "yape", payment_status: "paid", status: "ENTREGADO", origen: null, items, ...extra,
});

Deno.test("el costo de un Signature sale del modelo, por tamaño, con sus extras", () => {
  eq(costoDeLinea(lineaSig(20)).costo, sigCosto.costo["15"]);
  const conTodo = costoDeLinea(lineaSig(25, { doubleProt: true, extraSauce: true }));
  ok(cerca(conTodo.costo!, sigCosto.costo["15"] + sigCosto.doble["15"] + COSTOS.salsaExtra["15"]), "doble y salsa suman su costo");
});

Deno.test("el armador se costea por proteína y pan; la bebida por su botella", () => {
  const b = costoDeLinea({ type: "byo", prot: PROT, base: PAN, size: "30", qty: 2, precio: 30 });
  eq(b.costo, (COSTOS.byo as any)[PROT].costo[PAN]["30"]);
  eq(costoDeLinea({ type: "side", code: BEB, qty: 1, precio: 6 }).costo, (COSTOS.bebida as any)[BEB]);
});

Deno.test("lo que el modelo no sabe costear queda SIN COSTO, no con un 45% inventado", () => {
  const l = costoDeLinea({ type: "sig", sigId: "SIG99", size: "15", qty: 1, precio: 20 });
  eq(l.costo, null);
  const c = cierre([pedido([{ type: "sig", sigId: "SIG99", size: "15", qty: 3, precio: 20 }])]);
  eq(c.unidadesSinCosto, 3);
  eq(c.costo, 0);
  ok(alertasDePlata(c).some((a) => a.includes("sin costo")), "el correo lo dice");
});

Deno.test("la contribución resta costo y comisión de tarjeta; el envío no es venta", () => {
  const card = costoDelPedido(pedido([lineaSig(24)], { payment_method: "card" }));
  eq(card.comida, 24);
  eq(card.comision, Math.round(30 * CULQI_FEE_RATE * 100) / 100, "Culqi cobra sobre todo lo que pasó por la tarjeta");
  ok(cerca(card.contribucion, 24 - sigCosto.costo["15"] - 30 * CULQI_FEE_RATE), "contribución");
  // Yape no paga comisión: cargársela le bajaría el margen sin razón.
  eq(costoDelPedido(pedido([lineaSig(24)])).comision, 0);
});

Deno.test("solo cuentan los pedidos pagados y no cancelados", () => {
  const c = cierre([
    pedido([lineaSig(24)]),
    pedido([lineaSig(24)], { payment_status: "pending" }),
    pedido([lineaSig(24)], { status: "CANCELADO" }),
  ]);
  eq(c.pedidos, 1);
});

Deno.test("el margen se separa por canal: web contra apps", () => {
  eq(canalDe("rappi-trujillo"), "rappi");
  eq(canalDe("PedidosYa"), "pedidosya");
  eq(canalDe("ig-reel"), "web");
  const c = cierre([pedido([lineaSig(24)]), pedido([lineaSig(24)], { origen: "rappi" }), pedido([lineaSig(24)], { origen: "pedidosya" })]);
  const rappi = c.porCanal.find((k) => k.canal === "rappi")!;
  const web = c.porCanal.find((k) => k.canal === "web")!;
  ok(cerca(rappi.comision, 24 * COMISION_APPS.rappi!), "Rappi resta su comisión");
  ok(rappi.contribucion < web.contribucion, "un pedido de Rappi deja menos que uno de la web");
  const pya = c.porCanal.find((k) => k.canal === "pedidosya")!;
  ok(cerca(pya.comision, 24 * COMISION_APPS.pedidosya!), "PedidosYa resta su comisión");
  ok(pya.contribucion < web.contribucion, "un pedido de PedidosYa deja menos que uno de la web");
});

Deno.test("un producto que pasa su techo de costo dispara la alerta; uno sano no", () => {
  // Inyectado: el mismo Signature vendido a un precio al que el costo pasa el 45%.
  const precioMalo = Math.floor(sigCosto.costo["15"] / 0.5);
  const malo = cierre([pedido([lineaSig(precioMalo)])]);
  eq(malo.sobreTecho.length, 1, "pasa el techo");
  ok(alertasDePlata(malo)[0].includes(SIG), "la alerta nombra el producto");
  const sano = cierre([pedido([lineaSig(Math.ceil(sigCosto.costo["15"] / 0.3))])]);
  eq(sano.sobreTecho.length, 0, "no grita en falso");
});

Deno.test("los descuentos salen del margen: el costo se mide contra el precio de carta", () => {
  // Pagó 10 de comida por un sándwich de carta 20: el costo es el mismo, el descuento son 10.
  const c = cierre([pedido([lineaSig(20)], { total: 16, delivery_fee: 6 })]);
  eq(c.descuentos, 10);
  eq(c.costoPct, Math.round((sigCosto.costo["15"] / 20) * 1000) / 1000);
});

Deno.test("conciliación: Yape sin operación, con otro monto o repetido se avisa", () => {
  const ahora = Date.parse("2026-11-20T20:00:00Z");
  const r = conciliar([
    pedido([], { ref: "A", total: 24.9, receipt_op_number: "111", receipt_ocr: { amount: 24.9 } }),
    pedido([], { ref: "B", total: 24.9, receipt_op_number: null }),
    pedido([], { ref: "C", total: 24.9, receipt_op_number: "333", receipt_ocr: { amount: 23.9 } }),
    pedido([], { ref: "D", total: 24.9, receipt_op_number: "444", receipt_ocr: { duplicada: true } }),
    pedido([], { ref: "E", total: 18, payment_status: "pending", created_at: "2026-11-20T19:00:00Z" }),
    pedido([], { ref: "F", total: 18, payment_status: "pending", created_at: "2026-11-20T19:50:00Z" }),
  ], [], ahora);
  const de = (ref: string) => r.avisos.filter((a) => a.startsWith(ref + ":")).length;
  eq(de("A"), 0, "el que cuadra no se avisa");
  eq(de("B"), 1);
  eq(de("C"), 1);
  eq(de("D"), 1);
  eq(de("E"), 1, "pendiente hace una hora");
  eq(de("F"), 0, "pendiente hace 10 min todavía no");
  eq(r.yapePedidos, 4);
  ok(cerca(r.yapeEsperado, 24.9 * 4), "lo que debe verse en el Yape");
});

Deno.test("conciliación: Culqi neto esperado y cobros sin pedido", () => {
  const r = conciliar([pedido([], { ref: "T", total: 40, payment_method: "card", payment_id: "chr_1" }), pedido([], { ref: "U", total: 10, payment_method: "card", payment_id: null })], [{ ref: "V" }]);
  ok(cerca(r.culqiNetoEsperado, 50 * (1 - CULQI_FEE_RATE)), "neto");
  ok(r.avisos.some((a) => a.startsWith("U:")), "tarjeta sin cobro anotado");
  ok(r.avisos.some((a) => a.startsWith("V:")), "cobro sin pedido");
  ok(!r.avisos.some((a) => a.startsWith("T:")), "el que cuadra no");
});
