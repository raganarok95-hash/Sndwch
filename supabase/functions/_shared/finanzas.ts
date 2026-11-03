// SND//WCH — LAS CUENTAS DEL DUEÑO (2026-11-02, frente de Finanzas)
//
// Lo que le queda al negocio de lo que ya se cobró: costo real de cada pedido y de cada
// sándwich, margen por canal, lo que pasa el techo de 45% y la conciliación de Culqi y Yape.
// Lo usan daily-summary y weekly-summary (los correos privados al dueño) y se prueba en
// tests-api/finanzas.test.ts.
//
// ⚠ ESTE MÓDULO NO PONE PRECIOS. El precio de cada línea es el que quedó guardado en el pedido
// (`precio`, lo escribió deriveCart con `_shared/dinero.ts`, el único sitio donde se calcula lo
// que se cobra). Acá solo se resta lo que costó hacerlo.
//
// ⚠ EL COSTO NO SE INVENTA. Sale de `costos.ts`, que se genera desde el modelo
// (`modelo/exportar_costos.py`). Una línea que el modelo no sabe costear queda «sin costo» y se
// cuenta aparte: rellenarla con un 45% escondería justo el producto que hay que mirar.
//
// ⚠ REPO PÚBLICO. Nada de acá escribe cifras en el repo: los montos van solo al correo del dueño.

import { COSTOS } from "./costos.ts";
import { CULQI_FEE_RATE } from "./reglas.ts";

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number): number => Math.round(n * 100) / 100;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

// ── Canales ────────────────────────────────────────────────────────────────────────────
export type Canal = "web" | "rappi" | "pedidosya";

// Comisión de cada app sobre la venta de comida. `null` = sin dato: el cierre lo dice y no
// resta nada inventado. Rappi: 26% desde el mes 2 [OFERTA de Rappi al dueño, 2026-10-16; falta
// saber si es + IGV; el mes 1 es 0%]. PedidosYa: no hay cifra en Perú (modelo/proyeccion.py).
export const COMISION_APPS: Record<Exclude<Canal, "web">, number | null> = {
  rappi: 0.26,
  pedidosya: null,
};

/** El canal sale de `orders.origen`. Hoy los pedidos de las apps no entran a la base: si algún
 *  día se cargan con su origen, el cierre los separa solo. */
export function canalDe(origen: string | null | undefined): Canal {
  const o = String(origen || "").toLowerCase();
  if (o.includes("rappi")) return "rappi";
  if (o.includes("pedidosya") || o.includes("pedidos-ya") || o === "pya") return "pedidosya";
  return "web";
}

// ── Costo de una línea y de un pedido ──────────────────────────────────────────────────
/** Una línea tal como quedó en `orders.items`. */
export type LineaGuardada = {
  type?: string;
  code?: string;
  sigId?: string;
  prot?: string;
  base?: string;
  size?: string;
  doubleProt?: boolean;
  extraSauce?: boolean;
  qty?: number;
  precio?: number;
};

export type CostoDeLinea = {
  /** SIG09·15, P04·30, D06… */
  clave: string;
  qty: number;
  /** Precio unitario cobrado de carta (con extras), del pedido. */
  precio: number;
  /** Costo unitario de insumos + empaque, o null si el modelo no lo sabe. */
  costo: number | null;
  /** Techo de costo para esta línea (0.45 o su excepción anotada). */
  techo: number;
};

type Tam = "15" | "30";
const tamDe = (s: unknown): Tam | null => (s === "15" || s === "30" ? s : null);
const sig = COSTOS.sig as Record<string, { prot: string; costo: Record<Tam, number>; doble: Record<Tam, number> }>;
const byo = COSTOS.byo as Record<string, { costo: Record<string, Record<Tam, number>>; doble: Record<Tam, number> }>;
const bebida = COSTOS.bebida as Record<string, number>;
const excepciones = COSTOS.excepciones as Record<string, number>;

function techoDe(codigo: string, t: Tam | null): number {
  return (t && excepciones[`${codigo}|${t}`]) || COSTOS.techo;
}

