// Pruebas de deriveCart — el precio que el servidor DE VERDAD cobra, ejecutando el
// código real.
//
// POR QUÉ EXISTE. deriveCart es la única función que decide cuánto sale un pedido, y
// concentra cuatro mecanismos que se pisan entre sí: combo, promo de hora valle,
// recompensas de puntos y el sándwich gratis del organizador. Los specs de Playwright
// mockean el endpoint entero, así que verifican lo que el CLIENTE muestra, nunca lo que
// el servidor cobra — y cuando los dos no coinciden el checkout se rechaza con "El total
// no coincide con los productos del pedido", que es exactamente el defecto que ya pasó
// con el umbral del organizador.
//
// Cada caso de acá corresponde a una regla que costó dinero o un pedido roto cuando no
// se cumplía. Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
// El servidor compara totales en céntimos (Math.round(total*100)) porque los precios .90
// producen ruido de punto flotante — se compara igual acá para que el test mida lo mismo
// que la validación real, no una igualdad exacta que ningún total cumple.
function assertSoles(actual: number, expected: number, msg?: string) {
  assertEquals(
    Math.round(actual * 100),
    Math.round(expected * 100),
    msg ?? `esperaba S/${expected.toFixed(2)}, recibí S/${actual.toFixed(2)}`,
  );
}
import { deriveCart } from "../supabase/functions/api/catalog.ts";

// Precios de la semilla del catálogo (los mismos literales que carga loadCatalogPrices
// por encima en producción): THE ORIGINAL 15CM S/20.90, THE MIDNIGHT S/5, THE SPICE
// CHAI S/9.
const SIG15 = 20.9;
const D07 = 5;
const D09 = 9;

const sig15 = () => ({ type: "sig", sigId: "SIG01", size: "15", qty: 1 });
const bebida = (code: string) => ({ type: "side", code, qty: 1 });

// Horas fijas y explícitas: la promo de hora valle mira la hora de PREPARACIÓN, así que
// sin fijarla el mismo test daría un total distinto según a qué hora corra el CI.
const HORA_VALLE = "2026-09-10T21:00:00.000Z"; // 16:00 en Lima, dentro de 15-18
const HORA_NORMAL = "2026-09-10T01:00:00.000Z"; // 20:00 en Lima, fuera de la ventana

Deno.test("combo: sándwich + bebida descuenta S/1 una vez por par", () => {
  const r = deriveCart([sig15(), bebida("D07")], null, HORA_NORMAL);
  assertSoles(r.expectedTotal, SIG15 + D07 - 1);
});

// ── LA BEBIDA GRATIS DE HORA VALLE SE RETIRÓ EL 2026-09-05 ────────────────────────────
//
// Era la ÚNICA operación del catálogo con contribución NEGATIVA: regalar una bebida de hasta
// S/6 cuesta ~S/2.34 de insumo y devuelve S/0, así que la contribución media de una bebida
// pasaba de +S/3.97 a −S/1.79 (ver RENTABILIDAD_POR_PARTE.md).
//
// Se apagó VACIANDO su ventana horaria, no borrando el mecanismo. Por eso estas pruebas no
// se borran: ahora fijan que dentro de la que ERA la ventana ya no se regala nada. Su modo de
// fallo es SILENCIO en las dos direcciones — si alguien repone las horas "porque el array
// vacío parece un error", el negocio vuelve a regalar bebidas a pérdida sin que nada falle.
Deno.test("en la que era la ventana de hora valle ya no se regala la bebida", () => {
  // Mismo carrito y misma hora que antes daban SIG15 pelado (la bebida iba gratis). Ahora
  // solo queda el combo de S/1, exactamente igual que fuera de la ventana.
  const r = deriveCart([sig15(), bebida("D07")], null, HORA_VALLE);
  assertSoles(r.expectedTotal, SIG15 + D07 - 1);
});

Deno.test("la hora valle da el mismo total que cualquier otra hora", () => {
  // La prueba más fuerte de que la promo está apagada: la hora dejó de mover el precio.
  const valle = deriveCart([sig15(), bebida("D09")], null, HORA_VALLE);
  const normal = deriveCart([sig15(), bebida("D09")], null, HORA_NORMAL);
  assertSoles(valle.expectedTotal, normal.expectedTotal);
  assertSoles(valle.expectedTotal, SIG15 + D09 - 1);
});

