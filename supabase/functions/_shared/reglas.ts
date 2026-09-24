// SND//WCH — _shared/reglas
// LAS REGLAS DEL NEGOCIO, UNA SOLA VEZ (2026-09-24).
//
// Envío, tienda, horario, rangos, referidos, retos, tarjeta de regalo, Plan Semanal, cola,
// ventana de entrega y los plazos de «Algo salió mal». Estaban escritas dos veces —en el cliente
// (`src/app/01-*`, `06-*`) y en el servidor (`env.ts`, `customer.ts`, `problems.ts`)— y
// `parity.mjs` las comparaba leyendo los dos lados con expresiones regulares. Ahora las dos partes
// importan este archivo (el cliente por el bundle nuevo, igual que el dinero y la carta).
//
// El PORQUÉ de cada número sigue escrito junto a su nombre en el servidor (`env.ts`,
// `customer.ts`, `problems.ts`), que hoy solo lo toma de acá. Un cambio de regla se hace acá, una
// vez, y vale en los dos lados.
//
// ⚠ Varias son SEMILLA de algo que el dueño puede mover desde el panel (horario en `store_hours`,
// tope por hora y cola en get-store-hours). Lo que manda en runtime es la base.
import { recompensaDeTipo, type TipoRecompensa } from "./carta.ts";

const ptsDe = (tipo: TipoRecompensa): number => {
  const r = recompensaDeTipo(tipo);
  if (!r) throw new Error(`La carta no tiene una recompensa de tipo «${tipo}»: el referido la necesita.`);
  return r.pts;
};

// ── Referidos y puntos ──────────────────────────────────────────────────────────────
// Lo que gana cada parte ES una recompensa entregada como puntos: el invitado, una bebida; quien
// invita, un 15CM. Se derivan de la carta para que no puedan separarse (ya pasó: R05 subió de 120
// a 160 y el bono se quedó en 120 durante ocho días, prometiendo una bebida que no alcanzaba).
export const REFERRAL_BONUS_POINTS = ptsDe("bebida");
export const REFERRER_REWARD_POINTS = ptsDe("sandwich");
// La escalera: cada escalón paga `veces` × lo que cuesta la recompensa que su etiqueta nombra.
const escalon = (count: number, cubre: TipoRecompensa, veces: number, label: string) => ({
  count,
  points: veces * ptsDe(cubre),
  label,
  covers: recompensaDeTipo(cubre)!.id,
  veces,
});
export const REFERRAL_MILESTONES = [
  escalon(3, "bebida", 1, "una bebida de la casa gratis"),
  escalon(5, "sandwich", 1, "otro sándwich 15CM gratis"),
  escalon(10, "sandwich", 2, "dos sándwiches 15CM gratis"),
];
export const WELCOME_BONUS_POINTS = 40;
export const RANKS: { name: string; minOrders: number }[] = [
  { name: "NUEVO", minOrders: 0 },
  { name: "REGULAR", minOrders: 1 },
  { name: "INICIADO", minOrders: 5 },
  { name: "CÍRCULO INTERNO", minOrders: 15 },
  { name: "MESA FUNDADORA", minOrders: 30 },
];
export const CHALLENGE_TARGET_ORDERS = 3;
export const CHALLENGE_BONUS_POINTS = 50;
export const DISCOVERY_TARGET_FLAVORS = 3;
export const DISCOVERY_BONUS_POINTS = 50;

// ── Tienda, horario y cocina ───────────────────────────────────────────────────────
export const STORE_LAT = -8.139599;
export const STORE_LON = -79.039458;
/** Por día de la semana (0 = domingo): [abre, cierra] en horas de Lima, o null si cierra. */
export const STORE_HOURS: Array<[number, number] | null> = [
  [11, 22], null, [11, 22], [11, 22], [11, 22], [11, 22], [11, 22],
];
export const MAX_ORDERS_PER_HOUR = 10;
export const QUEUE_MINUTES_PER_ORDER = 5;
/** Minutos de la ventana que se promete con la cocina vacía: [desde, hasta]. */
export const ESTIMATED_DELIVERY_RANGE: [number, number] = [25, 40];
export const NOTE_ALERT_WORDS = ["alergi", "alérgi", "intoleran", "celiac", "celíac", "gluten", "lactosa", "diabet"];

// ── Envío ──────────────────────────────────────────────────────────────────────────
export const DELIVERY_KM_RATE = 2;
export const DELIVERY_ROAD_FACTOR = 1.3;
export const DELIVERY_MIN_FEE = 5;
export const DELIVERY_MAX_KM = 12;
export const DELIVERY_EXCLUDED_ZONES = ["el milagro", "el porvenir"];
export const ZONAS_DE_ENVIO: { id: string; nombre: string; precio: number }[] = [
  { id: "cerca", nombre: "Cerca del local", precio: 6 },
  { id: "media", nombre: "Distancia media", precio: 8 },
  { id: "lejos", nombre: "Lejos", precio: 12 },
  { id: "muy_lejos", nombre: "Muy lejos", precio: 15 },
];

// ── Cobro, tarjeta de regalo y Plan Semanal ────────────────────────────────────────
export const CULQI_FEE_RATE = 0.055;
export const GIFT_CARD_POINTS_PER_SOL = 40;
export const GIFT_CARD_AMOUNT_MIN = 10;
export const GIFT_CARD_AMOUNT_MAX = 500;
export const WEEKLY_PLAN_PRICE = 95;
export const WEEKLY_PLAN_CREDIT = 100;

// ── «Algo salió mal» ───────────────────────────────────────────────────────────────
/** Horas desde la entrega en que se puede reportar un problema (lo mismo que dicen los Términos). */
export const REPORTE_PLAZO_HORAS = 48;
/** Antes de esta hora de Lima se responde hoy a las RESPUESTA_HOY_HORA; después, mañana a las RESPUESTA_MANANA_HORA. */
export const RESPUESTA_CORTE_HORA = 19;
export const RESPUESTA_HOY_HORA = 21;
export const RESPUESTA_MANANA_HORA = 13;
