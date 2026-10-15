// Si una publicación automática falla, el dueño se entera; y no cada 15 minutos.
//
// POR QUÉ ESTE ARCHIVO. El 2026-10-15, a cinco días de abrir, la página no tenía un Instagram
// vinculado: Meta rechazaría cada publicación. El cron auto-publish-calendar devolvía el error,
// soltaba la entrada y la reintentaba cada 15 minutos, sin avisar a nadie. El marketing
// «automático» habría estado callado días enteros sin que el dueño lo supiera: el modo de fallo
// que importa es el silencio, y este cuesta pedidos.
//
// La promesa: con fallos y sin un aviso en las últimas 12 horas, se avisa; con un aviso reciente,
// no se repite; sin fallos, nunca.
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}

const { avisarFalloDePublicacion } = await import("../supabase/functions/api/actions/social.ts");

const AHORA = Date.parse("2026-10-20T17:00:00.000Z");
const hace = (horas: number) => new Date(AHORA - horas * 3600e3).toISOString();

Deno.test("sin fallos no se avisa nunca", () => {
  assertEquals(avisarFalloDePublicacion(0, null, AHORA), false);
  assertEquals(avisarFalloDePublicacion(0, hace(48), AHORA), false);
});

Deno.test("con fallos y sin ningún aviso antes, se avisa", () => {
  assertEquals(avisarFalloDePublicacion(1, null, AHORA), true);
});

Deno.test("con un aviso en las últimas 12 horas no se repite", () => {
  assertEquals(avisarFalloDePublicacion(3, hace(0.25), AHORA), false, "el cron corre cada 15 min: no puede avisar cada vez");
  assertEquals(avisarFalloDePublicacion(1, hace(11.9), AHORA), false);
});

Deno.test("pasadas 12 horas del último aviso, si sigue fallando, se vuelve a avisar", () => {
  assertEquals(avisarFalloDePublicacion(1, hace(12), AHORA), true);
  assertEquals(avisarFalloDePublicacion(2, hace(30), AHORA), true);
});

Deno.test("una fecha de aviso ilegible no calla el aviso", () => {
  assertEquals(avisarFalloDePublicacion(1, "no es una fecha", AHORA), true);
});
