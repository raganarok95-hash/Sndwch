// El botón que apaga y prende los anuncios de Meta (2026-10-01).
//
// POR QUÉ EXISTE. «Prender» reactiva campañas. Si reactivara una que el dueño había pausado a
// mano en Meta, esa campaña volvería a gastar plata sin que nadie lo decidiera: nada revienta,
// solo sale dinero. Y si dos «Apagar» seguidos olvidaran las primeras, «Prender» dejaría
// campañas apagadas para siempre. El modo de fallo es el silencio.
//
// Correr con: npm run test:api
const { planDeAnuncios } = await import("../supabase/functions/api/actions/social.ts");

function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

const campanas = [{ id: "a", activa: true }, { id: "b", activa: false }, { id: "c", activa: true }];

Deno.test("apagar pausa solo las activas y las anota", () => {
  const p = planDeAnuncios("apagar", campanas, []);
  assert(p.cambiar.map((c) => c.id + ":" + c.status).join(",") === "a:PAUSED,c:PAUSED", "pausa a y c, no b");
  assert(p.pausadasDespues.join(",") === "a,c", "anota a y c");
});

Deno.test("prender reactiva SOLO lo que apagó el botón, nunca la que ya estaba pausada", () => {
  const p = planDeAnuncios("prender", campanas, ["a", "c"]);
  assert(p.cambiar.every((c) => c.status === "ACTIVE"), "todo lo que cambia se activa");
  assert(!p.cambiar.some((c) => c.id === "b"), "b la pausó el dueño a mano: no se toca");
  assert(p.pausadasDespues.length === 0, "después de prender no queda nada anotado");
});

Deno.test("dos apagar seguidos no olvidan las primeras", () => {
  const segundo = planDeAnuncios("apagar", [{ id: "a", activa: false }, { id: "d", activa: true }], ["a"]);
  assert(segundo.pausadasDespues.sort().join(",") === "a,d", "siguen anotadas a y d");
});
