// Un código de descuento creado en el panel (admin-promo-create, 2026-10-02).
//
// POR QUÉ EXISTE. Un descuento fijo no tenía techo (S/2000 por S/20 regala pedidos) y las fechas
// pasaban sin leer: un «hasta» anterior al «desde» creaba un código que el panel mostraba activo y
// nadie podía usar. Nada revienta: se regala plata o la campaña muere sola. Modo de fallo: silencio.
//
// Correr con: npm run test:api
import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { validarEntrada } from "../supabase/functions/api/entrada.ts";
const { vigenciaDePromo } = await import("../supabase/functions/api/actions/admin.ts");

const base = { token: "t", code: "PRUEBA10", discountType: "fixed", value: 10 };

Deno.test("un descuento fuera de rango (0, o S/2000 por un tipeo) se rechaza", () => {
  assertThrows(() => validarEntrada("admin-promo-create", { ...base, value: 0 }, "x"));
  assertThrows(() => validarEntrada("admin-promo-create", { ...base, value: 2000 }, "x"));
  assertThrows(() => validarEntrada("admin-promo-create", { ...base, maxDiscount: "abc" }, "x"));
  assertEquals(validarEntrada("admin-promo-create", { ...base, value: "10" }, "x").value, 10);
  assertEquals(validarEntrada("admin-promo-create", { ...base, maxUses: "" }, "x").maxUses, null);
});

Deno.test("un código no nace vencido ni con las fechas al revés", () => {
  const ahora = Date.parse("2026-10-02T12:00:00Z");
  assertThrows(() => vigenciaDePromo("", "2026-10-01T00:00:00Z", ahora), Error, "ya pasó");
  assertThrows(() => vigenciaDePromo("2026-10-20T00:00:00Z", "2026-10-10T00:00:00Z", ahora), Error, "anterior");
  assertThrows(() => vigenciaDePromo("mañana", "", ahora), Error, "no es válida");
  assertEquals(vigenciaDePromo("", "", ahora), { validFrom: null, validUntil: null });
  assertEquals(vigenciaDePromo("", "2026-10-31T00:00:00Z", ahora).validUntil, "2026-10-31T00:00:00.000Z");
});
