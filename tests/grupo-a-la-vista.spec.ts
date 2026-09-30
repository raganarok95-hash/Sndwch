import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature, irAlArmador } from './helpers';

// EL GRUPO A LA VISTA (maquetas aprobadas grupo-3 y grupo-4, dueño 2026-09-30: «los pedidos
// grupales son de los que más suman»). Modo de fallo: SILENCIO en dos formas —
//   · «Convertir en grupo» crea el grupo pero lo elegido no pasa: el organizador lo tiene que
//     volver a elegir, o peor, lo paga dos veces (una en el carrito y otra en el grupo);
//   · sin cuenta, el botón no hace nada visible y el intento se pierde.

const GRUPO = { code: 'GRP123' };
const ESTADO = { code: 'GRP123', status: 'open', organizerName: 'Ana', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: true, sandwichQty: 1, organizerFreeAt: 5 };

test('con cuenta, «Convertir en grupo» pasa lo elegido al grupo y vacía el carrito', async ({ page }) => {
  const calls = await gotoApp(page, { 'create-group-order': GRUPO, 'add-group-item': { success: true }, 'get-group-order': ESTADO, 'addresses-list': { addresses: [] } });
  await pedirUnSignature(page, { size: '15' });
  const sello = page.locator('.m30 .grupo30');
  await expect(sello).toBeVisible();
  // La regla se lee de la carta, no se escribe.
  const desde = await page.evaluate(() => (window as any).ORGANIZER_FREE_MIN_SANDWICHES);
  await expect(sello).toContainText('Con ' + desde);
  // Ya con sesión (entrar tiene sus propias pruebas).
  await page.evaluate(() => { const w = window as any; w.cust = { name: 'Ana', points: 0 }; w.token = 'tok'; });
  await sello.getByRole('button', { name: /Convertir en grupo/ }).click();
  await expect.poll(() => calls.filter((c) => c.action === 'add-group-item').length).toBe(1);
  const add = calls.find((c) => c.action === 'add-group-item')!;
  expect(add.body.code).toBe('GRP123');
  expect(add.body.item.type).toBe('sig');
  expect(await page.evaluate(() => (window as any).cart.length), 'lo pasado al grupo sigue también en el carrito').toBe(0);
  await expect(page.locator('text=PEDIDO GRUPAL').first()).toBeVisible();
});

test('sin cuenta, lleva a entrar y guarda el intento', async ({ page }) => {
  const calls = await gotoApp(page, {});
  await pedirUnSignature(page, { size: '15' });
  await page.locator('.m30 .grupo30 button').click();
  expect(calls.find((c) => c.action === 'create-group-order')).toBeFalsy();
  expect(await page.evaluate(() => (window as any).wantsNewGroup)).toBe(true);
  await expect(page.locator('.en')).toBeVisible();
});

test('el armador de WICHO invita al grupo en el primer paso', async ({ page }) => {
  await gotoApp(page, {});
  await irAlArmador(page);
  await expect(page.locator('.mw .grupo')).toContainText('¿Son varios?');
});

test('el Mundo SANDO trae el plato del grupo en segundo lugar, con la regla de la carta', async ({ page }) => {
  const calls = await gotoApp(page, {});
  const platos = page.locator('.m15 .plato');
  await expect(platos.nth(1)).toHaveClass(/grupo/);
  const desde = await page.evaluate(() => (window as any).ORGANIZER_FREE_MIN_SANDWICHES);
  await expect(platos.nth(1)).toContainText('Desde ' + desde + ' sándwiches');
  await platos.nth(1).scrollIntoViewIfNeeded();
  await platos.nth(1).getByRole('button', { name: 'Armar el grupo' }).click();
  // Sin cuenta: lleva a entrar con el intento guardado, sin crear nada todavía.
  expect(calls.find((c) => c.action === 'create-group-order')).toBeFalsy();
  expect(await page.evaluate(() => (window as any).wantsNewGroup)).toBe(true);
});
