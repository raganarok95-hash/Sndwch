// Pruebas de lo que cuenta la pantalla del menú secreto: hasta cuándo dura, sus pistas y
// «los que ya no vuelven».
//
// POR QUÉ EXISTE. «11 días» es una promesa con fecha: si el fin se calcula mal, la pantalla
// dice que quedan días de algo que ya cambió, o al revés. Y «los que ya no vuelven» no puede
// listar el vigente (lo daría por muerto) ni repetir un nombre (corregir una tilde inserta
// otra fila con el mismo nombre). El modo de fallo es el silencio.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { finDelSecreto, secretosQueYaNoVuelven, pistasValidas } from "../supabase/functions/api/catalog.ts";

Deno.test("sin fecha puesta, el secreto dura hasta el último día del mes en que se publicó (Lima)", () => {
  const fin = finDelSecreto(null, "2026-09-10T15:00:00Z")!;
  assertEquals(fin, "2026-10-01T04:59:59.000Z"); // 30 sep 23:59:59 en Lima
});

Deno.test("publicado el 31 a las 10 p.m. de Lima sigue siendo de ese mes, no del siguiente", () => {
  const fin = finDelSecreto(null, "2026-09-01T03:00:00Z")!; // 31 ago 10 p.m. Lima
  assertEquals(fin, "2026-09-01T04:59:59.000Z");
});

Deno.test("si el dueño puso fecha, manda esa", () => {
  assertEquals(finDelSecreto("2026-10-15T05:00:00Z", "2026-09-10T15:00:00Z"), "2026-10-15T05:00:00.000Z");
});

Deno.test("los que ya no vuelven: sin el vigente, sin repetidos, los recientes primero", () => {
  const rows = [
    { name: "El Chifero", created_at: "2026-09-02T15:00:00Z" },
    { name: "El Chifero", created_at: "2026-09-01T15:00:00Z" },
    { name: "El Norteño", blurb: "Cabrito, culantro y zarandaja", created_at: "2026-08-02T15:00:00Z" },
    { name: "El norteño", created_at: "2026-08-01T15:00:00Z" },
    { name: "El Bravo", created_at: "2026-07-02T15:00:00Z" },
  ];
  const p = secretosQueYaNoVuelven(rows);
  assertEquals(p.map((x) => x.name).join("|"), "El Norteño|El Bravo");
  assertEquals(p[0].mes, "AGO");
  assertEquals(p[0].blurb, "Cabrito, culantro y zarandaja");
});

Deno.test("pistas: máximo tres, sin vacías", () => {
  const h = pistasValidas([{ t: "Pica" }, { t: "" }, { t: "Ahumado", s: "lo primero" }, { t: "Tres" }, { t: "Cuatro" }]);
  assertEquals(h.length, 3);
  assertEquals(h[0].t, "Pica");
});
