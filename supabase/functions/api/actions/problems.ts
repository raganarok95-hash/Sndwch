// SND//WCH — api / actions/problems
// «Algo salió mal» (pantalla 35): el reporte rápido de UN pedido, desde la app, dentro de
// las 48 horas siguientes a la entrega. Es distinto del Libro de Reclamaciones (reclamo o
// queja con plazo legal en días hábiles, abierto a cualquiera): esto lo hace un cliente con
// sesión sobre un pedido suyo, eligiendo qué pasó con un toque.
//
// El plazo de 48 h es el de los Términos (sección «Si tu pedido llegó mal», cambiado de 2 h
// a 48 h por el dueño el 2026-09-24). Si se mueve, se mueve en los DOS lados.
//
// La pantalla promete «Sando responde antes de las X». Esa hora no se escribe a mano: sale
// de `respondeAntesDe()`, se guarda con el reporte, y `actAlertOrderProblems` avisa al dueño
// cuando se está por pasar sin respuesta. Una promesa de plazo que nada vigila es la clase de
// defecto que este repo ya pagó con los reclamos.
import { sbGet, sbInsert, sbUpdate, rpc } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, requireAdmin, verifyCronSecret } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { sendPushToAdmins, sendPushToPhone } from "../push.ts";

export const REPORTE_PLAZO_HORAS = 48;
// La hora de respuesta que se promete (ver respondeAntesDe). DEBEN coincidir con las del
// cliente (src/app/06-*) — lo verifica `npm run parity`.
export const RESPUESTA_CORTE_HORA = 19;
export const RESPUESTA_HOY_HORA = 21;
export const RESPUESTA_MANANA_HORA = 13;

export const MOTIVOS: Record<string, string> = {
  falto: "Faltó algo",
  frio: "Llegó frío",
  distinto: "No era lo que pedí",
  otro: "Otra cosa",
};

// Las tres salidas que ofrecen los Términos, y ninguna más.
export const SOLUCIONES: Record<string, string> = {
  reposicion: "Te lo reponemos sin costo",
  credito: "Te dejamos el monto como crédito en la app",
  reembolso: "Te devolvemos el dinero por el mismo medio",
};

// ¿Todavía se puede reportar? Solo un pedido ENTREGADO, y dentro del plazo contado desde
// la entrega. Sin hora de entrega no hay desde dónde contar: no se adivina.
export function puedeReportar(deliveredAtIso: string | null | undefined, ahoraMs: number): boolean {
  const e = deliveredAtIso ? Date.parse(deliveredAtIso) : NaN;
  if (!Number.isFinite(e)) return false;
  return ahoraMs - e <= REPORTE_PLAZO_HORAS * 3600000 && ahoraMs >= e;
}

// Hasta cuándo se promete responder. Antes de las 7 p.m. (hora de Lima) → hoy a las 9 p.m.;
// después → mañana a la 1 p.m. Nunca promete responder de madrugada.
export function respondeAntesDe(ahoraMs: number): string {
  const LIMA = -5 * 3600000;
  const local = new Date(ahoraMs + LIMA);
  const y = local.getUTCFullYear(), m = local.getUTCMonth(), d = local.getUTCDate();
  const hora = local.getUTCHours();
  const limite = hora < RESPUESTA_CORTE_HORA
    ? Date.UTC(y, m, d, RESPUESTA_HOY_HORA, 0)
    : Date.UTC(y, m, d + 1, RESPUESTA_MANANA_HORA, 0);
  return new Date(limite - LIMA).toISOString();
}

