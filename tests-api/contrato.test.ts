// LA FRONTERA DEL SERVIDOR: lo que llega por la red se valida contra el contrato antes de
// tocar ninguna acción (supabase/functions/api/entrada.ts, 2026-09-24).
//
// POR QUÉ EXISTE. Tres defectos reales de este repo entraron por la frontera sin que nada los
// mirara: el id de dirección que llegaba como '12' desde un onclick y como 12 desde la base (el
// botón no hacía nada), campos que el cliente mandaba de más y que una acción terminaba
// guardando, y datos de otro tipo que recién reventaban adentro, a veces después de cobrar.
// Estas pruebas ejecutan el código real de la frontera.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
function assertThrows(fn: () => unknown, texto: string, status?: number) {
  try {
    fn();
  } catch (e) {
    const err = e as Error & { status?: number };
    if (!err.message.includes(texto)) throw new Error(`el error dice «${err.message}», esperaba «${texto}»`);
    if (status !== undefined && err.status !== status) throw new Error(`status ${err.status}, esperaba ${status}`);
    return;
  }
  throw new Error(`no lanzó; esperaba «${texto}»`);
}
import { validarEntrada } from "../supabase/functions/api/entrada.ts";
import { CONTRATO } from "../supabase/functions/_shared/contrato.ts";
import * as e from "../supabase/functions/_shared/esquema.ts";
import { unSignature } from "./carta.ts";

// Un Signature vigente cualquiera: la prueba no depende de qué sándwich haya en la carta.
const UN_SIGNATURE = unSignature();

const UUID = "0b7e3f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const ITEM = { type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 1 };

Deno.test("el id de dirección llega como texto o como número y adentro es SIEMPRE número", () => {
  const base = { token: "t", items: [ITEM], weekday: 4, slot: "19:00" };
  const desdeHtml = validarEntrada("recurring-add", { ...base, addressId: "12" }, "1.1.1.1");
  const desdeBase = validarEntrada("recurring-add", { ...base, addressId: 12 }, "1.1.1.1");
  assertEquals(desdeHtml.addressId, 12);
  assertEquals(desdeBase.addressId, 12);
  assertEquals(validarEntrada("recurring-add", { ...base, addressId: null }, "x").addressId, null);
  assertEquals(validarEntrada("recurring-add", base, "x").addressId, null);
  assertThrows(() => validarEntrada("recurring-add", { ...base, addressId: "12;drop" }, "x"), "Esa dirección no es válida.", 400);
});

Deno.test("lo que el cliente manda de más NO entra a la acción; la IP la pone el servidor", () => {
  const r = validarEntrada(
    "recurring-skip",
    { token: "t", id: UUID, deshacer: true, _ip: "8.8.8.8", customer_phone: "999", action: "recurring-skip" },
    "1.2.3.4",
  );
  assertEquals(r, { token: "t", id: UUID, deshacer: true, _ip: "1.2.3.4" });
});

Deno.test("cada campo mal formado se rechaza con el mensaje que ve el cliente, como 400", () => {
  assertThrows(() => validarEntrada("recurring-skip", { token: "t", id: "abc" }, "x"), "Falta el pedido fijo.", 400);
  assertThrows(() => validarEntrada("recurring-delete", { token: "t" }, "x"), "Falta el pedido fijo.", 400);
  const base = { token: "t", items: [ITEM], slot: "19:00" };
  assertThrows(() => validarEntrada("recurring-add", { ...base, weekday: 7 }, "x"), "Elige un día de la semana.", 400);
  assertThrows(() => validarEntrada("recurring-add", { ...base, weekday: 2.5 }, "x"), "Elige un día de la semana.", 400);
  assertThrows(() => validarEntrada("recurring-add", { ...base, weekday: 1, items: [] }, "x"), "Tu carrito está vacío", 400);
  assertThrows(() => validarEntrada("recurring-skip", { token: "t", id: UUID, deshacer: "sí" }, "x"), "sí o no", 400);
});

Deno.test("sin token NO es un 400: pasa vacío para que la sesión responda 401 y el cliente pida entrar", () => {
  assertEquals(validarEntrada("recurring-list", {}, "x"), { token: "", _ip: "x" });
});

// Desde el 2026-10-01 TODA acción registrada tiene contrato: la frontera valida la forma y
// descarta lo no declarado en las 155. Una acción nueva sin contrato recibiría el cuerpo crudo
// (validarEntrada lo deja pasar), así que esto la caza antes de salir.
Deno.test("toda acción registrada en el servidor tiene contrato", async () => {
  const idx = await Deno.readTextFile(new URL("../supabase/functions/api/index.ts", import.meta.url));
  const registradas = [...idx.matchAll(/^\s*"([a-z0-9-]+)":\s*act\w+/gm)].map((m) => m[1]);
  const sin = registradas.filter((a) => !Object.prototype.hasOwnProperty.call(CONTRATO, a));
  assertEquals(sin, []);
  assertEquals(registradas.length > 100, true);
});

Deno.test("todo esquema del contrato es un objeto que exige su token", () => {
  for (const [accion, def] of Object.entries(CONTRATO)) {
    const forma = (def.entrada as unknown as { forma?: Record<string, unknown> }).forma;
    if (!forma || !("token" in forma)) throw new Error(`${accion}: su entrada no declara el token`);
  }
});

Deno.test("los esquemas: texto recorta, entero acepta '4' pero no '4a', bandera solo sí/no", () => {
  assertEquals(e.texto().leer("  hola "), "hola");
  assertEquals(e.entero().leer("4"), 4);
  assertThrows(() => e.entero().leer("4a", "n"), "n no es válido");
  assertThrows(() => e.entero().leer("", "n"), "n no es válido");
  assertEquals(e.bandera().leer(undefined), false);
  assertThrows(() => e.bandera().leer(1, "b"), "sí o no");
  assertEquals(e.lista(e.entero()).leer(["1", 2]), [1, 2]);
  assertThrows(() => e.lista(e.entero()).leer([1, "x"], "l"), "l[1] no es válido");
});

// Los dos validadores nuevos (2026-10-01). Lo que importa es lo que NO hacen: un dato ausente no
// se convierte en 0 —el 0 es un monto y una coordenada válidos— ni un texto ausente en error.
Deno.test("textoOpcional y numero: ausente es '' y null, nunca 0 ni error", () => {
  assertEquals(e.textoOpcional().leer(undefined), "");
  assertEquals(e.textoOpcional(3).leer("  abcdef "), "abc");
  assertEquals(e.numero({ opcional: true }).leer(undefined), null);
  assertEquals(e.numero({ opcional: true }).leer(""), null);
  assertEquals(e.numero().leer("4.5"), 4.5);
  assertThrows(() => e.numero().leer(undefined, "n"), "n no es válido");
  assertThrows(() => e.numero({ min: 0 }).leer(-1, "n"), "n no es válido");
  assertThrows(() => e.numero().leer("4a", "n"), "n no es válido");
});

// Las acciones del panel que mueven dinero tienen tipos reales (2026-10-01): un monto que no es
// número o un pedido que no es un uuid se rechaza en la frontera, antes de tocar la base.
Deno.test("el panel: crédito con monto inválido y pedido mal formado se rechazan con 400", () => {
  assertThrows(() => validarEntrada("admin-manual-credit", { token: "t", phone: "9", delta: "diez" }, "x"), "no es válido");
  assertThrows(() => validarEntrada("admin-confirm-payment", { token: "t", orderId: "123" }, "x"), "Falta el pedido");
  assertEquals(validarEntrada("admin-manual-credit", { token: "t", phone: "9", delta: "5.5" }, "x").delta, 5.5);
});
