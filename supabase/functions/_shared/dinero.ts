// SND//WCH — EL DINERO, UNA SOLA VEZ (2026-09-24)
//
// Cuánto cuesta cada línea del carrito y cuánto se cobra por el carrito entero. Lo importan el
// servidor (catalog.ts → deriveCart, que es lo que se cobra) y el cliente (el total que ve antes
// de pagar). Mismo código y mismos precios dan el mismo total POR CONSTRUCCIÓN.
//
// ⚠ POR QUÉ EXISTE. Antes el motor existía dos veces: `deriveCart`/`priceCartItem` en el
// servidor e `itemUnitPrice`/`cartFinalTotal`/`rewardWaiverAmount`… en el cliente. `parity`
// comparaba las CONSTANTES leyendo los dos archivos como texto; la LÓGICA no la comparaba nadie.
// Cuando se unificaron aparecieron tres diferencias vivas, las tres con el pan focaccia (B03):
// el servidor cuenta su recargo dentro del precio base del sándwich y el cliente no, así que con
// R06 («15CM gratis»), R03 («sube a 30CM») o el sándwich gratis del organizador el cliente
// mostraba S/0.50 más y el servidor rechazaba el pago por «el total no coincide».
//
// ⚠ LA VALIDACIÓN NO VIVE ACÁ. Qué ingredientes existen, qué está retirado, qué es solo del menú
// secreto: eso lo decide el servidor (`priceCartItem`) ANTES de llamar a esto. Este módulo solo
// hace aritmética sobre líneas que ya se sabe que son válidas, con los precios que le pasen. Una
// línea con un id que no está en `precios` devuelve null (el cliente la muestra a S/0 hasta que
// el catálogo la descarta; el servidor nunca llega acá con una así).
//
// ⚠ TODO SE CUENTA EN CÉNTIMOS ENTEROS. `20.9 * 3` da 62.699999999999996 en coma flotante: en
// céntimos es 6270, exacto. Se convierte a soles solo al devolver.

/** Reglas del dinero que NO vienen de la base (no se editan desde el panel). */
import { CARTA, idsDe, type TipoRecompensa } from './carta.ts';

export const REGLAS = {
  /** Descuento por cada par sándwich + bebida. Bajado de S/2 a S/1 el 2026-08-22: a S/2 el
   *  combo se comía entre el 58% y el 118% de lo que deja una bebida (ver catalog.ts). */
  comboPorPar: 1,
  /** Recargo de la salsa extra. Uno de los dos precios que NO viven en `catalog_prices`. */
  salsaExtra: 2,
  /** Recargo del pan por tamaño. El otro precio que no vive en `catalog_prices`. Solo la
   *  focaccia lleva. Va DENTRO del precio base: así lo perdonan enteros el sándwich gratis y la subida a 30CM. */
  recargoPan: { B03: { p15: 0.5, p30: 1 } } as Record<string, { p15: number; p30: number }>,
  /** El menú secreto no entra en «15CM gratis» ni en el sándwich del organizador: es lo más caro
   *  del catálogo y se gamearía. */
  reservas: idsDe(CARTA.signatures, (x) => x.tipo === 'Reserve') as readonly string[],
  /** Desde cuántos sándwiches el organizador de un pedido grupal se lleva el 15CM más barato. */
  organizadorDesde: 5,
  /** Bebida gratis de hora valle. RETIRADA el 2026-09-05 (era la única operación con
   *  contribución negativa): la ventana vacía la apaga sin ramas muertas. */
  valleHorasLima: [] as readonly (readonly [number, number])[],
  valleTope: 6,
} as const;

export type Tamano = '15' | '30';
/** El id de una recompensa de la carta (`CARTA.recompensas`). Lo que hace lo dice su `tipo`. */
export type Recompensa = string;

/** La definición de una recompensa por su id, o undefined si la carta no la tiene. */
function defDe(r: Recompensa) {
  return CARTA.recompensas.find((x) => x.id === r);
}

/** Los precios vigentes, tal como los cargó cada lado (servidor: catalog_prices; cliente:
 *  get-catalog). En soles. */
export type Precios = {
  prot: Record<string, { p15: number; p30: number; pDbl: number; pDbl30: number }>;
  sig: Record<string, { prot: string; p15: number; p30: number; salsas: number }>;
  bebida: Record<string, number>;
};

/** Una línea del carrito, con lo que el dinero necesita saber de ella. */
export type LineaDelCarrito =
  | { type: 'side'; code: string; qty: number }
  | { type: 'sig'; sigId: string; size: Tamano; doubleProt?: boolean; extraSauce?: boolean; qty: number }
  | {
    type: 'byo';
    base: string;
    prot: string;
    sauces: readonly string[];
    size: Tamano;
    doubleProt?: boolean;
    extraSauce?: boolean;
    qty: number;
  };