export async function actReportOrderProblem(b: any) {
  const s = await requireSession(b.token);
  const ref = String(b.ref || "").trim();
  const motivo = String(b.motivo || "").trim();
  if (!ref) throw new ApiError("Falta el pedido.");
  if (!MOTIVOS[motivo]) throw new ApiError("Elige qué pasó.");
  const detalle = String(b.detalle || "").trim().slice(0, 1000);
  if (motivo === "otro" && !detalle) throw new ApiError("Cuéntanos qué pasó.");

  // El filtro por teléfono no es cosmético: sin él cualquiera con sesión reportaría el
  // pedido de otro.
  const rows = await sbGet(
    "orders",
    `ref=eq.${encodeURIComponent(ref)}&customer_phone=eq.${encodeURIComponent(s.phone)}&select=id,ref,status,delivered_at,customer_name`,
  );
  const o = rows[0];
  if (!o) throw new ApiError("No encontramos ese pedido.", 404);
  if (o.status !== "ENTREGADO") throw new ApiError("Este pedido todavía no se entregó. Si hay un problema, escríbenos.");
  const ahora = Date.now();
  if (!puedeReportar(o.delivered_at, ahora)) {
    throw new ApiError(`Pasaron más de ${REPORTE_PLAZO_HORAS} horas desde la entrega. Puedes dejarlo en el Libro de Reclamaciones.`);
  }

  const ok = await rpc("check_rate_limit", { p_key: `order-problem:${s.phone}`, p_limit: 5, p_window_minutes: 60 });
  if (!ok) throw new ApiError("Ya recibimos varios reportes. Espera un momento.", 429);

  const abierto = await sbGet("order_problems", `order_id=eq.${o.id}&resolved_at=is.null&select=id,respond_by`);
  if (abierto.length) return { success: true, yaReportado: true, respondeAntesDe: abierto[0].respond_by };

  const respondBy = respondeAntesDe(ahora);
  await sbInsert("order_problems", {
    order_id: o.id,
    ref: o.ref,
    customer_phone: s.phone,
    motivo,
    detalle: detalle || null,
    respond_by: respondBy,
  });
  try {
    await sendPushToAdmins({
      title: `Algo salió mal · ${o.ref}`,
      body: `${o.customer_name || "Un cliente"}: ${MOTIVOS[motivo]}${detalle ? " — " + detalle.slice(0, 120) : ""}`,
      url: "./index.html",
      tag: "sndwch-order-problem-" + o.id,
    });
  } catch {
    // el reporte ya quedó guardado; el cron de abajo lo vuelve a avisar si nadie responde
  }
  return { success: true, yaReportado: false, respondeAntesDe: respondBy };
}

export async function actAdminOrderProblems(b: any) {
  await requireAdmin(b.token);
  return {
    problems: await sbGet("order_problems", "order=resolved_at.desc.nullsfirst,created_at.asc&limit=100"),
  };
}

export async function actAdminResolveOrderProblem(b: any) {
  const s = await requireAdmin(b.token);
  const id = String(b.id || "").trim();
  const solucion = String(b.solucion || "").trim();
  if (!id) throw new ApiError("Falta el reporte.");
  if (!SOLUCIONES[solucion]) throw new ApiError("Elige cómo se resuelve.");
  const nota = String(b.nota || "").trim().slice(0, 500);
  // Guard atómico: solo el primero que resuelve gana, y un reporte ya resuelto no se pisa.
  const rows = await sbUpdate(
    "order_problems",
    `id=eq.${encodeURIComponent(id)}&resolved_at=is.null`,
    { resolved_at: new Date().toISOString(), resolution: solucion, resolution_note: nota || null, resolved_by: s.phone },
  );
  const p = rows && rows[0];
  if (!p) throw new ApiError("Ese reporte ya estaba resuelto.", 409);
  await logAdminAction(s.phone, "resolve-order-problem", undefined, { id, ref: p.ref, solucion });
  try {
    await sendPushToPhone(p.customer_phone, {
      title: `Sobre tu pedido ${p.ref}`,
      body: SOLUCIONES[solucion] + (nota ? ". " + nota : "."),
      url: "./index.html",
      tag: "sndwch-order-problem-resuelto-" + p.id,
    });
  } catch {
    // sin suscripción push: la respuesta queda en la app igual
  }
  return { success: true };
}

// Cron: los reportes a los que se les está por pasar la hora prometida sin respuesta. Una
// sola vez por reporte (alerted), igual que los reclamos.
export async function actAlertOrderProblems(b: any) {
  if (!(await verifyCronSecret(b.cronSecret))) throw new ApiError("No autorizado.", 401);
  const pronto = new Date(Date.now() + 30 * 60000).toISOString();
  const rows = await sbGet(
    "order_problems",
    `resolved_at=is.null&alerted=eq.false&respond_by=lte.${encodeURIComponent(pronto)}&select=id,ref,motivo,respond_by&limit=100`,
  );
  let avisados = 0;
  for (const p of rows) {
    try {
      await sendPushToAdmins({
        title: "Reporte sin responder ⚠️",
        body: `${p.ref} (${MOTIVOS[p.motivo] || p.motivo}) — prometimos responder antes de las ${new Date(p.respond_by).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit" })}.`,
        url: "./index.html",
        tag: "sndwch-order-problem-plazo-" + p.id,
      });
      await sbUpdate("order_problems", `id=eq.${p.id}`, { alerted: true });
      avisados++;
    } catch (e) {
      console.error("alert-order-problems failed for", p.id, e);
    }
  }
  return { success: true, avisados };
}

// Lo que el cliente ve de sus reportes (para pintar «ya lo reportaste» y la respuesta).
export async function actMyOrderProblems(b: any) {
  const s = await requireSession(b.token);
  return {
    problems: await sbGet(
      "order_problems",
      `customer_phone=eq.${encodeURIComponent(s.phone)}&select=ref,motivo,respond_by,resolved_at,resolution,resolution_note,created_at&order=created_at.desc&limit=20`,
    ),
  };
}
