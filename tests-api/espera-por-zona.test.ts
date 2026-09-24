// Pruebas de la lista de espera por zona (maqueta 34: «te avisamos apenas abramos la zona»).
//
// POR QUÉ EXISTE. El aviso «Ya llegamos a tu zona» es una promesa por push. Si sale mientras
// la zona sigue excluida, el cliente pide y el pedido rebota: nada revienta, solo se rompe la
// promesa. Y un distrito mal escrito deja una lista que nadie puede agrupar.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { distritoValido, zonaSigueCerrada } from "../supabase/functions/api/actions/zones.ts";
import { DELIVERY_EXCLUDED_ZONES } from "../supabase/functions/api/env.ts";

Deno.test("las zonas excluidas del servidor se reconocen con el id del cliente", () => {
  for (const z of DELIVERY_EXCLUDED_ZONES) {
    assertEquals(zonaSigueCerrada(z.replace(/ /g, "_")), true, z);
  }
});

Deno.test("una zona que ya se cubre no cuenta como cerrada", () => {
  assertEquals(zonaSigueCerrada("victor_larco"), false);
});

Deno.test("solo se anota un distrito con nombre de verdad", () => {
  assertEquals(distritoValido("El_Porvenir"), "el_porvenir");
  assertEquals(distritoValido("otro"), null);
  assertEquals(distritoValido(""), null);
  assertEquals(distritoValido("x; drop table"), null);
});
