// Pruebas de la lectura del comprobante (#28), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Este parser lee DINERO de un texto sucio salido de un OCR, y sus dos
// formas de fallar son opuestas y las dos caras:
//   · agarrar el número equivocado (un saldo, una comisión, un número de operación) y
//     decirle al dueño que el monto cuadra cuando no cuadra,
//   · no reconocer nada y dejarlo sin la ayuda justo en los pedidos raros.
//
// Y hay una tercera que no es del parser sino del encuadre, y por eso está fijada acá: esto
// NUNCA confirma un pago. Una captura se edita en dos minutos. Lo único que hace es los
// chequeos que el dueño haría a ojo.
//
// ⚠ Los rótulos son best-effort: no se pudo verificar contra una constancia real de Yape al
// escribirlo (ver P20 en docs/PENDIENTE_DEL_DUENO.md). Por eso las pruebas cubren varias
// formas de decir lo mismo, y el caso de "no reconocí nada" es tan importante como el resto.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { parseTransferReceipt, receiptChecks } from "../supabase/functions/api/actions/orders.ts";

// ── El monto ───────────────────────────────────────────────────────────────────────────

Deno.test("lee el monto pegado al símbolo de soles", () => {
  assertEquals(parseTransferReceipt("Yapeaste S/ 26.90 a SND//WCH").amount, 26.9);
  assertEquals(parseTransferReceipt("Monto S/26.90").amount, 26.9);
  assertEquals(parseTransferReceipt("Total: S/. 26.90").amount, 26.9);
  assertEquals(parseTransferReceipt("PEN 26.90").amount, 26.9);
});

Deno.test("acepta la coma decimal, que es como escribe medio Perú", () => {
  assertEquals(parseTransferReceipt("S/ 26,90").amount, 26.9);
});

Deno.test("NO toma un número suelto como monto", () => {
  // Un número de operación de 8 dígitos se leería como S/12345678 y el veredicto diría que
  // el monto no cuadra en todos los pedidos — la forma más rápida de que se ignore el aviso.
  assertEquals(parseTransferReceipt("Operacion 12345678 exitosa").amount, null);
  assertEquals(parseTransferReceipt("26.90").amount, null);
});

Deno.test("con varias cifras se queda con la mayor, que es el monto enviado", () => {
  // En una constancia suele aparecer también una comisión o un saldo. Quedarse con la
  // primera cifra tomaría cualquiera de esas.
  const r = parseTransferReceipt("Comision S/ 0.00 Monto S/ 26.90 Saldo S/ 12.50");
  assertEquals(r.amount, 26.9);
});

Deno.test("un monto con separador de miles no se lee mil veces menor", () => {
  assertEquals(parseTransferReceipt("S/ 1,250.00").amount, 1250);
  assertEquals(parseTransferReceipt("S/ 1.250,00").amount, 1250);
});

// ── El número de operación ─────────────────────────────────────────────────────────────

Deno.test("lee el número de operación con varios rótulos", () => {
  assertEquals(parseTransferReceipt("N° de operación 01234567").opNumber, "01234567");
  assertEquals(parseTransferReceipt("Nro. de operacion: 987654321").opNumber, "987654321");
  assertEquals(parseTransferReceipt("Código de operación 55512345").opNumber, "55512345");
  assertEquals(parseTransferReceipt("Constancia 40012345").opNumber, "40012345");
});

Deno.test("NO agarra el número más largo del texto como operación", () => {
  // Un teléfono o una fecha se colarían como número de operación, y entonces dos pedidos del
  // mismo cliente parecerían usar la misma transferencia — un falso positivo grave.
  assertEquals(parseTransferReceipt("Enviado a 987654321 el 03/09/2026").opNumber, null);
});

Deno.test("un texto sin nada reconocible devuelve todo null, no ceros", () => {
  // Cero sería un dato inventado, y sobre un dato inventado el dueño confirmaría un pago.
  const r = parseTransferReceipt("qwjkeh askdj 8888");
  assertEquals(r.amount, null);
  assertEquals(r.opNumber, null);
  assertEquals(r.dateText, null);
});

Deno.test("un texto vacío o basura no revienta el parser", () => {
  assertEquals(parseTransferReceipt("").amount, null);
  assertEquals(parseTransferReceipt(null as never).opNumber, null);
  assertEquals(parseTransferReceipt(undefined as never).dateText, null);
});

// ── La fecha ───────────────────────────────────────────────────────────────────────────

Deno.test("la fecha se guarda como TEXTO, tal como se leyó", () => {
  // Interpretar 03/09 como marzo o setiembre según el runtime metería un error de meses en
  // el dato que existe justamente para detectar comprobantes viejos.
  assertEquals(parseTransferReceipt("03/09/2026 - 14:32").dateText, "03/09/2026");
  assertEquals(parseTransferReceipt("Fecha 3 set 2026").dateText, "3 set 2026");
});

// ── El veredicto ───────────────────────────────────────────────────────────────────────

Deno.test("monto que cuadra y sin duplicado: ok", () => {
  const c = receiptChecks({ amount: 26.9, opNumber: "111", dateText: null }, 26.9, []);
  assertEquals(c.verdict, "ok");
  assertEquals(c.amountMatches, true);
});

Deno.test("monto que no cuadra: revisar, con los dos números a la vista", () => {
  const c = receiptChecks({ amount: 20, opNumber: "111", dateText: null }, 26.9, []);
  assertEquals(c.verdict, "revisar");
  assertEquals(c.amountRead, 20);
  assertEquals(c.expected, 26.9);
});

Deno.test("tolera un céntimo de diferencia por el redondeo del OCR", () => {
  // El total lleva decimales desde los precios .90, y el OCR puede leer una coma por punto.
  assertEquals(receiptChecks({ amount: 26.91, opNumber: null, dateText: null }, 26.9, []).verdict, "ok");
  assertEquals(receiptChecks({ amount: 26.8, opNumber: null, dateText: null }, 26.9, []).verdict, "revisar");
});

Deno.test("la misma operación en otro pedido manda sobre el monto que cuadra", () => {
  // Aunque el monto sea correcto, una transferencia no puede respaldar dos pedidos.
  const c = receiptChecks({ amount: 26.9, opNumber: "111", dateText: null }, 26.9, ["ORD-7"]);
  assertEquals(c.verdict, "revisar");
  assertEquals(c.duplicateOpRefs.join(","), "ORD-7");
});

Deno.test("si no se leyó el monto, el veredicto lo DICE en vez de aprobar", () => {
  // "Sin lectura" y "todo bien" no son lo mismo. Tratarlos igual haría que el dueño
  // confirmara pagos que nadie miró.
  const c = receiptChecks({ amount: null, opNumber: null, dateText: null }, 26.9, []);
  assertEquals(c.verdict, "sin_lectura");
  assertEquals(c.amountMatches, null);
});

Deno.test("el pedido no se acusa a sí mismo por su propia operación", () => {
  const c = receiptChecks({ amount: 26.9, opNumber: "111", dateText: null }, 26.9, []);
  assertEquals(c.duplicateOpRefs.length, 0);
});
