// CIERRE TEMPORAL (dueño, 2026-11-23: «Cierra el app, por el momento. Coloca un aviso que atenderemos a
// partir del miércoles 25»).
// PROMESA: hasta la hora de `hasta` no entra ningún pedido, y desde esa hora se reabre solo.
// MODO DE FALLO: silencio en las dos direcciones — se cobra un pedido que nadie va a cocinar, o la app
// sigue cerrada el miércoles sin que nadie lo note.
import { CIERRE_TEMPORAL, cerradoTemporalmente, cuandoVolvemos } from "../supabase/functions/_shared/reglas.ts";

function assert(c: boolean, m: string) { if (!c) throw new Error(m); }

Deno.test("el cierre temporal cierra hasta su hora y se reabre solo a esa hora", () => {
  if (!CIERRE_TEMPORAL) return; // sin cierre puesto no hay nada que probar
  const hasta = Date.parse(CIERRE_TEMPORAL.hasta);
  assert(Number.isFinite(hasta), "la fecha del cierre no se puede leer");
  assert(cerradoTemporalmente(hasta - 60_000), "un minuto antes debía seguir cerrado");
  assert(!cerradoTemporalmente(hasta), "a la hora de volver debía estar abierto");
  assert(!cerradoTemporalmente(hasta + 3_600_000), "una hora después debía estar abierto");
  assert(cuandoVolvemos().length > 0, "el aviso no dice cuándo volvemos");
});
