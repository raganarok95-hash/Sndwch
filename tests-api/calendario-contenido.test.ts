// Pruebas del generador de calendario de contenido (#50), sobre el código real del servidor.
//
// POR QUÉ EXISTE. Esta función decide qué FILAS se escriben en marketing_calendar, y el cron
// la corre cada semana sobre la misma tabla. El modo de fallo que importa no es un error: es
// la ACUMULACIÓN silenciosa — sin el filtro de fechas ya ocupadas, a la cuarta corrida hay
// cuatro borradores encima del mismo día y el calendario, cuyo único valor es decir qué toca
// publicar hoy, se vuelve ilegible. Nadie recibe un error; simplemente deja de servir.
//
// El segundo modo de fallo cubierto acá es pisar lo que el dueño planeó a mano. Un generador
// automático que sobrescribe una decisión humana se apaga y no se vuelve a usar.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { planContentCalendar } from "../supabase/functions/api/actions/admin.ts";

const TEMAS = [
  { theme: "A", whatsapp: "wa-a", caption: "cap-a", photoIdea: "foto-a", videoIdea: "video-a" },
  { theme: "B", whatsapp: "wa-b", caption: "cap-b", photoIdea: "foto-b", videoIdea: "video-b" },
  { theme: "C", whatsapp: "wa-c", caption: "cap-c", photoIdea: "foto-c", videoIdea: "video-c" },
];

Deno.test("genera una entrada por semana, separadas 7 días", () => {
  const r = planContentCalendar("2026-09-07", 4, TEMAS, 0, new Set());
  assertEquals(r.length, 4);
  assertEquals(r.map((e) => e.scheduled_date).join(","), "2026-09-07,2026-09-14,2026-09-21,2026-09-28");
});

Deno.test("cada entrada trae el texto completo, no solo el tema", () => {
  // Un borrador sin caption ni texto de WhatsApp no ahorra ningún trabajo: sería el mismo
  // recordatorio de antes con otra forma.
  const [e] = planContentCalendar("2026-09-07", 1, TEMAS, 0, new Set());
  assertEquals(e.title, "A");
  assertEquals(e.caption_text, "cap-a");
  assertEquals(e.whatsapp_text, "wa-a");
  assertEquals(e.photo_idea, "foto-a");
  // El guion es el campo que la pauta consume: `marketing_calendar` ya sabía guardar un
  // video y publicarlo solo, pero hasta el 2026-09-04 ningún tema decía qué grabar. Su modo
  // de fallo es SILENCIO — si alguien deja de propagarlo, el borrador se sigue creando y el
  // dueño vuelve a quedarse sin guion sin que nada avise.
  assertEquals(e.video_idea, "video-a");
});

Deno.test("los temas rotan y vuelven a empezar sin repetir dos seguidos", () => {
  const r = planContentCalendar("2026-09-07", 5, TEMAS, 0, new Set());
  assertEquals(r.map((e) => e.title).join(","), "A,B,C,A,B");
});

Deno.test("una fecha que ya tiene entrada NO se vuelve a llenar", () => {
  // Lo que evita que el cron semanal apile borradores sobre los suyos de la semana pasada.
  const ocupadas = new Set(["2026-09-14", "2026-09-21"]);
  const r = planContentCalendar("2026-09-07", 4, TEMAS, 0, ocupadas);
  assertEquals(r.map((e) => e.scheduled_date).join(","), "2026-09-07,2026-09-28");
});

Deno.test("correr el generador dos veces seguidas no crea nada la segunda vez", () => {
  // La prueba que de verdad describe el cron: corre, se guarda lo generado, vuelve a correr.
  const primera = planContentCalendar("2026-09-07", 4, TEMAS, 0, new Set());
  const guardadas = new Set(primera.map((e) => e.scheduled_date));
  const segunda = planContentCalendar("2026-09-07", 4, TEMAS, 0, guardadas);
  assertEquals(segunda.length, 0);
});

Deno.test("saltarse una fecha ocupada no corre el tema de las demás", () => {
  // El tema depende de la SEMANA, no de la posición en la lista de salida. Si al saltar una
  // fecha se corriera la rotación, el calendario del dueño y el rotador que ve en el panel
  // dirían cosas distintas para el mismo día.
  const r = planContentCalendar("2026-09-07", 3, TEMAS, 0, new Set(["2026-09-14"]));
  assertEquals(r.map((e) => `${e.scheduled_date}:${e.title}`).join(","), "2026-09-07:A,2026-09-21:C");
});

Deno.test("la aritmética de fechas no se corre un día al cruzar mes o año", () => {
  // Sumar días sobre una fecha local (en vez de UTC) desplaza el resultado según la zona
  // horaria del runtime, y este código corre en un servidor en UTC pero se lee en Lima.
  const finDeAno = planContentCalendar("2026-12-28", 2, TEMAS, 0, new Set());
  assertEquals(finDeAno.map((e) => e.scheduled_date).join(","), "2026-12-28,2027-01-04");
  const bisiesto = planContentCalendar("2028-02-22", 2, TEMAS, 0, new Set());
  assertEquals(bisiesto.map((e) => e.scheduled_date).join(","), "2028-02-22,2028-02-29");
});

Deno.test("un pedido absurdo de semanas no escribe cientos de filas", () => {
  // `weeks` llega de una petición del panel. Sin tope, un 9999 llenaría la tabla de
  // borradores hasta el año 2218 y el calendario quedaría inservible.
  assertEquals(planContentCalendar("2026-09-07", 9999, TEMAS, 0, new Set()).length <= 12, true);
  assertEquals(planContentCalendar("2026-09-07", 0, TEMAS, 0, new Set()).length, 0);
  assertEquals(planContentCalendar("2026-09-07", -5, TEMAS, 0, new Set()).length, 0);
});

Deno.test("entradas mal formadas no generan filas basura", () => {
  assertEquals(planContentCalendar("07/09/2026", 4, TEMAS, 0, new Set()).length, 0);
  assertEquals(planContentCalendar("", 4, TEMAS, 0, new Set()).length, 0);
  assertEquals(planContentCalendar("2026-09-07", 4, [], 0, new Set()).length, 0);
  assertEquals(planContentCalendar("2026-09-07", 4, null as never, 0, new Set()).length, 0);
});

Deno.test("un índice de semana negativo no rompe la rotación", () => {
  // marketingWeekIndex ya normaliza, pero el módulo de JS con negativos devuelve negativo y
  // eso sería un índice fuera del array: undefined donde debería ir el texto del post.
  const r = planContentCalendar("2026-09-07", 3, TEMAS, -4, new Set());
  assertEquals(r.every((e) => typeof e.title === "string" && e.title.length > 0), true);
});
