import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — birthday-bonus
// Cron diario: le regala puntos a los clientes que cumplen años hoy.
// birthday_pts_year evita que se le acredite dos veces el mismo año.

import { sbGet, sbInsert, sbUpdate, debugLog, verifyCronSecret } from "../_shared/sb.ts";
import { emailShell } from "../_shared/email-shell.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const BIRTHDAY_POINTS = 100;
const SOURCE = "birthday-bonus";

async function sendBirthdayEmail(to: string, name: string, newPoints: number) {
  if (!RESEND_API_KEY) return { ok: false, data: { skipped: true } };
  const html = emailShell("FELIZ CUMPLEAÑOS //", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Para celebrar te regalamos <b style="color:#CBA258">+${BIRTHDAY_POINTS} puntos</b>. Ya están en tu cuenta.</p>
    <p style="font-size:28px;font-weight:900;color:#CBA258;margin:16px 0">${newPoints} pts</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:10px">Canjéalos en sndwch.app → PUNTOS → CANJEAR 🎉</p>
  `);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `SND//WCH — ¡Feliz cumpleaños! Te regalamos ${BIRTHDAY_POINTS} pts 🎂`, html }),
  });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  if (!(await verifyCronSecret(req.headers.get("x-cron-secret")))) return new Response("No autorizado", { status: 401 });

  try {
    const limaNow = new Date(Date.now() - 5 * 3600000);
    const mm = String(limaNow.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(limaNow.getUTCDate()).padStart(2, "0");
    const year = limaNow.getUTCFullYear();
    const monthDay = `-${mm}-${dd}`; // birthday se guarda como YYYY-MM-DD
    // En años no bisiestos Feb 29 nunca "llega", así que esos clientes no cobraban su
    // regalo ningún día del año. Se les otorga el 28 de febrero en su lugar (mismo criterio
    // que usan bancos/tarjetas de crédito para cumpleaños bisiestos).
    const alsoMatchFeb29 = mm === "02" && dd === "28" && !isLeapYear(year);

    const customers = await sbGet("customers", "select=phone,name,email,points,birthday,birthday_pts_year&birthday=not.is.null");
    const todaysBirthdays = customers.filter((c: any) =>
      typeof c.birthday === "string" &&
      (c.birthday.endsWith(monthDay) || (alsoMatchFeb29 && c.birthday.endsWith("-02-29"))) &&
      (c.birthday_pts_year || 0) !== year
    );

    let granted = 0;
    for (const c of todaysBirthdays) {
      const newPoints = (c.points || 0) + BIRTHDAY_POINTS;
      await sbInsert("transactions", {
        customer_phone: c.phone,
        type: "earn_confirmed",
        points: BIRTHDAY_POINTS,
        description: "Regalo de cumpleaños",
        confirmed: true,
      });
      await sbUpdate("customers", `phone=eq.${encodeURIComponent(c.phone)}`, { points: newPoints, birthday_pts_year: year });
      granted++;
      if (c.email) {
        try {
          const res = await sendBirthdayEmail(c.email, c.name, newPoints);
          await debugLog(SOURCE, { stage: "email_sent", phone: c.phone, ok: res.ok });
        } catch (e) {
          await debugLog(SOURCE, { stage: "email_failed", phone: c.phone, error: String(e) });
        }
      }
    }

    await debugLog(SOURCE, { stage: "done", checked: customers.length, granted });
    return new Response(JSON.stringify({ success: true, granted }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await debugLog(SOURCE, { stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
