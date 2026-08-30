import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #22 / #21 / #17 — Las tres señales de dirección, en la cola donde se despacha.
//
// El cálculo está probado contra el servidor real en tests-api/direcciones-cola. Lo que se
// fija acá es lo que decide si sirven: que aparezcan ANTES de la lista de pedidos, porque
// las tres son decisiones que se toman antes de despachar, y que la cola siga funcionando
// igual cuando el servidor no las manda — es la pantalla que el dueño usa en hora punta.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

const PEDIDO = (ref: string, extra: Record<string, unknown> = {}) => ({
  id: 'id-' + ref,
  ref,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'yape',
  customer_name: 'Cliente ' + ref,
  customer_address: 'Av. España 123',
  contact_phone: '987654321',
  total: 20.9,
  delivery_fee: 6,
  items: [],
  created_at: '2026-09-10T18:00:00Z',
  ...extra,
});

async function entrarALaCola(page: any, respuesta: Record<string, unknown>) {
  await gotoApp(page, { ...ADMIN, 'admin-orders': respuesta });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
}

test('dos pedidos a la misma puerta se avisan como un solo viaje', async ({ page }) => {
  await entrarALaCola(page, {
    orders: [PEDIDO('ORD-1'), PEDIDO('ORD-2')],
    truncated: false,
    addressFlags: { duplicates: [{ address: 'Av. España 123', refs: ['ORD-1', 'ORD-2'] }], ambiguous: [], nearby: [] },
  });
  await expect(page.locator('text=/Misma dirección/')).toBeVisible();
  await expect(page.locator('text=/ORD-1, ORD-2/')).toBeVisible();
});

test('una dirección incompleta se avisa con lo que hay que preguntar', async ({ page }) => {
  // "Falta algo" no sirve: sin decir QUÉ falta hay que abrir el pedido igual, que es
  // justo el trabajo que este aviso tenía que ahorrar.
  await entrarALaCola(page, {
    orders: [PEDIDO('ORD-9', { customer_address: 'Por Larco' })],
    truncated: false,
    addressFlags: { duplicates: [], nearby: [], ambiguous: [{ ref: 'ORD-9', address: 'Por Larco', reasons: ['sin número de puerta', 'sin referencia'] }] },
  });
  await expect(page.locator('text=/sin número de puerta y sin referencia/')).toBeVisible();
  await expect(page.locator('text=/ANTES de despachar/')).toBeVisible();
});

test('dos pedidos a la misma zona se sugieren en un viaje, nombrando la zona', async ({ page }) => {
  await entrarALaCola(page, {
    orders: [PEDIDO('ORD-3'), PEDIDO('ORD-4')],
    truncated: false,
    addressFlags: { duplicates: [], ambiguous: [], nearby: [{ zone: 'cerca', refs: ['ORD-3', 'ORD-4'] }] },
  });
  await expect(page.locator('text=/2 pedidos a la zona «cerca»/')).toBeVisible();
});

test('sin nada que avisar no queda ninguna franja permanente', async ({ page }) => {
  // Una franja que casi siempre dice "todo bien" se deja de leer, y entonces tampoco se lee
  // el día que dice otra cosa.
  await entrarALaCola(page, {
    orders: [PEDIDO('ORD-5')],
    truncated: false,
    addressFlags: { duplicates: [], ambiguous: [], nearby: [] },
  });
  await expect(page.locator('text=/Misma dirección/')).toHaveCount(0);
  await expect(page.locator('text=/ANTES de despachar/')).toHaveCount(0);
  await expect(page.locator('text=ORD-5').first()).toBeVisible();
});

test('si el servidor no manda las señales, la cola sigue funcionando igual', async ({ page }) => {
  // Un deploy a medias no puede romper la pantalla con la que se despacha en hora punta.
  await entrarALaCola(page, { orders: [PEDIDO('ORD-6')], truncated: false });
  await expect(page.locator('text=ORD-6').first()).toBeVisible();
});
