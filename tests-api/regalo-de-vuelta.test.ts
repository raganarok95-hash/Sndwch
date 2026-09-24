// El regalo de vuelta (24-48 h después del primer pedido) le dice al cliente «te sumamos puntos
// suficientes para canjear una bebida de la casa». Hasta el 2026-09-24 eran 120 puntos escritos
// a mano, con un comentario «= R05»… y R05 vale 160 desde la recalibración del 2026-09-05: el
// aviso prometía una bebida que el regalo no alcanzaba a pagar. Ahora los puntos salen del precio
// VIGENTE de la recompensa de tipo bebida (el que el dueño puede mover desde el panel).
//
// jsr.io está bloqueado por el proxy, así que el assert va acá adentro (ver CLAUDE.md).
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
import { REWARDS } from "../supabase/functions/api/catalog.ts";
import { recompensaDeTipo } from "../supabase/functions/_shared/carta.ts";
import { regaloDeVuelta } from "../supabase/functions/api/actions/customer.ts";

const bebida = recompensaDeTipo("bebida")!;

Deno.test("el regalo de vuelta alcanza para la bebida que promete", () => {
  const r = regaloDeVuelta();
  assert(r.puntos >= REWARDS[bebida.id].pts, `regala ${r.puntos} pts y la bebida cuesta ${REWARDS[bebida.id].pts}`);
  assert(/bebida/i.test(r.aviso), "el aviso ya no dice qué se puede canjear");
});

Deno.test("si el dueño sube la bebida desde el panel, el regalo la sigue cubriendo", () => {
  const antes = REWARDS[bebida.id].pts;
  try {
    REWARDS[bebida.id].pts = antes + 90;
    assert(regaloDeVuelta().puntos >= antes + 90, "el regalo se quedó con el precio viejo de la bebida");
  } finally {
    REWARDS[bebida.id].pts = antes;
  }
});
