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

// Ver el mismo comentario en create-charge/index.ts — esta función tampoco escribía a
// debug_logs pese a mover dinero real (hallazgo de auditoría de arquitectura backend/
// observabilidad). best-effort: un fallo al loguear nunca debe tumbar el cobro.
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ source: "create-credit-charge", detail }),
    });
  } catch (_e) { /* nunca debe tumbar la respuesta real */ }
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
  const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

  const pcResp = await fetch(
    `${SB_URL}/rest/v1/pending_weekly_plans?ref=eq.${encodeURIComponent(ref)}&status=eq.pending&select=id,amount_paid,expires_at`,
    { headers: sbHeaders },
  );
  if (!pcResp.ok) return json({ error: "No se pudo verificar la reserva de tu compra." }, 500);
  const pcRows = await pcResp.json();
  const pc = pcRows[0];
  if (!pc) return json({ error: "No encontramos una reserva de compra válida. Vuelve a intentarlo." }, 404);
  if (new Date(pc.expires_at).getTime() < Date.now()) {
    return json({ error: "Tu reserva expiró. Vuelve a intentarlo." }, 410);
  }
  if (Math.round(Number(pc.amount_paid) * 100) !== amountCents) {
    return json({ error: "El monto no coincide con tu compra." }, 400);
  }

  const claimResp = await fetch(
    `${SB_URL}/rest/v1/pending_weekly_plans?id=eq.${pc.id}&status=eq.pending`,
    { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=representation" }, body: JSON.stringify({ status: "charging" }) },
  );
  const claimed = claimResp.ok ? await claimResp.json() : [];
  if (!claimed.length) {
    await debugLog({ event: "claim-conflict", ref, pendingPlanId: pc.id });
    return json({ error: "Ya hay un cobro en proceso para esta compra. Espera un momento antes de reintentar." }, 409);
  }

  async function releaseClaim() {
    try {
      await fetch(`${SB_URL}/rest/v1/pending_weekly_plans?id=eq.${pc.id}&status=eq.charging`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({ status: "pending" }),
      });
    } catch (_e) { /* el cron de expiración igual limpia una fila 'charging' atascada */ }
  }

  let culqiResp: Response;
  try {
    culqiResp = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CULQI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents,
        currency_code: "PEN",
        email: email,
        source_id: token,
        description: `SND//WCH Plan Semanal ${ref}`,
        metadata: { credit_ref: ref },
      }),
    });
  } catch (e) {
    await releaseClaim();
    await debugLog({ event: "culqi-fetch-failed", ref, amountCents, error: String(e) });
    return json({ error: "No se pudo conectar con Culqi: " + String(e) }, 502);
  }

  const culqiData = await culqiResp.json().catch(() => ({}));

  if (!culqiResp.ok) {
    await releaseClaim();
    const msg = culqiData?.user_message || culqiData?.merchant_message || "El pago fue rechazado.";
    await debugLog({ event: "culqi-rejected", ref, amountCents, status: culqiResp.status, culqi: culqiData });
    return json({ error: msg, culqi: culqiData }, 402);
  }

  // Cobro real ya realizado — se libera la reserva de vuelta a 'pending' (no antes) para
  // que actConfirmWeeklyPlan (función api) pueda hacer su propio reclamo atómico
  // pending -> consumed al acreditar el saldo, exactamente igual que create-charge.
  await releaseClaim();
  await debugLog({ event: "charge-succeeded", ref, amountCents, chargeId: culqiData.id });

  return json({
    success: true,
    chargeId: culqiData.id,
    outcome: culqiData.outcome?.type,
    ref,
  });
});
