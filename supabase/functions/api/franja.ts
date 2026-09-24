// EL LUGAR APARTADO DEL PEDIDO FIJO (decisión del dueño, 2026-09-23: «la idea de lo de la
// franja es mejor»). Ver docs/VOLVER_SIN_SUSCRIPCION.md §4.
//
// El pedido fijo NO se manda ni se cobra solo: se avisa y el cliente confirma. Lo que sí
// hace, a quien ya lo repitió, es GUARDARLE UN LUGAR en el tope de su hora desde el día
// anterior, para que el aviso pueda decir algo que sin esto sería mentira: «tu jueves está
// guardado hasta las 12:00». Si no confirma, el lugar se suelta solo y vuelve al resto.
//
// ⚠ NADA DE ESTO SE GUARDA. El lugar apartado se CALCULA cada vez, a partir del fijo y de
// los pedidos que salieron de él, contra la hora actual. Es el mismo criterio que la pausa
// de la tienda y las horas llenas: un estado guardado («apartado: sí») es algo que alguien
// tiene que acordarse de revertir, y el día que el cron que lo suelta falla, la cocina
// pierde un lugar que nadie va a usar. Calculado, se suelta solo por construcción.
//
// Todo acá es puro para poder probarlo: su modo de fallo es el silencio. Un lugar que no
// se suelta le quita una venta a otro sin que nada lo diga; uno que no se aparta rompe la
// promesa del aviso justo cuando el cliente ya decidió.
import { limaFields } from "./env.ts";

/** Minutos antes de la hora del pedido en que el lugar se suelta si nadie lo confirmó. */
export const FRANJA_SUELTA_MIN = 90;
/** Confirmaciones (días distintos pagados) desde las que un fijo aparta lugar. Un hábito
 *  probado aparta lugar; una intención, no. */
export const FRANJA_DESDE_CONFIRMADOS = 2;
/** Sin lugar apartado, el aviso sale una hora antes (como siempre). */
export const AVISO_FIJO_MIN = 60;
/** Con lugar apartado, el aviso sale una hora antes de SOLTARLO, no de la entrega: avisar
 *  después de soltar sería prometer un lugar que ya no tiene. */
export const AVISO_ANTES_DE_SOLTAR_MIN = 60;

const MIN = 60000;
const DIA = 86400000;
// Lima es UTC-5 y no tiene horario de verano (ver limaMonthStartIso en env.ts).
const LIMA_MS = 5 * 3600000;

export type Fijo = { id: string; weekday: number; slot: string; active?: boolean; skip_on?: string | null };
export type PedidoDelFijo = {
  // La columna admite null en la base (lo mostraron los tipos generados, 2026-09-24). Pasa a
  // NOT NULL en el paso 6; mientras tanto, sin fecha el pedido no cuenta (NaN).
  created_at: string | null;
  delivery_time?: string | null;
  status?: string | null;
  payment_status?: string | null;
};
// El tipo vive en el dominio compartido: el cliente lee el mismo.
import type { EstadoDeFranja } from "../_shared/dominio.ts";
export type { EstadoDeFranja };

export function slotMinutos(slot: string): number | null {
  const m = /^([0-2][0-9]):([0-5][0-9])$/.exec(String(slot || ""));
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v < 24 * 60 ? v : null;
}

/** "YYYY-MM-DD" del día en Lima en que cae ese instante. */
export function fechaLima(ms: number): string {
  const f = limaFields(new Date(ms));
  return f.year + "-" + String(f.month).padStart(2, "0") + "-" + String(f.day).padStart(2, "0");
}

function medianocheLima(ms: number): number {
  const f = limaFields(new Date(ms));
  return Date.UTC(f.year, f.month - 1, f.day) + LIMA_MS;
}

/** El instante de la próxima vez que toca el fijo: hoy si su hora todavía no pasó; si ya
 *  pasó, la semana que viene. */
export function proximaVez(f: Fijo, nowMs: number): number {
  const m = slotMinutos(f.slot);
  if (m === null) return NaN;
  const hoy = limaFields(new Date(nowMs)).weekday;
  const dias = ((Number(f.weekday) - hoy) % 7 + 7) % 7;
  let vez = medianocheLima(nowMs) + dias * DIA + m * MIN;
  if (vez <= nowMs) vez += 7 * DIA;
  return vez;
}

