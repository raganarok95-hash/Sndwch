import { test, expect } from '@playwright/test';
import { gotoApp, elegirSando, pedirUnSignature, ponerRecibe, ponerDireccion, pagarConYape, cartaDeLaApp } from './helpers';

// EL CAMINO DE COMPRA de las maquetas (01 → bebidas → 30G → 34 → 31 → 06A), de punta a punta.
//
// Lo que no puede pasar en silencio:
//   · que el pedido no salga, o salga con otro total del que se mostró;
//   · que tarjeta no mande el envío con la comisión que el servidor va a exigir;
//   · que se vuelva a exigir un distrito. El envío se cobra por distancia y el distrito ya no
//     limita nada (dueño, 2026-09-30). Exigirlo dejaba al cliente en un bucle 30G → 34 → mapa
//     cuando el geocodificador no lo reconocía: ninguna prueba lo vio porque todas elegían uno.
// El pin de las pruebas (PIN_TEST) cae a 4 km: S/8 de envío con Yape, 8/(1-0.055) con tarjeta.

const ORDEN = (body: any) => ({
  success: true,
  order: { id: 'ord-c1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
  customer: null,
});

test('con Yape, sin distrito: el pedido sale con el total de la carta más el envío', async ({ page }) => {
  const calls = await gotoApp(page, { 'place-order': ORDEN });
  await elegirSando(page);
  await pedirUnSignature(page, { size: '15' });
  await ponerRecibe(page, 'Cliente Camino', '987654321');
  await ponerDireccion(page, 'Calle Los Cedros 500', '');
  await pagarConYape(page);
  await expect(page.locator('.m06')).toBeVisible({ timeout: 10000 });

  const c = await cartaDeLaApp(page);
  const po = calls.find((x) => x.action === 'place-order');
  expect(po, 'el pedido no salió').toBeTruthy();
  const it = po!.body.items[0];
  expect(it.size).toBe('15');
  expect(po!.body.paymentMethod).toBe('yape');
  expect(po!.body.name).toBe('Cliente Camino');
  expect(po!.body.phone).toBe('987654321');
  expect(po!.body.address).toContain('Calle Los Cedros 500');
  expect(po!.body.total).toBe(Math.round((c.p15[it.sigId]! + 8) * 100) / 100);
});

test('con tarjeta, sin distrito: prepare-order lleva el envío con la comisión', async ({ page }) => {
  const calls = await gotoApp(page, { 'prepare-order': () => ({ success: true }) });
  await elegirSando(page);
  await pedirUnSignature(page, { size: '15' });
  await ponerRecibe(page);
  await ponerDireccion(page, 'Calle Los Cedros 500', '');
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31.y').waitFor();
  await page.locator('[onclick*="selectPayMethod(\'culqi\')"]').click();
  await page.locator('.m31.t').waitFor();
  await page.locator('.m30-go .oro').click();

  await expect.poll(() => calls.find((x) => x.action === 'prepare-order'), { timeout: 10000 }).toBeTruthy();
  const c = await cartaDeLaApp(page);
  const pr = calls.find((x) => x.action === 'prepare-order')!;
  expect(pr.body.total).toBe(Math.round((c.p15[pr.body.items[0].sigId]! + 8.47) * 100) / 100);
});
