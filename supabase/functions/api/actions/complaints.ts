// SND//WCH — api / actions/complaints
// Libro de Reclamaciones Virtual — exigido por el Código de Protección y Defensa del
// Consumidor. Público (no requiere sesión: cualquier consumidor debe poder reclamar,
// tenga o no cuenta), genera un código correlativo, y notifica por correo tanto al
// consumidor (copia de su reclamo) como al negocio (para que pueda responder).
import { sbGet, sbInsert, sbUpdate } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { sendComplaintConfirmation, sendComplaintNotification } from "../email.ts";

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
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(consumerEmail)) throw new ApiError("Ingresa un correo válido.");
  if (isMinor && !guardianName) throw new ApiError("Ingresa el nombre del padre, madre o apoderado.");
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
  await sbUpdate("complaints", `id=eq.${encodeURIComponent(id)}`, {
    status: "atendido",
    provider_response: response.slice(0, 2000),
    responded_at: new Date().toISOString(),
    responded_by: s.phone,
  });
  await logAdminAction(s.phone, "respond-complaint", undefined, { id, claim_code: rows[0].claim_code });
  return { success: true };
}
