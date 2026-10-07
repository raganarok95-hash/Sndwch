// «YA ME LLEGÓ» — el cliente cierra su propio pedido (2026-10-07, docs/PANEL_NUEVO.md §8).
//
// Promesa: el cliente puede cerrar un pedido que va EN CAMINO, salvo un contra entrega sin
// cobrar. Modo de fallo silencioso: marcar ENTREGADO es lo que registra el cobro de un contra
// entrega (y suma los puntos). Si el cliente pudiera cerrarlo, quedaría cobrado un pedido cuya
// plata nadie vio — sin error, sin aviso, y la caja del día no cuadraría.
//
// Correr con: npm run test:api
import { porQueNoPuedeCerrarElCliente } from "../supabase/functions/api/actions/orders.ts";

function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

Deno.test("un contra entrega sin cobrar NO lo cierra el cliente", () => {
  assert(porQueNoPuedeCerrarElCliente({ status: "EN CAMINO", payment_method: "cod", payment_status: "pending" }) !== null,
    "el cliente pudo cerrar un contra entrega sin cobrar: quedaría cobrado sin que nadie vea la plata");
});

Deno.test("un pedido ya pagado que va en camino sí lo cierra el cliente", () => {
  for (const m of ["yape", "plin", "card", "credit"]) {
    assert(porQueNoPuedeCerrarElCliente({ status: "EN CAMINO", payment_method: m, payment_status: "paid" }) === null, m + " pagado no se pudo cerrar");
  }
  // Un contra entrega que el dueño ya marcó cobrado tampoco mueve plata al cerrarse.
  assert(porQueNoPuedeCerrarElCliente({ status: "EN CAMINO", payment_method: "cod", payment_status: "paid" }) === null, "cod ya cobrado no se pudo cerrar");
});

Deno.test("solo desde EN CAMINO: no se salta la cocina ni revive un cancelado", () => {
  for (const st of ["RECIBIDO", "PREPARANDO", "CANCELADO"]) {
    assert(porQueNoPuedeCerrarElCliente({ status: st, payment_method: "card", payment_status: "paid" }) !== null, st + " se pudo cerrar");
  }
});