/** Cuándo se entrega un pedido: la hora programada si la tiene, si no la de creación. */
export function entregaDe(p: PedidoDelFijo): number {
  const t = p.delivery_time ? Date.parse(p.delivery_time) : NaN;
  return Number.isFinite(t) ? t : Date.parse(p.created_at ?? "");
}

/** Cuántas veces se CONFIRMÓ el fijo: días distintos con un pedido pagado y no cancelado.
 *  Días y no pedidos, para que dos pedidos el mismo jueves no cuenten como un hábito. Y
 *  pagados, porque un Yape que nunca llegó no probó nada. */
export function confirmaciones(pedidos: PedidoDelFijo[]): number {
  const dias = new Set<string>();
  for (const p of pedidos) {
    if (p.status === "CANCELADO" || p.payment_status !== "paid") continue;
    const t = entregaDe(p);
    if (Number.isFinite(t)) dias.add(fechaLima(t));
  }
  return dias.size;
}

export type Franja = {
  vez: number;
  /** Desde cuándo guarda el lugar: la medianoche (Lima) del día anterior. */
  desde: number;
  /** Cuándo lo suelta si nadie lo confirmó. */
  sueltaA: number;
  estado: EstadoDeFranja;
  apartada: boolean;
  confirmados: number;
};

/** El estado del lugar de UN fijo, ahora. `abiertoEsaHora` lo decide quien llama con el
 *  horario real cargado: no se aparta lugar en una hora en que la tienda no atiende. */
export function estadoFranja(f: Fijo, pedidos: PedidoDelFijo[], nowMs: number, abiertoEsaHora: boolean): Franja {
  const vez = proximaVez(f, nowMs);
  const desde = medianocheLima(vez) - DIA;
  const sueltaA = vez - FRANJA_SUELTA_MIN * MIN;
  const confirmados = confirmaciones(pedidos);
  const base = { vez, desde, sueltaA, confirmados };
  const con = (estado: EstadoDeFranja): Franja => ({ ...base, estado, apartada: estado === "apartada" });
  if (f.active === false || !Number.isFinite(vez)) return con("inactivo");
  // Ya se pidió para ese día: el pedido mismo ocupa su lugar en la hora. Seguir apartando
  // además sería contar al mismo cliente dos veces contra el tope.
  const dia = fechaLima(vez);
  if (pedidos.some((p) => p.status !== "CANCELADO" && Number.isFinite(entregaDe(p)) && fechaLima(entregaDe(p)) === dia)) {
    return con("usada");
  }
  if (f.skip_on && String(f.skip_on).slice(0, 10) === dia) return con("saltada");
  if (!abiertoEsaHora) return con("cerrado");
  if (confirmados < FRANJA_DESDE_CONFIRMADOS) return con("faltan-confirmaciones");
  if (nowMs < desde) return con("aun-no-toca");
  if (nowMs >= sueltaA) return con("soltada");
  return con("apartada");
}

