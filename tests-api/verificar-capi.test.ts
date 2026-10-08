// LA VERIFICACIÓN DEL TOKEN DE CAPI NO DICE «BIEN» CUANDO ESTÁ MAL (2026-10-08).
//
// Dueño: «Meta CAPI ya está colocado como secret. Revísalo bien». La prueba manda a Meta un
// evento fechado hace 8 días: Meta revisa token y permiso, y recién después lo rechaza por viejo.
// Modo de fallo: SILENCIO — si «sin permiso sobre el píxel» se leyera como «evento viejo», el
// chequeo diría ✓ y cada compra real se perdería con un console.error que nadie lee, justo
// cuando la pauta necesita las ventas para optimizar.
//
// Correr con: npm run test:api
import { leerRespuestaDelPixel } from "../supabase/functions/api/meta-capi.ts";

function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}

Deno.test("el evento rechazado por viejo cuenta como permiso confirmado", () => {
  const viejo = { error: { message: "Invalid parameter", code: 100, error_subcode: 2804003, error_user_title: "Event Timestamp Too Old", error_user_msg: "The timestamp for this event is too far in the past." } };
  assertEquals(leerRespuestaDelPixel(false, viejo).puede, true);
});

Deno.test("el rechazo por viejo también se reconoce cuando Meta responde en español", () => {
  // Así respondió Meta el 2026-10-08 (subcódigo 2804003): la prueba lo marcó «?» y no «sí».
  const es = { error: { message: "Invalid parameter", code: 100, error_subcode: 2804003, error_user_title: "La fecha del evento es demasiado antigua", error_user_msg: "La fecha de este evento es demasiado antigua." } };
  assertEquals(leerRespuestaDelPixel(false, es).puede, true);
});

Deno.test("sin permiso sobre el píxel NO cuenta como bien", () => {
  const sinPermiso = { error: { message: "Unsupported post request. Object with ID '123' does not exist, cannot be loaded due to missing permissions, or does not support this operation.", code: 100, error_subcode: 33 } };
  assertEquals(leerRespuestaDelPixel(false, sinPermiso).puede, false, "un píxel ajeno pasó como bueno");
  assertEquals(leerRespuestaDelPixel(false, { error: { message: "(#200) Permissions error", code: 200 } }).puede, false);
});

Deno.test("un token vencido se reporta como token inválido", () => {
  const r = leerRespuestaDelPixel(false, { error: { message: "Error validating access token: Session has expired", code: 190 } });
  assertEquals([r.tokenInvalido, r.puede], [true, null]);
});

Deno.test("una respuesta rara no se da por buena", () => {
  assertEquals(leerRespuestaDelPixel(false, { error: { message: "An unknown error occurred", code: 1 } }).puede, null);
});
