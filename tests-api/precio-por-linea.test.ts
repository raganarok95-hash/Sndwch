// EL PRECIO DE CADA LÍNEA SE GUARDA CON EL PEDIDO (2026-09-30, detalle de un pedido aprobado).
// El detalle muestra lo que costó cada cosa ESE día; el panel puede cambiar la carta después.
// Modo de fallo: SILENCIO. Sin `precio`, el detalle no tiene de dónde sacarlo y o calla o
// recalcula con la carta de hoy, que es un número que el cliente nunca pagó.
function assertEquals(actual: unknown, expected: unknown, msg?: string) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(msg ?? `esperaba ${e}, recibí ${a}`);
}
import { deriveCart, priceCartItem } from "../supabase/functions/api/catalog.ts";
import { unSignature } from "./carta.ts";

const HORA_NORMAL = "2026-09-10T01:00:00.000Z";
const SIG = unSignature(() => true);

Deno.test("cada línea guardada lleva su precio unitario, el mismo con que se cobró", () => {
  const linea = { type: "sig", sigId: SIG, size: "30", qty: 2 };
  const r = deriveCart([linea], null, HORA_NORMAL);
  assertEquals(r.sanitizedItems[0].precio, priceCartItem(linea).unitPrice);
});

Deno.test("el precio guardado no vuelve a entrar: al repetir, el servidor lo recalcula", () => {
  const r = deriveCart([{ type: "sig", sigId: SIG, size: "15", qty: 1, precio: 0.01 }], null, HORA_NORMAL);
  assertEquals(r.sanitizedItems[0].precio === 0.01, false, "el servidor creyó el precio del cliente");
});
