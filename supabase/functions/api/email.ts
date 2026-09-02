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

// #94 — El reporte de cohortes, al correo del negocio, una vez al mes.
//
// LA ADVERTENCIA DE FIABILIDAD VA ARRIBA DEL TODO, antes de cualquier cifra. Si va al pie,
// se lee después de haber creído los números — y con pocas cohortes esos números se mueven
// varios puntos porque volvió una persona más. Mismo criterio que el plan de tanda.
//
// El correo lleva el detalle y el push solo el titular: son dos momentos distintos, uno se
// mira de pie y el otro sentado.
export async function sendRetentionEmail(
  digest: {
    reliable: boolean; reason: string | null; customers: number; repeatRatePct: number | null;
    rolling30Pct: number | null; daysToSecondMedian: number | null; contributionPerOrder: number | null;
    atRisk: number; headline: string;
  },
  cohorts: { month?: string; customers?: number; withSecond?: number; secondPct?: number; avgOrders?: number; revenue?: number }[],
): Promise<boolean> {
  const fila = (etiqueta: string, valor: string, nota: string) => `
    <tr>
      <td style="padding:7px 0;font-size:12px;color:#8BAF9A">${escHtml(etiqueta)}</td>
      <td style="padding:7px 0;font-size:15px;color:#F2F0EB;text-align:right;white-space:nowrap"><b>${escHtml(valor)}</b></td>
    </tr>
    <tr><td colspan="2" style="padding:0 0 8px;font-size:11px;color:#6E8A7A;line-height:1.5">${escHtml(nota)}</td></tr>`;
  // Un guion, nunca un 0. Un 0 se lee como "medimos y dio cero"; el guion dice "no hay dato".
  const n = (v: number | null, suf = "") => (v === null ? "—" : `${v}${suf}`);

  const aviso = digest.reliable
    ? ""
    : `<p style="background:#3a2a1a;border-left:3px solid #C8963E;padding:10px 12px;font-size:12px;color:#E8C88A;line-height:1.6;margin:0 0 16px">
         <b>Todavía no te fíes de estos porcentajes.</b><br>${escHtml(digest.reason || "")}
       </p>`;

  const filasCohorte = (Array.isArray(cohorts) ? cohorts : []).map((c) => `
    <tr>
      <td style="padding:5px 0;font-size:12px;color:#A8C8B0">${escHtml(String(c.month || ""))}</td>
      <td style="padding:5px 0;font-size:12px;color:#F2F0EB;text-align:right">${escHtml(String(c.customers ?? 0))}</td>
      <td style="padding:5px 0;font-size:12px;color:#F2F0EB;text-align:right">${escHtml(String(c.secondPct ?? 0))}%</td>
      <td style="padding:5px 0;font-size:12px;color:#F2F0EB;text-align:right">${escHtml(String(c.avgOrders ?? 0))}</td>
    </tr>`).join("");

  const html = emailShell("RETENCIÓN DEL MES", `
    ${aviso}
    <p style="font-size:15px;color:#F2F0EB;line-height:1.6;margin:0 0 18px">${escHtml(digest.headline)}</p>
    <table style="width:100%;border-collapse:collapse">
      ${fila("Clientes con al menos un pedido", String(digest.customers), "La base sobre la que se calcula todo lo demás.")}
      ${fila("Hicieron un segundo pedido", n(digest.repeatRatePct, "%"), "El número que decide si el negocio funciona: adquirir sale caro, el segundo pedido es donde se recupera.")}
      ${fila("De los que compraron este mes, ya eran clientes", n(digest.rolling30Pct, "%"), "Si esto baja mientras las ventas suben, estás creciendo comprando clientes nuevos cada mes.")}
      ${fila("Días hasta el segundo pedido (mediana)", n(digest.daysToSecondMedian), "Calibra cuándo tiene sentido el recordatorio de vuelta. Mediana, no promedio: un cliente que volvió a los 6 meses no debe mover la ventana.")}
      ${fila("Contribución por pedido (90 días)", digest.contributionPerOrder === null ? "—" : `S/${digest.contributionPerOrder}`, "Lo que queda después de insumos y comisión de pasarela. No es utilidad: no descuenta tu tiempo ni los fijos.")}
      ${fila("Clientes en riesgo de fuga", String(digest.atRisk), "Compraron y llevan entre 30 y 60 días sin volver. Todavía se pueden recuperar.")}
    </table>
    ${filasCohorte ? `
    <p style="font-size:12px;color:#8BAF9A;margin:22px 0 6px"><b>Por mes de primera compra</b></p>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="font-size:11px;color:#6E8A7A;padding-bottom:4px">Mes</td>
        <td style="font-size:11px;color:#6E8A7A;text-align:right;padding-bottom:4px">Clientes</td>
        <td style="font-size:11px;color:#6E8A7A;text-align:right;padding-bottom:4px">2do pedido</td>
        <td style="font-size:11px;color:#6E8A7A;text-align:right;padding-bottom:4px">Pedidos/cliente</td>
      </tr>
      ${filasCohorte}
    </table>` : ""}
    <p style="font-size:11px;color:#8BAF9A;margin-top:20px">Detalle completo → sndwch.app → PUNTOS → PANEL ADMIN → RETENCIÓN</p>
  `, { maxWidth: 560, wordmarkSize: 22 });
  return sendResend([CONTACT_EMAIL], `SND//WCH — Retención del mes: ${digest.headline}`, html);
}
