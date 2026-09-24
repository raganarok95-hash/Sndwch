// LA CARGA DE CADA HORA: pedidos + lugares apartados por pedidos fijos (2026-09-24).
//
// Hasta hoy la cuenta de «¿cuántos pedidos caen en esta hora?» vivía escrita DOS veces —en
// `assertHourCapacity` (orders.ts), que rechaza, y en `capacidad()` (hours.ts), que le dice
// al cliente qué horas tachar— con las mismas dos consultas copiadas. Con el lugar apartado
// del pedido fijo había que sumar un tercer término a las dos, y una copia que se actualiza y
// otra que no es exactamente el defecto que este repo ya pagó con precios: el cliente tacharía
// una hora que el servidor acepta, o al revés. Ahora las dos preguntan acá.
import { sbGet } from "./db.ts";
import { isWithinStoreHours, MAX_ORDERS_PER_HOUR } from "./env.ts";
import { verifyActiveSession } from "./session.ts";
import {
  apartadosPorHora,
  estadoFranja,
  fechaLima,
  horaLimaHHMM,
  inicioDeHora,
  proximaVez,
  type Franja,
  type PedidoDelFijo,
} from "./franja.ts";

const HORA = 3600000;

export type FilaFijo = {
  id: string;
  customer_phone: string;
  items: unknown[];
  weekday: number;
  slot: string;
  label: string | null;
  active: boolean;
  skip_on: string | null;
  address_id: number | null;
  last_notified_at: string | null;
};
export type FijoConFranja = { fila: FilaFijo; franja: Franja };

// Cuánto hacia atrás se miran los pedidos de un fijo. Las confirmaciones cuentan dentro de
// esta ventana: un fijo que nadie usó en cuatro meses dejó de ser un hábito probado y no
// tiene por qué seguir quitándole lugar a nadie.
const HISTORIA_DIAS = 120;

async function pedidosPorFijo(ids: string[]): Promise<Map<string, PedidoDelFijo[]>> {
  const out = new Map<string, PedidoDelFijo[]>();
  if (!ids.length) return out;
  const desde = new Date(Date.now() - HISTORIA_DIAS * 86400000).toISOString();
  const rows = await sbGet(
    "orders",
    `recurring_id=in.(${ids.join(",")})&created_at=gte.${encodeURIComponent(desde)}&select=recurring_id,created_at,delivery_time,status,payment_status&limit=2000`,
  );
  for (const r of rows) {
    const l = out.get(r.recurring_id) || [];
    l.push(r);
    out.set(r.recurring_id, l);
  }
  return out;
}

/** El estado del lugar de cada fijo activo, ahora. ⚠ Requiere el horario ya cargado
 *  (`loadStoreHours`): sin él se decidiría con el horario de respaldo si la tienda atiende a
 *  esa hora. `filtro` es un trozo de query de PostgREST (ej. `&customer_phone=eq.X`). */
export async function cargarFranjas(nowMs = Date.now(), filtro = ""): Promise<FijoConFranja[]> {
  const filas: FilaFijo[] = await sbGet(
    "recurring_orders",
    `active=eq.true${filtro}&select=id,customer_phone,items,weekday,slot,label,active,skip_on,address_id,last_notified_at&limit=1000`,
  );
  const pedidos = await pedidosPorFijo(filas.map((f) => f.id));
  return filas.map((fila) => {
    const vez = proximaVez(fila, nowMs);
    const abierto = Number.isFinite(vez) && isWithinStoreHours(new Date(vez));
    return { fila, franja: estadoFranja(fila, pedidos.get(fila.id) || [], nowMs, abierto) };
  });
}

export type Carga = { pedidos: Map<string, number>; apartados: Map<string, number> };

/** Pedidos vivos y lugares apartados de cada hora entre `desdeMs` y `hastaMs`. `excluirFijo`
 *  es el fijo de quien está pidiendo: su propio lugar no cuenta en su contra. `franjas` se
 *  puede pasar ya cargado para no volver a leerlo. */
export async function cargasPorHora(
  desdeMs: number,
  hastaMs: number,
  opts: { excluirFijo?: string | null; franjas?: FijoConFranja[] } = {},
): Promise<Carga> {
  const from = encodeURIComponent(new Date(desdeMs).toISOString());
  const to = encodeURIComponent(new Date(hastaMs).toISOString());
  const [programados, inmediatos, franjas] = await Promise.all([
    // La columna se llama `delivery_time`, NO `scheduled_for` (verificado contra
    // information_schema: `orders` no tiene `scheduled_for`; ese nombre solo existe en
    // `pending_charges`). Con el nombre equivocado PostgREST devolvía 42703, el catch de
    // quien llama se lo tragaba, y el tope NUNCA se aplicó desde que se introdujo.
    sbGet("orders", `status=neq.CANCELADO&delivery_time=not.is.null&delivery_time=gte.${from}&delivery_time=lt.${to}&select=delivery_time&limit=1000`),
    sbGet("orders", `status=neq.CANCELADO&delivery_time=is.null&created_at=gte.${from}&created_at=lt.${to}&select=created_at&limit=1000`),
    opts.franjas ? Promise.resolve(opts.franjas) : cargarFranjas(),
  ]);
  const pedidos = new Map<string, number>();
  const sumar = (iso: string) => {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return;
    const k = inicioDeHora(t);
    pedidos.set(k, (pedidos.get(k) || 0) + 1);
  };
  for (const o of programados) sumar(o.delivery_time);
  for (const o of inmediatos) sumar(o.created_at);
  const enRango = franjas.filter((x) => x.franja.vez >= desdeMs && x.franja.vez < hastaMs);
  const apartados = apartadosPorHora(enRango.map((x) => ({ id: x.fila.id, franja: x.franja })), opts.excluirFijo);
  return { pedidos, apartados };
}

export function cargaDe(c: Carga, hora: string): number {
  return (c.pedidos.get(hora) || 0) + (c.apartados.get(hora) || 0);
}

/** ¿La hora en que cae `ms` llegó al tope? */
export function horaLlena(c: Carga, ms: number): boolean {
  return cargaDe(c, inicioDeHora(ms)) >= MAX_ORDERS_PER_HOUR;
}

/** La siguiente media hora con lugar ese mismo día, dentro del horario ("HH:MM"), o null. Es
 *  lo que el aviso ofrece cuando la hora de siempre se llenó: rechazar sin alternativa manda
 *  al cliente a adivinar, y la mayoría no vuelve. */
export function siguienteLibreDelDia(c: Carga, vezMs: number): string | null {
  const finDelDia = vezMs + 12 * HORA;
  for (let t = vezMs + 30 * 60000; t < finDelDia; t += 30 * 60000) {
    if (fechaLima(t) !== fechaLima(vezMs)) break;
    if (!isWithinStoreHours(new Date(t))) continue;
    if (!horaLlena(c, t)) return horaLimaHHMM(t);
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El id del fijo si es del cliente de esta sesión; null en cualquier otro caso. Un id ajeno
 *  no puede servir para esquivar el tope usando el lugar que otro tiene apartado. */
export async function fijoPropio(id: unknown, token: unknown): Promise<string | null> {
  const s = String(id || "").trim();
  if (!UUID.test(s) || !token) return null;
  const active = await verifyActiveSession(String(token));
  if (!active) return null;
  const rows = await sbGet(
    "recurring_orders",
    `id=eq.${s}&customer_phone=eq.${encodeURIComponent(active.payload.phone)}&active=eq.true&select=id`,
  );
  return rows[0]?.id || null;
}