/** Inicio de la hora (ISO) en que cae un instante — como agrupa el tope por hora. */
export function inicioDeHora(ms: number): string {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/** Lugares apartados por hora. `excluirId` es el fijo de quien está pidiendo AHORA: su
 *  propio lugar no puede contar en su contra, justo es el que está usando. */
export function apartadosPorHora(
  franjas: { id: string; franja: Franja }[],
  excluirId?: string | null,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const { id, franja } of franjas) {
    if (!franja.apartada || (excluirId && id === excluirId)) continue;
    const k = inicioDeHora(franja.vez);
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
}

/** Cuándo sale el aviso del fijo para ESTA vez. */
export function momentoDelAviso(franja: Franja): number {
  return franja.apartada
    ? franja.sueltaA - AVISO_ANTES_DE_SOLTAR_MIN * MIN
    : franja.vez - AVISO_FIJO_MIN * MIN;
}

/** «Lo pediste 9 veces · siempre a las 7:20 p.m.» (maqueta tu-pedido-fijo). La hora es la
 *  MEDIANA de las entregas, redondeada a 5 minutos: un promedio lo movería un solo pedido
 *  raro de medianoche. El día es el que más se repite. */
export function habitoDe(pedidos: PedidoDelFijo[]): { veces: number; hora: string | null; weekday: number | null; minutos: number | null } {
  const ts = pedidos.map(entregaDe).filter((t) => Number.isFinite(t));
  if (!ts.length) return { veces: 0, hora: null, weekday: null, minutos: null };
  const mins = ts.map((t) => {
    const f = limaFields(new Date(t));
    return f.hour * 60 + f.minute;
  }).sort((a, b) => a - b);
  const mediana = mins[Math.floor((mins.length - 1) / 2)];
  const r = Math.round(mediana / 5) * 5;
  const dias = new Map<number, number>();
  for (const t of ts) {
    const w = limaFields(new Date(t)).weekday;
    dias.set(w, (dias.get(w) || 0) + 1);
  }
  let weekday: number | null = null;
  let max = 0;
  for (const [w, n] of dias) {
    if (n > max || (n === max && weekday !== null && w < weekday)) {
      max = n;
      weekday = w;
    }
  }
  return {
    veces: ts.length,
    hora: String(Math.floor(r / 60) % 24).padStart(2, "0") + ":" + String(r % 60).padStart(2, "0"),
    weekday,
    minutos: mediana,
  };
}

/** La media hora que se le ofrece para dejarlo fijo: la de su costumbre, redondeada a :00 o
 *  :30 (así se guardan los fijos y así corre el aviso) y dentro del horario de ESE día. null
 *  si ese día la tienda no abre. */
export function franjaSugerida(minutos: number, horario: [number, number] | null | undefined): string | null {
  if (!horario) return null;
  const [abre, cierra] = horario;
  let m = Math.round(minutos / 30) * 30;
  m = Math.max(abre * 60, Math.min(cierra * 60 - 30, m));
  if (m < abre * 60 || m >= cierra * 60) return null;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** La hora de Lima en 24 h ("13:30"): es como se guardó el fijo y como lo eligió el cliente. */
export function horaLimaHHMM(ms: number): string {
  const f = limaFields(new Date(ms));
  return String(f.hour).padStart(2, "0") + ":" + String(f.minute).padStart(2, "0");
}

export type AvisoFijo = { title: string; body: string; url: string };

/** El texto del aviso. Toda hora sale del cálculo, ninguna está escrita: es una promesa que
 *  el cliente lee en su teléfono y puede comprobar. `alternativa` es la siguiente media hora
 *  libre de ese día cuando la suya se llenó (null si no queda ninguna); `llena` solo aplica a
 *  quien no tiene lugar apartado — el apartado, por definición, tiene el suyo. */
export function textoAvisoFijo(p: {
  id: string;
  nombre: string;
  franja: Franja;
  llena: boolean;
  alternativa: string | null;
}): AvisoFijo {
  const hora = horaLimaHHMM(p.franja.vez);
  const dia = DIAS[limaFields(new Date(p.franja.vez)).weekday];
  const url = "./index.html?fijo=" + encodeURIComponent(p.id);
  if (p.franja.apartada) {
    return {
      title: "Tu " + dia + " está guardado 🥪",
      body: p.nombre + " para las " + hora + ". Te guardamos el lugar hasta las " + horaLimaHHMM(p.franja.sueltaA)
        + "; si no lo confirmas, se suelta solo. No se cobra nada hasta que confirmes.",
      url,
    };
  }
  if (p.llena && p.alternativa) {
    return {
      title: "Hoy las " + hora + " se nos llenó",
      body: "¿Te lo dejamos a las " + p.alternativa + "? " + p.nombre + ", ya armado: confirmas en un toque.",
      url: url + "&franja=" + encodeURIComponent(p.alternativa),
    };
  }
  if (p.llena) {
    return {
      title: "Hoy no tenemos lugar a las " + hora,
      body: "La cocina se llenó a esa hora. Tu pedido fijo sigue en pie para el " + dia + " que viene.",
      url,
    };
  }
  return {
    title: "¿Va lo de siempre? 🥪",
    body: p.nombre + " para las " + hora + " — ya está armado, confirmas en un toque.",
    url,
  };
}
