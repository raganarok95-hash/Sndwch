// SND//WCH — scripts/decidir-capturas
// Aplica a cada captura real (capturas-reales.json, de scripts/capturas-reales.mjs) EXACTAMENTE
// las reglas de producción: parseTransferReceipt → receiptChecks → decisionAutomatica, con el tope
// y el número de cobro de reglas.ts. El pedido se evalúa como si estuviera vivo y sin pagar, y
// «hoy» es el día en que se hizo el pedido: lo que se prueba es la LECTURA, no si ya venció.
import { parseTransferReceipt, receiptChecks, decisionAutomatica } from "../supabase/functions/api/actions/orders.ts";
import { YAPE_AUTO_TOPE, YAPE_NUMERO_COBRO } from "../supabase/functions/_shared/reglas.ts";

const capturas = JSON.parse(await Deno.readTextFile("capturas-reales.json"));
let confirmadas = 0;
for (const { order, texto } of capturas) {
  const fields = parseTransferReceipt(texto);
  const checks = receiptChecks(fields, Number(order.total) || 0, []);
  const hoyLima = new Date(order.created_at).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const vivo = { ...order, status: "RECIBIDO", payment_status: "pending" };
  const d = decisionAutomatica({ checks, fields, order: vivo, hoyLima, tope: YAPE_AUTO_TOPE, numeroCobro: YAPE_NUMERO_COBRO });
  if (d.confirmar) confirmadas++;
  console.log(`\n── ${order.ref} · S/${order.total} · ${order.payment_method} (en la base: ${order.status}/${order.payment_status})`);
  console.log(`   leído: monto ${fields.amount} (candidatos ${JSON.stringify(fields.amountCandidates || [])}) · operación ${fields.opNumber} · celular …${fields.celularFinal} · fecha «${fields.dateText}»`);
  console.log(`   decisión: ${d.confirmar ? "SE CONFIRMA SOLO" : "a revisión"} — ${d.motivo}`);
  console.log(`   texto: ${texto.replace(/\s+/g, " ").slice(0, 400)}`);
}
console.log(`\n${confirmadas} de ${capturas.length} se confirmarían solas.`);
