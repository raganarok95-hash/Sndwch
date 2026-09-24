import { test, expect } from '@playwright/test';
import { gotoApp, APP_FILE } from './helpers';

// «CERRAR Y PAGAR» = CADA UNO PAGA LO SUYO (maqueta pedido-grupal, decisión del dueño 2026-09-24).
//
// Lo que no puede pasar en silencio: que «Cerrar y pagar» siga cobrándole todo al organizador
// (el cierre viejo), que el reparto salga sin la dirección con pin de la que sale el envío, o
// que las partes no se puedan pagar una por una con su propio monto.

const ANA = { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 };
const ABIERTO = {
  code: 'ABC123', status: 'open', organizerName: 'Ana Cliente',
  expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
  items: [
    { id: 1, contributorName: 'Ana Cliente', label: 'The Original 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
    { id: 2, contributorName: 'Beto', label: 'The Original 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  ],
  total: 41.8, isOrganizer: true, sandwichQty: 2, organizerFreeAt: 5,
  canPay: true, freeApplies: false, missingForFree: 3,
};
const REPARTIDO = {
  ...ABIERTO, status: 'splitting', canPay: false,
  splitDeadline: new Date(Date.now() + 20 * 60000).toISOString(),
  partes: [
    { ref: 'ORD-GABC123-0XY', name: 'Ana Cliente', total: 24.4, envio: 3.5, paid: false, cancelled: false },
    { ref: 'ORD-GABC123-1QW', name: 'Beto', total: 24.4, envio: 3.5, paid: true, cancelled: false },
  ],
};
// Ids NUMÉRICOS, como los manda la base (saved_addresses.id es bigint): con ids de texto la
// comparación === pasaba en la prueba y fallaba en producción.
const DIRECCION = { id: 7, label: 'Oficina', address: 'Av. España 123', reference: 'Piso 3', lat: -8.11, lon: -79.03 };
const CASA = { id: 8, label: 'Casa', address: 'Jr. Pizarro 500', lat: -8.115, lon: -79.035 };

test('«Cerrar y pagar» reparte desde la dirección con pin y cada parte se paga sola', async ({ page }) => {
  let repartido = false;
  const calls = await gotoApp(page, {
    login: { customer: ANA, isAdmin: false, token: 'tok-ana' },
    'addresses-list': { addresses: [CASA, DIRECCION] },
    'get-group-order': () => (repartido ? REPARTIDO : ABIERTO),
    'split-group-order': () => { repartido = true; return { success: true }; },
    'close-group-order': { success: true, items: [] },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  // Lo que suma cada uno se ve antes de cerrar.
  await expect(page.getByText('Tu parte por ahora')).toBeVisible();

  await page.getByRole('button', { name: /cerrar y pagar/i }).first().click();
  await expect(page.getByText('Cerrar y pagar · #ABC123')).toBeVisible();
  await expect(page.getByText('Av. España 123')).toBeVisible();
  // La primera (Casa) viene elegida; se cambia a la Oficina.
  await page.getByRole('radio', { name: /Oficina/ }).click();
  await page.getByRole('button', { name: /repartir y cobrar/i }).click();

  await expect.poll(() => calls.some((c) => c.action === 'split-group-order'), { timeout: 10000 }).toBe(true);
  const body = calls.find((c) => c.action === 'split-group-order')!.body;
  expect(body.code).toBe('ABC123');
  expect(body.lat).toBe(-8.11);
  expect(body.lon).toBe(-79.03);
  expect(body.address).toContain('Piso 3');
  // El cierre viejo (todo en un pedido) no se toca por este camino.
  expect(calls.some((c) => c.action === 'close-group-order')).toBe(false);

  await expect(page.getByText('1 de 2 pagaron')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Pagado')).toBeVisible();
  await page.getByRole('button', { name: /^pagar$/i }).click();
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_sent');
  expect(await page.evaluate(() => (window as any)._lRef)).toBe('ORD-GABC123-0XY');
  expect(await page.evaluate(() => (window as any)._lTot)).toBe(24.4);
});

test('sin una dirección con pin no se reparte: se pide guardarla', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: ANA, isAdmin: false, token: 'tok-ana' },
    'addresses-list': { addresses: [{ ...DIRECCION, lat: null, lon: null }] },
    'get-group-order': ABIERTO,
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');
  await page.getByRole('button', { name: /cerrar y pagar/i }).first().click();
  await expect(page.getByText('Primero guarda la dirección marcándola en el mapa.')).toBeVisible();
  await expect(page.getByRole('button', { name: /repartir y cobrar/i })).toHaveCount(0);
  expect(calls.some((c) => c.action === 'split-group-order')).toBe(false);
});
