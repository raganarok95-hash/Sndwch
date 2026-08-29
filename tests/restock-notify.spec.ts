import { test, expect } from '@playwright/test';
import { mockBackend, stubWindowOpen, APP_FILE } from './helpers';

// "Avísame cuando vuelva" — antes la tarjeta AGOTADO de un Signature simplemente no
// dejaba intentar pedirlo, sin ningún registro de quién lo quería. Este test cubre que
// un cliente logueado pueda pedir que le avisen, y que el botón refleje la confirmación.

test('cliente pide que le avisen cuando un Signature agotado vuelva a stock', async ({ page }) => {
  const calls = await mockBackend(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'request-restock-notify': { success: true },
    'get-catalog': {
      proteins: {}, sigs: {}, sides: {}, rewardPts: {},
      inventory: { P02: { inStock: false, qty: 0 } },
    },
  });

  // P02 (Pollo Teriyaki, la proteína de SIG06 "THE TERIYAKI" — la única signature
  // pública que la usa) sin stock. Desde el 2026-08-27 el inventario NO viaja por
  // PostgREST: llega dentro de get-catalog, porque `inventory` tiene RLS sin políticas y
  // la lectura directa con la anon key devolvía 200 [] en silencio — el cliente creía que
  // todo estaba disponible. El mock va en el handler de esa acción.
  // No se usa P01 (Res // Asado) porque la comparten THE ORIGINAL y ARMA EL TUYO, y
  // marcarla sin stock mostraría dos tarjetas AGOTADO a la vez.
  await stubWindowOpen(page);
  await page.goto(APP_FILE);
  await page.waitForSelector('text=SIGNATURE');

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();

  await expect(page.locator('text=AGOTADO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' })).toBeVisible();
  await page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' }).click();

  await expect(page.locator('text=Te avisamos apenas vuelva.')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: '✓ TE AVISAMOS CUANDO VUELVA' })).toBeVisible();

  const call = calls.find((c) => c.action === 'request-restock-notify');
  expect(call).toBeTruthy();
  expect(call!.body.sigId).toBe('SIG06');
});
