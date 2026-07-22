import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — create-charge
// Recibe un token de Culqi (generado en el navegador, nunca los datos reales de la tarjeta)
// y realiza el cobro server-side usando la llave secreta protegida.
// Responsabilidad única: cobrar. El cliente (index.html) se encarga de crear el pedido
// y acreditar puntos una vez que este endpoint confirma el pago, igual que el resto de la app.
//
// Antes cobraba el monto que viniera en el cuerpo de la petición sin verificar nada más —
// orderRef era metadata inerte, nunca comprobada. Eso lo dejaba como un oráculo de cobro
// ciego: cualquiera con un token de Culqi válido (el suyo propio, con su propia tarjeta)
// podía cobrarse a sí mismo cualquier monto sin pasar por prepare-order, y una llamada
// concurrente/duplicada para la misma referencia podía generar dos cobros reales
// (hallazgo de la re-auditoría de pagos). Ahora exige una reserva real y vigente en
// pending_charges (creada por actPrepareOrder en la función api) que coincida en monto, y
// la reclama atómicamente (pending -> charging) ANTES de llamar a Culqi — una segunda
// llamada para la misma referencia mientras la primera sigue en vuelo encuentra la fila ya
// en 'charging' y se rechaza antes de generar un segundo cobro real.
//
// La reserva/reclamo/cobro/logging en sí viven en _shared/culqi-claim.ts, compartidos
// byte a byte con create-credit-charge (eran ~95% el mismo archivo — hallazgo de
// auditoría de arquitectura de código). Este archivo solo valida la forma del pedido
// y arma la config específica de "pedido" (tabla, campos, mensajes).

import { claimAndChargeCulqi } from "../_shared/culqi-claim.ts";

const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");
// Provistas automáticamente por Supabase a toda función edge del proyecto — no requieren
// configuración manual de secrets aparte, a diferencia de CULQI_SECRET_KEY.
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
    return json({ error: "CULQI_SECRET_KEY no configurada. Ve a Supabase → Edge Functions → create-charge → Secrets y agrégala." }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const { token, amountSoles, email, orderRef } = body || {};

  if (!token || !amountSoles || !email || !orderRef) {
    return json({ error: "Faltan datos: token, amountSoles, email y orderRef son obligatorios." }, 400);
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
    table: "pending_charges",
    amountField: "expected_total",
    refValue: orderRef,
    amountCents,
    email,
    token,
    description: `SND//WCH pedido ${orderRef}`,
    metadataKey: "order_ref",
    source: "create-charge",
    notFoundMsg: "No encontramos una reserva de pago válida para este pedido. Vuelve a intentar tu pedido.",
    expiredMsg: "Tu reserva expiró. Vuelve a intentar tu pedido — el inventario ya se liberó.",
    mismatchMsg: "El monto no coincide con tu pedido.",
    conflictMsg: "Ya hay un cobro en proceso para este pedido. Espera un momento antes de reintentar.",
  });

  if (!result.ok) {
    return json({ error: result.error, ...(result.culqi ? { culqi: result.culqi } : {}) }, result.status);
  }

  // Cobro real ya realizado — la reserva quedó liberada de vuelta a 'pending' (no antes)
  // para que actConfirmCulqiOrder (función api) pueda hacer su propio reclamo atómico
  // pending -> consumed al crear el pedido, exactamente igual que siempre.
  return json({
    success: true,
    chargeId: result.chargeId,
    outcome: result.outcome,
    orderRef,
  });
});
