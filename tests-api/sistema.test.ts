// El aviso de «EL SISTEMA //» en el correo de cierre (_shared/sistema.ts).
//
// PROMESA: si una automática falló dos veces seguidas, si una entrega entre hilos está atascada o si hay
// preguntas esperando a Ezra, el correo de cierre lo dice. Y si el vigía mismo no corrió, también.
// MODO DE FALLO: el silencio. El recorrido real estuvo 9 días en rojo (25-oct al 2-nov) sin que nadie se
// enterara; un vigía caído que no deja nada se vería igual que «todo en verde».
//
// Correr con: npm run test:api
import { lineasDelSistema } from "../supabase/functions/_shared/sistema.ts";

function ok(c: unknown, msg: string) {
  if (!c) throw new Error(msg);
}
const AHORA = new Date("2026-11-11T03:30:00Z");
const RECIEN = "2026-11-11T03:13:00Z";

Deno.test("todo en verde y sin pendientes: no hay líneas", () => {
  ok(lineasDelSistema({ automaticas_en_rojo: [], preguntas_abiertas: [], entregas_atascadas: [] }, RECIEN, AHORA).length === 0, "inventó un aviso");
});

Deno.test("una automática en rojo, una entrega atascada y las preguntas aparecen", () => {
  const l = lineasDelSistema({
    automaticas_en_rojo: [{ nombre: "Recorrido de un cliente por el sitio real", archivo: "recorrido-real.yml" }],
    entregas_atascadas: [{ hilo: "recetas", archivo: "2026-11-08-sal.md", de: "disenos", desde: "2026-11-08" }],
    preguntas_abiertas: [{ id: "P01", hilo: "app", pregunta: "Token de Instagram" }],
  }, RECIEN, AHORA);
  ok(l.some((x) => x.includes("Recorrido de un cliente")), "no dijo qué automática");
  ok(l.some((x) => x.includes("de disenos para recetas")), "no dijo la entrega atascada");
  ok(l.some((x) => x.includes("Token de Instagram")), "no dijo la pregunta");
});

Deno.test("si el vigía no corrió en el último día, eso también es un aviso", () => {
  ok(lineasDelSistema(null, null, AHORA).length === 1, "sin datos no avisó");
  ok(lineasDelSistema({ automaticas_en_rojo: [] }, "2026-11-09T03:13:00Z", AHORA).length === 1, "con datos viejos no avisó");
});
