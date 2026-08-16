// SND//WCH — api / email
// Envío del PIN de recuperación de cuenta por correo (Resend).
import { RESEND_API_KEY, FROM_EMAIL, CONTACT_EMAIL, BUSINESS_LEGAL_NAME } from "./env.ts";
import { emailShell, escHtml } from "../_shared/email-shell.ts";
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, user.length - 1))}@${domain}`;
}
async function sendResend(to: string[], subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
export async function sendRecoveryEmail(to: string, name: string, newPin: string): Promise<boolean> {
  const html = emailShell("RECUPERACIÓN DE CUENTA", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Pediste recuperar tu PIN. Este es tu nuevo PIN:</p>
    <p style="font-size:34px;font-weight:900;color:#CBA258;letter-spacing:.1em;margin:16px 0">${newPin}</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Si no fuiste tú, contáctanos de inmediato.</p>
  `);
  return sendResend([to], "SND//WCH — Tu nuevo PIN", html);
}

// Antes ningún correo confirmaba la recepción del pedido en sí — send-order-email
// (la función vieja, invocada desde el cliente) solo se dispara cuando el ADMIN avanza
// el estado, y nunca se llama con status:'RECIBIDO', así que ese primer aviso jamás
// salía para NINGÚN método de pago (hallazgo de la auditoría de flujo de pedidos). Este
// se llama desde el propio servidor en finalizeAndInsertOrder, en el mismo tiro en que
// se crea el pedido — no depende de que el cliente siga conectado ni de que un admin
// haga algo después.
export async function sendOrderConfirmationEmail(to: string, name: string, ref: string, total: number): Promise<boolean> {
  const html = emailShell("TU PEDIDO FUE RECIBIDO //", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Recibimos tu pedido <b style="color:#fff">${escHtml(ref)}</b> por un total de <b style="color:#CBA258">S/${total.toFixed(2)}</b>.</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Te avisaremos por correo cuando pasemos a prepararlo. Puedes seguir el estado de tu pedido en la app, sección PUNTOS → MIS PEDIDOS.</p>
  `);
  return sendResend([to], `SND//WCH — Recibimos tu pedido (${ref})`, html);
}

// Correo de cambio de estado (RECIBIDO ya lo cubre sendOrderConfirmationEmail arriba) —
// antes vivía en la función edge separada `send-order-email`, invocada directo desde el
// cliente SIN ninguna autenticación (relay de correo abierto + HTML sin escapar,
// hallazgo de auditoría de seguridad, CRÍTICO). Movido al servidor, junto al resto de
// notificaciones de este mismo archivo — se llama desde applyOrderStatusUpdate justo
// después de que requireAdmin ya validó la sesión, mismo patrón que el push de esa misma
// función. `send-order-email` queda desplegada pero ahora exige la service role key
// (por si algo más externo la necesitara), ya no la usa esta app.
const STATUS_EMAIL_COPY: Record<string, string> = {
  PREPARANDO: "Estamos preparando tu pedido",
  "EN CAMINO": "Tu pedido salió para entrega",
  ENTREGADO: "Disfruta tu SND//WCH",
};
export async function sendOrderStatusEmail(to: string, name: string, ref: string, status: string, etaMinutes?: number): Promise<boolean> {
  const title = STATUS_EMAIL_COPY[status];
  if (!title) return false;
  const etaLine = (status === "EN CAMINO" && etaMinutes)
    ? `<p style="font-size:20px;font-weight:900;color:#CBA258;margin:16px 0">Tiempo estimado: ${Number(etaMinutes) || 0} minutos</p>`
    : "";
  const html = emailShell(`${escHtml(title.toUpperCase())} //`, `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Tu pedido <b style="color:#fff">${escHtml(ref)}</b> ahora está: <b style="color:#CBA258">${escHtml(status)}</b></p>
    ${etaLine}
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Puedes seguir el estado de tu pedido en la app, sección PUNTOS → MIS PEDIDOS.</p>
  `);
  return sendResend([to], `SND//WCH — ${title} (${ref})`, html);
}

// Copia del reclamo/queja para el consumidor — exigido por el Código de Protección y
// Defensa del Consumidor: al registrar un reclamo se le debe entregar constancia con el
// código y la fecha de recepción.
export async function sendComplaintConfirmation(to: string, name: string, claimCode: string, kind: string): Promise<boolean> {
  const kindLabel = kind === "queja" ? "queja" : "reclamo";
  const html = emailShell("LIBRO DE RECLAMACIONES", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Registramos tu ${kindLabel}. Este es tu código:</p>
    <p style="font-size:28px;font-weight:900;color:#CBA258;letter-spacing:.05em;margin:16px 0">${claimCode}</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Conforme al Código de Protección y Defensa del Consumidor, responderemos dentro de los 15 días hábiles siguientes a la fecha de presentación. Conserva este código para hacer seguimiento.</p>
  `);
  return sendResend([to], `SND//WCH — Constancia de tu ${kindLabel} (${claimCode})`, html);
}

// La respuesta del proveedor, ENVIADA AL CONSUMIDOR. Antes `actAdminRespondComplaint`
// solo guardaba la respuesta en la tabla `complaints` y la mostraba en el panel admin —
// el consumidor nunca se enteraba por ningún canal. El Código de Protección y Defensa del
// Consumidor obliga a RESPONDER al consumidor dentro del plazo, no solo a dejar
// constancia interna de que se redactó una respuesta (hallazgo de auditoría legal).
export async function sendComplaintResponse(
  to: string, name: string, claimCode: string, kind: string, response: string,
): Promise<boolean> {
  const kindLabel = kind === "queja" ? "queja" : "reclamo";
  const html = emailShell("RESPUESTA A TU RECLAMO", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Esta es nuestra respuesta a tu ${kindLabel} <b style="color:#CBA258">${escHtml(claimCode)}</b>:</p>
    <div style="background:#1A3028;border-left:3px solid #CBA258;padding:14px 16px;margin:16px 0;font-size:14px;color:#F2F0EB;line-height:1.7;white-space:pre-wrap">${escHtml(response)}</div>
    <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Si no estás conforme con esta respuesta, puedes acudir a INDECOPI. Conserva tu código de reclamo para cualquier trámite.</p>
  `);
  return sendResend([to], `SND//WCH — Respuesta a tu ${kindLabel} (${claimCode})`, html);
}

// Aviso al negocio de un reclamo/queja nuevo, para que pueda contactar al consumidor y
// responder dentro del plazo legal.
export async function sendComplaintNotification(
  claimCode: string, kind: string, consumerName: string, consumerEmail: string,
  consumerPhone: string, detail: string, consumerRequest: string,
): Promise<boolean> {
  const kindLabel = kind === "queja" ? "QUEJA" : "RECLAMO";
  const html = emailShell(`NUEVO ${kindLabel} — ${claimCode}`, `
    <p style="font-size:13px;color:#F2F0EB;line-height:1.7">
      <b>Consumidor:</b> ${escHtml(consumerName)}<br>
      <b>Correo:</b> ${escHtml(consumerEmail)}<br>
      <b>Teléfono:</b> ${escHtml(consumerPhone)}
    </p>
    <p style="font-size:13px;color:#A8C8B0;line-height:1.6;margin-top:14px"><b>Detalle:</b><br>${escHtml(detail)}</p>
    <p style="font-size:13px;color:#A8C8B0;line-height:1.6;margin-top:10px"><b>Pide:</b><br>${escHtml(consumerRequest)}</p>
    <p style="font-size:11px;color:#ff8888;margin-top:20px">Tienes 15 días hábiles para responder. Hazlo desde el panel admin, sección Reclamaciones.</p>
  `, { maxWidth: 520, wordmarkSize: 22 });
  return sendResend([CONTACT_EMAIL], `[${kindLabel}] ${claimCode} — ${BUSINESS_LEGAL_NAME}`, html);
}
