// SND//WCH — api / actions/complaints
// Libro de Reclamaciones Virtual — exigido por el Código de Protección y Defensa del
// Consumidor. Público (no requiere sesión: cualquier consumidor debe poder reclamar,
// tenga o no cuenta), genera un código correlativo, y notifica por correo tanto al
// consumidor (copia de su reclamo) como al negocio (para que pueda responder).
import { sbGet, sbInsert, sbUpdate, rpc } from "../db.ts";
import { ApiError, isValidEmail } from "../types.ts";
import { requireAdmin, verifyCronSecret } from "../session.ts";
import { logAdminAction, debugLog } from "../logging.ts";
import { sendComplaintConfirmation, sendComplaintNotification, sendComplaintResponse } from "../email.ts";
import { sendPushToAdmins } from "../push.ts";

// El Libro de Reclamaciones es público por ley (ver arriba) — eso lo deja sin ningún
// requisito de sesión que frene el abuso automatizado, a diferencia del resto de acciones
// públicas de la app. El límite es generoso a propósito (no debe bloquear a un consumidor
// real con más de un reclamo legítimo) — solo frena un script mandando cientos de filas
// (hallazgo de la re-auditoría de 10 agentes).
const COMPLAINT_RATE_LIMIT = 5;
const COMPLAINT_RATE_WINDOW_MINUTES = 60;

export async function actSubmitComplaint(b: any) {
  const kind = String(b.kind || "").trim();
  if (kind !== "reclamo" && kind !== "queja") throw new ApiError("Indica si es un reclamo o una queja.");
  const consumerName = String(b.consumerName || "").trim();
  const consumerDni = String(b.consumerDni || "").trim();
  const consumerAddress = String(b.consumerAddress || "").trim();
  const consumerPhone = String(b.consumerPhone || "").trim();
  const consumerEmail = String(b.consumerEmail || "").trim();
  const detail = String(b.detail || "").trim();
  const consumerRequest = String(b.consumerRequest || "").trim();
  const isMinor = !!b.isMinor;
  const guardianName = isMinor ? String(b.guardianName || "").trim() : null;
  if (!consumerName || !consumerDni || !consumerAddress || !consumerPhone || !consumerEmail || !detail || !consumerRequest) {
    throw new ApiError("Completa todos los campos obligatorios.");
  }
  if (!isValidEmail(consumerEmail)) throw new ApiError("Ingresa un correo válido.");
  if (isMinor && !guardianName) throw new ApiError("Ingresa el nombre del padre, madre o apoderado.");
  const withinLimit = await rpc("check_rate_limit", {
    p_key: `complaint:${consumerPhone}`,
    p_limit: COMPLAINT_RATE_LIMIT,
    p_window_minutes: COMPLAINT_RATE_WINDOW_MINUTES,
  });
  if (!withinLimit) throw new ApiError("Ya registramos varios reclamos con este teléfono. Espera un momento antes de enviar otro.", 429);
  const claimedAmount = b.claimedAmount !== undefined && b.claimedAmount !== null && b.claimedAmount !== ""
    ? Number(b.claimedAmount)
    : null;
  if (claimedAmount !== null && (!Number.isFinite(claimedAmount) || claimedAmount < 0)) throw new ApiError("Monto reclamado inválido.");

  const rows = await sbInsert("complaints", {
    kind,
    consumer_name: consumerName,
    consumer_dni: consumerDni,
    consumer_address: consumerAddress,
    consumer_phone: consumerPhone,
    consumer_email: consumerEmail,
    is_minor: isMinor,
    guardian_name: guardianName,
    order_ref: b.orderRef ? String(b.orderRef).trim().slice(0, 40) : null,
    claimed_amount: claimedAmount,
    detail: detail.slice(0, 2000),
    consumer_request: consumerRequest.slice(0, 1000),
    claim_code: "PENDING",
  });
  const row = rows[0];
  // El código correlativo usa el id autogenerado — no se puede conocer antes del insert,
  // así que se completa en un segundo paso justo después de crear la fila.
  const claimCode = "REC-" + new Date(row.created_at).getFullYear() + "-" + String(row.id).padStart(6, "0");
  await sbUpdate("complaints", `id=eq.${row.id}`, { claim_code: claimCode });

  await Promise.all([
    sendComplaintConfirmation(consumerEmail, consumerName, claimCode, kind),
    sendComplaintNotification(claimCode, kind, consumerName, consumerEmail, consumerPhone, detail, consumerRequest),
  ]);

  return { success: true, claimCode };
}

