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
  const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

  const pcResp = await fetch(
    `${SB_URL}/rest/v1/pending_charges?ref=eq.${encodeURIComponent(orderRef)}&status=eq.pending&select=id,expected_total,expires_at`,
    { headers: sbHeaders },
  );
  if (!pcResp.ok) return json({ error: "No se pudo verificar la reserva de tu pedido." }, 500);
  const pcRows = await pcResp.json();
  const pc = pcRows[0];
  if (!pc) return json({ error: "No encontramos una reserva de pago válida para este pedido. Vuelve a intentar tu pedido." }, 404);
  if (new Date(pc.expires_at).getTime() < Date.now()) {
    return json({ error: "Tu reserva expiró. Vuelve a intentar tu pedido — el inventario ya se liberó." }, 410);
  }
  if (Math.round(Number(pc.expected_total) * 100) !== amountCents) {
    return json({ error: "El monto no coincide con tu pedido." }, 400);
  }

  // Reclamo atómico pending -> charging: si otra llamada para esta misma referencia ya está
  // en vuelo (doble tap, reintento de red, o un intento directo fuera del flujo normal),
  // esta actualización encuentra 0 filas y se rechaza ANTES de cobrar en Culqi.
  const claimResp = await fetch(
    `${SB_URL}/rest/v1/pending_charges?id=eq.${pc.id}&status=eq.pending`,
    { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=representation" }, body: JSON.stringify({ status: "charging" }) },
  );
  const claimed = claimResp.ok ? await claimResp.json() : [];
  if (!claimed.length) {
    return json({ error: "Ya hay un cobro en proceso para este pedido. Espera un momento antes de reintentar." }, 409);
  }

  async function releaseClaim() {
    try {
      await fetch(`${SB_URL}/rest/v1/pending_charges?id=eq.${pc.id}&status=eq.charging`, {
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
        description: `SND//WCH pedido ${orderRef}`,
        metadata: { order_ref: orderRef },
      }),
    });
  } catch (e) {
    await releaseClaim();
    return json({ error: "No se pudo conectar con Culqi: " + String(e) }, 502);
  }

  const culqiData = await culqiResp.json().catch(() => ({}));

  if (!culqiResp.ok) {
    await releaseClaim();
    const msg = culqiData?.user_message || culqiData?.merchant_message || "El pago fue rechazado.";
    return json({ error: msg, culqi: culqiData }, 402);
  }

  // Cobro real ya realizado — se libera la reserva de vuelta a 'pending' (no antes) para
  // que actConfirmCulqiOrder (función api) pueda hacer su propio reclamo atómico
  // pending -> consumed al crear el pedido, exactamente igual que siempre.
  await releaseClaim();

  return json({
    success: true,
    chargeId: culqiData.id,
    outcome: culqiData.outcome?.type,
    orderRef,
  });
});
