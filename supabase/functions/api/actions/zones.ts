// SND//WCH — api / actions/zones
// «Fuera de los distritos que cubrimos no llegamos todavía. Te avisamos apenas abramos la
// zona.» (maqueta 34). Antes esa frase no tenía nada detrás: nadie guardaba a quién había
// que avisar. Ahora el cliente queda anotado con su distrito, y el dueño —cuando decide
// abrir esa zona— avisa a todos de una vez desde el panel. Cada persona recibe UN aviso por
// zona: después queda marcada (notified_at) y no se le vuelve a escribir.
import { sbGet, sbInsert, sbUpdate } from "../db.ts";
import { ApiError } from "../types.ts";
import { requireSession, requireAdmin } from "../session.ts";
import { logAdminAction } from "../logging.ts";
import { sendPushToPhone } from "../push.ts";
import { DELIVERY_EXCLUDED_ZONES } from "../env.ts";

// Solo se anota un distrito con nombre de verdad: texto libre acá sería una lista que nadie
// puede agrupar para decidir qué zona abrir.
export function distritoValido(d: unknown): string | null {
  const s = String(d || "").trim().toLowerCase();
  return /^[a-z_]{3,40}$/.test(s) && s !== "otro" ? s : null;
}

export async function actZoneWaitlistJoin(b: any) {
  const s = await requireSession(b.token);
  const district = distritoValido(b.district);
  if (!district) throw new ApiError("Falta el distrito.");
  const ya = await sbGet(
    "zone_waitlist",
    `customer_phone=eq.${encodeURIComponent(s.phone)}&district=eq.${district}&notified_at=is.null&select=id`,
  );
  if (!ya.length) {
    await sbInsert("zone_waitlist", {
      customer_phone: s.phone,
      district,
      lat: typeof b.lat === "number" ? b.lat : null,
      lon: typeof b.lon === "number" ? b.lon : null,
    });
  }
  return { success: true };
}

// Para decidir qué zona abrir: cuántos esperan en cada una.
export async function actAdminZoneWaitlist(b: any) {
  await requireAdmin(b.token);
  const rows = await sbGet("zone_waitlist", "notified_at=is.null&select=district,created_at&limit=5000");
  const porZona = new Map<string, { district: string; count: number; desde: string }>();
  for (const r of rows) {
    const z = porZona.get(r.district) || { district: r.district, count: 0, desde: r.created_at };
    z.count++;
    if (r.created_at < z.desde) z.desde = r.created_at;
    porZona.set(r.district, z);
  }
  return { zones: [...porZona.values()].sort((a, b) => b.count - a.count) };
}

// ¿Esa zona sigue fuera de cobertura? El id del cliente es «el_porvenir»; la lista del
// servidor dice «el porvenir».
export function zonaSigueCerrada(district: string): boolean {
  return DELIVERY_EXCLUDED_ZONES.includes(district.replace(/_/g, " "));
}

// «Ya llegamos a tu zona»: un aviso a cada persona que esperaba, y se marca para no repetir.
// Se niega mientras la zona siga excluida: avisar «ya puedes pedir» y que el pedido rebote
// sería la peor promesa rota posible, la que llega por push.
export async function actAdminNotifyZone(b: any) {
  const s = await requireAdmin(b.token);
  const district = distritoValido(b.district);
  if (!district) throw new ApiError("Falta el distrito.");
  if (zonaSigueCerrada(district)) {
    throw new ApiError("Esa zona todavía está fuera de cobertura. Ábrela primero; después se avisa.");
  }
  const nombre = String(b.districtLabel || district).trim().slice(0, 60);
  const rows = await sbGet(
    "zone_waitlist",
    `district=eq.${district}&notified_at=is.null&select=id,customer_phone&limit=2000`,
  );
  let avisados = 0;
  for (const r of rows) {
    try {
      await sendPushToPhone(r.customer_phone, {
        title: `Ya llegamos a ${nombre}`,
        body: "Te habías anotado para que te avisemos. Ya puedes pedir.",
        url: "./index.html",
        tag: "sndwch-zona-abierta-" + district,
      });
      avisados++;
    } catch {
      // sin suscripción push: igual se marca, el aviso se intentó una vez
    }
    await sbUpdate("zone_waitlist", `id=eq.${r.id}`, { notified_at: new Date().toISOString() });
  }
  await logAdminAction(s.phone, "notify-zone", undefined, { district, total: rows.length, avisados });
  return { success: true, total: rows.length, avisados };
}
