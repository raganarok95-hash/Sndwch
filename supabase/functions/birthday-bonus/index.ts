import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// SND//WCH — birthday-bonus
// Cron diario: le regala un CUPÓN CON VENCIMIENTO a los clientes que cumplen años hoy.
// Hasta el 2026-08-29 regalaba puntos sin fecha (ver el bloque de #54 más abajo).
// birthday_pts_year evita que se le otorgue dos veces el mismo año — el nombre de la
// columna quedó de la época de los puntos, pero ahora marca "ya recibió su regalo de este
// año", que es lo mismo.

import { sbGet, sbInsert, sbUpdate, debugLog, verifyCronSecret } from "../_shared/sb.ts";
import { emailShell } from "../_shared/email-shell.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "SND//WCH <pedidos@sndwch.app>";
const SOURCE = "birthday-bonus";

// ── #54: cupón de cumpleaños con vencimiento ────────────────────────────────────────────
//
// ⚠ ESTO CAMBIÓ QUÉ RECIBE EL CLIENTE. Hasta el 2026-08-29 el regalo eran 100 PUNTOS, que
// no vencen nunca. Ahora es un cupón personal de S/6 que vence en 7 días.
//
// Por qué: un beneficio sin fecha no genera ninguna razón para pedir HOY — se guarda "para
// después" y muchas veces ese después no llega. El cupón con vencimiento corto convierte
// mejor justamente porque obliga a decidir. Y para el negocio es más barato en valor
// esperado: los puntos quedan como un pasivo abierto para siempre, el cupón caduca solo.
//
// Los S/6 no son al azar: 100 puntos a la tasa vigente de 20 pts/sol valen S/5, así que
// quien SÍ pide en la semana recibe algo un poco mejor que antes, no peor. Quien no pide
// pierde el regalo — eso es el mecanismo, no un efecto secundario.
//
// Para volver a los puntos: restaurar el bloque de increment_customer_points de abajo (está
// en el historial de git) y quitar la creación del cupón. Es un cambio de una decisión de
// negocio, no de arquitectura.
const BIRTHDAY_COUPON_SOLES = 6;
const BIRTHDAY_COUPON_DAYS = 7;

// Código corto, legible por teléfono y difícil de adivinar. Sin caracteres ambiguos (0/O,
// 1/I/L): el cliente lo va a tipear desde el correo o desde la notificación.
function birthdayCode(): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) s += abc[b % abc.length];
  return "CUMPLE" + s;
}

async function sendBirthdayEmail(to: string, name: string, code: string, vence: string) {
  if (!RESEND_API_KEY) return { ok: false, data: { skipped: true } };
  const html = emailShell("FELIZ CUMPLEAÑOS //", `
    <p style="font-size:14px;color:#F2F0EB;line-height:1.6">Hola ${name},</p>
    <p style="font-size:14px;color:#A8C8B0;line-height:1.6">Para celebrar, tu sándwich lleva <b style="color:#CBA258">S/${BIRTHDAY_COUPON_SOLES} de descuento</b>.</p>
    <p style="font-size:28px;font-weight:900;color:#CBA258;margin:16px 0;letter-spacing:2px">${code}</p>
    <p style="font-size:13px;color:#F2F0EB;line-height:1.6">Úsalo en el checkout antes del <b>${vence}</b>. Es tuyo y de un solo uso.</p>
    <p style="font-size:12px;color:#8BAF9A;margin-top:10px">Pide en sndwch.app 🎂</p>
  `);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: `SND//WCH — ¡Feliz cumpleaños! S/${BIRTHDAY_COUPON_SOLES} de regalo 🎂`, html }),
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

    // limit explícito (cap de seguridad, mismo criterio que actAnniversaryGreeting) — sin
    // esto, PostgREST trunca en silencio a 1000 filas por defecto y clientes con
    // cumpleaños hoy podían quedar fuera sin ningún error visible (hallazgo de auditoría
    // 2026-08-07).
    const customers = await sbGet("customers", "select=phone,name,email,birthday,birthday_pts_year&birthday=not.is.null&limit=20000");
    const todaysBirthdays = customers.filter((c: any) =>
      typeof c.birthday === "string" &&
      (c.birthday.endsWith(monthDay) || (alsoMatchFeb29 && c.birthday.endsWith("-02-29"))) &&
      (c.birthday_pts_year || 0) !== year
    );

    const venceIso = new Date(Date.now() + BIRTHDAY_COUPON_DAYS * 24 * 3600 * 1000).toISOString();
    const venceTexto = new Date(venceIso).toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "long" });

    let granted = 0;
    for (const c of todaysBirthdays) {
      const code = birthdayCode();
      // El cupón se crea PRIMERO y la bandera del año se escribe DESPUÉS. Si algo falla en
      // el medio, el cliente se queda sin bandera y mañana recibe su cupón — un regalo
      // repetido es un problema mucho menor que un cumpleaños sin regalo, y el orden
      // inverso (bandera primero) haría que un fallo le quitara el suyo en silencio.
      try {
        await sbInsert("promo_codes", {
          code,
          // "fixed" (no "amount"): es el valor que entiende el cálculo de descuento en
          // actions/orders.ts. Un tipo desconocido no daría error al insertar — el cupón se
          // crearía y recién fallaría al canjearlo, en la cara del cliente.
          discount_type: "fixed",
          value: BIRTHDAY_COUPON_SOLES,
          // De un solo uso y a nombre de nadie más: es un regalo personal, no una campaña.
          // `max_uses: 1` es lo que impide que el código circule por WhatsApp.
          max_uses: 1,
          min_order_total: 0,
          valid_until: venceIso,
          campaign_tag: "cumpleanos",
          created_by: SOURCE,
          active: true,
        });
      } catch (e) {
        await debugLog(SOURCE, { stage: "coupon_failed", phone: c.phone, error: String(e) });
        continue;
      }
      await sbUpdate("customers", `phone=eq.${encodeURIComponent(c.phone)}`, { birthday_pts_year: year });
      // Log de marketing_touches (ver admin-campaign-performance en la función api) —
      // best-effort, un fallo acá nunca debe tumbar el regalo ya otorgado.
      //
      // El canal registrado decía "push" y NUNCA se mandó un push desde acá: esta función
      // solo manda correo. El reporte de campañas estaba contando envíos que no existieron.
      //
      // ⚠ HUECO CONOCIDO: un cliente SIN correo no se entera de su regalo por ningún lado.
      // Arreglarlo bien es mover esta lógica a la función `api`, que sí tiene Web Push
      // (sendPushToPhone) y además se despliega por CI. No se hizo acá porque meter VAPID y
      // web-push en esta función sería duplicar infraestructura que ya existe al lado.
      try {
        await sbInsert("marketing_touches", { customer_phone: c.phone, campaign_type: "birthday", channel: c.email ? "email" : "ninguno" });
      } catch (e) {
        await debugLog(SOURCE, { stage: "touch_log_failed", phone: c.phone, error: String(e) });
      }
      if (!c.email) await debugLog(SOURCE, { stage: "sin_canal", phone: c.phone, code });
      granted++;
      if (c.email) {
        try {
          const res = await sendBirthdayEmail(c.email, c.name, code, venceTexto);
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
