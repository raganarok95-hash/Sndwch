import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo de dinero real nuevo: Plan Semanal (recarga de saldo PROPIO con bono, cobro Culqi
// real). Mismo stub de Culqi que gift-card.spec.ts — window.Culqi.open() dispara de
// inmediato el callback window.culqi() que expone app.ts, sin depender del widget real.

test('cliente activa el Plan Semanal y recibe saldo con bono', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Culqi = {
      publicKey: null,
      settings: () => {},
      options: () => {},
      token: null,
      error: null,
      open: function () {
        (window as any).Culqi.token = { id: 'tkn-plan-test' };
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
    'prepare-weekly-plan': {
      success: true,
      ref: 'PLAN-TEST01',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      amountPaid: 95,
      creditAmount: 100,
    },
    'confirm-weekly-plan': { success: true, creditAmount: 100 },
    'session-check': {
      valid: true,
      customer: { phone: '900000001', name: 'Ana Cliente', email: 'ana@test.com', points: 0, credit_balance: 100 },
    },
  });

  await page.route('**/functions/v1/create-credit-charge', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, chargeId: 'chr-plan-test', outcome: 'venta_exitosa', ref: 'PLAN-TEST01' }),
    }),
  );

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sndScreen=\'p_profile\'"]').click();
  await page.locator('[onclick*="sndScreen=\'weekly_plan\'"]').click();
  await expect(page.getByRole('button', { name: 'ACTIVAR PLAN SEMANAL //' })).toBeVisible();

  await page.locator('#wp-email').fill('ana@test.com');
  await page.getByRole('button', { name: 'ACTIVAR PLAN SEMANAL //' }).click();

  // Modal de confirmación propio de la app (no window.confirm) — el monto usa un <span>
  // anidado para el "S/" (ver SOLES en app.ts) así que se verifica por el texto plano
  // alrededor en vez del monto completo.
  await expect(page.locator('text=¿Pagar')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=¡Listo! Recibiste')).toBeVisible({ timeout: 10000 });

  const prepareCall = calls.find((c) => c.action === 'prepare-weekly-plan');
  expect(prepareCall).toBeTruthy();

  const confirmCall = calls.find((c) => c.action === 'confirm-weekly-plan');
  expect(confirmCall).toBeTruthy();
  expect(confirmCall!.body.ref).toBe('PLAN-TEST01');
  expect(confirmCall!.body.chargeId).toBe('chr-plan-test');

  // Vuelve al perfil tras confirmar, no se queda en la pantalla de compra.
  await expect(page.locator('text=MI PERFIL')).toBeVisible();
});
