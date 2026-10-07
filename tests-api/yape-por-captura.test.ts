// Yape confirmado por la captura (2026-10-02).
//
// POR QUÉ EXISTE. El dueño aceptó que una captura bien editada pase, a cambio de no confirmar a
// mano. Todo lo demás tiene que quedar para él: un monto que no cuadra, una operación ya usada,
// una captura de otro día, un total sobre el tope. Si la regla se afloja, se entregan pedidos que
// nadie pagó — y nada revienta. Modo de fallo: dinero en silencio.
//
// Correr con: npm run test:api
import { assertEquals } from "jsr:@std/assert@1";
const { decisionAutomatica, fechaDelComprobante, receiptChecks, parseTransferReceipt } = await import("../supabase/functions/api/actions/orders.ts");

const HOY = "2026-10-02";
const yape = { payment_method: "yape", payment_status: "pending", status: "RECIBIDO", total: 27.9 };
const leida = { amount: 27.9, opNumber: "12345678", dateText: "02 oct. 2026 - 07:15 p. m.", celularFinal: "640" };
const decide = (o: any, f: any, otras: string[] = [], tope = 80) =>
  decisionAutomatica({ checks: receiptChecks(f, Number(o.total), otras), fields: f, order: o, hoyLima: HOY, tope, numeroCobro: "930957640" });

Deno.test("todo cuadra: se confirma solo", () => {
  assertEquals(decide(yape, leida).confirmar, true);
});

Deno.test("cualquier duda queda para el dueño", () => {
  assertEquals(decide(yape, { ...leida, amount: 27.0 }).confirmar, false, "monto distinto");
  assertEquals(decide(yape, { ...leida, amount: null }).confirmar, false, "monto sin leer");
  assertEquals(decide(yape, leida, ["R-OTRO"]).confirmar, false, "operación ya usada");
  assertEquals(decide(yape, { ...leida, opNumber: null }).confirmar, false, "sin operación");
  assertEquals(decide(yape, { ...leida, dateText: "01 oct. 2026" }).confirmar, false, "de ayer");
  // Fecha ilegible no bloquea (la operación única es la protección); fecha de otro día, sí.
  assertEquals(decide(yape, { ...leida, dateText: null }).confirmar, true, "sin fecha legible");
  assertEquals(decide({ ...yape, total: 85 }, { ...leida, amount: 85 }).confirmar, false, "sobre el tope");
  assertEquals(decide({ ...yape, payment_method: "culqi" }, leida).confirmar, false, "no es Yape");
  assertEquals(decide({ ...yape, payment_status: "paid" }, leida).confirmar, false, "ya pagado");
  assertEquals(decide({ ...yape, status: "CANCELADO" }, leida).confirmar, false, "cancelado");
  assertEquals(decide(yape, { ...leida, celularFinal: "688" }).confirmar, false, "yapeado a otro celular");
  assertEquals(decide(yape, { ...leida, celularFinal: null }).confirmar, false, "celular sin leer");
});

Deno.test("la fecha de la constancia se lee en los formatos comunes", () => {
  for (const t of ["02/10/2026", "2-10-2026", "02 oct. 2026", "2 de octubre de 2026", "02 Oct 2026 19:15", "02 0ct. 2026", "02 oct, 2026"]) {
    assertEquals(fechaDelComprobante(t), HOY, t);
  }
  assertEquals(fechaDelComprobante("sin fecha"), null);
  assertEquals(fechaDelComprobante("31/02/1999"), null);
});

// Lo que Tesseract leyó de una constancia REAL de Yape (captura del dueño, 2026-10-02; el nombre
// de la persona se cambió). El «S/» sale como «7» y los asteriscos del celular como basura.
const OCR_REAL = `1:11 5, NEZR | ED
¡Yapeaste! S Compartir
710.40
Nombre Ape*
E 28 set. 2026 | () 08:49 a. m.
CÓDIGO DE SEGURIDAD o 2 7 2
DATOS DE LA TRANSACCIÓN
Nro. de celular Xxx 4% 688
Destino Yape
Nro. de operación 06058272
Y Nuevo Yapeo`;

Deno.test("una constancia real de Yape se lee entera: monto, operación, fecha y celular", () => {
  const f = parseTransferReceipt(OCR_REAL);
  assertEquals(f.opNumber, "06058272");
  assertEquals(fechaDelComprobante(f.dateText), "2026-09-28");
  assertEquals(f.celularFinal, "688");
  assertEquals(receiptChecks(f, 10.4, []).amountMatches, true, "S/ 10.40 leído como 710.40");
  assertEquals(receiptChecks(f, 710.4, []).amountMatches, true);
  assertEquals(receiptChecks(f, 11.4, []).amountMatches, false);
  // Ese yapeo fue a OTRO celular (…688) y es de otro día: no se confirma por ninguna de las dos.
  const o = { ...yape, total: 10.4 };
  const d = decisionAutomatica({ checks: receiptChecks(f, 10.4, []), fields: f, order: o, hoyLima: "2026-09-28", tope: 80, numeroCobro: "930957640" });
  assertEquals(d.confirmar, false);
  const igual = decisionAutomatica({ checks: receiptChecks(f, 10.4, []), fields: f, order: o, hoyLima: "2026-09-28", tope: 80, numeroCobro: "999999688" });
  assertEquals(igual.confirmar, true, "la misma captura, yapeada al número correcto y de hoy, sí se confirma");
});

Deno.test("el lector encuentra la fecha aunque confunda la o con un 0 o el punto con una coma", () => {
  for (const linea of ["E 02 0ct. 2026 | 02:58 p. m.", "E 02 oct, 2026 | 02:58 p. m.", "02 oct. 2026"]) {
    assertEquals(fechaDelComprobante(parseTransferReceipt("¡Yapeaste!\n710.10\n" + linea).dateText), HOY, linea);
  }
});

// Las dos capturas reales del dueño (2026-10-02), leídas en GitHub con el mismo lector del celular
// (workflow capturas-reales.yml). El nombre del titular va cambiado. La fecha sale PEGADA
// («02oct.2026»): antes no se leía y la regla de «captura de hoy» no se podía aplicar.
const REAL_0310 = ["LATE NN ZE AN [ a. | ye (1 =1 | Mé =/) a 7 1,", "\"La Es EN A.", "¡Yapeaste!", "70.10", "Nombre Apell*", "E 02oct.2026 | O 04:12 p.m.", "CÓDIGO DE SEGURIDAD", "TZ 6", "DATOS DE LA TRANSACCIÓN", "Nro. de celular A 640", "Destino Yape", "Nro. de operación 24729126"].join("\n");
Deno.test("captura real: se lee la fecha pegada y se confirma el mismo día", () => {
  const f = parseTransferReceipt(REAL_0310);
  assertEquals(fechaDelComprobante(f.dateText), "2026-10-02");
  assertEquals(f.opNumber, "24729126");
  assertEquals(f.celularFinal, "640");
  const o = { ...yape, total: 0.1 };
  const d = (hoy: string) => decisionAutomatica({ checks: receiptChecks(f, 0.1, []), fields: f, order: o, hoyLima: hoy, tope: 80, numeroCobro: "930957640" });
  assertEquals(d("2026-10-02").confirmar, true);
  // Y una captura de otro día ya no pasa: es lo que la fecha estaba para atajar.
  assertEquals(d("2026-10-05").confirmar, false);
});
