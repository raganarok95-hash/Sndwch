// P01 (Res) y P05 (Embutido) NO se pueden armar en ARMA EL TUYO — pero SÍ siguen vivas en
// sus Signatures.
//
// POR QUÉ EXISTE ESTE ARCHIVO. El 2026-09-05 las dos salieron del armador por RENTABILIDAD,
// no por producto: cada una cruzaba el techo de 45% de costo en un tamaño (Res 30CM al 47.6%,
// Embutido 15CM al 45.7%) y eran las dos únicas del armador que lo hacían. En receta cerrada
// rinden bien; lo que no estaba costeado es el armador de elección libre, donde el cliente
// combina el tamaño caro con el pan caro y nadie calculó esa combinación.
//
// SU MODO DE FALLO ES SILENCIO, en las DOS direcciones:
//   · Si alguien vacía `SIG_ONLY_PROTS`, las dos vuelven al armador, nada revienta, los tipos
//     siguen compilando, y el negocio simplemente vuelve a vender por debajo del techo.
//   · Si alguien las BORRA del catálogo en vez de marcarlas, THE ORIGINAL y THE SMOKE se
//     quedan sin proteína — y eso sí rompe, pero recién en producción.
// Por eso las dos aserciones son opuestas: no se puede en BYO, sí se puede en el Signature.
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
import { priceCartItem, SIG_ONLY_PROTS, PROT_PRICE } from "../supabase/functions/api/catalog.ts";

const armar = (prot: string, size: "15" | "30") =>
  priceCartItem({ type: "byo", base: "B01", prot, tops: [], sauces: ["S01"], size, qty: 1 });

Deno.test("res y embutido no se pueden armar en ARMA EL TUYO", () => {
  for (const prot of ["P01", "P05"]) {
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

Deno.test("las proteínas que SÍ quedan en el armador siguen funcionando", () => {
  // El riesgo del cambio de al lado es pasarse de largo y dejar el armador vacío.
  for (const prot of ["P02", "P04", "P06"]) {
    const r = armar(prot, "15");
    assert(r.unitPrice > 0, `${prot} dejó de poder armarse`);
  }
});

Deno.test("res y embutido NO se borraron del catálogo: sus Signatures las necesitan", () => {
  // THE ORIGINAL (SIG01) lleva P01 y THE SMOKE (SIG03) lleva P05. Marcarlas es lo correcto;
  // borrarlas dejaría a esos dos Signatures sin proteína.
  for (const prot of ["P01", "P05"]) {
    assert(PROT_PRICE[prot] !== undefined, `${prot} desapareció del catálogo`);
    assert(SIG_ONLY_PROTS.has(prot), `${prot} dejó de estar marcada como exclusiva de Signature`);
  }
});

Deno.test("un Signature sí puede usarlas", () => {
  // La misma proteína que el armador rechaza tiene que seguir tasándose dentro de su receta,
  // que es todo el sentido de `sigOnly` — si esto falla, THE ORIGINAL no se puede pedir.
  const sig = priceCartItem({ type: "sig", sigId: "SIG01", size: "15", qty: 1 });
  assert(sig.unitPrice > 0, "THE ORIGINAL dejó de poder pedirse");
  const smoke = priceCartItem({ type: "sig", sigId: "SIG03", size: "15", qty: 1 });
  assert(smoke.unitPrice > 0, "THE SMOKE dejó de poder pedirse");
});

Deno.test("el armador no se quedó demasiado corto", () => {
  // Con P01 y P05 fuera y P03 exclusiva del menú secreto, ARMA EL TUYO baja a TRES proteínas.
  // Tres ya es poco para una sección cuyo argumento entero es que el cliente elige; menos de
  // tres deja de ser un armador. Esta prueba es el piso, no una meta.
  const armables = Object.keys(PROT_PRICE).filter((p) => !SIG_ONLY_PROTS.has(p));
  assert(
    armables.length >= 4,
    `solo quedan ${armables.length} proteínas en el catálogo sin marcar (incluida la del menú secreto)`,
  );
});
