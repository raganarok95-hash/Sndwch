// EL REVISOR DEL EQUIPO DE MARKETING (2026-10-07).
//
// Cada mañana un video sale a Instagram sin que nadie lo mire: lo único entre un error y el
// público es `decidir()`. Modo de fallo: SILENCIO, y cuesta plata y lo legal — un precio que la
// app ya no cobra es publicidad engañosa; un video de algo agotado es pauta tirada; siete videos
// acumulados antes de abrir saliendo juntos el día de la apertura queman la cuenta.
//
// Correr con: npm run test:api
import { decidir, APERTURA, horaDePublicar } from "../scripts/video-auto/reglas-del-revisor.mjs";
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
// de 5 a 9 horas tarde: el video de mañana sale a las 12:00 de Lima aunque se apruebe a cualquier
// hora, y uno de hoy que llega tarde sale apenas se aprueba, pero nunca de noche. Modo de fallo:
// SILENCIO — un video del almuerzo publicado a las 22:00 no trae pedidos y nadie lo nota.
Deno.test("el video de mañana sale a las 12:00 de Lima, se apruebe a la hora que se apruebe", () => {
  assertEquals(horaDePublicar("2026-10-14", "2026-10-13", new Date("2026-10-13T23:50:00-05:00")), "2026-10-14T17:00:00.000Z");
});
Deno.test("uno de hoy que se aprueba tarde sale ya, pero no después de las 20:00", () => {
  assertEquals(horaDePublicar("2026-10-14", "2026-10-14", new Date("2026-10-14T09:00:00-05:00")), "2026-10-14T17:00:00.000Z", "salió antes del almuerzo");
  assertEquals(horaDePublicar("2026-10-14", "2026-10-14", new Date("2026-10-14T16:30:00-05:00")), "2026-10-14T21:30:00.000Z");
  assertEquals(horaDePublicar("2026-10-14", "2026-10-14", new Date("2026-10-14T20:30:00-05:00")), null, "salió de noche");
});
