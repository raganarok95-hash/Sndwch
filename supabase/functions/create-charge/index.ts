import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — create-charge
// Recibe un token de Culqi (generado en el navegador, nunca los datos reales de la tarjeta)
// y realiza el cobro server-side usando la llave secreta protegida.
// Responsabilidad única: cobrar. El cliente (index.html) se encarga de crear el pedido
// y acreditar puntos una vez que este endpoint confirma el pago, igual que el resto de la app.

const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY");

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
    return json({ error: "No se pudo conectar con Culqi: " + String(e) }, 502);
  }

  const culqiData = await culqiResp.json().catch(() => ({}));

  if (!culqiResp.ok) {
    const msg = culqiData?.user_message || culqiData?.merchant_message || "El pago fue rechazado.";
    return json({ error: msg, culqi: culqiData }, 402);
  }

  return json({
    success: true,
    chargeId: culqiData.id,
    outcome: culqiData.outcome?.type,
    orderRef,
  });
});
