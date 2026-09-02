// Pruebas de la detección de comprobante duplicado (#29), sobre el código real del servidor.
//
// POR QUÉ EXISTE. El comprobante de Yape/Plin es una captura que sube el cliente, y el admin
// da el pago por bueno MIRÁNDOLA. Hasta ahora nada comparaba una captura contra las
// anteriores: la misma imagen respaldaba tres pedidos y el único filtro era que el dueño se
// acordara de haberla visto. Es dinero: cada falso "pagado" es un sándwich regalado.
//
// Los dos modos de fallo importan por igual. Si el hash cambia con la misma imagen, el aviso
// no sale nunca y volvemos a donde estábamos. Si el aviso salta con imágenes distintas, el
// dueño aprende a ignorarlo — y entonces tampoco lo mira el día que es real.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { receiptHash, duplicateReceiptRefs } from "../supabase/functions/api/actions/orders.ts";

const bytes = (...n: number[]) => Uint8Array.from(n);

Deno.test("la misma imagen da siempre el mismo hash", () => {
  return Promise.all([receiptHash(bytes(1, 2, 3, 4)), receiptHash(bytes(1, 2, 3, 4))])
    .then(([a, b]) => assertEquals(a, b));
});

Deno.test("un byte distinto da un hash distinto", async () => {
  const a = await receiptHash(bytes(1, 2, 3, 4));
  const b = await receiptHash(bytes(1, 2, 3, 5));
  assertEquals(a === b, false);
});

Deno.test("el hash mira la VISTA, no el buffer de atrás", async () => {
  // Un Uint8Array puede ser una ventana sobre un buffer más grande. Si se hasheara el buffer
  // entero, el mismo archivo daría hashes distintos según cómo se decodificó — y el
  // duplicado no se detectaría jamás, en silencio.
  const grande = Uint8Array.from([9, 9, 1, 2, 3, 4, 9, 9]);
  const vista = grande.subarray(2, 6);
  assertEquals(await receiptHash(vista), await receiptHash(bytes(1, 2, 3, 4)));
});

Deno.test("es un SHA-256 en hex, no un número ni un base64", async () => {
  const h = await receiptHash(bytes(1, 2, 3));
  assertEquals(h.length, 64);
  assertEquals(/^[0-9a-f]{64}$/.test(h), true);
});

Deno.test("una imagen vacía no revienta ni devuelve un hash falso", async () => {
  const h = await receiptHash(new Uint8Array(0));
  assertEquals(/^[0-9a-f]{64}$/.test(h), true);
});

Deno.test("el pedido que sube su propio comprobante no se acusa a sí mismo", () => {
  // Volver a subir la captura del MISMO pedido es lo más normal del mundo (la primera salió
  // borrosa). Acusarlo sería el falso positivo más frecuente de todos.
  assertEquals(duplicateReceiptRefs([{ ref: "ORD-1" }], "ORD-1").length, 0);
});

Deno.test("nombra los otros pedidos que ya usaron esa captura", () => {
  // El aviso tiene que DECIR cuál: lo primero que el dueño va a hacer es abrirlo y comparar.
  const refs = duplicateReceiptRefs([{ ref: "ORD-1" }, { ref: "ORD-2" }, { ref: "ORD-3" }], "ORD-3");
  assertEquals(refs.join(","), "ORD-1,ORD-2");
});

Deno.test("una captura nunca vista no genera ningún aviso", () => {
  assertEquals(duplicateReceiptRefs([], "ORD-9").length, 0);
  assertEquals(duplicateReceiptRefs(null as never, "ORD-9").length, 0);
});

Deno.test("filas rotas de la base no producen un aviso con el pedido vacío", () => {
  // Un aviso que dice "es idéntico al de " (sin ref) es peor que ninguno: manda a buscar
  // algo que no existe.
  const refs = duplicateReceiptRefs([{ ref: "" } as never, { ref: null } as never, { ref: "ORD-7" }], "ORD-9");
  assertEquals(refs.join(","), "ORD-7");
});
