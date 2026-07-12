import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo de dinero real nuevo: comprar una tarjeta de regalo digital (cobro Culqi propio,
// crédito acreditado a OTRO cliente). Culqi Checkout es un widget externo que no carga en
// este entorno de test (por eso checkout.spec.ts lo evita por completo pagando con
// Yape/Plin) — acá lo stubbeamos manualmente (window.Culqi.open() dispara de inmediato el
// callback window.culqi() que expone app.ts) para poder cubrir el flujo de punta a punta
// sin depender del widget real.

test('cliente compra una tarjeta de regalo para otro cliente', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Culqi = {
      publicKey: null,
      settings: () => {},
      options: () => {},
      token: null,
      error: null,
      open: function () {
        (window as any).Culqi.token = { id: 'tkn-gift-test' };
        (window as any).culqi();
      },
    };
  });

  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000001', name: 'Ana Cliente', email: 'ana@test.com', points: 0, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-ana',
    },
    'credit-lookup': { name: 'Beto Amigo' },
    'prepare-credit-purchase': (body: any) => ({
      success: true,
      ref: 'GIFT-TEST01',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      toName: 'Beto Amigo',
    }),
    'confirm-credit-purchase': (body: any) => ({ success: true, toName: 'Beto Amigo' }),
  });

  await page.route('**/functions/v1/create-credit-charge', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, chargeId: 'chr-gift-test', outcome: 'venta_exitosa', ref: 'GIFT-TEST01' }),
    }),
  );

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sc=\'p_profile\'"]').click();
  await page.locator('[onclick*="sc=\'gift_card\'"]').click();
  await expect(page.getByRole('button', { name: 'COMPRAR Y REGALAR //' })).toBeVisible();

  await page.locator('#gc-phone').fill('911111111');
  await page.locator('#gc-amt').fill('50');
  await page.locator('#gc-email').fill('ana@test.com');

  await page.getByRole('button', { name: 'COMPRAR Y REGALAR //' }).click();

  // Modal de confirmación propio de la app (no window.confirm) mostrando el destinatario.
  await expect(page.locator('text=Beto Amigo')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=¡Regalaste crédito a Beto Amigo!')).toBeVisible({ timeout: 10000 });

  const lookupCall = calls.find((c) => c.action === 'credit-lookup');
  expect(lookupCall).toBeTruthy();
  expect(lookupCall!.body.toPhone).toBe('911111111');

  const prepareCall = calls.find((c) => c.action === 'prepare-credit-purchase');
  expect(prepareCall).toBeTruthy();
  expect(prepareCall!.body.toPhone).toBe('911111111');
  expect(prepareCall!.body.amount).toBe(50);

  const confirmCall = calls.find((c) => c.action === 'confirm-credit-purchase');
  expect(confirmCall).toBeTruthy();
  expect(confirmCall!.body.ref).toBe('GIFT-TEST01');
  expect(confirmCall!.body.chargeId).toBe('chr-gift-test');

  // Vuelve al perfil tras confirmar, no se queda en la pantalla de compra.
  await expect(page.locator('text=MI PERFIL')).toBeVisible();
});