export async function actAdminListComplaints(b: any) {
  await requireAdmin(b.token);
  const status = b.status ? String(b.status) : null;
  const query = status
    ? `status=eq.${encodeURIComponent(status)}&order=created_at.desc&limit=200`
    : `order=created_at.desc&limit=200`;
  return { complaints: await sbGet("complaints", query) };
}

export async function actAdminRespondComplaint(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "");
  const response = String(b.response || "").trim();
  if (!id || !response) throw new ApiError("Falta el reclamo o la respuesta.");
  const rows = await sbGet("complaints", `id=eq.${encodeURIComponent(id)}`);
  if (!rows.length) throw new ApiError("Reclamo no encontrado.", 404);
  // El texto se guarda SIEMPRE (es la constancia interna), pero el estado "atendido" se
  // fija DESPUÉS y solo si la respuesta de verdad salió.
  //
  // Antes se marcaba "atendido" acá arriba, antes de intentar el correo. Si Resend fallaba
  // en ese momento —una caída, un rate limit— el reclamo quedaba cerrado sin que el
  // consumidor recibiera nada, Y desaparecía para siempre de actAlertComplaintDeadlines,
  // que filtra `status=neq.atendido`. O sea: nadie volvía a enterarse de que faltaba
  // responder, con un plazo legal de 30 días corriendo. El único rastro era el campo
  // `emailed` de la respuesta HTTP, que nadie está obligado a mirar.
  const baseUpdate: Record<string, unknown> = {
    provider_response: response.slice(0, 2000),
    responded_at: new Date().toISOString(),
    responded_by: s.phone,
  };
  await sbUpdate("complaints", `id=eq.${encodeURIComponent(id)}`, baseUpdate);
  await logAdminAction(s.phone, "respond-complaint", undefined, { id, claim_code: rows[0].claim_code });

  let emailed = false;
  if (rows[0].consumer_email) {
    try {
      emailed = await sendComplaintResponse(
        rows[0].consumer_email, rows[0].consumer_name || "", rows[0].claim_code,
        rows[0].kind || "reclamo", response.slice(0, 2000),
      );
    } catch (e) {
      console.error("sendComplaintResponse failed for", rows[0].claim_code, e);
      await debugLog({ stage: "complaint-response-email", claimCode: rows[0].claim_code, error: String(e) });
    }
  }
  // Sin correo registrado no hay nada que entregar por esta vía: el reclamo se cierra
  // igual, porque el consumidor eligió no dejar correo y la constancia queda guardada.
  const deliveredOrNoEmail = emailed || !rows[0].consumer_email;
  if (deliveredOrNoEmail) {
    await sbUpdate("complaints", `id=eq.${encodeURIComponent(id)}`, { status: "atendido" });
  } else {
    // Se queda fuera de "atendido" a propósito, para que la alerta de plazo lo siga viendo
    // y el dueño lo reintente antes de que venza.
    await debugLog({ stage: "complaint-response-not-delivered", claimCode: rows[0].claim_code });
  }
  return { success: true, emailed, closed: deliveredOrNoEmail };
}

