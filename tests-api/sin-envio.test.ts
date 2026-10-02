// Un Signature que no cobra envío (catalog_items.sin_envio), 2026-10-02.
//
// POR QUÉ EXISTE. El sándwich de prueba del dueño va sin envío. Si la regla se afloja (basta una
// línea así para no cobrar, o un armado cuenta), el envío deja de cobrarse en pedidos normales y
// nada revienta: el motorizado igual cobra y la diferencia sale del bolsillo. Modo de fallo: silencio.
//
// Correr con: npm run test:api
import { assertEquals } from "jsr:@std/assert@1";
const { carritoSinEnvio, SIG_DATA } = await import("../supabase/functions/api/catalog.ts");

const normal = Object.keys(SIG_DATA)[0];
SIG_DATA["SIG91"] = { ...SIG_DATA[normal], sinEnvio: true };
const prueba = { type: "sig", sigId: "SIG91", size: "15", qty: 1 };

Deno.test("solo productos sin envío: el envío es 0", () => {
  assertEquals(carritoSinEnvio([prueba]), true);
  assertEquals(carritoSinEnvio([prueba, { ...prueba, qty: 2 }]), true);
});

Deno.test("una sola línea normal y el envío se cobra completo", () => {
  assertEquals(carritoSinEnvio([prueba, { type: "sig", sigId: normal, size: "15", qty: 1 }]), false);
  assertEquals(carritoSinEnvio([prueba, { type: "byo", prot: "P99", size: "15", qty: 1 }]), false);
  assertEquals(carritoSinEnvio([prueba, { type: "side", code: "D99", qty: 1 }]), false);
  assertEquals(carritoSinEnvio([{ type: "sig", sigId: normal, size: "15", qty: 1 }]), false);
  assertEquals(carritoSinEnvio([]), false);
  assertEquals(carritoSinEnvio(null), false);
});
