import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LOS IDS DE DIRECCIÓN SON NÚMEROS (2026-09-24).
//
// `saved_addresses.id` es bigint: la API los devuelve como NÚMEROS. Pero cada botón los
// manda como TEXTO (`pickAddr('12')`), y la búsqueda comparaba con ===, así que 12 === '12'
// daba falso y tocar una dirección guardada no hacía nada: ni la dirección, ni el pin, ni el
// envío. Ninguna prueba lo veía porque todas simulaban ids de texto ('d1'). Esta usa números,
// como la base.

const CLIENTE = { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 2 };
const DIRECCIONES = [
  { id: 11, label: 'Casa', address: 'Jr. Pizarro 500', lat: -8.111, lon: -79.029 },
  { id: 12, label: 'Oficina', address: 'Av. España 123', reference: 'Piso 3', lat: -8.112, lon: -79.031 },
];

test('tocar una dirección guardada la usa, aunque su id sea un número', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok' },
    'session-check': { valid: true, customer: CLIENTE },
    'addresses-list': { addresses: DIRECCIONES },
  });
  await page.evaluate((dirs) => {
    const w = window as any;
    w.token = 'tok';
    w.cust = { phone: '900000001', name: 'Ana', total_orders: 2 };
    w.myAddresses = dirs;
    w.loadCart([{ type: 'sig', sigId: 'SIG02', size: '15', qty: 1 }]);
  }, DIRECCIONES);
  await page.locator('[onclick="pickAddr(\'12\')"]').click();
  expect(await page.evaluate(() => (window as any).addrText)).toBe('Av. España 123');
  expect(await page.evaluate(() => (window as any)._mLat)).toBe(-8.112);
});
