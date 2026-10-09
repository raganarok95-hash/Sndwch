// EL CÓDIGO «BEBIDA» (2026-10-09): el QR de la bolsa regala la bebida más barata del carrito.
//
// Promesa: quien pide sándwich + bebida con el código paga el sándwich, ni un céntimo menos. El
// modo de fallo es SILENCIOSO y cuesta plata: si el descuento fuera el precio entero de la bebida,
// el combo (que ese par ya descontaba) se regalaría encima, en cada pedido del QR, sin que nadie lo
// note. Y sin bebida en el carrito el código no regala nada.
//
// Correr con: npm run test:api
function assertEquals<T>(actual: T, expected: T, msg?: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(msg ?? `esperaba ${JSON.stringify(expected)}, recibí ${JSON.stringify(actual)}`);
  }
}
import { deriveCart } from "../supabase/functions/api/catalog.ts";
import type { LineaDelCarrito } from "../supabase/functions/_shared/dinero.ts";
import { unSignature, unaBebida } from "./carta.ts";

const sandwich = { type: "sig", sigId: unSignature(), size: "15", qty: 1 } as LineaDelCarrito;
const bebida = { type: "side", code: unaBebida(), qty: 1 } as LineaDelCarrito;
const cobra = (items: LineaDelCarrito[]) => deriveCart(items, null, null, false);

Deno.test("sándwich + bebida con el código: se paga lo mismo que el sándwich solo", () => {
  const par = cobra([sandwich, bebida]);
  const solo = cobra([sandwich]).expectedTotal;
  assertEquals(Math.round((par.expectedTotal - par.ahorroBebida) * 100), Math.round(solo * 100));
});

Deno.test("sin bebida en el carrito, el código no tiene qué regalar", () => {
  assertEquals(cobra([sandwich]).ahorroBebida, 0);
});

Deno.test("con dos bebidas regala UNA, y el otro par sigue con su combo", () => {
  const dos = cobra([{ ...sandwich, qty: 2 } as LineaDelCarrito, { ...bebida, qty: 2 } as LineaDelCarrito]);
  const unaMenos = cobra([{ ...sandwich, qty: 2 } as LineaDelCarrito, bebida]).expectedTotal;
  assertEquals(Math.round((dos.expectedTotal - dos.ahorroBebida) * 100), Math.round(unaMenos * 100));
});
