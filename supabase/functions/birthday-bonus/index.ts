import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — birthday-bonus
// Cron diario: le regala puntos a los clientes que cumplen años hoy.
// birthday_pts_year evita que se le acredite dos veces el mismo año.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const BIRTHDAY_POINTS = 100;

function sbHeaders(extra?: Record<string, string>) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra };
}
async function sbGet(table: string, query: string) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Error leyendo ${table}: ${await r.text()}`);
  return r.json();
}
async function sbInsert(table: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Error creando en ${table}: ${await r.text()}`);
  return r.json();
}
async function sbUpdate(table: string, query: string, data: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: "PATCH", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`Error actualizando ${table}: ${await r.text()}`);
  return r.json();
}
async function debugLog(detail: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/debug_logs`, { method: "POST", headers: sbHeaders({ Prefer: "return=minimal" }), body: JSON.stringify({ source: "birthday-bonus", detail }) });
  } catch (_e) {}
}
// El secreto compartido con pg_cron ya no vive como literal aquí — se valida contra
// Supabase Vault vía la misma RPC verify_cron_secret que usa la función api principal.
async function verifyCronSecret(provided: unknown): Promise<boolean> {
  if (typeof provided !== "string" || !provided) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/verify_cron_secret`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ p_secret: provided }),
    });
    if (!r.ok) return false;
    return await r.json();
  } catch {
    return false;
  }
}
async function sendBirthdayEmail(to: string, name: string, newPoints: number) {
  if (!RESEND_API_KEY) return { ok: false, data: { skipped: true } };
  const html = `
    <div style="font-family:Arial,sans-serif;background:#1E3932;padding:32px;color:#fff">
      <div style="max-width:420px;margin:0 auto;background:#2D5246;border-radius:14px;padding:28px">
        <div style="font-size:26px;font-weight:900;letter-spacing:.06em;margin-bottom:4px">SND<span style="color:#CBA258">//</span>WCH</div>
        <div style="font-size:11px;color:#CBA258;letter-spacing:.2em;margin-bottom:20px">FELIZ CUMPLEAÑOS //</div>
        <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name},</p>
        <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Para celebrar te regalamos <b style="color:#CBA258">+${BIRTHDAY_POINTS} puntos</b>. Ya están en tu cuenta.</p>
        <p style="font-size:28px;font-weight:900;color:#CBA258;margin:16px 0">${newPoints} pts</p>
        <p style="font-size:12px;color:#8BAF9A;margin-top:10px">Canjéalos en sndwch.app → PUNTOS → CANJEAR 🎉</p>
      </div>
    </div>
  `;
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
          await debugLog({ stage: "email_sent", phone: c.phone, ok: res.ok });
        } catch (e) {
          await debugLog({ stage: "email_failed", phone: c.phone, error: String(e) });
        }
      }
    }

    await debugLog({ stage: "done", checked: customers.length, granted });
    return new Response(JSON.stringify({ success: true, granted }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await debugLog({ stage: "exception", error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
