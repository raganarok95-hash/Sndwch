// Yape confirmado por la captura (2026-10-02).
//
// POR QUÉ EXISTE. El dueño aceptó que una captura bien editada pase, a cambio de no confirmar a
// mano. Todo lo demás tiene que quedar para él: un monto que no cuadra, una operación ya usada,
// una captura de otro día, un total sobre el tope. Si la regla se afloja, se entregan pedidos que
// nadie pagó — y nada revienta. Modo de fallo: dinero en silencio.
//
// Correr con: npm run test:api
import { assertEquals } from "jsr:@std/assert@1";
const { decisionAutomatica, fechaDelComprobante, receiptChecks } = await import("../supabase/functions/api/actions/orders.ts");

const HOY = "2026-10-02";
const yape = { payment_method: "yape", payment_status: "pending", status: "RECIBIDO", total: 27.9 };
const leida = { amount: 27.9, opNumber: "12345678", dateText: "02 oct. 2026 - 07:15 p. m." };
const decide = (o: any, f: any, otras: string[] = [], tope = 80) =>
  decisionAutomatica({ checks: receiptChecks(f, Number(o.total), otras), fields: f, order: o, hoyLima: HOY, tope });

Deno.test("todo cuadra: se confirma solo", () => {
  assertEquals(decide(yape, leida).confirmar, true);
});

Deno.test("cualquier duda queda para el dueño", () => {
  assertEquals(decide(yape, { ...leida, amount: 27.0 }).confirmar, false, "monto distinto");
  assertEquals(decide(yape, { ...leida, amount: null }).confirmar, false, "monto sin leer");
  assertEquals(decide(yape, leida, ["R-OTRO"]).confirmar, false, "operación ya usada");
  assertEquals(decide(yape, { ...leida, opNumber: null }).confirmar, false, "sin operación");
  assertEquals(decide(yape, { ...leida, dateText: "01 oct. 2026" }).confirmar, false, "de ayer");
  assertEquals(decide(yape, { ...leida, dateText: null }).confirmar, false, "sin fecha");
  assertEquals(decide({ ...yape, total: 85 }, { ...leida, amount: 85 }).confirmar, false, "sobre el tope");
  assertEquals(decide({ ...yape, payment_method: "culqi" }, leida).confirmar, false, "no es Yape");
  assertEquals(decide({ ...yape, payment_status: "paid" }, leida).confirmar, false, "ya pagado");
  assertEquals(decide({ ...yape, status: "CANCELADO" }, leida).confirmar, false, "cancelado");
});

Deno.test("la fecha de la constancia se lee en los formatos comunes", () => {
  for (const t of ["02/10/2026", "2-10-2026", "02 oct. 2026", "2 de octubre de 2026", "02 Oct 2026 19:15"]) {
    assertEquals(fechaDelComprobante(t), HOY, t);
  }
  assertEquals(fechaDelComprobante("sin fecha"), null);
  assertEquals(fechaDelComprobante("31/02/1999"), null);
});
