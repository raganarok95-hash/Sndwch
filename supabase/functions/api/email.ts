// SND//WCH — api / email
// Envío del PIN de recuperación de cuenta por correo (Resend).
import { RESEND_API_KEY, FROM_EMAIL, CONTACT_EMAIL, BUSINESS_LEGAL_NAME } from "./env.ts";

function escHtml(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, user.length - 1))}@${domain}`;
}
export async function sendRecoveryEmail(to: string, name: string, newPin: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">RECUPERACIÓN DE CUENTA</div>
          <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name || ""},</p>
          <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Pediste recuperar tu PIN. Este es tu nuevo PIN:</p>
          <p style="font-size:34px;font-weight:900;color:#CBA258;letter-spacing:.1em;margin:16px 0">${newPin}</p>
          <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Si no fuiste tú, contáctanos de inmediato.</p>
        </div>
      </div>
    `;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: "SND//WCH — Tu nuevo PIN", html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Copia del reclamo/queja para el consumidor — exigido por el Código de Protección y
// Defensa del Consumidor: al registrar un reclamo se le debe entregar constancia con el
// código y la fecha de recepción.
export async function sendComplaintConfirmation(to: string, name: string, claimCode: string, kind: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const kindLabel = kind === "queja" ? "queja" : "reclamo";
    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">LIBRO DE RECLAMACIONES</div>
          <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${escHtml(name)},</p>
          <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Registramos tu ${kindLabel}. Este es tu código:</p>
          <p style="font-size:28px;font-weight:900;color:#CBA258;letter-spacing:.05em;margin:16px 0">${claimCode}</p>
          <p style="font-size:12px;color:#8BAF9A;margin-top:20px">Conforme al Código de Protección y Defensa del Consumidor, responderemos dentro de los 30 días calendario siguientes a la fecha de presentación. Conserva este código para hacer seguimiento.</p>
        </div>
      </div>
    `;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `SND//WCH — Constancia de tu ${kindLabel} (${claimCode})`, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Aviso al negocio de un reclamo/queja nuevo, para que pueda contactar al consumidor y
// responder dentro del plazo legal.
export async function sendComplaintNotification(
  claimCode: string, kind: string, consumerName: string, consumerEmail: string,
  consumerPhone: string, detail: string, consumerRequest: string,
): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const kindLabel = kind === "queja" ? "QUEJA" : "RECLAMO";
    const html = `
      <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
        <div style="max-width:520px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
          <div style="font-size:22px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
          <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">NUEVO ${kindLabel} — ${claimCode}</div>
          <p style="font-size:13px;color:#F2F0EB;line-height:1.7">
            <b>Consumidor:</b> ${escHtml(consumerName)}<br>
            <b>Correo:</b> ${escHtml(consumerEmail)}<br>
            <b>Teléfono:</b> ${escHtml(consumerPhone)}
          </p>
          <p style="font-size:13px;color:#A8C8B0;line-height:1.6;margin-top:14px"><b>Detalle:</b><br>${escHtml(detail)}</p>
          <p style="font-size:13px;color:#A8C8B0;line-height:1.6;margin-top:10px"><b>Pide:</b><br>${escHtml(consumerRequest)}</p>
          <p style="font-size:11px;color:#ff8888;margin-top:20px">Tienes 30 días calendario para responder. Hazlo desde el panel admin, sección Reclamaciones.</p>
        </div>
      </div>
    `;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [CONTACT_EMAIL], subject: `[${kindLabel}] ${claimCode} — ${BUSINESS_LEGAL_NAME}`, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
