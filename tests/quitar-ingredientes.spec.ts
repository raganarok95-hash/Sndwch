import { test, expect } from '@playwright/test';
import { gotoApp, ponerRecibe, ponerDireccion, pagarConYape } from './helpers';

// QUITAR INGREDIENTES Y EL COMBO EN LA FICHA (dueño, 2026-09-30, del estudio de Subway).
// Modo de fallo: SILENCIO. Si «sin cebolla» se ve en la ficha pero no sale en el pedido, el
// cliente recibe su cebolla sin que nada falle. Se toca como un cliente y se lee lo que viaja.

const ORDEN = (body: any) => ({
  success: true,
  order: { id: 'ord-q1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
  customer: null,
});

test('lo que se quita en la ficha viaja en el pedido y se ve en el recibo', async ({ page }) => {
  const calls = await gotoApp(page, { 'place-order': ORDEN });
  // El primer plato que tenga algo que quitar.
  const platos = page.locator('.m15 .plato:not(.v)');
  await platos.first().locator('button.b').click();
  await page.locator('.f01').waitFor();
  const chip = page.locator('.f01 .quita button').first();
  await expect(chip).toBeVisible();
  const nombre = ((await chip.textContent()) || '').trim();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(chip).toContainText('Sin ' + nombre);
  // El combo a la vista: cuánto sale con bebida.
  await expect(page.locator('.f01 .pie .p s')).toContainText('Con bebida');

  await page.locator('.f01 .pie button').click();
  const sin = page.getByRole('button', { name: /Sigo sin bebida/ });
  await Promise.race([sin.waitFor(), page.locator('.m30').waitFor()]);
  if (await sin.isVisible()) await sin.click();
  await page.locator('.m30').waitFor();
  await expect(page.locator('.m30')).toContainText('sin ' + nombre);

  await ponerRecibe(page);
  await ponerDireccion(page, 'Calle Los Cedros 500', '');
  await pagarConYape(page);
  const po = calls.find((x) => x.action === 'place-order');
  expect(po, 'el pedido no salió').toBeTruthy();
  expect(po!.body.items[0].sin?.length, 'el pedido salió sin lo que el cliente quitó').toBe(1);
  expect(po!.body.summary).toContain('sin ' + nombre);
});
