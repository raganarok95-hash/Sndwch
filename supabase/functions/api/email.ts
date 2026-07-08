// SND//WCH — api / email
// Envío del PIN de recuperación de cuenta por correo (Resend).
import { RESEND_API_KEY, FROM_EMAIL } from "./env.ts";

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
