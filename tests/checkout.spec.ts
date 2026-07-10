import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo prioritario #1: invitado arma un Signature, va al carrito, paga con Yape/Plin
// (el único método 100% mockeable sin el widget externo de Culqi) y ve la confirmación.

test('invitado arma un Signature y paga con Yape/Plin', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.locator('[onclick*="startOrder(\'sig\')"]').click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  await page.locator('[onclick*="size=\'15\'"]').click();
  // Primer Signature de la lista — cualquiera sirve para probar el flujo.
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Con el carrito vacío, el primer sándwich entra en modo "pago rápido"
  // (quickPayEligible, ver enterConfirm() en index.html): el checkout completo se
  // muestra inline en la misma pantalla de confirmación, sin pasar por TU CARRITO.
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Invitado');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();

  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.paymentMethod).toBe('yape');
  expect(placeOrderCall!.body.name).toBe('Cliente Invitado');
  expect(placeOrderCall!.body.address).toContain('Trujillo');
});
