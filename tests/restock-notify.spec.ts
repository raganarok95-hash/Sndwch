import { test, expect } from '@playwright/test';
import { mockBackend, stubWindowOpen, APP_FILE } from './helpers';

// "Avísame cuando vuelva" — antes la tarjeta AGOTADO de un Signature simplemente no
// dejaba intentar pedirlo, sin ningún registro de quién lo quería. Este test cubre que
// un cliente logueado pueda pedir que le avisen, y que el botón refleje la confirmación.

test('cliente pide que le avisen cuando un Signature agotado vuelva a stock', async ({ page }) => {
  const calls = await mockBackend(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'request-restock-notify': { success: true },
  });

  // P02 (Pollo Teriyaki, la proteína de SIG06 "THE TERIYAKI" — la única signature
  // pública que la usa) sin stock — registrada DESPUÉS de mockBackend (que deja
  // inventario vacío = todo disponible) y ANTES de navegar, porque Playwright resuelve
  // rutas que hacen match en orden LIFO: la última registrada gana. Si se registrara
  // después de goto(), loadInvBackground() ya habría corrido con el mock por defecto.
  // No se usa P01 (Asado de Res) porque desde CHICAGO ITALIAN BEEF (SIG07) también
  // usa esa proteína, y marcarla sin stock mostraría dos tarjetas AGOTADO a la vez.
  await page.route('**/rest/v1/inventory*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ product_code: 'P02', in_stock: false, stock_qty: 0 }]) }),
  );
  await stubWindowOpen(page);
  await page.goto(APP_FILE);
  await page.waitForSelector('text=SIGNATURE');

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrder(\'sig\')"]').first().click();

  await expect(page.locator('text=AGOTADO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' })).toBeVisible();
  await page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' }).click();

  await expect(page.locator('text=Te avisamos apenas vuelva.')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: '✓ TE AVISAMOS CUANDO VUELVA' })).toBeVisible();

  const call = calls.find((c) => c.action === 'request-restock-notify');
  expect(call).toBeTruthy();
  expect(call!.body.sigId).toBe('SIG06');
});