export function costoDeLinea(it: LineaGuardada): CostoDeLinea {
  const qty = Math.max(0, Math.round(num(it?.qty)) || 0);
  const precio = num(it?.precio);
  if (it?.type === "side") {
    const code = String(it.code || "");
    return { clave: code, qty, precio, costo: code in bebida ? bebida[code] : null, techo: COSTOS.techo };
  }
  const t = tamDe(it?.size);
  const extras = (doble: Record<Tam, number> | undefined) =>
    t ? (it.doubleProt && doble ? doble[t] : 0) + (it.extraSauce ? COSTOS.salsaExtra[t] : 0) : 0;
  if (it?.type === "sig") {
    const id = String(it.sigId || "");
    const s = sig[id];
    const costo = s && t ? s.costo[t] + extras(s.doble) : null;
    return { clave: `${id}·${t ?? "?"}`, qty, precio, costo: costo == null ? null : r2(costo), techo: techoDe(id, t) };
  }
  if (it?.type === "byo") {
    const p = String(it.prot || "");
    const b = byo[p];
    const base = b && t ? b.costo[String(it.base || "")]?.[t] : undefined;
    const costo = base != null ? base + extras(b.doble) : null;
    return { clave: `${p}·${t ?? "?"}`, qty, precio, costo: costo == null ? null : r2(costo), techo: techoDe(p, t) };
  }
  return { clave: String(it?.type || "?"), qty, precio, costo: null, techo: COSTOS.techo };
}

export type PedidoParaCuentas = {
  ref?: string | null;
  total?: number | null;
  delivery_fee?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  status?: string | null;
  origen?: string | null;
  items?: unknown;
};

export type CostoDelPedido = {
  ref: string;
  canal: Canal;
  /** Lo que el cliente pagó por la comida (total − envío). */
  comida: number;
  /** La comida a precio de carta, antes de combo, recompensa y código. */
  carta: number;
  costo: number;
  /** Comisión de la tarjeta (Culqi) o de la app. */
  comision: number;
  /** comida − costo − comisión. El envío no deja margen: se le paga al motorizado. */
  contribucion: number;
  lineas: CostoDeLinea[];
  /** Líneas que el modelo no supo costear (no suman al costo). */
  sinCosto: number;
  comisionSinDato: boolean;
};

export function costoDelPedido(o: PedidoParaCuentas, culqi = CULQI_FEE_RATE): CostoDelPedido {
  const lineas = (Array.isArray(o?.items) ? o.items as LineaGuardada[] : []).map(costoDeLinea);
  const comida = Math.max(0, num(o?.total) - num(o?.delivery_fee));
  const carta = lineas.reduce((a, l) => a + l.precio * l.qty, 0);
  const costo = lineas.reduce((a, l) => a + (l.costo ?? 0) * l.qty, 0);
  const canal = canalDe(o?.origen);
  let comision = 0;
  let comisionSinDato = false;
  if (canal === "web") {
    // Culqi cobra sobre TODO lo que pasó por la tarjeta, envío incluido (igual que cashClose).
    if (o?.payment_method === "card") comision = num(o?.total) * culqi;
  } else {
    const tasa = COMISION_APPS[canal];
    if (tasa == null) comisionSinDato = true;
    else comision = comida * tasa;
  }
  return {
    ref: String(o?.ref || ""),
    canal,
    comida: r2(comida),
    carta: r2(carta),
    costo: r2(costo),
    comision: r2(comision),
    contribucion: r2(comida - costo - comision),
    lineas,
    sinCosto: lineas.filter((l) => l.costo == null).reduce((a, l) => a + l.qty, 0),
    comisionSinDato,
  };
}

// ── El cierre: del día, de la semana o del mes ─────────────────────────────────────────
export type CierreDeCanal = {
  canal: Canal;
  pedidos: number;
  comida: number;
  costo: number;
  comision: number;
  contribucion: number;
  /** contribución ÷ comida cobrada; null sin ventas. */
  margenPct: number | null;
  /** Lo que deja un pedido promedio de este canal. */
  porPedido: number | null;
  comisionSinDato: boolean;
};

export type ProductoDelCierre = {
  clave: string;
  unidades: number;
  vendido: number;
  costo: number | null;
  /** costo ÷ precio de carta; null si no hay costo. */
  costoPct: number | null;
  techo: number;
  pasaElTecho: boolean;
};

