// SND//WCH — _shared/culqi-claim
// create-charge y create-credit-charge eran ~95% el mismo archivo carácter por carácter
// (167 y 163 líneas): la reserva atómica pending->charging, verificación de monto/
// expiración, y manejo de errores de Culqi eran idénticos, solo cambiando el nombre de
// tabla/campo y algún texto (hallazgo de auditoría de arquitectura de código, MEDIO).
// Cualquier fix de seguridad futuro en este patrón (como el que ya motivó este diseño,
// ver comentario en create-charge/index.ts) tenía que aplicarse dos veces. Ahora vive
// una sola vez acá.
export interface CulqiClaimConfig {
  sbUrl: string;
  serviceKey: string;
  culqiSecretKey: string;
  table: string; // "pending_charges" | "pending_weekly_plans"
  amountField: string; // "expected_total" | "amount_paid"
  refValue: string;
  amountCents: number;
  email: string;
  token: string;
  description: string; // texto que Culqi guarda como descripción del cargo
  metadataKey: string; // "order_ref" | "credit_ref"
  source: string; // etiqueta de debug_logs
  notFoundMsg: string;
  expiredMsg: string;
  mismatchMsg: string;
  conflictMsg: string;
}

export type CulqiClaimResult =
  | { ok: true; chargeId: string; outcome?: string }
  | { ok: false; status: number; error: string; culqi?: unknown };

export async function claimAndChargeCulqi(cfg: CulqiClaimConfig): Promise<CulqiClaimResult> {
  const sbHeaders = { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}`, "Content-Type": "application/json" };

  async function debugLog(detail: unknown) {
    try {
      await fetch(`${cfg.sbUrl}/rest/v1/debug_logs`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ source: cfg.source, detail }),
      });
    } catch (_e) { /* nunca debe tumbar la respuesta real */ }
  }

  const pcResp = await fetch(
    `${cfg.sbUrl}/rest/v1/${cfg.table}?ref=eq.${encodeURIComponent(cfg.refValue)}&status=eq.pending&select=id,${cfg.amountField},expires_at`,
    { headers: sbHeaders },
  );
  if (!pcResp.ok) return { ok: false, status: 500, error: "No se pudo verificar la reserva." };
  const pcRows = await pcResp.json();
  const pc = pcRows[0];
  if (!pc) return { ok: false, status: 404, error: cfg.notFoundMsg };
  if (new Date(pc.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 410, error: cfg.expiredMsg };
  }
  if (Math.round(Number(pc[cfg.amountField]) * 100) !== cfg.amountCents) {
    return { ok: false, status: 400, error: cfg.mismatchMsg };
  }

  // Reclamo atómico pending -> charging: si otra llamada para esta misma referencia ya
  // está en vuelo (doble tap, reintento de red, o un intento directo fuera del flujo
  // normal), esta actualización encuentra 0 filas y se rechaza ANTES de cobrar en Culqi.
  const claimResp = await fetch(
    `${cfg.sbUrl}/rest/v1/${cfg.table}?id=eq.${pc.id}&status=eq.pending`,
    { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=representation" }, body: JSON.stringify({ status: "charging" }) },
  );
  const claimed = claimResp.ok ? await claimResp.json() : [];
  if (!claimed.length) {
    await debugLog({ event: "claim-conflict", ref: cfg.refValue, pendingId: pc.id });
    return { ok: false, status: 409, error: cfg.conflictMsg };
  }

  async function releaseClaim() {
    try {
      await fetch(`${cfg.sbUrl}/rest/v1/${cfg.table}?id=eq.${pc.id}&status=eq.charging`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({ status: "pending" }),
      });
    } catch (_e) { /* el cron de expiración igual limpia una fila 'charging' atascada */ }
  }

  let culqiResp: Response;
  try {
    culqiResp = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfg.culqiSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: cfg.amountCents,
        currency_code: "PEN",
        email: cfg.email,
        source_id: cfg.token,
        description: cfg.description,
        metadata: { [cfg.metadataKey]: cfg.refValue },
      }),
    });
  } catch (e) {
    await releaseClaim();
    await debugLog({ event: "culqi-fetch-failed", ref: cfg.refValue, amountCents: cfg.amountCents, error: String(e) });
    return { ok: false, status: 502, error: "No se pudo conectar con Culqi: " + String(e) };
  }

  const culqiData = await culqiResp.json().catch(() => ({}));

  if (!culqiResp.ok) {
    await releaseClaim();
    const msg = culqiData?.user_message || culqiData?.merchant_message || "El pago fue rechazado.";
    await debugLog({ event: "culqi-rejected", ref: cfg.refValue, amountCents: cfg.amountCents, status: culqiResp.status, culqi: culqiData });
    return { ok: false, status: 402, error: msg, culqi: culqiData };
  }

  // Cobro real ya realizado — se libera la reserva de vuelta a 'pending' (no antes) para
  // que la función api pueda hacer su propio reclamo atómico pending -> consumed al
  // crear el pedido / acreditar el saldo, exactamente igual que siempre.
  await releaseClaim();
  await debugLog({ event: "charge-succeeded", ref: cfg.refValue, amountCents: cfg.amountCents, chargeId: culqiData.id });

  return { ok: true, chargeId: culqiData.id, outcome: culqiData.outcome?.type };
}
