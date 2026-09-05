// Pruebas del empujón "te faltan N puntos" (#64), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Este aviso decide a QUIÉN se le habla y de QUÉ recompensa, y las dos
// decisiones se equivocan en silencio. Avisarle a quien ya puede canjear no es un empujón,
// es ruido; avisarle a quien le faltan 300 puntos tampoco mueve nada y además enseña a
// ignorar la notificación. Y si eligiera la recompensa equivocada, el número que ve el
// cliente sería cierto pero inútil.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { nextRewardNudge } from "../supabase/functions/api/actions/customer.ts";
import { REWARDS } from "../supabase/functions/api/catalog.ts";

// ⚠ Los números de acá están atados a la CALIBRACIÓN de puntos, recalibrada el 2026-09-05
// para que las cinco recompensas devuelvan lo mismo (~1.5%): R02 20 · R04/R05 160 · R03 320 ·
// R06 400. Si se vuelve a recalibrar, estas aserciones hay que rehacerlas — y eso es correcto:
// son el guardia de que el empujón apunta a la recompensa que de verdad sigue.
Deno.test("elige la recompensa más cercana que TODAVÍA no alcanza", () => {
  // Con 100 puntos: R02 (20) ya la puede canjear, R04/R05 (160) le faltan 60, R03 (320) 220.
  // La que empuja es la de 60.
  const n = nextRewardNudge(100, REWARDS);
  assertEquals(n?.missing, 60);
  assertEquals(n?.pts === undefined, true);
});

Deno.test("una recompensa que YA puede canjear no es un empujón", () => {
  // Con 400 puntos las alcanza todas. Este cron no es el recordatorio de "tienes puntos
  // sin usar": ese es otro, y mezclarlos haría que el mismo cliente reciba los dos.
  assertEquals(nextRewardNudge(400, REWARDS), null);
  assertEquals(nextRewardNudge(9999, REWARDS), null);
});

Deno.test("el borde exacto de una recompensa NO dispara el aviso", () => {
  // Con exactamente 320 puntos ya tiene R03: faltan 0, y 0 no es "te falta poco". La que
  // sigue es R06 (400), a 80 — fuera del margen normal, así que no dice nada...
  assertEquals(nextRewardNudge(320, REWARDS), null);
  // ...pero con un margen amplio sí aparece, y apunta a R06 y no a la que YA tiene. Eso es
  // lo que prueba que miró más allá del borde en vez de quedarse en el 0.
  assertEquals(nextRewardNudge(320, REWARDS, 100)?.missing, 80);
});

Deno.test("a quien le falta MUCHO no se le dice nada", () => {
  // Con 0 puntos le faltan 20 para la más barata: eso sí entra (20 <= 60).
  assertEquals(nextRewardNudge(0, REWARDS)?.missing, 20);
  // Pero con un margen chico, ni siquiera eso.
  assertEquals(nextRewardNudge(0, REWARDS, 10), null);
});

Deno.test("el margen se puede mover sin tocar el resto del cálculo", () => {
  // Con 200 puntos le faltan 120 para R03: fuera del margen normal, dentro de uno amplio.
  assertEquals(nextRewardNudge(200, REWARDS), null);
  assertEquals(nextRewardNudge(200, REWARDS, 250)?.missing, 120);
});

Deno.test("devuelve la etiqueta real de la recompensa, no el código", () => {
  // El cliente ve el nombre; mostrarle "R05" sería un dato interno filtrado a la app.
  const n = nextRewardNudge(100, REWARDS);
  assertEquals(typeof n?.label, "string");
  assertEquals((n?.label || "").length > 0, true);
  assertEquals((n?.label || "").startsWith("R0"), false);
});

Deno.test("sin recompensas configuradas no revienta ni inventa una", () => {
  assertEquals(nextRewardNudge(50, {}), null);
  assertEquals(nextRewardNudge(50, null as never), null);
});

Deno.test("puntos negativos o basura no producen un aviso absurdo", () => {
  // No debería pasar, pero si `points` viniera mal de la base, el peor caso tiene que ser
  // no avisar — nunca un "te faltan -30 puntos".
  const n = nextRewardNudge(-100, REWARDS);
  assertEquals(n === null || n.missing > 0, true);
});
