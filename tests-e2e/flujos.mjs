// FLUJOS DE PUNTA A PUNTA CONTRA EL BACKEND REAL (2026-09-24).
//
// Corren contra `scripts/e2e/servidor-local.mjs`: el `api` real en Deno, PostgREST y un
// Postgres con el esquema real. Cada flujo entra por la API como lo haría la app y después MIRA
// LA BASE, porque el modo de fallo que importa acá es silencioso: una respuesta 200 con el
// saldo mal, un pedido sin su historial, un cobro que no quedó anotado.
//
// POR QUÉ EXISTE. Las pruebas de pantalla (tests/) simulan el `api` entero y nunca ejecutan una
// línea del servidor; las del servidor (tests-api/) prueban cálculos sueltos sin base. Por el
// hueco entre las dos pasaron a producción `pointsFor` con decimales contra una columna entera
// (reventaba DESPUÉS del cobro) y el tope por hora consultando una columna que no existe.
//
// Correr con: npm run check:e2e
import { resolverCarrito } from '../supabase/functions/_shared/dinero.ts';

const TIENDA = { lat: -8.139599, lon: -79.039458 };
const ENVIO_MINIMO = 5;

function preciosDelCatalogo(c) {
  const sig = {};
  for (const [id, x] of Object.entries(c.sigItems || {})) sig[id] = { prot: x.prot, p15: x.p15, p30: x.p30, salsas: (x.sauces || []).length };
  for (const [id, x] of Object.entries(c.sigs || {})) if (sig[id]) Object.assign(sig[id], { p15: x.p15, p30: x.p30 });
  return { prot: c.proteins, sig, bebida: c.sides };
}

function afirmar(cond, msg) {
  if (!cond) throw new Error(msg);
}

let n = 0;
async function registrarYEntrar(s) {
  n++;
  const phone = '9' + String(10000000 + n * 7919).slice(-8);
  const dni = String(40000000 + n * 13);
  // Todas las pruebas llegan desde la misma «conexión»: el límite real de cuentas nuevas por
  // conexión (check_rate_limit) las cortaría a la tercera. Se reinicia ese contador, no el límite.
  s.sql(`delete from rate_limits`);
  const r = await s.llamar('register', { name: 'Cliente ' + n, phone, pin: '4321', dni, bday: '1995-05-05' });
  afirmar(r.status === 200, `registro: ${r.status} ${r.error || ''}`);
  const l = await s.llamar('login', { phone, pin: '4321' });
  afirmar(l.status === 200 && l.token, `login: ${l.status} ${l.error || ''}`);
  return { phone, token: l.token };
}

const valor = (s, q) => s.sql(q).trim();

