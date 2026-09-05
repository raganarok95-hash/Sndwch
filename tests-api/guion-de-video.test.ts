// Los 8 temas de marketing tienen que traer un GUION DE VIDEO, no solo una idea de foto.
//
// Hasta el 2026-09-04 los 8 proponían una foto y ninguno un video, mientras
// `marketing_calendar` ya soportaba `media_type='video'` y la publicación automática a IG/FB
// ya estaba construida. El video es el formato que la pauta consume; la foto no.
//
// El modo de fallo de todo lo que se prueba acá es SILENCIO: si alguien borra un guion, deja
// uno vacío, o escribe a mano un número que el código ya conoce, nada revienta y el
// typecheck sigue en verde — el dueño solo se queda sin qué grabar, o publica una promesa
// falsa. Por eso son aserciones sobre el CONTENIDO y no sobre que la función no tire.
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
import { marketingContent } from "../supabase/functions/api/actions/admin.ts";
import { SIG_GATES } from "../supabase/functions/api/catalog.ts";
import { REFERRER_REWARD_POINTS, REFERRAL_BONUS_POINTS, WELCOME_BONUS_POINTS } from "../supabase/functions/api/env.ts";
import { ORGANIZER_FREE_MIN_SANDWICHES } from "../supabase/functions/api/catalog.ts";

Deno.test("los 8 temas traen un guion de video, ninguno vacío", () => {
  const temas = marketingContent();
  assert(temas.length > 0, "no hay temas de marketing");
  for (const t of temas) {
    assert(
      typeof t.videoIdea === "string" && t.videoIdea.trim().length > 40,
      `el tema ${t.theme} no tiene guion de video usable`,
    );
  }
});

Deno.test("cada guion declara formato y duración", () => {
  // Un guion sin duración no se puede rodar contra la regla de 12-18 s, y sin formato no se
  // puede reutilizar la plantilla la semana siguiente — que es lo que hace que el sistema
  // sea repetible en vez de una idea suelta por semana.
  for (const t of marketingContent()) {
    assert(/\b9:16\b/.test(t.videoIdea), `el guion de ${t.theme} no declara el encuadre 9:16`);
    assert(/\b\d{1,2} s\b/.test(t.videoIdea), `el guion de ${t.theme} no declara duración`);
    assert(/^[A-E] · /.test(t.videoIdea), `el guion de ${t.theme} no declara cuál de los 5 formatos es`);
  }
});

Deno.test("ningún guion supera los 18 segundos", () => {
  // 9:16 con audio dio 34.5% menor costo por resultado que imagen en Reels, y un video de
  // 15 s visto 3 veces le gana a uno de 60 s visto una. Pasar de 18 s no rompe nada: solo
  // rinde peor, en silencio.
  for (const t of marketingContent()) {
    const m = t.videoIdea.match(/\b(\d{1,2}) s\b/);
    assert(m !== null, `el guion de ${t.theme} no declara duración`);
    const seg = Number(m![1]);
    assert(seg >= 12 && seg <= 18, `el guion de ${t.theme} dura ${seg} s, fuera de 12-18`);
  }
});

Deno.test("las cifras del guion se interpolan, nunca se escriben a mano", () => {
  // Es la regla que ya costó tres promesas rotas a la vez en los textos de marketing
  // (ver CLAUDE.md): un número escrito a mano en un texto que el dueño copia y pega es una
  // promesa que se desincroniza sola. El umbral del menú secreto es el caso más claro —
  // es editable desde el panel, así que un literal se rompe el día que el dueño lo mueva.
  const temas = marketingContent();
  const porTema = (t: string) => temas.find((x) => x.theme === t)!.videoIdea;

  const secretoMin = SIG_GATES.SIG05?.minOrders ?? 3;
  assert(
    porTema("MENÚ SECRETO").includes(String(secretoMin)),
    "el guion del menú secreto no lleva el umbral vigente",
  );
  assert(
    porTema("REFERIDOS").includes(String(REFERRER_REWARD_POINTS)) &&
      porTema("REFERIDOS").includes(String(REFERRAL_BONUS_POINTS)),
    "el guion de referidos no lleva los dos bonos reales",
  );
  assert(
    porTema("LANZAMIENTO").includes(String(WELCOME_BONUS_POINTS)),
    "el guion de lanzamiento no lleva el bono de bienvenida real",
  );
  assert(
    porTema("PEDIDOS GRUPALES").includes(String(ORGANIZER_FREE_MIN_SANDWICHES)),
    "el guion de pedidos grupales no lleva el mínimo real de sándwiches",
  );
});

Deno.test("el guion del menú secreto no muestra el producto", () => {
  // El menú secreto no se puede enseñar: ese es todo el mecanismo. Un guion que pida un
  // plano del sándwich lo quema, y nadie se daría cuenta hasta que el video ya está
  // publicado.
  const g = marketingContent().find((t) => t.theme === "MENÚ SECRETO")!.videoIdea;
  assert(/NO se muestra el producto/i.test(g), "el guion del menú secreto no advierte que no se muestra");
});

Deno.test("los formatos usados son de los cinco definidos", () => {
  const usados = new Set(marketingContent().map((t) => t.videoIdea[0]));
  for (const f of usados) assert("ABCDE".includes(f), `formato desconocido: ${f}`);
  // EL PLEITO (A) es el formato principal a propósito: es literalmente la estructura del
  // menú —cada hermano encarna un modo de pedir— y ése es el mecanismo por el que un dúo
  // funciona. Si deja de ser el más usado, el sistema perdió su ancla.
  const conteo = marketingContent().filter((t) => t.videoIdea.startsWith("A · ")).length;
  assert(conteo >= 2, "EL PLEITO dejó de ser el formato principal");
  assertEquals(usados.size >= 4, true, "se están usando menos de 4 de los 5 formatos");
});
