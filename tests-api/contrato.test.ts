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

const UUID = "0b7e3f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const ITEM = { type: "sig", sigId: "SIG01", size: "15", qty: 1 };

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

Deno.test("una acción todavía sin contrato recibe el cuerpo tal cual, más la IP del servidor", () => {
  const r = validarEntrada("get-catalog", { algo: 1, _ip: "falsa" }, "1.2.3.4");
  assertEquals(r, { algo: 1, _ip: "1.2.3.4" });
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
