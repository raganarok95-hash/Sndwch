// SIN SÁNDWICH, BEBIDAS DESDE 2 (dueño, 2026-10-21: «si es sin sándwich, se venden a partir de dos
// latas»; del 2026-09-30 a esa fecha no se vendían solas). Un pedido sin sándwich con menos de
// BEBIDAS_SIN_SANDWICH_DESDE bebidas se rechaza al crearlo; con un sándwich, cualquier cantidad.
// Modo de fallo: SILENCIO y plata. Si el mínimo no se cuenta por unidades (qty), una línea de
// «2 × la misma bebida» rebota sin motivo; si no se exige, sale un motorizado por una sola lata.
// Los ítems son los saneados por deriveCart ({ type, ... }).
function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
import { assertSandwichOBebidas } from "../supabase/functions/api/actions/orders.ts";
import { BEBIDAS_SIN_SANDWICH_DESDE as MIN } from "../supabase/functions/_shared/reglas.ts";

const rechaza = (items: Record<string, unknown>[]) => {
  try { assertSandwichOBebidas(items); return false; } catch { return true; }
};

Deno.test("sin sándwich, menos bebidas que el mínimo se rechaza", () => {
  assertEquals(rechaza([{ type: "side", code: "X", qty: MIN - 1 }]), true);
});

Deno.test("sin sándwich, el mínimo de bebidas pasa, en una línea o en varias", () => {
  assertEquals(rechaza([{ type: "side", code: "X", qty: MIN }]), false);
  assertEquals(rechaza(Array.from({ length: MIN }, (_, i) => ({ type: "side", code: `X${i}`, qty: 1 }))), false);
});

Deno.test("con un sándwich pasa con una bebida o ninguna, sea Signature o armado", () => {
  assertEquals(rechaza([{ type: "sig", sigId: "X", size: "15", qty: 1 }, { type: "side", code: "X", qty: 1 }]), false);
  assertEquals(rechaza([{ type: "byo", prot: "X", size: "15", qty: 1 }]), false);
});
