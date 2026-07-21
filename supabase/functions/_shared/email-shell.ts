// SND//WCH — _shared/email-shell
// Wrapper HTML de marca (fondo verde oscuro, tarjeta, wordmark "SND//WCH") reusado por
// TODOS los correos de la app — antes se repetía el mismo bloque literal en 5 archivos
// distintos (api/email.ts x4 funciones, daily-summary, birthday-bonus, winback-campaign,
// send-order-email) sin ningún helper común, así que un cambio de paleta de marca (libre
// de cambiar, ver CLAUDE.md) obligaba a editar el mismo string 5+ veces sin garantía de
// que quedara consistente (hallazgo de auditoría de arquitectura de código, ALTO).
export function emailShell(eyebrow: string, bodyHtml: string, opts?: { maxWidth?: number; wordmarkSize?: number }): string {
  const maxWidth = opts?.maxWidth ?? 420;
  const wordmarkSize = opts?.wordmarkSize ?? 26;
  return `
    <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
      <div style="max-width:${maxWidth}px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
        <div style="font-size:${wordmarkSize}px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
        <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">${eyebrow}</div>
        ${bodyHtml}
      </div>
    </div>
  `;
}
