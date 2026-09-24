import { test, expect } from '@playwright/test';
import { cartaDeLaApp, gotoApp, type Carta } from './helpers';

// ⚠ PANTALLA DESCONECTADA (2026-09-24). «Los sellos» quedó construida (src/nuevo/pantallas/
// pedidos.ts) pero no registrada en main.ts: la maqueta no dice cómo se llega a un pedido
// CANCELADO ni a uno EN CURSO que no sea el último, y la lista vieja sí los mostraba (lo cubren
// algo-salio-mal, cancel-order, entrega-y-caja y mis-pedidos-cancelado). Lo decide el dueño.
// Hasta entonces estas pruebas quedan pendientes, no borradas: se reactivan con la pantalla.
test.fixme(true, 'pantalla 33 desconectada hasta que el dueño decida cómo se llega a pedidos cancelados y en curso (tarea #69)');

// TUS PEDIDOS · LOS SELLOS (pantalla 33, maqueta tus-pedidos-los-sellos.png), 2026-09-24.
//
// Lo que se fija acá es lo que puede romperse EN SILENCIO:
//   · «Pedir lo mismo» cobra lo de HOY: si alguien lo cambia por el total guardado del pedido,
//     la pantalla promete un número que el checkout no cobra y nada revienta;
//   · un pedido cancelado o sin pagar no es «una vez que comiste acá»: no deja sello;
//   · «los jueves son 9 de los 14» solo aparece cuando es cierto y dice algo.

const CLIENTE = { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 14 };
const DIA = 86_400_000;
// Mediodía de Lima (17:00 UTC): lejos de la medianoche, el día no cambia según la zona.
function haceDias(n: number): string {
  const d = new Date(Date.now() - n * DIA);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
}
// Lo que lleva cada pedido sale de la carta que la app tiene cargada, nunca de un código
// escrito: un Signature 30CM y una bebida. `items` puede venir como función de la carta, y se
// resuelve recién cuando la app pide `my-orders` (ya con la carta leída).
const unSignatureYBebida = (c: Carta) => [
  { type: 'sig', sigId: c.signature(), size: '30', qty: 1 },
  { type: 'side', code: c.bebida(), qty: 1 },
];
const pedido = (i: number, dias: number, extra: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  ref: 'REF-' + i,
  status: 'ENTREGADO',
  payment_status: 'paid',
  total: 99,
  summary: '1x algo',
  items: unSignatureYBebida as any,
  created_at: haceDias(dias),
  delivered_at: haceDias(dias),
  ...extra,
});

async function abrirTusPedidos(page: any, orders: any[], cliente: any = CLIENTE): Promise<Carta> {
  let carta: Carta;
  await gotoApp(page, {
    login: { customer: cliente, isAdmin: false, token: 'tok' },
    'session-check': { valid: true, customer: cliente },
    'my-orders': () => ({ orders: orders.map((o) => ({ ...o, items: typeof o.items === 'function' ? o.items(carta) : o.items })) }),
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
  });
  await page.evaluate((c: any) => {
    (window as any).token = 'tok';
    (window as any).cust = c;
  }, cliente);
  carta = await cartaDeLaApp(page);
  await page.evaluate(async () => { await (window as any).loadMyOrders(); });
  await expect(page.locator('.mtp .sellos, .mtp .pie').first()).toBeVisible();
  return carta;
}

// Nueve jueves (o el día que sea ayer) y cinco sueltos: 9 de 14.
function catorceSemanas() {
  const orders = [];
  for (let i = 0; i < 9; i++) orders.push(pedido(i, 1 + 7 * i));
  for (let i = 0; i < 5; i++) orders.push(pedido(9 + i, 3 + 7 * i + 1));
  return orders.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

test('«Pedir lo mismo» está arriba y deja el último pedido en el carrito', async ({ page }) => {
  const c = await abrirTusPedidos(page, catorceSemanas());
  const nombre = await page.evaluate(([sig, beb]) => {
    const w = window as any;
    return w.SIGS.find((s: any) => s.id === sig).n + ' 30CM + ' + w.SIDES.find((d: any) => d.id === beb).l;
  }, [c.signature(), c.bebida()]);
  await expect(page.locator('.mtp .ult b')).toHaveText(nombre);
  await page.getByRole('button', { name: /Pedir lo mismo/ }).click();
  expect(await page.evaluate(() => (window as any).cart.map((c: any) => c.sigId || c.code))).toEqual([c.signature(), c.bebida()]);
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_cart');
});

test('el precio de «Pedir lo mismo» es el de HOY, no el total guardado del pedido', async ({ page }) => {
  const c = await abrirTusPedidos(page, catorceSemanas());
  const hoy = await page.evaluate((items) => {
    const w = window as any;
    return w.SOLES_TXT + w.pz(w.DINERO.desglose(items, { cuandoMs: Date.now() }).total);
  }, unSignatureYBebida(c));
  const boton = page.locator('.mtp .rep b');
  await expect(boton).toHaveText(hoy);
  await expect(boton).not.toHaveText(/99/);
});

test('un sello por pedido pagado; ni el cancelado ni el que no se pagó dejan sello', async ({ page }) => {
  const orders = [
    pedido(1, 1),
    pedido(2, 2, { status: 'CANCELADO' }),
    pedido(3, 3, { payment_status: 'pending', status: 'RECIBIDO' }),
    pedido(4, 4),
  ];
  await abrirTusPedidos(page, orders, { ...CLIENTE, total_orders: 2 });
  await expect(page.locator('.mtp .se')).toHaveCount(2);
  await expect(page.locator('.mtp .cont b')).toHaveText('2 veces');
});

test('tocar un sello abre ese pedido', async ({ page }) => {
  const orders = catorceSemanas();
  await abrirTusPedidos(page, orders);
  await page.locator('.mtp .se').nth(3).click();
  const w = await page.evaluate(() => ({ sc: (window as any).sndScreen, id: (window as any)._sndOd }));
  expect(w).toEqual({ sc: 'p_ord_detail', id: orders[3]!.id });
});

test('«los X son N de los M» solo cuando un día junta al menos 3 sellos y la mitad', async ({ page }) => {
  await abrirTusPedidos(page, catorceSemanas());
  await expect(page.locator('.mtp .pie')).toContainText(/son 9 de los 14 — por algo será/);

  // Cuatro pedidos en cuatro días distintos: no hay patrón y no se inventa uno.
  await abrirTusPedidos(page, [pedido(1, 1), pedido(2, 2), pedido(3, 3), pedido(4, 4)], { ...CLIENTE, total_orders: 4 });
  await expect(page.locator('.mtp .pie')).toHaveText(/Toca un sello y se abre ese pedido\.\s*$/);
});

test('si nada del último pedido sigue en la carta, no se ofrece repetirlo', async ({ page }) => {
  // Un armado con una proteína que solo existe dentro de un Signature: el servidor lo rechazaría.
  const viejo = pedido(1, 1, {
    items: (c: Carta) => [{ type: 'byo', base: c.pan(), prot: c.protExclusivas[0], tops: [], sauces: [c.salsa()], size: '15', qty: 1 }],
  });
  await abrirTusPedidos(page, [viejo], { ...CLIENTE, total_orders: 1 });
  await expect(page.locator('.mtp .ult')).toBeVisible();
  await expect(page.getByRole('button', { name: /Pedir lo mismo/ })).toHaveCount(0);
});
