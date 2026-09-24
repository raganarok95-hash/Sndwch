import { test, expect } from '@playwright/test';
import { mockBackend, stubWindowOpen, APP_FILE, elegirSando, entrarConTelefono } from './helpers';

// "Avísame cuando vuelva" — antes la tarjeta AGOTADO de un Signature simplemente no
// dejaba intentar pedirlo, sin ningún registro de quién lo quería. Este test cubre que
// un cliente logueado pueda pedir que le avisen, y que el botón refleje la confirmación.

test('cliente pide que le avisen cuando un Signature agotado vuelva a stock', async ({ page }) => {
  const handlers = {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'request-restock-notify': { success: true },
  };
  await mockBackend(page, handlers);
  await stubWindowOpen(page);
  await page.goto(APP_FILE);

  // Una proteína que use UN solo Signature público, sacada de la carta que la app tiene: si la
  // compartieran dos, saldrían dos tarjetas AGOTADO a la vez. No se escribe ningún código de
  // producto porque la carta cambia.
  const { prot, sigId } = await page.evaluate(() => {
    const publicos = (window as any).SIGS.filter((s: any) => !s.secret);
    for (const s of publicos) {
      if (publicos.filter((x: any) => x.prot === s.prot).length === 1) return { prot: s.prot, sigId: s.id };
    }
    return { prot: null, sigId: null };
  });
  if (!prot) throw new Error('Ninguna proteína la usa un solo Signature: la prueba no puede armarse.');

  // Desde el 2026-08-27 el inventario NO viaja por PostgREST: llega dentro de get-catalog,
  // porque `inventory` tiene RLS sin políticas y la lectura directa con la anon key devolvía
  // 200 [] en silencio. Una ruta nueva gana a la anterior: desde acá esa proteína está agotada.
  const calls = await mockBackend(page, {
    ...handlers,
    'get-catalog': { proteins: {}, sigs: {}, sides: {}, rewardPts: {}, inventory: { [prot]: { inStock: false, qty: 0 } } },
  });
  await page.reload();
  // La app abre en la eleccion entre los hermanos; esta prueba necesita el catalogo.
  await elegirSando(page);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000001', '1234');

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();

  await expect(page.locator('text=AGOTADO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' })).toBeVisible();
  await page.getByRole('button', { name: 'AVÍSAME CUANDO VUELVA →' }).click();

  await expect(page.locator('text=Te avisamos apenas vuelva.')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: '✓ TE AVISAMOS CUANDO VUELVA' })).toBeVisible();

  const call = calls.find((c) => c.action === 'request-restock-notify');
  expect(call).toBeTruthy();
  expect(call!.body.sigId).toBe(sigId);
});
