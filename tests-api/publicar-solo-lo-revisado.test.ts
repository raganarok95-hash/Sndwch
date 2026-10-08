// LO QUE EL REVISOR BLOQUEA NO SE PUBLICA (2026-10-07).
//
// El equipo de marketing automático produce un video cada mañana sin que nadie lo mire; lo único
// que separa un error (precio viejo, texto antes de abrir) de Instagram es el Revisor. El cron
// `auto-publish-calendar` publica cada 15 min lo que esté en 'scheduled'. Modo de fallo: SILENCIO
// — si el filtro pierde `revision`, una pieza bloqueada que quedó programada sale igual, y nadie
// lo nota hasta verla publicada.
//
// Correr con: npm run test:api
import { loQueSaleSolo, agotadoAlPublicar } from "../supabase/functions/api/actions/social.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
const filtros = (q: string) => Object.fromEntries(new URLSearchParams(q));

Deno.test("el cron no toma lo bloqueado por el Revisor", () => {
  assertEquals(filtros(loQueSaleSolo("2026-10-13")).revision, "neq.bloqueada", "el cron publicaría una pieza bloqueada");
});

Deno.test("el cron solo toma lo programado, nunca un borrador del Productor", () => {
  assertEquals(filtros(loQueSaleSolo("2026-10-13")).status, "eq.scheduled");
});

// LO QUE TIENE HORA NO SALE ANTES (2026-10-08). GitHub atrasa sus horarios de 5 a 9 horas: el video
// se aprueba un día antes y las historias tienen su hora (19:00, 10:50…). Modo de fallo: SILENCIO —
// sin el filtro, «Mañana descansamos» saldría a mediodía y el video del día, la víspera.
Deno.test("el cron no publica antes de publicar_desde", () => {
  const ahora = "2026-10-13T15:00:00.000Z";
  assertEquals(filtros(loQueSaleSolo("2026-10-13", ahora)).or, `(publicar_desde.is.null,publicar_desde.lte.${ahora})`, "saldría antes de su hora");
});

// Se aprueba un día antes, así que el inventario se mira al publicar. Modo de fallo: un video que
// vende un Signature agotado (plata de pauta y un cliente que no puede pedir).
Deno.test("una pieza de un Signature agotado (o de su proteína) no sale", () => {
  const pieza = { datos: { sig: "SIG91", prot: "P91" } };
  assertEquals(agotadoAlPublicar(pieza, [{ product_code: "SIG91", in_stock: false }]) !== null, true, "salió un Signature agotado");
  assertEquals(agotadoAlPublicar(pieza, [{ product_code: "P91", in_stock: false }]) !== null, true, "salió con la proteína agotada");
  assertEquals(agotadoAlPublicar(pieza, [{ product_code: "SIG91", in_stock: true }]), null);
  assertEquals(agotadoAlPublicar({ datos: {} }, [{ product_code: "SIG91", in_stock: false }]), null, "una pieza sin Signature no depende del stock");
});
