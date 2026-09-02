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

Deno.test("elige la recompensa más cercana que TODAVÍA no alcanza", () => {
  // Con 100 puntos: R02 (40) ya la puede canjear, R04/R05 (120) le faltan 20, R03 (160) 60.
  // La que empuja es la de 20.
  const n = nextRewardNudge(100, REWARDS);
  assertEquals(n?.missing, 20);
  assertEquals(n?.pts === undefined, true);
});

Deno.test("una recompensa que YA puede canjear no es un empujón", () => {
  // Con 400 puntos las alcanza todas. Este cron no es el recordatorio de "tienes puntos
  // sin usar": ese es otro, y mezclarlos haría que el mismo cliente reciba los dos.
  assertEquals(nextRewardNudge(400, REWARDS), null);
  assertEquals(nextRewardNudge(9999, REWARDS), null);
});

Deno.test("el borde exacto de una recompensa NO dispara el aviso", () => {
  // Con exactamente 120 puntos ya tiene R05: faltan 0, y 0 no es "te falta poco".
  const n = nextRewardNudge(120, REWARDS);
  assertEquals(n?.missing, 40, "con 120 debería empujar hacia R03 (160), no hacia la que ya tiene");
});

Deno.test("a quien le falta MUCHO no se le dice nada", () => {
  // Con 0 puntos le faltan 40 para la más barata: eso sí entra (40 <= 60).
  assertEquals(nextRewardNudge(0, REWARDS)?.missing, 40);
  // Pero con un margen chico, ni siquiera eso.
  assertEquals(nextRewardNudge(0, REWARDS, 20), null);
});

Deno.test("el margen se puede mover sin tocar el resto del cálculo", () => {
  // Con 200 puntos le faltan 200 para R06: fuera del margen normal, dentro de uno amplio.
  assertEquals(nextRewardNudge(200, REWARDS), null);
  assertEquals(nextRewardNudge(200, REWARDS, 250)?.missing, 200);
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
