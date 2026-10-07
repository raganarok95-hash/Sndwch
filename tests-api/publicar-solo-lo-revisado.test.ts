// LO QUE EL REVISOR BLOQUEA NO SE PUBLICA (2026-10-07).
//
// El equipo de marketing automático produce un video cada mañana sin que nadie lo mire; lo único
// que separa un error (precio viejo, texto antes de abrir) de Instagram es el Revisor. El cron
// `auto-publish-calendar` publica cada 15 min lo que esté en 'scheduled'. Modo de fallo: SILENCIO
// — si el filtro pierde `revision`, una pieza bloqueada que quedó programada sale igual, y nadie
// lo nota hasta verla publicada.
//
// Correr con: npm run test:api
import { loQueSaleSolo } from "../supabase/functions/api/actions/social.ts";

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