/** Una línea tasada. Montos en CÉNTIMOS, por unidad. */
export type Tasada = {
  tipo: 'side' | 'sig' | 'byo';
  qty: number;
  /** base + doble + salsa */
  unitario: number;
  /** Precio del sándwich (con el recargo del pan) o de la bebida, sin extras. */
  base: number;
  doble: number;
  salsa: number;
  /** Cuánto costaría subir ESTE 15CM a 30CM, pan incluido. 0 si ya es 30CM. */
  subir30: number;
  /** A qué TIPO de recompensa puede aplicarse esta línea (ver `TipoRecompensa` en la carta). */
  elegible: Record<TipoRecompensa, boolean>;
};

const cent = (soles: number): number => Math.round(soles * 100);
const soles = (c: number): number => c / 100;

function recargoPan(base: string, t: Tamano): number {
  const r = REGLAS.recargoPan[base];
  return r ? (t === '15' ? r.p15 : r.p30) : 0;
}

export function tasarLinea(it: LineaDelCarrito, p: Precios): Tasada | null {
  if (it.type === 'side') {
    const precio = p.bebida[it.code];
    if (precio == null) return null;
    const c = cent(precio);
    return {
      tipo: 'side', qty: it.qty, unitario: c, base: c, doble: 0, salsa: 0, subir30: 0,
      elegible: { salsa: false, subir30: false, doble: false, bebida: true, sandwich: false },
    };
  }
  const t = it.size;
  let base: number;
  let base30: number;
  let prot: Precios['prot'][string] | undefined;
  let hayQueDuplicar: boolean;
  let r02: boolean;
  let reserva = false;
  if (it.type === 'sig') {
    const s = p.sig[it.sigId];
    if (!s) return null;
    prot = p.prot[s.prot];
    base = cent(t === '15' ? s.p15 : s.p30);
    base30 = cent(s.p30);
    // Sin salsas en la receta no hay nada que duplicar: no se cobra ni se perdona nada.
    hayQueDuplicar = !!it.extraSauce && s.salsas > 0;
    r02 = !!it.extraSauce;
    reserva = REGLAS.reservas.includes(it.sigId);
  } else {
    prot = p.prot[it.prot];
    if (!prot) return null;
    base = cent((t === '15' ? prot.p15 : prot.p30) + recargoPan(it.base, t));
    base30 = cent(prot.p30 + recargoPan(it.base, '30'));
    hayQueDuplicar = !!it.extraSauce;
    // En ARMA EL TUYO la «4ta salsa gratis» solo tiene sentido si ya llegó al tope de 3.
    r02 = !!it.extraSauce && it.sauces.length === 3;
  }
  const doble = it.doubleProt && prot ? cent(t === '30' ? prot.pDbl30 : prot.pDbl) : 0;
  const salsa = hayQueDuplicar ? cent(REGLAS.salsaExtra) : 0;
  const subir30 = t === '15' ? Math.max(0, base30 - base) : 0;
  return {
    tipo: it.type, qty: it.qty, unitario: base + doble + salsa, base, doble, salsa, subir30,
    elegible: { salsa: r02, subir30: subir30 > 0, doble: !!it.doubleProt, bebida: false, sandwich: t === '15' && !reserva },
  };
}

/** La primera línea a la que se le puede aplicar la recompensa, o -1. */
export function lineaDeLaRecompensa(tasadas: readonly (Tasada | null)[], r: Recompensa): number {
  const d = defDe(r);
  if (!d) return -1;
  return tasadas.findIndex((x) => !!x && x.elegible[d.tipo]);
}

/** Cuánto perdona la recompensa sobre esa línea, en céntimos: lo que su tipo cubre, con su tope. */
function perdonDe(r: Recompensa, x: Tasada): number {
  const d = defDe(r);
  if (!d) return 0;
  const monto = d.tipo === 'salsa' ? x.salsa
    : d.tipo === 'subir30' ? x.subir30
    : d.tipo === 'doble' ? x.doble
    : x.base; // bebida y sándwich: la unidad entera
  return d.tope == null ? monto : Math.min(monto, cent(d.tope));
}

export type OpcionesDelCarrito = {
  recompensa?: Recompensa | null;
  /** Solo en true cuando el servidor VERIFICÓ que es el pedido grupal cerrado de esta sesión. */
  organizador?: boolean;
  /** Hora de preparación (ms), para la bebida de hora valle. */
  cuandoMs?: number;
};

