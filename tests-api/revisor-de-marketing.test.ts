// EL REVISOR DEL EQUIPO DE MARKETING (2026-10-07).
//
// Cada mañana un video sale a Instagram sin que nadie lo mire: lo único entre un error y el
// público es `decidir()`. Modo de fallo: SILENCIO, y cuesta plata y lo legal — un precio que la
// app ya no cobra es publicidad engañosa; un video de algo agotado es pauta tirada; siete videos
// acumulados antes de abrir saliendo juntos el día de la apertura queman la cuenta.
//
// Correr con: npm run test:api
import { decidir, APERTURA, horaDePublicar, horaDelVideo } from "../scripts/video-auto/reglas-del-revisor.mjs";
import { precio } from "../scripts/video-auto/produccion.mjs";
import { unSignature } from "./carta.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
const SIG = unSignature();
// Un día ya abierto: el siguiente a APERTURA (fijo hasta el 2026-10-08, cuando la apertura pasó del
// 13 al 20 y estas pruebas, con «2026-10-14» escrito, quedaron antes de abrir).
const ABIERTO = new Date(Date.parse(`${APERTURA}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);
const cat = (p15 = 22.9, p30 = 33.9, inStock = true) => ({ sigItems: { [SIG]: { p15, p30, prot: "P9X", active: true } }, inventory: { [SIG]: { inStock } } });
const pieza = (src: string, creada: string, p15 = 22.9, p30 = 33.9) => ({
  id: src, src, created_at: creada, datos: { sig: SIG, p15, p30 },
  caption_text: `Gancho.\n\nX · 15CM ${precio(p15)} · 30CM ${precio(p30)}\n\nPídelo en sndwch.app/?src=${src}`,
});
const base = (piezas: any[], extra: any = {}) => decidir({ piezas, hoy: ABIERTO, abreHoy: true, cat: cat(), conVideo: new Set(piezas.map((p) => p.src)), recientes: new Set(), ...extra });
const veredicto = (r: any[], src: string) => r.find((v) => v.src === src).veredicto;

Deno.test("una pieza correcta sale", () => {
  assertEquals(veredicto(base([pieza("a", "1")]), "a"), "aprobada");
});

Deno.test("un precio que la app ya no cobra se bloquea", () => {
  const r = base([pieza("a", "1", 19.9, 33.9)]);
  assertEquals(veredicto(r, "a"), "bloqueada", "salió un video con un precio viejo");
  assertEquals(r[0].motivo.startsWith("precio"), true);
});

Deno.test("lo agotado hoy no se publicita", () => {
  assertEquals(veredicto(base([pieza("a", "1")], { cat: cat(22.9, 33.9, false) }), "a"), "bloqueada");
});

Deno.test("sin video en el bucket no sale", () => {
  assertEquals(veredicto(base([pieza("a", "1")], { conVideo: new Set() }), "a"), "bloqueada");
});

Deno.test("antes de abrir y los días cerrados nada sale, y nada se pierde", () => {
  const antes = decidir({ piezas: [pieza("a", "1")], hoy: "2026-10-12", abreHoy: true, cat: cat(), conVideo: new Set(["a"]), recientes: new Set() });
  assertEquals(antes[0].veredicto, "espera");
  assertEquals("2026-10-12" < APERTURA, true);
  assertEquals(veredicto(base([pieza("a", "1")], { abreHoy: false }), "a"), "espera");
});

Deno.test("si se acumularon, sale solo la más reciente", () => {
  const r = base([pieza("viejo", "2026-10-08"), pieza("nuevo", "2026-10-13"), pieza("medio", "2026-10-10")]);
  assertEquals(r.filter((v) => v.veredicto === "aprobada").map((v) => v.src), ["nuevo"]);
});

Deno.test("el mismo Signature no sale dos días seguidos", () => {
  assertEquals(veredicto(base([pieza("a", "1")], { recientes: new Set([SIG]) }), "a"), "bloqueada");
});

// LA HORA DE PUBLICAR NO DEPENDE DE CUÁNDO CORRIÓ EL REVISOR (2026-10-08). GitHub corre sus horarios
// de 5 a 9 horas tarde: el video de mañana sale a SU franja de Lima aunque se apruebe a cualquier
// hora, y uno de hoy que llega tarde sale apenas se aprueba, pero nunca de noche. Modo de fallo:
// SILENCIO — un video del almuerzo publicado a las 22:00 no trae pedidos y nadie lo nota.
const dia = (n: number) => new Date(Date.parse(`${APERTURA}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const lima = (d: string, hhmm: string) => new Date(`${d}T${hhmm}:00-05:00`);
const enLima = (d: string, hhmm: string) => lima(d, hhmm).toISOString();
Deno.test("el video de mañana sale a su franja de Lima, se apruebe a la hora que se apruebe", () => {
  assertEquals(horaDePublicar(dia(0), dia(-1), lima(dia(-1), "23:50")), enLima(dia(0), horaDelVideo(dia(0))));
  assertEquals(horaDePublicar(dia(1), dia(0), lima(dia(0), "23:50")), enLima(dia(1), horaDelVideo(dia(1))));
});
Deno.test("uno de hoy que se aprueba tarde sale ya, pero no después de las 20:00", () => {
  const d = dia(0);
  assertEquals(horaDelVideo(d), "12:00", "el día de la apertura el video sale al almuerzo");
  assertEquals(horaDePublicar(d, d, lima(d, "09:00")), enLima(d, "12:00"), "salió antes del almuerzo");
  assertEquals(horaDePublicar(d, d, lima(d, "16:30")), enLima(d, "16:30"));
  assertEquals(horaDePublicar(d, d, lima(d, "20:30")), null, "salió de noche");
});

// LA PRUEBA DE HORA ES PAREJA (dueño, 2026-10-08: «sí me parece bien lo del video»). Las dos
// primeras semanas abiertas, el video alterna 12:00 y 18:00; después queda 18:00. Modo de fallo:
// SILENCIO — si una franja cae siempre en los mismos días (los viernes a las 18:00, los martes a
// las 12:00), gana el día y no la hora, y nos quedamos con la hora equivocada sin saberlo.
Deno.test("las dos primeras semanas alternan 12:00 y 18:00, parejas y cruzadas por día; después, 18:00", () => {
  const abiertos = Array.from({ length: 14 }, (_, n) => n).filter((n) => new Date(`${dia(n)}T12:00:00Z`).getUTCDay() !== 1);
  assertEquals(abiertos.filter((n) => horaDelVideo(dia(n)) === "12:00").length * 2, abiertos.length, "una franja tiene más días que la otra");
  for (const n of abiertos.filter((n) => n < 7)) {
    assertEquals(horaDelVideo(dia(n)) !== horaDelVideo(dia(n + 7)), true, `el ${dia(n)} y el ${dia(n + 7)} prueban la misma hora`);
  }
  assertEquals([horaDelVideo(dia(14)), horaDelVideo(dia(30))], ["18:00", "18:00"], "la prueba no terminó a las dos semanas");
});
