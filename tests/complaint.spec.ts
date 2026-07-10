import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo prioritario #5: Libro de Reclamaciones — público por ley, no requiere sesión.
// Accesible desde el pie de página del home (contactFooterHTML).

test('invitado presenta un reclamo desde el Libro de Reclamaciones', async ({ page }) => {
  const calls = await gotoApp(page, {
    'submit-complaint': (body: any) => ({ success: true, claimCode: 'REC-2026-000123' }),
  });

  await page.locator('[onclick*="p_complaints"]').click();
  await expect(page.locator('#cq-name')).toBeVisible();

  await page.locator('#cq-name').fill('Consumidor de Prueba');
  await page.locator('#cq-dni').fill('12345678');
  await page.locator('#cq-addr').fill('Av. Larco 500, Trujillo');
  await page.locator('#cq-phone').fill('987654321');
  await page.locator('#cq-email').fill('consumidor@example.com');
  await page.locator('#cq-detail').fill('El pedido llegó frío y más de una hora tarde.');
  await page.locator('#cq-request').fill('Solicito el reembolso del pedido.');

  await page.getByRole('button', { name: /ENVIAR RECLAMO/ }).click();

  await expect(page.locator('text=REC-2026-000123')).toBeVisible({ timeout: 10000 });

  const call = calls.find((c) => c.action === 'submit-complaint');
  expect(call).toBeTruthy();
  expect(call!.body.kind).toBe('reclamo');
  expect(call!.body.consumerName).toBe('Consumidor de Prueba');
  expect(call!.body.consumerDni).toBe('12345678');
});

test('invitado presenta una queja (no un reclamo)', async ({ page }) => {
  const calls = await gotoApp(page, {
    'submit-complaint': { success: true, claimCode: 'REC-2026-000124' },
  });

  await page.locator('[onclick*="p_complaints"]').click();
  await page.locator('[onclick*="cmplKind=\'queja\'"]').click();

  await page.locator('#cq-name').fill('Consumidor Dos');
  await page.locator('#cq-dni').fill('87654321');
  await page.locator('#cq-addr').fill('Jr. Bolívar 200, Trujillo');
  await page.locator('#cq-phone').fill('912345678');
  await page.locator('#cq-email').fill('otro@example.com');
  await page.locator('#cq-detail').fill('La atención en el local fue muy demorada.');
  await page.locator('#cq-request').fill('Solicito una disculpa formal.');

  await page.getByRole('button', { name: /ENVIAR QUEJA/ }).click();
  await expect(page.locator('text=REC-2026-000124')).toBeVisible({ timeout: 10000 });

  const call = calls.find((c) => c.action === 'submit-complaint');
  expect(call!.body.kind).toBe('queja');
});
