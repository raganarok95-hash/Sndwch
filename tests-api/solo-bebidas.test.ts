// SOLO BEBIDAS, NO (dueño, 2026-09-30): un pedido sin ningún sándwich se rechaza al crearlo.
// Los ítems son los saneados por deriveCart ({ type, ... }).
function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
}
import { assertTraeSandwich } from "../supabase/functions/api/actions/orders.ts";

const rechaza = (items: Record<string, unknown>[]) => {
  try { assertTraeSandwich(items); return false; } catch { return true; }
};

Deno.test("un pedido de solo bebidas se rechaza", () => {
  assertEquals(rechaza([{ type: "side", code: "X", qty: 2 }]), true);
});

Deno.test("un sándwich con bebida pasa, sea Signature o armado", () => {
  assertEquals(rechaza([{ type: "sig", sigId: "X", size: "15", qty: 1 }, { type: "side", code: "X", qty: 1 }]), false);
  assertEquals(rechaza([{ type: "byo", prot: "X", size: "15", qty: 1 }]), false);
});
