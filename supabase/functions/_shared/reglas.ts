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
/** Rappi y PedidosYa cobran el precio de la web más este recargo (dueño, 2026-10-09; confirmado el
 *  2026-10-16: «todos cobran más en Rappi y PedidosYa que en sus locales»). Las apps no tienen API:
 *  el dueño pega en su portal lo que calcula `npm run hechos` (docs/hechos/CARTA.md). */
export const RECARGO_APPS = 0.10;
/** Sin sándwich, un pedido lleva al menos estas bebidas (dueño, 2026-10-21: «si es sin sándwich,
 *  se venden a partir de dos latas»). Con un sándwich, cualquier cantidad. Lo exigen el servidor
 *  (`assertSandwichOBebidas`, orders.ts) y el aviso del carrito (`faltaSandwich`). */
export const BEBIDAS_SIN_SANDWICH_DESDE = 2;
export const NOTE_ALERT_WORDS = ["alergi", "alérgi", "intoleran", "celiac", "celíac", "gluten", "lactosa", "diabet"];

// ── Cierre temporal ────────────────────────────────────────────────────────────────
// CERRADO HASTA UNA FECHA (dueño, 2026-11-23: «Cierra el app, por el momento. Coloca un aviso que
// atenderemos a partir del miércoles 25»). Mientras dure, la app no toma pedidos (ni para ahora ni
// programados) y la puerta dice cuándo volvemos. Se reabre SOLA a la hora de `hasta`, sin tocar
// nada. Para quitarlo antes, o cuando ya pasó, se pone en null. Vive en el código y no en la base
// para que valga igual en el cliente y en el servidor desde el mismo despliegue.
export const CIERRE_TEMPORAL: { hasta: string } | null = { hasta: "2026-11-25T11:00:00-05:00" };
/** true mientras el cierre temporal está vigente. */
export function cerradoTemporalmente(ahoraMs: number = Date.now()): boolean {
  if (!CIERRE_TEMPORAL) return false;
  const hasta = Date.parse(CIERRE_TEMPORAL.hasta);
  return Number.isFinite(hasta) && ahoraMs < hasta;
}
/** «el miércoles 25 de noviembre desde las 11:00», sacado de `hasta` (la cifra nunca se escribe a mano). */
export function cuandoVolvemos(): string {
  if (!CIERRE_TEMPORAL) return "";
  const d = new Date(CIERRE_TEMPORAL.hasta);
  const dia = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Lima" }).replace(",", "");
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Lima" });
  return `el ${dia} desde las ${hora}`;
}

// ── Envío ──────────────────────────────────────────────────────────────────────────
// TARIFARIO POR KM del grupo de motorizados (dueño, 2026-11-20: «Me actualizaron el tarifario de
// envío»). Cada tramo cubre hasta `hastaKm` inclusive; el que cae entre dos tramos (1.55 km) paga
// el de arriba, así el error queda del lado de pagarle completo al motorizado. Pasado el último
// tramo no hay tarifa: la app no acepta la dirección (DELIVERY_MAX_KM). Reemplaza a S/2 por km.
export const TARIFA_ENVIO: { hastaKm: number; precio: number }[] = [
  { hastaKm: 1.5, precio: 5 },
  { hastaKm: 2.2, precio: 6 },
  { hastaKm: 3.0, precio: 7 },
  { hastaKm: 3.9, precio: 8 },
  { hastaKm: 4.5, precio: 9 },
  { hastaKm: 5.0, precio: 10 },
  { hastaKm: 5.5, precio: 11 },
  { hastaKm: 6.0, precio: 12 },
  { hastaKm: 6.5, precio: 13 },
  { hastaKm: 7.0, precio: 14 },
];
/** Hasta dónde llega el envío: el último tramo del tarifario. */
export const DELIVERY_MAX_KM = TARIFA_ENVIO[TARIFA_ENVIO.length - 1]!.hastaKm;
export const DELIVERY_ROAD_FACTOR = 1.3;
/** El envío más barato: el primer tramo («delivery desde S/5»). */
export const DELIVERY_MIN_FEE = TARIFA_ENVIO[0]!.precio;
/** Lo que cuesta el envío a `km` cobrables, o null si está fuera del tarifario. Cliente y servidor usan ESTA. */
export function tarifaEnvio(km: number): number | null {
  if (!Number.isFinite(km) || km < 0) return null;
  const tramo = TARIFA_ENVIO.find((t) => km <= t.hastaKm);
  return tramo ? tramo.precio : null;
}
// SIN LÍMITES POR DISTRITO (dueño, 2026-09-30: «manda siempre la distancia, mi proveedor de delivery
// no tiene límites de envío»). Desde el 2026-11-20 el límite es el del tarifario (DELIVERY_MAX_KM). Hasta el 2026-09-30 había un tope de 12 km y El Milagro / El Porvenir se
// rechazaban por el texto de la dirección. La lista vacía apaga ese rechazo sin ramas muertas
// (el mismo criterio que la hora valle retirada); el tope de km se quitó con sus chequeos.
export const DELIVERY_EXCLUDED_ZONES: string[] = [];
export const ZONAS_DE_ENVIO: { id: string; nombre: string; precio: number }[] = [
  { id: "cerca", nombre: "Cerca del local", precio: 6 },
  { id: "media", nombre: "Distancia media", precio: 8 },
  { id: "lejos", nombre: "Lejos", precio: 12 },
  { id: "muy_lejos", nombre: "Muy lejos", precio: 14 },
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

// ── Yape confirmado por captura (dueño, 2026-10-02: «gratis y automatizado aun con el riesgo de
// que se modifique la captura»; tope decidido: S/80). Sobre este total el pago lo confirma el dueño.
export const YAPE_AUTO_TOPE = 80;
/** El celular que recibe los yapeos (el mismo de WhatsApp). El cliente lo muestra para yapear y el
 *  servidor comprueba que la captura diga que el yapeo fue a este número (sus 3 últimos dígitos). */
export const YAPE_NUMERO_COBRO = "930957640";
