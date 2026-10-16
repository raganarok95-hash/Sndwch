// SND//WCH — datos/resumen: la semana en números, para el equipo (2026-10-16).
//
// Función pura (sin red): la llama semana.mjs con lo que leyó de producción y la prueba
// tests-api/datos-de-la-semana.test.ts. Es el «DATOS.md hecho por código» que faltaba
// (docs/marketing/AGENCIA.md §9): el Analista lo interpreta y el ciclo del lunes decide con él,
// en la laptop o en la nube, sin acceso a la base.
//
// El repo es PÚBLICO: aquí no sale la venta total, la utilidad ni la caja, ni nada de un cliente.
// Solo conteos, porcentajes, ticket promedio y gasto de pauta (reglas-sndwch).

// Lima es UTC−5 todo el año.
const LIMA = -5 * 3600e3;
const enLima = (iso) => new Date(Date.parse(iso) + LIMA);
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
export const clave = (tel) => String(tel || '').replace(/\D/g, '').slice(-9);
export const valido = (o) => o.payment_status === 'paid' && o.status !== 'CANCELADO';

/**
 * @param {object} c
 * @param {any[]} c.pedidos   orders creados en la semana (created_at, total, payment_status, status, origen, customer_phone, group_code, recurring_id)
 * @param {any[]} c.historia  orders anteriores a la semana (customer_phone, payment_status, status)
 * @param {any[]} c.visitas   visitas_por_origen de la semana (dia, src, visitas)
 * @param {any[]} c.gasto     ad_spend de la semana (spend_date, platform, amount)
 * @param {string} c.desde    lunes AAAA-MM-DD (hora de Lima)
 * @param {string} c.apertura AAAA-MM-DD: antes de esta fecha todo es prueba
 */
export function resumirSemana({ pedidos, historia, visitas, gasto, desde, apertura }) {
  const antes = new Set(historia.filter(valido).map((o) => clave(o.customer_phone)).filter(Boolean));
  const buenos = pedidos.filter(valido).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const vistos = new Set();
  const origenes = new Map();
  const de = (src) => {
    if (!origenes.has(src)) origenes.set(src, { origen: src, visitas: 0, pedidos: 0, nuevos: 0 });
    return origenes.get(src);
  };
  const porHora = {}, porDia = {};
  let nuevos = 0, vuelven = 0, suma = 0, grupo = 0, fijo = 0;
  for (const o of buenos) {
    const k = clave(o.customer_phone);
    const fila = de(o.origen || 'directo');
    fila.pedidos++;
    // Cliente nuevo = su primer pedido válido de la historia, contado una vez.
    if (k && !antes.has(k) && !vistos.has(k)) { nuevos++; fila.nuevos++; }
    else if (k && antes.has(k) && !vistos.has(k)) vuelven++;
    if (k) vistos.add(k);
    suma += Number(o.total) || 0;
    if (o.group_code) grupo++;
    if (o.recurring_id) fijo++;
    const l = enLima(o.created_at);
    porHora[l.getUTCHours()] = (porHora[l.getUTCHours()] || 0) + 1;
    porDia[DIAS[l.getUTCDay()]] = (porDia[DIAS[l.getUTCDay()]] || 0) + 1;
  }
  for (const v of visitas) de(v.src || 'directo').visitas += Number(v.visitas) || 0;
  const porOrigen = [...origenes.values()]
    .map((f) => ({ ...f, conversion: f.visitas ? +(f.pedidos / f.visitas).toFixed(4) : null }))
    .sort((a, b) => b.pedidos - a.pedidos || b.visitas - a.visitas);
  const gastoPorPlataforma = {};
  for (const g of gasto) gastoPorPlataforma[g.platform || 'meta'] = +((gastoPorPlataforma[g.platform || 'meta'] || 0) + Number(g.amount || 0)).toFixed(2);
  // Costo por cliente nuevo de Meta: su gasto entre los nuevos que llegaron con un enlace meta-*.
  const nuevosMeta = porOrigen.filter((f) => f.origen.startsWith('meta-')).reduce((s, f) => s + f.nuevos, 0);
  const gMeta = gastoPorPlataforma.meta || 0;
  return {
    semana: desde,
    // Una semana que termina antes de abrir es toda de prueba (CLAUDE.md: data de prueba).
    prueba: new Date(Date.parse(desde) + 7 * 864e5).toISOString().slice(0, 10) <= apertura,
    pedidos: buenos.length,
    clientesNuevos: nuevos,
    clientesQueVuelven: vuelven,
    ticketPromedio: buenos.length ? +(suma / buenos.length).toFixed(2) : null,
    enGrupo: grupo,
    conPedidoFijo: fijo,
    porOrigen,
    porHora,
    porDia,
    gastoDePauta: gastoPorPlataforma,
    costoPorClienteNuevoMeta: gMeta && nuevosMeta ? +(gMeta / nuevosMeta).toFixed(2) : null,
  };
}

// El lunes (hora de Lima) de la semana que contiene `iso`.
export function lunesDe(iso) {
  const l = enLima(iso);
  const atras = (l.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - atras)).toISOString().slice(0, 10);
}
