// Ninguna cifra que el código ya conoce se escribe a mano en el contenido que se publica.
//
// POR QUÉ ESTE ARCHIVO. `marketingContent()` es lo que el dueño copia y pega a Instagram y
// WhatsApp: una promesa pública. CLAUDE.md ya cuenta que el 2026-08-30 tenía TRES números
// desactualizados a la vez. La auditoría del 2026-09-23 encontró un cuarto: el tema de
// PEDIDOS GRUPALES decía «Desde 5 sándwiches» escrito a mano en los dos textos que se
// publican, mientras la idea de video del MISMO objeto ya interpolaba
// ORGANIZER_FREE_MIN_SANDWICHES. Hoy coinciden; el día que el umbral se mueva, la promesa
// pública queda mintiendo y nada avisa, porque es texto y no cálculo.
//
// Esta prueba no mira la SALIDA (con el umbral en 5, un «5» escrito y uno interpolado se
// ven iguales): mira el FUENTE, y exige que toda cifra de dinero, sándwiches, pedidos o
// puntos dentro de marketingContent() venga de una interpolación `${...}`.
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const fuente = Deno.readTextFileSync(new URL("../supabase/functions/api/actions/admin.ts", import.meta.url));

// Cuerpo exacto de marketingContent, emparejando llaves. Su tipo de retorno trae llaves
// propias (`{ theme: string; ... }[]`), así que el cuerpo empieza en el `{` que sigue a `[]`.
function cuerpoDe(src: string, nombre: string): string {
  const i = src.indexOf(`export function ${nombre}(`);
  assert(i >= 0, `no encontré ${nombre} en admin.ts`);
  const ini = src.indexOf("{", src.indexOf("}[]", i) + 3);
  let prof = 0;
  for (let k = ini; k < src.length; k++) {
    if (src[k] === "{") prof++;
    else if (src[k] === "}" && --prof === 0) return src.slice(ini, k + 1);
  }
  throw new Error(`no pude cerrar el cuerpo de ${nombre}`);
}

// Una cifra "de promesa": soles (S/12), o un número pegado a sándwiches/pedidos/puntos/pts/%.
const CIFRA = /(S\/\s?\d+(?:[.,]\d+)?)|(\b\d+(?:[.,]\d+)?\s?(?:sándwich(?:es)?|pedidos?|puntos|pts|%))/gi;

Deno.test("marketingContent no tiene cifras de promesa escritas a mano", () => {
  const cuerpo = cuerpoDe(fuente, "marketingContent")
    // Se quitan las interpolaciones: lo que queda es texto escrito a mano.
    .replace(/\$\{[^}]*\}/g, "«X»")
    // y los comentarios, que no se publican. SOLO los de línea completa: un `//` a mitad de
    // línea es casi siempre el de la marca («SND//WCH», «Combo //»), y quitar desde ahí se
    // comía justo el texto que hay que mirar — la primera versión de esta prueba pasaba con
    // el «Desde 5» escrito a mano por eso.
    .replace(/^\s*\/\/[^\n]*/gm, "");
  const halladas = [...cuerpo.matchAll(CIFRA)].map((m) => m[0]);
  assert(
    halladas.length === 0,
    `cifras escritas a mano en el contenido que se publica: ${JSON.stringify(halladas)} — interpólalas desde la constante`,
  );
});

Deno.test("el detector de cifras sí reconoce el caso que motivó esta prueba", () => {
  const viejo = 'whatsapp: "Organiza un pedido grupal. Desde 5 sándwiches, el 15CM más barato va gratis."';
  const halladas = [...viejo.matchAll(CIFRA)].map((m) => m[0]);
  assert(halladas.includes("5 sándwiches"), `el detector no vio «5 sándwiches»: ${JSON.stringify(halladas)}`);
});
