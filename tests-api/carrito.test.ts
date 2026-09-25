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
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
import { deriveCart, SIDE_PRICE, SIG_DATA } from "../supabase/functions/api/catalog.ts";
import { recompensa, unSignature } from "./carta.ts";

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const R_SANDWICH = recompensa("sandwich");
const R_BEBIDA = recompensa("bebida");

// Los productos salen de la carta, no se escriben (ver tests-api/carta.ts): un Signature vigente
// cualquiera, la bebida más barata y la más cara. Estas pruebas fijan REGLAS de dinero —combo,
// recompensas, organizador—, que no dependen de qué sándwich o qué bebida haya este mes.
const UN_SIGNATURE = unSignature();
const PRECIO_SIG_15 = SIG_DATA[UN_SIGNATURE]!.p15;
const bebidasPorPrecio = Object.keys(SIDE_PRICE).sort((x, y) => SIDE_PRICE[x]! - SIDE_PRICE[y]!);
const BEBIDA = bebidasPorPrecio[0]!;
const BEBIDA_CARA = bebidasPorPrecio[bebidasPorPrecio.length - 1]!;
const PRECIO_BEBIDA = SIDE_PRICE[BEBIDA]!;
const PRECIO_BEBIDA_CARA = SIDE_PRICE[BEBIDA_CARA]!;

const sig15 = () => ({ type: "sig", sigId: UN_SIGNATURE, size: "15", qty: 1 });
const bebida = (code: string) => ({ type: "side", code, qty: 1 });

// Horas fijas y explícitas: la promo de hora valle mira la hora de PREPARACIÓN, así que
// sin fijarla el mismo test daría un total distinto según a qué hora corra el CI.
const HORA_VALLE = "2026-09-10T21:00:00.000Z"; // 16:00 en Lima, dentro de 15-18
const HORA_NORMAL = "2026-09-10T01:00:00.000Z"; // 20:00 en Lima, fuera de la ventana

Deno.test("combo: sándwich + bebida descuenta S/1 una vez por par", () => {
  const r = deriveCart([sig15(), bebida(BEBIDA)], null, HORA_NORMAL);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 + PRECIO_BEBIDA - 1);
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
  // Mismo carrito y misma hora que antes daban PRECIO_SIG_15 pelado (la bebida iba gratis). Ahora
  // solo queda el combo de S/1, exactamente igual que fuera de la ventana.
  const r = deriveCart([sig15(), bebida(BEBIDA)], null, HORA_VALLE);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 + PRECIO_BEBIDA - 1);
});

Deno.test("la hora valle da el mismo total que cualquier otra hora", () => {
  // La prueba más fuerte de que la promo está apagada: la hora dejó de mover el precio.
  const valle = deriveCart([sig15(), bebida(BEBIDA_CARA)], null, HORA_VALLE);
  const normal = deriveCart([sig15(), bebida(BEBIDA_CARA)], null, HORA_NORMAL);
  assertSoles(valle.expectedTotal, normal.expectedTotal);
  assertSoles(valle.expectedTotal, PRECIO_SIG_15 + PRECIO_BEBIDA_CARA - 1);
});

Deno.test("el 15CM gratis no regala además la bebida del combo", () => {
  // El sándwich regalado sale del conteo de combo. Si siguiera contando, el combo
  // descontaría también sobre la bebida emparejada con algo que ya es gratis — el
  // defecto que se detectó en vivo el día que se reestructuraron R02-R06.
  const r = deriveCart([sig15(), bebida(BEBIDA)], R_SANDWICH, HORA_NORMAL);
  assertSoles(r.expectedTotal, PRECIO_BEBIDA);
});

Deno.test("la bebida gratis cubre entera la bebida más cara que hoy existe", () => {
  // R05_FLAT_WAIVER es S/6 y la bebida más cara cuesta S/6: la recompensa la cubre completa,
  // sin resto. Ese "sin resto" es la promesa — "BEBIDA // GRATIS" que no alcanza para alguna
  // bebida del catálogo es la misma clase de promesa falsa que obligó a retirar dos badges.
  //
  // ⚠ LA BEBIDA SE DERIVA DE `SIDE_PRICE`, NO SE ESCRIBE. Hasta el 2026-09-13 esta prueba
  // decía "la más cara que hoy existe" en su título y ejercía `D06` a mano: una bebida nueva
  // más cara entraba al catálogo y la prueba seguía en verde midiendo otra cosa. Es el mismo
  // defecto que este repo ya documentó dos veces — un chequeo que se mide contra un caso fijo
  // no protege la afirmación general que dice proteger.
  const masCara = Object.keys(SIDE_PRICE).reduce((a, b) => SIDE_PRICE[a] >= SIDE_PRICE[b] ? a : b);
  const r = deriveCart([sig15(), bebida(masCara)], R_BEBIDA, HORA_NORMAL);
  assertSoles(
    r.expectedTotal,
    PRECIO_SIG_15,
    `la bebida gratis no cubrió entera ${masCara} (S/${SIDE_PRICE[masCara]}): "BEBIDA // GRATIS" ya no es cierto`,
  );
});

