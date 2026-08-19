import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Tarjeta de regalo digital — rediseñada esta sesión de un cobro real por Culqi a un
// canje de PUNTOS PROPIOS (sin ningún cobro ni pasarela de pago de por medio): el
// comprador gasta puntos y el crédito se acredita a OTRO cliente en una sola llamada
// atómica (gift-card-purchase). Ya no hay widget de Culqi que stubbear.

test('cliente regala una tarjeta de regalo con puntos a otro cliente', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000001', name: 'Ana Cliente', email: 'ana@test.com', points: 2500, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-ana',
    },
    'credit-lookup': { name: 'Beto Amigo' },
    'gift-card-purchase': (body: any) => ({ success: true, toName: 'Beto Amigo' }),
    'session-check': {
      valid: true,
      customer: { phone: '900000001', name: 'Ana Cliente', email: 'ana@test.com', points: 500, credit_balance: 0 },
    },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sc=\'p_profile\'"]').click();
  await page.locator('[onclick*="sc=\'gift_card\'"]').click();
  await expect(page.getByRole('button', { name: 'REGALAR CON PUNTOS //' })).toBeVisible();

  await page.locator('#gc-phone').fill('911111111');
  await page.locator('#gc-amt').fill('50');

  await page.getByRole('button', { name: 'REGALAR CON PUNTOS //' }).click();

  // Modal de confirmación propio de la app (no window.confirm) mostrando el destinatario.
  await expect(page.locator('text=Beto Amigo')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=¡Regalaste crédito a Beto Amigo!')).toBeVisible({ timeout: 10000 });

  const lookupCall = calls.find((c) => c.action === 'credit-lookup');
  expect(lookupCall).toBeTruthy();
  expect(lookupCall!.body.toPhone).toBe('911111111');

  const purchaseCall = calls.find((c) => c.action === 'gift-card-purchase');
  expect(purchaseCall).toBeTruthy();
  expect(purchaseCall!.body.toPhone).toBe('911111111');
  expect(purchaseCall!.body.amount).toBe(50);

  // Vuelve al perfil tras confirmar, no se queda en la pantalla de compra.
  await expect(page.locator('text=MI PERFIL')).toBeVisible();
});

// Hallazgo de esta misma sesión: antes de la recompensa de puntos costaba lo mismo sin
// importar cuántos puntos tenía el cliente — con la tarjeta de regalo pagándose en
// puntos, un cliente sin puntos suficientes debe ver el error ANTES de gastar tiempo
// llenando el modal de confirmación (client-side, sin ni siquiera llamar a credit-lookup).
test('cliente sin puntos suficientes ve el error sin llegar a confirmar', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000004', name: 'Deco Cliente', email: 'deco@test.com', points: 100, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-deco',
    },
    'credit-lookup': { name: 'Beto Amigo' },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000004');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sc=\'p_profile\'"]').click();
  await page.locator('[onclick*="sc=\'gift_card\'"]').click();

  await page.locator('#gc-phone').fill('911111111');
  await page.locator('#gc-amt').fill('50');
  await page.getByRole('button', { name: 'REGALAR CON PUNTOS //' }).click();

  await expect(page.locator('text=No tienes puntos suficientes para este monto.')).toBeVisible();

  const lookupCall = calls.find((c) => c.action === 'credit-lookup');
  expect(lookupCall).toBeFalsy();
  const purchaseCall = calls.find((c) => c.action === 'gift-card-purchase');
  expect(purchaseCall).toBeFalsy();
});