Deno.test("R06 (sándwich gratis) no regala además la bebida del combo", () => {
  // El sándwich regalado sale del conteo de combo. Si siguiera contando, el combo
  // descontaría también sobre la bebida emparejada con algo que ya es gratis — el
  // defecto que se detectó en vivo el día que se reestructuraron R02-R06.
  const r = deriveCart([sig15(), bebida("D07")], "R06", HORA_NORMAL);
  assertSoles(r.expectedTotal, D07);
});

Deno.test("R05 (bebida gratis) está topada igual que la promo de hora valle", () => {
  const r = deriveCart([sig15(), bebida("D09")], "R05", HORA_NORMAL);
  assertSoles(r.expectedTotal, SIG15 + D09 - 6);
});

Deno.test("R05 tampoco deja que la bebida regalada arrastre un combo", () => {
  const r = deriveCart([sig15(), bebida("D07")], "R05", HORA_NORMAL);
  // La bebida sale del conteo: no queda ningún par, así que no hay S/1 de combo.
  assertSoles(r.expectedTotal, SIG15 + D07 - D07);
});

Deno.test("una recompensa sin producto elegible en el carrito se rechaza", () => {
  let lanzó = false;
  try {
    deriveCart([sig15()], "R05", HORA_NORMAL); // R05 necesita una bebida
  } catch {
    lanzó = true;
  }
  assertEquals(lanzó, true, "R05 sin bebida en el carrito debía rechazarse");
});

Deno.test("organizador: a partir de 5 sándwiches el 15CM más barato va gratis", () => {
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const con = deriveCart(cinco, null, HORA_NORMAL, true);
  assertSoles(con.expectedTotal, SIG15 * 5 - SIG15);
});

Deno.test("organizador: con 4 sándwiches todavía no regala nada", () => {
  const cuatro = [sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cuatro, null, HORA_NORMAL, true);
  assertSoles(r.expectedTotal, SIG15 * 4);
});

Deno.test("organizador: el umbral se mide ANTES de descontar el sándwich de R06", () => {
  // Este es el defecto exacto que rompía el checkout: restar R06 primero dejaba el grupo
  // en 4 sándwiches SOLO en el servidor, el cliente descontaba los dos, y el pedido se
  // rechazaba por total que no coincide. Los dos regalos aplican, sobre líneas distintas.
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cinco, "R06", HORA_NORMAL, true);
  assertSoles(r.expectedTotal, SIG15 * 5 - SIG15 - SIG15);
});

Deno.test("organizador: el sándwich regalado sale del conteo de combo", () => {
  // 5 sándwiches + 5 bebidas. Con el regalado fuera del conteo quedan 4 pares, no 5 — si
  // contara, el combo regalaría también la bebida emparejada con un sándwich gratis.
  const carrito = [
    sig15(), sig15(), sig15(), sig15(), sig15(),
    bebida("D07"), bebida("D07"), bebida("D07"), bebida("D07"), bebida("D07"),
  ];
  const r = deriveCart(carrito, null, HORA_NORMAL, true);
  assertSoles(r.expectedTotal, SIG15 * 5 + D07 * 5 - 4 - SIG15);
});

Deno.test("sin la verificación del grupo, declarar el descuento no basta", () => {
  // organizerFreeSandwich es false por defecto: lo pone quien ya verificó contra la base
  // que el grupo existe, lo cierra quien paga y no se cobró antes. El cuerpo del request
  // nunca lo alcanza.
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cinco, null, HORA_NORMAL);
  assertSoles(r.expectedTotal, SIG15 * 5);
});

Deno.test("un carrito vacío nunca produce un total de S/0 cobrable", () => {
  let lanzó = false;
  try {
    deriveCart([], null, HORA_NORMAL);
  } catch {
    lanzó = true;
  }
  assertEquals(lanzó, true);
});

Deno.test("el total nunca baja de cero por acumulación de descuentos", () => {
  // Antes esto se probaba con la bebida gratis de hora valle, que igualaba exactamente el
  // precio de una bebida sola. Retirada esa promo, el caso que queda es R05: regala la
  // bebida entera, así que una bebida sola con R05 tiene que dar 0 y no un negativo.
  const r = deriveCart([bebida("D07")], "R05", HORA_NORMAL);
  assertSoles(r.expectedTotal, 0);
  assertEquals(r.expectedTotal >= 0, true);
});