Deno.test("el tope de la bebida gratis sigue vivo aunque hoy ninguna bebida lo pase", () => {
  // ⚠ MODO DE FALLO: SILENCIO. Con el chai (S/9) fuera, la bebida más cara vale exactamente
  // lo que el tope, así que el tope NO recorta nada hoy — y alguien podría concluir que
  // sobra y borrarlo. Sigue siendo la única defensa para el día que vuelva una bebida por
  // encima de S/6: sin él, R05 regalaría el precio completo de lo que sea que se agregue.
  //
  // Lo que se fija es que la recompensa nunca devuelva MÁS que el tope, comprobado sobre
  // todo el catálogo vigente en vez de sobre una bebida escrita a mano — así una bebida
  // nueva y cara entra sola a esta prueba en lugar de quedar fuera en silencio.
  for (const code of Object.keys(SIDE_PRICE)) {
    const conRecompensa = deriveCart([sig15(), bebida(code)], R_BEBIDA, HORA_NORMAL);
    const sinRecompensa = deriveCart([sig15(), bebida(code)], null, HORA_NORMAL);
    const perdonado = sinRecompensa.expectedTotal - conRecompensa.expectedTotal;
    assert(
      Math.round(perdonado * 100) <= Math.round(6 * 100),
      `la bebida gratis perdonó S/${perdonado.toFixed(2)} en ${code}: más que el tope de S/6`,
    );
  }
});

Deno.test("la bebida gratis tampoco deja que la bebida regalada arrastre un combo", () => {
  const r = deriveCart([sig15(), bebida(BEBIDA)], R_BEBIDA, HORA_NORMAL);
  // La bebida sale del conteo: no queda ningún par, así que no hay S/1 de combo.
  assertSoles(r.expectedTotal, PRECIO_SIG_15 + PRECIO_BEBIDA - PRECIO_BEBIDA);
});

Deno.test("una recompensa sin producto elegible en el carrito se rechaza", () => {
  let lanzó = false;
  try {
    deriveCart([sig15()], R_BEBIDA, HORA_NORMAL); // R05 necesita una bebida
  } catch {
    lanzó = true;
  }
  assertEquals(lanzó, true, "la bebida gratis sin bebida en el carrito debía rechazarse");
});

Deno.test("organizador: a partir de 5 sándwiches el 15CM más barato va gratis", () => {
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const con = deriveCart(cinco, null, HORA_NORMAL, true);
  assertSoles(con.expectedTotal, PRECIO_SIG_15 * 5 - PRECIO_SIG_15);
});

Deno.test("organizador: con 4 sándwiches todavía no regala nada", () => {
  const cuatro = [sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cuatro, null, HORA_NORMAL, true);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 * 4);
});

Deno.test("organizador: el umbral se mide ANTES de descontar el sándwich del 15CM gratis", () => {
  // Este es el defecto exacto que rompía el checkout: restar R06 primero dejaba el grupo
  // en 4 sándwiches SOLO en el servidor, el cliente descontaba los dos, y el pedido se
  // rechazaba por total que no coincide. Los dos regalos aplican, sobre líneas distintas.
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cinco, R_SANDWICH, HORA_NORMAL, true);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 * 5 - PRECIO_SIG_15 - PRECIO_SIG_15);
});

Deno.test("organizador: el sándwich regalado sale del conteo de combo", () => {
  // 5 sándwiches + 5 bebidas. Con el regalado fuera del conteo quedan 4 pares, no 5 — si
  // contara, el combo regalaría también la bebida emparejada con un sándwich gratis.
  const carrito = [
    sig15(), sig15(), sig15(), sig15(), sig15(),
    bebida(BEBIDA), bebida(BEBIDA), bebida(BEBIDA), bebida(BEBIDA), bebida(BEBIDA),
  ];
  const r = deriveCart(carrito, null, HORA_NORMAL, true);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 * 5 + PRECIO_BEBIDA * 5 - 4 - PRECIO_SIG_15);
});

Deno.test("sin la verificación del grupo, declarar el descuento no basta", () => {
  // organizerFreeSandwich es false por defecto: lo pone quien ya verificó contra la base
  // que el grupo existe, lo cierra quien paga y no se cobró antes. El cuerpo del request
  // nunca lo alcanza.
  const cinco = [sig15(), sig15(), sig15(), sig15(), sig15()];
  const r = deriveCart(cinco, null, HORA_NORMAL);
  assertSoles(r.expectedTotal, PRECIO_SIG_15 * 5);
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
  const r = deriveCart([bebida(BEBIDA)], R_BEBIDA, HORA_NORMAL);
  assertSoles(r.expectedTotal, 0);
  assertEquals(r.expectedTotal >= 0, true);
});