export type Desglose = {
  /** Suma de las líneas a precio de carta, en soles. */
  subtotal: number;
  combo: number;
  valle: number;
  organizador: { indice: number; monto: number };
  /** indice -1 si se pidió una recompensa y no hay línea elegible (el servidor lo rechaza). */
  recompensa: { id: Recompensa; indice: number; monto: number } | null;
  /** Lo que se cobra por la comida (sin envío ni código promocional), en soles. */
  total: number;
  tasadas: (Tasada | null)[];
};

function enHoraValle(ms: number): boolean {
  const h = new Date(ms - 5 * 3600000).getUTCHours();
  return REGLAS.valleHorasLima.some(([a, b]) => h >= a && h < b);
}

export function resolverCarrito(
  items: readonly LineaDelCarrito[],
  op: OpcionesDelCarrito,
  p: Precios,
): Desglose {
  const tasadas = items.map((it) => tasarLinea(it, p));
  const reales = tasadas.map((x, i) => ({ x, i })).filter((v): v is { x: Tasada; i: number } => !!v.x);
  let total = reales.reduce((s, { x }) => s + x.unitario * x.qty, 0);
  const subtotal = total;

  // La recompensa se resuelve PRIMERO: la bebida y el sándwich gratis regalan una unidad COMPLETA, y esa unidad no
  // puede seguir contando para el combo (si no, el combo regala también la otra mitad del par).
  const rid = op.recompensa ?? null;
  const ri = rid ? lineaDeLaRecompensa(tasadas, rid) : -1;
  const objetivo = ri >= 0 ? tasadas[ri]! : null;
  const tipo = rid ? defDe(rid)?.tipo ?? null : null;

  let sandwiches = reales.filter(({ x }) => x.tipo !== 'side').reduce((s, { x }) => s + x.qty, 0);
  let bebidas = reales.filter(({ x }) => x.tipo === 'side').reduce((s, { x }) => s + x.qty, 0);
  // El umbral del organizador se mide sobre lo que el grupo PIDIÓ, antes de quitar la unidad
  // que regala el sándwich gratis (si no, un grupo de 5 que lo usaba caía a 4 y perdía el del organizador).
  const sandwichesPedidos = sandwiches;
  if (tipo === 'sandwich' && objetivo && objetivo.tipo !== 'side') sandwiches -= 1;
  if (tipo === 'bebida' && objetivo && objetivo.tipo === 'side') bebidas -= 1;

  // El organizador se lleva el 15CM más barato (misma elegibilidad que el sándwich gratis), nunca la misma
  // línea que ya regala la recompensa.
  let oi = -1;
  if (op.organizador && sandwichesPedidos >= REGLAS.organizadorDesde) {
    let mejor = Infinity;
    reales.forEach(({ x, i }) => {
      if (i === ri || !x.elegible.sandwich) return;
      if (x.base < mejor) {
        mejor = x.base;
        oi = i;
      }
    });
    if (oi >= 0) sandwiches -= 1;
  }

  const combo = Math.max(0, Math.min(sandwiches, bebidas)) * cent(REGLAS.comboPorPar);
  let valle = 0;
  if (enHoraValle(op.cuandoMs ?? Date.now())) {
    const precios: number[] = [];
    reales.forEach(({ x, i }) => {
      if (x.tipo !== 'side') return;
      const n = tipo === 'bebida' && i === ri ? x.qty - 1 : x.qty;
      for (let k = 0; k < n; k++) precios.push(x.unitario);
    });
    if (precios.length) valle = Math.min(Math.min(...precios), cent(REGLAS.valleTope));
  }
  // Combo y hora valle no se suman: se aplica el mayor.
  total = Math.max(0, total - Math.max(combo, valle));

  const organizador = oi >= 0 ? tasadas[oi]!.base : 0;
  total = Math.max(0, total - organizador);

  const perdon = objetivo && rid ? perdonDe(rid, objetivo) : 0;
  total = Math.max(0, total - perdon);

  return {
    subtotal: soles(subtotal),
    combo: soles(combo),
    valle: soles(valle),
    organizador: { indice: oi, monto: soles(organizador) },
    recompensa: rid ? { id: rid, indice: ri, monto: soles(perdon) } : null,
    total: soles(total),
    tasadas,
  };
}

/** Precio de UNA unidad de la línea, en soles (0 si ya no está en la carta). */
export function precioUnitario(it: LineaDelCarrito, p: Precios): number {
  const x = tasarLinea(it, p);
  return x ? soles(x.unitario) : 0;
}
