// El prompt de video tiene que llevar A LOS HERMANOS, y llevarlos AL PRINCIPIO.
//
// POR QUÉ EXISTE ESTE ARCHIVO. Hasta el 2026-09-07 este generador producía prompts de comida
// SIN NADIE — terminaban literalmente en "No people's faces". Pero el dueño ya tiene a los dos
// hermanos creados en Flow, son el eje de toda la publicidad (`marca/LOS_HERMANOS.md`) y el
// calendario semanal (`marketingContent()`) YA escribía sus guiones con los cinco formatos de
// los hermanos. Había DOS generadores de guion que no se conocían y proponían videos distintos
// para la misma semana.
//
// SU MODO DE FALLO ES SILENCIO. Un prompt sin el ancla de personaje no falla: devuelve un video
// bonito de OTRO personaje, y el dueño se entera después de gastar los créditos de Flow. Y un
// ancla que quede al FINAL tampoco falla — solo deriva, porque Flow pesa más lo que aparece
// primero (`FLUJO_VIDEO_ANUNCIOS.md` §1). Por eso acá se fija el CONTENIDO y el ORDEN.
//
// Se prueba `buildFlowPrompt` y no la acción: la acción pasa por `requireAdmin`, que toca la
// base. Extraer el cálculo puro es el patrón que este repo ya usa (`marketingContent`,
// `cancellationDeltas`, `batchExpiryStatus`).
//
// jsr.io está bloqueado por el proxy, así que el assert va acá adentro (ver CLAUDE.md).
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
import { buildFlowPrompt, FORMATOS, ANGLES } from "../supabase/functions/api/actions/video.ts";

const fmt = (k: string) => FORMATOS.find((f) => f.key === k)!;
const prompt = (sigId: string, k: string) => buildFlowPrompt(sigId, fmt(k), ANGLES[0]);

Deno.test("el prompt ancla a los dos hermanos, y los ancla PRIMERO", () => {
  const p = prompt("SIG01", "pleito");
  assert(/CALM BROTHER/.test(p), "el prompt no nombra al hermano calmado");
  assert(/WILD BROTHER/.test(p), "el prompt no nombra al hermano alocado");
  // EL ORDEN ES LA PRUEBA: si la escena va antes que el personaje, la escena moldea al
  // personaje y la identidad deriva.
  const iAncla = p.indexOf("CALM BROTHER");
  const iEscena = p.indexOf("Scene:");
  assert(iAncla >= 0 && iAncla < iEscena, "el ancla de personaje NO va antes de la escena");
  assert(iAncla < 60, `el ancla arranca en el caracter ${iAncla}: ya no está al principio`);
});

Deno.test("los hermanos nunca comparten primer plano ni se tocan", () => {
  // Está reportado que la identidad se degrada en Flow cuando dos personajes comparten primer
  // plano o se tocan. La regla vive en el prompt, no en la cabeza de quien lo pega.
  const p = prompt("SIG01", "pleito");
  assert(/must not share a tight close-up/i.test(p), "falta la regla de no compartir primer plano");
  assert(/must not touch/i.test(p), "falta la regla de no tocarse");
});

Deno.test("EL SECRETO no le manda los ingredientes al modelo", () => {
  // No alcanza con decir "no muestres el producto": mandarle la receta es la forma más fácil
  // de que aparezca en cuadro igual y queme el menú secreto.
  const p = prompt("SIG01", "secreto");
  assert(/never revealed on camera/i.test(p), "EL SECRETO no advierte que el producto no se muestra");
  assert(!/The sandwich is/i.test(p), "EL SECRETO le está mandando los ingredientes al modelo");
});

Deno.test("el pan siempre es sub, y la marca entra en el cierre", () => {
  // La del pan es FACTUAL, no estética: los nombres de los panes describen sabor, no forma —
  // un modelo que lea "focaccia" sin esto devuelve un pan plano cuadrado. La del "//" junto a
  // la cara es la mitigación medida del efecto vampiro (que el personaje se robe la marca).
  const p = prompt("SIG04", "receta");
  assert(/sub\/hoagie roll/i.test(p), "falta la regla del pan sub");
  assert(/never sliced loaf bread/i.test(p), "el prompt no prohíbe el pan de molde");
  assert(/"\/\/" mark/.test(p), "el cierre no lleva el // junto a los personajes");
});

Deno.test("los cinco formatos son los mismos que usa el calendario semanal", () => {
  // Si estas letras se separan de las de `marketingContent()`, el borrador del lunes propone un
  // video y el prompt que se pega en Flow propone otro — el defecto que este cambio vino a
  // cerrar.
  const letras = FORMATOS.map((f) => f.letra).sort().join("");
  assert(letras === "ABCDE", `los formatos son ${letras}, no ABCDE`);
  assert(FORMATOS[0].key === "pleito", "EL PLEITO dejó de ser el formato por defecto");
});
