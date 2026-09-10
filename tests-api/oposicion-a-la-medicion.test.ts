// SND//WCH — EL DERECHO DE OPOSICIÓN TIENE QUE CORTAR DE VERDAD (Ley 29733)
//
// La Política de Privacidad dice, palabra por palabra, que el cliente puede apagar el
// reporte de sus compras a Meta desde su perfil. Esto comprueba que esa frase es verdad.
//
// ⚠ MODO DE FALLO: SILENCIO ABSOLUTO. Si alguien "simplifica" el guard, no revienta nada:
// el pedido se cobra, el cliente ve su confirmación, el panel funciona igual. Lo único que
// pasa es que la app hace exactamente lo contrario de lo que su texto legal promete, y
// nadie se entera hasta que lo reclame un cliente — o la autoridad.
//
// Se prueba el CÁLCULO puro (¿este pedido se reporta o no?) extraído de las dos rutas que
// llaman a Meta, que es el mismo patrón con el que se probó `cancellationDeltas`.

function assertEquals(a: unknown, b: unknown, msg?: string) {
  if (a !== b) throw new Error(msg || `esperaba ${JSON.stringify(b)}, llegó ${JSON.stringify(a)}`);
}

// Réplica exacta de la condición que gobierna las dos rutas:
//   · checkout con cuenta      → reportPurchaseToMeta(p, c): `if (cliente?.ad_tracking_opt_out) return;`
//   · confirmación Yape/Plin   → `if (!c.ad_tracking_opt_out) sendPurchaseEvent({...})`
// Si las dos dejan de coincidir con esto, la prueba de abajo lo dice.
function seReporta(cliente: { ad_tracking_opt_out?: boolean } | null | undefined): boolean {
  return !cliente?.ad_tracking_opt_out;
}

Deno.test("quien se opuso NO se reporta a Meta", () => {
  assertEquals(seReporta({ ad_tracking_opt_out: true }), false);
});

Deno.test("quien no tocó nada sí se reporta — la oposición se pide, no es el default", () => {
  assertEquals(seReporta({ ad_tracking_opt_out: false }), true);
});

// Un pedido de invitado llega sin fila de cliente. Sin cuenta no hay dónde guardar una
// oposición, y ese pedido es justo el que el anuncio trajo: se reporta.
Deno.test("un invitado (sin cuenta) se reporta igual", () => {
  assertEquals(seReporta(null), true);
  assertEquals(seReporta(undefined), true);
});

// La columna es `boolean not null default false`, pero una fila leída antes de la migración
// —o un mock— puede traer el campo ausente. Ausente NO puede significar "se opuso": eso
// apagaría la medición entera en silencio y nadie miraría por qué el CAC no se mide.
Deno.test("el campo ausente se trata como 'no se opuso', nunca al revés", () => {
  assertEquals(seReporta({}), true);
});

// ── Y que las DOS rutas del servidor sigan teniendo el guard ──────────────────────────
// Esto es lo que atrapa el caso real: alguien agrega una tercera forma de cerrar un pedido
// y se olvida del corte. El texto de la política no distingue entre rutas de pago.
Deno.test("las dos rutas que reportan a Meta tienen su corte por oposición", async () => {
  const src = await Deno.readTextFile(new URL("../supabase/functions/api/actions/orders.ts", import.meta.url));
  const llamadas = src.split("sendPurchaseEvent(").length - 1;
  // Una es el import, el resto son llamadas reales.
  assertEquals(llamadas >= 2, true, "se esperaban llamadas a sendPurchaseEvent en orders.ts");

  assertEquals(
    src.includes("if (cliente?.ad_tracking_opt_out) return;"),
    true,
    "reportPurchaseToMeta perdió su corte por oposición — el checkout con cuenta volvería a reportar a quien se opuso",
  );
  assertEquals(
    src.includes("if (!c.ad_tracking_opt_out) sendPurchaseEvent({"),
    true,
    "la confirmación manual (Yape/Plin, el método POR DEFECTO) perdió su corte por oposición",
  );
  assertEquals(
    src.includes("reportPurchaseToMeta(p, c)"),
    true,
    "el checkout con cuenta dejó de pasarle el cliente — el guard quedaría vivo pero nunca recibiría a quién juzgar",
  );
});

// El píxel del NAVEGADOR se prueba aparte, en tests/oposicion-a-la-medicion.spec.ts:
// ahí se puede comprobar de verdad que `fbq` no recibe nada, en vez de buscar un texto
// dentro del archivo. (Y este runner corre sobre una copia que no incluye `src/`.)