export type Cierre = {
  pedidos: number;
  comida: number;
  envio: number;
  descuentos: number;
  costo: number;
  comisiones: number;
  contribucion: number;
  /** costo de insumos ÷ comida a precio de carta (lo que se compara con el techo). */
  costoPct: number | null;
  margenPct: number | null;
  porCanal: CierreDeCanal[];
  porProducto: ProductoDelCierre[];
  /** Productos cuyo costo pasó su techo, del peor al menos malo. */
  sobreTecho: ProductoDelCierre[];
  unidadesSinCosto: number;
};

const contable = (o: PedidoParaCuentas) => o && o.payment_status === "paid" && o.status !== "CANCELADO";

export function cierre(pedidos: readonly PedidoParaCuentas[], culqi = CULQI_FEE_RATE): Cierre {
  const lista = (Array.isArray(pedidos) ? pedidos : []).filter(contable).map((o) => ({ o, c: costoDelPedido(o, culqi) }));
  const canales = new Map<Canal, CierreDeCanal>();
  const productos = new Map<string, { clave: string; unidades: number; vendido: number; costo: number; conCosto: boolean; techo: number }>();
  let comida = 0, envio = 0, carta = 0, costo = 0, comisiones = 0, sinCosto = 0;
  for (const { o, c } of lista) {
    comida += c.comida;
    envio += num(o.delivery_fee);
    carta += c.carta;
    costo += c.costo;
    comisiones += c.comision;
    sinCosto += c.sinCosto;
    const k = canales.get(c.canal) || { canal: c.canal, pedidos: 0, comida: 0, costo: 0, comision: 0, contribucion: 0, margenPct: null, porPedido: null, comisionSinDato: false };
    k.pedidos++;
    k.comida += c.comida;
    k.costo += c.costo;
    k.comision += c.comision;
    k.contribucion += c.contribucion;
    k.comisionSinDato ||= c.comisionSinDato;
    canales.set(c.canal, k);
    for (const l of c.lineas) {
      const p = productos.get(l.clave) || { clave: l.clave, unidades: 0, vendido: 0, costo: 0, conCosto: true, techo: l.techo };
      p.unidades += l.qty;
      p.vendido += l.precio * l.qty;
      if (l.costo == null) p.conCosto = false;
      else p.costo += l.costo * l.qty;
      productos.set(l.clave, p);
    }
  }
  const porProducto: ProductoDelCierre[] = [...productos.values()].map((p) => {
    const costoPct = p.conCosto && p.vendido > 0 ? r3(p.costo / p.vendido) : null;
    return {
      clave: p.clave,
      unidades: p.unidades,
      vendido: r2(p.vendido),
      costo: p.conCosto ? r2(p.costo) : null,
      costoPct,
      techo: p.techo,
      pasaElTecho: costoPct != null && costoPct > p.techo,
    };
  }).sort((a, b) => b.vendido - a.vendido);
  const contribucion = comida - costo - comisiones;
  return {
    pedidos: lista.length,
    comida: r2(comida),
    envio: r2(envio),
    descuentos: r2(Math.max(0, carta - comida)),
    costo: r2(costo),
    comisiones: r2(comisiones),
    contribucion: r2(contribucion),
    costoPct: carta > 0 ? r3(costo / carta) : null,
    margenPct: comida > 0 ? r3(contribucion / comida) : null,
    porCanal: [...canales.values()].map((k) => ({
      ...k,
      comida: r2(k.comida),
      costo: r2(k.costo),
      comision: r2(k.comision),
      contribucion: r2(k.contribucion),
      margenPct: k.comida > 0 ? r3(k.contribucion / k.comida) : null,
      porPedido: k.pedidos ? r2(k.contribucion / k.pedidos) : null,
    })).sort((a, b) => b.comida - a.comida),
    porProducto,
    sobreTecho: porProducto.filter((p) => p.pasaElTecho).sort((a, b) => (b.costoPct! - b.techo) - (a.costoPct! - a.techo)),
    unidadesSinCosto: sinCosto,
  };
}

// ── Conciliación de Culqi y Yape ───────────────────────────────────────────────────────
export type PedidoParaConciliar = PedidoParaCuentas & {
  created_at?: string | null;
  payment_id?: string | null;
  receipt_op_number?: string | null;
  receipt_ocr?: { amount?: number | null; coincide?: boolean | null; duplicada?: boolean | null } | null;
};