export const FLUJOS = {
  async 'registrarse, entrar y seguir con la sesión'(s) {
    const { token, phone } = await registrarYEntrar(s);
    const r = await s.llamar('session-check', { token });
    afirmar(r.status === 200 && r.valid === true && r.customer?.phone === phone, `session-check: ${JSON.stringify(r).slice(0, 200)}`);
    afirmar(valor(s, `select count(*) from customers where phone = '${phone}'`) === '1', 'el cliente no quedó en la base');
    afirmar(valor(s, `select pin = '4321' from customers where phone = '${phone}'`) === 'f', 'el PIN quedó guardado en texto plano');
  },

  async 'pedir pagando con crédito: se cobra el total justo y queda saldo, pedido e historial'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    s.sql(`update customers set credit_balance = 100 where phone = '${phone}'`);
    const items = [{ type: 'sig', sigId: 'SIG01', size: '15', qty: 1 }, { type: 'side', code: 'D07', qty: 1 }];
    const comida = resolverCarrito(items, {}, precios).total;
    const total = Math.round((comida + ENVIO_MINIMO) * 100) / 100;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-CRED', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, useCredit: true, summary: '1x The Original', deliveryZone: 'trujillo',
    });
    afirmar(r.status === 200, `place-order: ${r.status} ${r.error || ''}`);
    afirmar(valor(s, `select payment_status || '|' || total || '|' || delivery_fee from orders where ref = 'E2E-CRED'`) === `paid|${total.toFixed(2)}|${ENVIO_MINIMO.toFixed(2)}`,
      'el pedido no quedó pagado con el total y el envío esperados: ' + valor(s, `select payment_status || '|' || total || '|' || delivery_fee from orders where ref = 'E2E-CRED'`));
    afirmar(Number(valor(s, `select credit_balance from customers where phone = '${phone}'`)) === Math.round((100 - total) * 100) / 100, 'el crédito no bajó en el total');
    afirmar(valor(s, `select count(*) from credit_ledger where customer_phone = '${phone}' and reason like '%E2E-CRED%'`) === '1', 'falta la línea en el libro de crédito');
    const ganados = Number(valor(s, `select coalesce(sum(points),0) from transactions where order_ref = 'E2E-CRED' and type = 'earn_confirmed'`));
    afirmar(ganados > 0 && Number.isInteger(ganados), `puntos ganados: ${ganados}`);
    const saldo = Number(valor(s, `select points from customers where phone = '${phone}'`));
    const historial = Number(valor(s, `select coalesce(sum(points),0) from transactions where customer_phone = '${phone}'`));
    afirmar(saldo === historial, `los puntos del cliente (${saldo}) no coinciden con la suma de su historial (${historial}); del pedido: ${ganados}. Movimientos: ` +
      valor(s, `select string_agg(type || ':' || points || ':' || coalesce(description,''), ' | ') from transactions where customer_phone = '${phone}'`));
  },

  async 'un total manipulado se rechaza y no toca nada'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    s.sql(`update customers set credit_balance = 100 where phone = '${phone}'`);
    const items = [{ type: 'sig', sigId: 'SIG02', size: '30', qty: 1 }];
    const total = resolverCarrito(items, {}, precios).total + ENVIO_MINIMO - 1;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-TRAMPA', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, useCredit: true, summary: 'x', deliveryZone: 'trujillo',
    });
    afirmar(r.status === 400 && /no coincide/.test(r.error || ''), `esperaba 400 «no coincide», llegó ${r.status} ${r.error || ''}`);
    afirmar(valor(s, `select count(*) from orders where ref = 'E2E-TRAMPA'`) === '0', 'quedó un pedido con el total manipulado');
    afirmar(valor(s, `select credit_balance from customers where phone = '${phone}'`) === '100.00', 'el crédito cambió con un pedido rechazado');
  },

  async 'Yape: queda pendiente, reserva stock y la cancelación lo devuelve'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    s.sql(`insert into inventory (product_code, stock_qty) values ('D08', 5) on conflict (product_code) do update set stock_qty = 5`);
    const puntosAntes = valor(s, `select points from customers where phone = '${phone}'`);
    const items = [{ type: 'side', code: 'D08', qty: 2 }];
    const total = resolverCarrito(items, {}, precios).total + ENVIO_MINIMO;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-YAPE', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, paymentMethod: 'yape', summary: '2x The Cool', deliveryZone: 'trujillo',
    });
    afirmar(r.status === 200, `place-order yape: ${r.status} ${r.error || ''}`);
    afirmar(valor(s, `select payment_status from orders where ref = 'E2E-YAPE'`) === 'pending', 'el pedido Yape no quedó pendiente');
    afirmar(valor(s, `select stock_qty from inventory where product_code = 'D08'`) === '3', 'no se reservó el stock: ' + valor(s, `select stock_qty from inventory where product_code = 'D08'`));
    afirmar(valor(s, `select points from customers where phone = '${phone}'`) === puntosAntes, 'un pedido sin pagar dio puntos');
    const id = valor(s, `select id from orders where ref = 'E2E-YAPE'`);
    const c = await s.llamar('cancel-my-order', { token, orderId: id, id, ref: 'E2E-YAPE' });
    afirmar(c.status === 200, `cancel-my-order: ${c.status} ${c.error || ''}`);
    afirmar(valor(s, `select status from orders where ref = 'E2E-YAPE'`) === 'CANCELADO', 'el pedido no quedó cancelado');
    afirmar(valor(s, `select stock_qty from inventory where product_code = 'D08'`) === '5', 'cancelar no devolvió el stock');
  },

  async 'el dueño confirma el Yape: recién ahí se ganan los puntos, y el historial cuadra'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    const dueno = await registrarYEntrar(s);
    s.sql(`insert into admin_accounts (phone, name) values ('${dueno.phone}', 'Dueño')`);
    const admin = await s.llamar('login', { phone: dueno.phone, pin: '4321' });
    afirmar(admin.token && admin.isAdmin, 'el dueño no entró como admin');
    const items = [{ type: 'sig', sigId: 'SIG03', size: '15', qty: 1 }];
    const total = resolverCarrito(items, {}, precios).total + ENVIO_MINIMO;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-CONF', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, paymentMethod: 'yape', summary: '1x The Smoke', deliveryZone: 'trujillo',
    });
    afirmar(r.status === 200, `place-order: ${r.status} ${r.error || ''}`);
    const antes = Number(valor(s, `select points from customers where phone = '${phone}'`));
    const id = valor(s, `select id from orders where ref = 'E2E-CONF'`);
    const c = await s.llamar('admin-confirm-payment', { token: admin.token, orderId: id });
    afirmar(c.status === 200, `admin-confirm-payment: ${c.status} ${c.error || ''}`);
    afirmar(valor(s, `select payment_status from orders where ref = 'E2E-CONF'`) === 'paid', 'el pedido no quedó pagado');
    const ganados = Number(valor(s, `select coalesce(sum(points),0) from transactions where order_ref = 'E2E-CONF'`));
    const despues = Number(valor(s, `select points from customers where phone = '${phone}'`));
    afirmar(ganados > 0 && despues - antes === ganados, `puntos: antes ${antes}, después ${despues}, historial del pedido ${ganados}`);
    afirmar(valor(s, `select total_orders from customers where phone = '${phone}'`) === '1', 'no se contó el pedido');
    // Confirmar dos veces (doble toque en el panel) no puede dar los puntos dos veces.
    await s.llamar('admin-confirm-payment', { token: admin.token, orderId: id });
    afirmar(Number(valor(s, `select points from customers where phone = '${phone}'`)) === despues, 'confirmar dos veces dio los puntos dos veces');
  },

  async 'cancelar un pedido pagado con crédito devuelve el crédito y quita los puntos'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    s.sql(`update customers set credit_balance = 80 where phone = '${phone}'`);
    const antes = valor(s, `select points || '|' || credit_balance || '|' || total_orders from customers where phone = '${phone}'`);
    const items = [{ type: 'sig', sigId: 'SIG06', size: '30', qty: 1 }];
    const total = Math.round((resolverCarrito(items, {}, precios).total + ENVIO_MINIMO) * 100) / 100;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-CANC', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, useCredit: true, summary: '1x The Teriyaki', deliveryZone: 'trujillo',
    });
    afirmar(r.status === 200, `place-order: ${r.status} ${r.error || ''}`);
    const id = valor(s, `select id from orders where ref = 'E2E-CANC'`);
    const c = await s.llamar('cancel-my-order', { token, orderId: id, ref: 'E2E-CANC' });
    afirmar(c.status === 200, `cancel-my-order: ${c.status} ${c.error || ''}`);
    const despues = valor(s, `select points || '|' || credit_balance || '|' || total_orders from customers where phone = '${phone}'`);
    afirmar(despues === antes, `cancelar no dejó la cuenta como estaba: antes ${antes}, después ${despues}`);
    afirmar(valor(s, `select coalesce(sum(delta),0) from credit_ledger where customer_phone = '${phone}'`) === '0.00' ||
      Number(valor(s, `select coalesce(sum(delta),0) from credit_ledger where customer_phone = '${phone}'`)) === 0, 'el libro de crédito no cuadra en cero');
  },

  async 'un pedido programado guarda su hora como fecha y ocupa su hora en la capacidad'(s, precios) {
    const { token, phone } = await registrarYEntrar(s);
    s.sql(`update customers set credit_balance = 100 where phone = '${phone}'`);
    // Mañana a las 15:00 hora Lima (20:00 UTC), dentro del horario abierto de la semilla.
    const d = new Date(Date.now() + 86400000);
    const cuando = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 20, 0, 0)).toISOString();
    const items = [{ type: 'sig', sigId: 'SIG04', size: '15', qty: 1 }];
    const total = Math.round((resolverCarrito(items, {}, precios).total + ENVIO_MINIMO) * 100) / 100;
    const r = await s.llamar('place-order', {
      token, ref: 'E2E-PROG', name: 'Cliente', phone, address: 'Av. España 123, Trujillo', ...TIENDA,
      items, total, useCredit: true, summary: '1x The Fresh', deliveryZone: 'trujillo', scheduledFor: cuando,
    });
    afirmar(r.status === 200, `place-order programado: ${r.status} ${r.error || ''}`);
    // La hora se guarda como FECHA (desde el paso 6), y se compara como fecha, no como texto.
    afirmar(valor(s, `select delivery_time = '${cuando}'::timestamptz from orders where ref = 'E2E-PROG'`) === 't', 'la hora programada no quedó guardada como esa fecha');
    const h = await s.llamar('get-store-hours', {});
    const k = new Date(Date.parse(cuando)).toISOString();
    afirmar(h.cargaPorHora && Number(h.cargaPorHora[k] || 0) >= 1, `la hora programada no ocupa su lugar en la capacidad: ${JSON.stringify(h.cargaPorHora || {}).slice(0, 200)}`);
  },
};
