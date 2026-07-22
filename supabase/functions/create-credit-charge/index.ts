import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — create-credit-charge
// Cobra el Plan Semanal: el comprador paga con su tarjeta (vía Culqi) y recibe saldo
// propio al instante. Deliberadamente una función aparte de create-charge (no comparten
// tabla): create-charge reclama contra pending_charges (reserva de un PEDIDO — dirección,
// items, inventario reservado); esta reclama contra pending_weekly_plans (reserva de una
// RECARGA DE SALDO — sin inventario ni destinatario de por medio). Mismo patrón de
// seguridad que create-charge: la reserva real y vigente (creada por actPrepareWeeklyPlan
// en la función api) debe coincidir en monto, y se reclama atómicamente (pending ->
// charging) ANTES de llamar a Culqi — una segunda llamada para la misma referencia
// mientras la primera sigue en vuelo encuentra la fila ya en 'charging' y se rechaza antes
// de generar un segundo cobro real.
//
// Antes esta función reclamaba contra pending_credit_purchases (la tarjeta de regalo, que
// SÍ pagaba con Culqi). El rediseño de la tarjeta de regalo a puntos (sin ningún cobro
// real) eliminó esa tabla — Plan Semanal queda como el único consumidor, así que esta
// función ahora reclama contra su tabla (pending_weekly_plans), que es la que de verdad
// usa desde que existe (nunca compartió pending_credit_purchases pese a lo que decía este
// comentario antes — ver actPrepareWeeklyPlan en customer.ts).
//
// La reserva/reclamo/cobro/logging en sí viven en _shared/culqi-claim.ts, compartidos
// byte a byte con create-charge (eran ~95% el mismo archivo — hallazgo de auditoría de
// arquitectura de código). Este archivo solo valida la forma de la compra y arma la
// config específica de "Plan Semanal" (tabla, campos, mensajes).

import { claimAndChargeCulqi } from "../_shared/culqi-claim.ts";

const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");
const SB_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  if (!CULQI_SECRET_KEY) {
    return json({ error: "CULQI_SECRET_KEY no configurada. Ve a Supabase → Edge Functions → create-credit-charge → Secrets y agrégala." }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const { token, amountSoles, email, ref } = body || {};

  if (!token || !amountSoles || !email || !ref) {
    return json({ error: "Faltan datos: token, amountSoles, email y ref son obligatorios." }, 400);
  }

  const amountCents = Math.round(Number(amountSoles) * 100);
  if (!amountCents || amountCents < 100) {
    return json({ error: "Monto inválido." }, 400);
  }

  if (!SB_URL || !SERVICE_KEY) {
    return json({ error: "Configuración incompleta del servidor." }, 500);
  }

  const result = await claimAndChargeCulqi({
    sbUrl: SB_URL,
    serviceKey: SERVICE_KEY,
    culqiSecretKey: CULQI_SECRET_KEY,
    table: "pending_weekly_plans",
    amountField: "amount_paid",
    refValue: ref,
    amountCents,
    email,
    token,
    description: `SND//WCH Plan Semanal ${ref}`,
    metadataKey: "credit_ref",
    source: "create-credit-charge",
    notFoundMsg: "No encontramos una reserva de compra válida. Vuelve a intentarlo.",
    expiredMsg: "Tu reserva expiró. Vuelve a intentarlo.",
    mismatchMsg: "El monto no coincide con tu compra.",
    conflictMsg: "Ya hay un cobro en proceso para esta compra. Espera un momento antes de reintentar.",
  });

  if (!result.ok) {
    return json({ error: result.error, ...(result.culqi ? { culqi: result.culqi } : {}) }, result.status);
  }

  // Cobro real ya realizado — la reserva quedó liberada de vuelta a 'pending' (no antes)
  // para que actConfirmWeeklyPlan (función api) pueda hacer su propio reclamo atómico
  // pending -> consumed al acreditar el saldo, exactamente igual que create-charge.
  return json({
    success: true,
    chargeId: result.chargeId,
    outcome: result.outcome,
    ref,
  });
});
