// Pruebas de la LÓGICA DE DINERO DEL SERVIDOR, ejecutando el código real.
//
// POR QUÉ EXISTE ESTE ARCHIVO. Los 40 specs de Playwright mockean el endpoint `api`
// entero (tests/helpers.ts → mockBackend intercepta la petición HTTP), así que NUNCA
// ejecutan una línea del backend. Y `npm run typecheck:api` solo corre `deno check`:
// verifica tipos, no comportamiento. Entre los dos quedaba un hueco por el que pasaron
// dos defectos que llegaron a producción y que ningún check en verde detectó:
//
//   · `pointsFor` daba decimales (total − delivery con precios .90) contra una columna
//     `integer`, y reventaba DESPUÉS de que Culqi ya había cobrado.
//   · `assertHourCapacity` consultaba `scheduled_for`, una columna que no existe, y el
//     `catch` de la propia función se tragaba el 42703 — el tope nunca se aplicó.
//
// Los dos son de esta clase: aritmética y forma de consulta, invisibles a un mock.
//
// Correr con: npm run test:api
// Assert propio en vez de jsr:@std/assert — jsr.io está bloqueado por el proxy de este
// entorno (mismo motivo por el que scripts/check-backend.mjs reintenta sin los tipos de
// ambiente). Tres líneas evitan una dependencia que no se puede descargar.
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { pointsFor } from "../supabase/functions/api/actions/orders.ts";

Deno.test("pointsFor devuelve SIEMPRE un entero — las columnas de puntos son integer", () => {
  // El caso real que rompía: The Original 15CM (20.90) + delivery zona media engordado.
  assertEquals(Number.isInteger(pointsFor(27.25, 6.35)), true);
  assertEquals(Number.isInteger(pointsFor(20.9, 0)), true);
  assertEquals(Number.isInteger(pointsFor(29.35, 8.47)), true);
  // Una batería amplia: cualquier combinación de precios .90 con cualquier zona.
  const zonas = [0, 6, 6.35, 8, 8.47, 12, 12.7, 15, 15.87];
  const totales = [19.9, 20.9, 21.9, 23.9, 25.9, 26.9, 28.9, 30.9, 34.9, 62.7];
  for (const t of totales) {
    for (const z of zonas) {
      const p = pointsFor(t + z, z);
      assertEquals(Number.isInteger(p), true, `pointsFor(${t + z}, ${z}) = ${p} no es entero`);
    }
  }
});

Deno.test("pointsFor nunca premia el delivery — es pass-through al motorizado", () => {
  // Mismo sándwich, dos zonas distintas: los puntos tienen que ser los mismos.
  assertEquals(pointsFor(20.9 + 6, 6), pointsFor(20.9 + 15, 15));
  // Y el valor tiene que ser el de la comida, no el del total cobrado.
  assertEquals(pointsFor(26.9, 6), 21);
});

Deno.test("pointsFor tolera un delivery ausente sin devolver NaN", () => {
  assertEquals(pointsFor(20.9, 0), 21);
  // @ts-expect-error: se prueba a propósito lo que llega de la base cuando la columna es null
  assertEquals(pointsFor(20.9, null), 21);
  // @ts-expect-error: idem para undefined
  assertEquals(pointsFor(20.9, undefined), 21);
});