export type Conciliacion = {
  /** Lo que debería verse en el Yape/Plin del dueño por los pedidos confirmados. */
  yapeEsperado: number;
  yapePedidos: number;
  /** Lo que Culqi debería depositar (cobrado − 5.5%). */
  culqiNetoEsperado: number;
  culqiPedidos: number;
  /** Cada cosa que el dueño tiene que mirar, en palabras, con el pedido. */
  avisos: string[];
};

const MINUTOS_SIN_CONFIRMAR = 30;

export function conciliar(
  pedidos: readonly PedidoParaConciliar[],
  cobrosSinPedido: readonly { ref?: string | null }[] = [],
  ahoraMs = Date.now(),
  culqi = CULQI_FEE_RATE,
): Conciliacion {
  const lista = (Array.isArray(pedidos) ? pedidos : []).filter((o) => o && o.status !== "CANCELADO");
  const avisos: string[] = [];
  let yape = 0, yapeN = 0, tarjeta = 0, tarjetaN = 0;
  const transferencia = (m: unknown) => m === "yape" || m === "plin";
  for (const o of lista) {
    const ref = String(o.ref || "?");
    const total = num(o.total);
    if (o.payment_status === "paid" && transferencia(o.payment_method)) {
      yape += total;
      yapeN++;
      const ocr = o.receipt_ocr || null;
      if (!o.receipt_op_number) avisos.push(`${ref}: confirmado por ${o.payment_method} sin número de operación. Búscalo en tu app.`);
      if (ocr?.amount != null && Math.abs(num(ocr.amount) - total) > 0.009) {
        avisos.push(`${ref}: la captura dice S/${r2(num(ocr.amount))} y el pedido es de S/${r2(total)}.`);
      }
      if (ocr?.coincide === false) avisos.push(`${ref}: tu panel leyó otra captura que la del cliente.`);
      if (ocr?.duplicada) avisos.push(`${ref}: la operación ya se había usado en otro pedido.`);
    }
    if (o.payment_status !== "paid" && transferencia(o.payment_method)) {
      const t = Date.parse(String(o.created_at || ""));
      if (Number.isFinite(t) && ahoraMs - t > MINUTOS_SIN_CONFIRMAR * 60000) {
        avisos.push(`${ref}: ${o.payment_method} de S/${r2(total)} sin confirmar hace más de ${MINUTOS_SIN_CONFIRMAR} min. Mira si entró.`);
      }
    }
    if (o.payment_status === "paid" && o.payment_method === "card") {
      tarjeta += total;
      tarjetaN++;
      if (!o.payment_id) avisos.push(`${ref}: pagado con tarjeta sin el cobro de Culqi anotado.`);
    }
  }
  for (const c of Array.isArray(cobrosSinPedido) ? cobrosSinPedido : []) {
    avisos.push(`${String(c?.ref || "?")}: Culqi cobró y todavía no hay pedido. Se recupera solo; si sigue mañana, revísalo.`);
  }
  return {
    yapeEsperado: r2(yape),
    yapePedidos: yapeN,
    culqiNetoEsperado: r2(tarjeta * (1 - culqi)),
    culqiPedidos: tarjetaN,
    avisos,
  };
}

// ── Texto para el correo ───────────────────────────────────────────────────────────────
export const pct = (x: number | null): string => (x == null ? "sin dato" : `${Math.round(x * 1000) / 10}%`);
export const soles = (x: number | null): string => (x == null ? "sin dato" : `S/${r2(x).toFixed(2)}`);
const NOMBRE_CANAL: Record<Canal, string> = { web: "Web (sndwch.app)", rappi: "Rappi", pedidosya: "PedidosYa" };
export const nombreCanal = (c: Canal): string => NOMBRE_CANAL[c];

/** Las alertas de plata del cierre, en palabras, para el bloque de ALERTAS del correo. */
export function alertasDePlata(c: Cierre): string[] {
  const a: string[] = [];
  for (const p of c.sobreTecho) {
    a.push(`${p.clave} costó ${pct(p.costoPct)} de su precio (techo ${pct(p.techo)}), en ${p.unidades} unidad(es).`);
  }
  if (c.unidadesSinCosto) a.push(`${c.unidadesSinCosto} producto(s) vendidos sin costo en el modelo: no suman al costo. Hay que costearlos.`);
  for (const k of c.porCanal) if (k.comisionSinDato) a.push(`${nombreCanal(k.canal)}: falta la comisión real; su margen sale sin ella.`);
  return a;
}
