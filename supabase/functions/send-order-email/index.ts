import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// La API key de Resend es un secreto real y DEBE venir de una variable de entorno —
// nunca un valor por defecto hardcodeado aquí (quien lea este archivo podría enviar
// correos desde el dominio del negocio). Configúrala con: supabase secrets set RESEND_API_KEY=...
import { debugLog } from "../_shared/sb.ts";
import { emailShell } from "../_shared/email-shell.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const SOURCE = "send-order-email";

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

const STATUS_COPY: Record<string, { subject: string; title: string }> = {
  RECIBIDO: { subject: "Recibimos tu pedido", title: "Tu pedido fue recibido" },
  PREPARANDO: { subject: "Estamos preparando tu pedido", title: "Tu pedido está en preparación" },
  "EN CAMINO": { subject: "Tu pedido va en camino", title: "Tu pedido salió para entrega" },
  ENTREGADO: { subject: "Tu pedido fue entregado", title: "Disfruta tu SND//WCH" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  if (!RESEND_API_KEY) {
    await debugLog(SOURCE, { stage: "no_key" });
    return json({ error: "RESEND_API_KEY no configurada." }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }

  const { to, customerName, orderRef, status, etaMinutes } = body || {};

  if (!to || !orderRef || !status) {
    return json({ error: "Faltan datos: to, orderRef y status son obligatorios." }, 400);
  }

  const copy = STATUS_COPY[status] || { subject: "Actualización de tu pedido", title: "Actualización de tu pedido" };
  const nameLine = customerName ? `Hola ${customerName},` : "Hola,";
  const etaLine = (status === "EN CAMINO" && etaMinutes)
    ? `<p style="font-size:20px;font-weight:900;color:#CBA258;margin:16px 0">Tiempo estimado: ${etaMinutes} minutos</p>`
    : "";

  const html = emailShell(`${copy.title.toUpperCase()} //`, `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">${nameLine}</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Tu pedido <b style="color:#fff">${orderRef}</b> ahora está: <b style="color:#CBA258">${status}</b></p>
    ${etaLine}
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Puedes seguir el estado de tu pedido en la app, sección PUNTOS → MIS PEDIDOS.</p>
  `);

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `SND//WCH — ${copy.subject} (${orderRef})`,
        html,
      }),
    });
    const data = await r.json().catch(() => ({}));
    await debugLog(SOURCE, { stage: "resend_response", ok: r.ok, statusCode: r.status, data, sentTo: to, from: FROM_EMAIL });
    if (!r.ok) {
      return json({ error: data?.message || "Resend rechazó el envío.", detail: data }, 502);
    }
    return json({ success: true, id: data?.id });
  } catch (e) {
    await debugLog(SOURCE, { stage: "fetch_exception", error: String(e) });
    return json({ error: "No se pudo conectar con Resend: " + String(e) }, 502);
  }
});
