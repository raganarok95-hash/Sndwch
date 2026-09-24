// Lo que NO se puede armar en ARMA EL TUYO, y lo que sí — preguntado al catálogo, nunca con
// códigos de producto escritos: la carta cambia (la v4 del 2026-09-24 sacó tres proteínas del
// armador de una vez) y esta prueba tiene que seguir diciendo lo mismo con cualquier carta.
//
// Una proteína queda fuera del armador marcándola en `SIG_ONLY_PROTS`, no borrándola: puede
// seguir viva en un Signature, y los pedidos viejos conservan su nombre.
//
// SU MODO DE FALLO ES SILENCIO, en las DOS direcciones:
//   · Si alguien vacía `SIG_ONLY_PROTS`, vuelven al armador proteínas que ya no se preparan o
//     que pasan el techo de costo: nada revienta hasta que el pedido llega a la cocina.
//   · Si alguien las BORRA del catálogo en vez de marcarlas, el Signature que las usa se queda
//     sin proteína — y eso rompe recién en producción.
// Por eso las aserciones son opuestas: no se puede en BYO, sí se puede en su Signature.
//
// ⚠ Lo que esta prueba NO puede ver: que alguien le QUITE la marca `soloEnSignature` a una
// proteína en `_shared/carta.ts`. Pregunta a la carta qué revisar, así que sin la marca no hay
// nada que revisar. Hasta el 2026-09-24 eso lo cazaba `parity` comparando dos copias; hoy hay
// una sola carta, y quitar la marca ES la decisión de devolverla al armador (se revisa en el
// diff, no en una prueba).
//
// jsr.io está bloqueado por el proxy, así que el assert va acá adentro (ver CLAUDE.md).
function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
import { priceCartItem, PROT_PRICE, SIG_DATA } from "../supabase/functions/api/catalog.ts";
import { proteinasDelArmador, proteinasSoloDeSignature, signaturesRetirados, signaturesVigentes, unaSalsaDelArmador } from "./carta.ts";

const armar = (prot: string, size: "15" | "30") =>
  priceCartItem({ type: "byo", base: "B01", prot, tops: [], sauces: [unaSalsaDelArmador()], size, qty: 1 });

Deno.test("ninguna proteína marcada como exclusiva de Signature se puede armar", () => {
  for (const prot of proteinasSoloDeSignature()) {
    for (const size of ["15", "30"] as const) {
      let tiro = false;
      try {
        armar(prot, size);
      } catch {
        tiro = true;
      }
      assert(tiro, `${prot} ${size}CM todavía se puede armar por BYO`);
    }
  }
});

Deno.test("las proteínas del armador se pueden armar en los dos tamaños", () => {
  for (const prot of proteinasDelArmador()) {
    for (const size of ["15", "30"] as const) {
      assert(armar(prot, size).unitPrice > 0, `${prot} ${size}CM dejó de poder armarse`);
    }
  }
});

Deno.test("la exclusiva que usa un Signature vigente se puede pedir dentro de él", () => {
  // Es todo el sentido de `sigOnly`: si esto falla, ese Signature no se puede pedir.
  for (const prot of proteinasSoloDeSignature()) {
    for (const sigId of signaturesVigentes().filter((id) => SIG_DATA[id]!.prot === prot)) {
      const r = priceCartItem({ type: "sig", sigId, size: "15", qty: 1 });
      assert(r.unitPrice > 0, `${sigId} (con ${prot}) dejó de poder pedirse`);
    }
  }
});

Deno.test("una exclusiva sigue en el catálogo: se marca, no se borra", () => {
  for (const prot of proteinasSoloDeSignature()) {
    assert(PROT_PRICE[prot] !== undefined, `${prot} desapareció del catálogo`);
  }
});

Deno.test("un Signature retirado ya no se puede pedir", () => {
  // Sigue en SIG_DATA para que un pedido viejo conserve su nombre; pedirlo tiene que fallar con
  // el motivo claro, no cobrarse con una receta que la cocina ya no prepara.
  for (const sigId of signaturesRetirados()) {
    let motivo = "";
    try {
      priceCartItem({ type: "sig", sigId, size: "15", qty: 1 });
    } catch (e) {
      motivo = (e as Error).message;
    }
    assertEquals(motivo, "Ese Signature ya no está disponible.", `${sigId} todavía se puede pedir`);
  }
});

Deno.test("el armador no se quedó demasiado corto", () => {
  // Es el argumento entero de la sección: el cliente elige. Menos de cuatro deja de serlo.
  // Esta prueba es el piso, no una meta.
  assert(proteinasDelArmador().length >= 4, `solo quedan ${proteinasDelArmador().length} proteínas en el armador`);
});