// Antes ningún aviso avisaba que el plazo legal de 30 días calendario (Código de
// Protección y Defensa del Consumidor) para responder un reclamo se acercaba a vencer —
// a diferencia de un pedido atascado (aviso a los 10 min), un reclamo sin responder podía
// vencer el plazo en silencio (hallazgo de la re-auditoría legal/datos y de
// automatización). Avisa cuando falten DEADLINE_WARNING_DAYS días o menos para el
// vencimiento, una sola vez por reclamo (alerted_deadline), igual que actAlertStuckOrders.
// 15 días HÁBILES, no 30 calendario. La Ley 31435 y el D.S. 101-2022-PCM (vigente desde
// mayo de 2022) redujeron el plazo del Libro de Reclamaciones de 30 días calendario a 15
// días hábiles, y lo declararon improrrogable. Con el valor anterior (30 calendario) el
// aviso llegaba recién sobre el día 23 — cuando el plazo legal ya se había vencido hacía
// más de una semana. Corregido 2026-08-15.
//
// Solo se descuentan sábados y domingos, no los feriados nacionales. Eso hace que la
// fecha calculada caiga ANTES que el vencimiento legal real (que también excluye
// feriados), o sea que el aviso se adelanta. Es el error seguro: avisar de más nunca
// cuesta una sanción, avisar tarde sí.
export const COMPLAINT_DEADLINE_BUSINESS_DAYS = 15;
export const DEADLINE_WARNING_BUSINESS_DAYS = 4;
// Segundo aviso, ya en zona roja: el primero avisa con margen para responder con calma,
// este avisa que se acaba el tiempo.
const FINAL_WARNING_BUSINESS_DAYS = 1;
// Días hábiles transcurridos entre dos fechas (excluye sábado y domingo).
export function businessDaysSince(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from.getTime());
  cur.setUTCHours(0, 0, 0, 0);
  const end = new Date(to.getTime());
  end.setUTCHours(0, 0, 0, 0);
  while (cur < end) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const d = cur.getUTCDay();
    if (d !== 0 && d !== 6) count++;
  }
  return count;
}
export async function actAlertComplaintDeadlines(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  // Se trae todo reclamo abierto sin alertar de los últimos 40 días calendario (holgura
  // suficiente para cubrir 15 hábiles con feriados de por medio) y el filtro fino por días
  // hábiles se hace en JS — PostgREST no sabe contar días hábiles.
  const lookback = new Date(Date.now() - 40 * 86400000).toISOString();
  const open = await sbGet(
    "complaints",
    `status=neq.atendido&created_at=gte.${encodeURIComponent(lookback)}&select=id,claim_code,kind,created_at,alerted_deadline,alerted_deadline_final&limit=500`,
  );
  const now = new Date();
  const nearing = open.filter((c: any) =>
    COMPLAINT_DEADLINE_BUSINESS_DAYS - businessDaysSince(new Date(c.created_at), now) <= DEADLINE_WARNING_BUSINESS_DAYS
  );
  // DOS avisos, no uno. Antes solo existía el primero (a 4 días hábiles del vencimiento) y
  // `alerted_deadline` no se reseteaba nunca: si el dueño no actuaba sobre ESE único push,
  // el reclamo se quedaba callado hasta vencer, con una multa de por medio. Ahora hay un
  // segundo aviso, más fuerte, cuando quedan FINAL_WARNING_BUSINESS_DAYS o menos.
  let alerted = 0;
  for (const c of nearing) {
    try {
      const daysLeft = COMPLAINT_DEADLINE_BUSINESS_DAYS - businessDaysSince(new Date(c.created_at), now);
      const isFinal = daysLeft <= FINAL_WARNING_BUSINESS_DAYS;
      if (isFinal ? c.alerted_deadline_final : c.alerted_deadline) continue;
      await sendPushToAdmins({
        title: isFinal ? "Reclamo VENCE YA 🚨" : "Reclamo por vencer ⚠️",
        body: `${c.claim_code} (${c.kind}) — quedan ${Math.max(0, daysLeft)} días hábiles para responder antes del plazo legal.`,
        url: "./index.html",
        tag: "sndwch-complaint-deadline-" + (isFinal ? "final-" : "") + c.id,
      });
      await sbUpdate("complaints", `id=eq.${c.id}`, isFinal ? { alerted_deadline_final: true } : { alerted_deadline: true });
      alerted++;
    } catch (e) {
      console.error("alert-complaint-deadlines failed for", c.id, e);
    }
  }
  return { success: true, alerted };
}
