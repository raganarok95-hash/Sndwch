import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo de dinero sin ningún test de regresión (hallazgo de auditoría de código, ALTO):
// actCancelMyOrder trae un fix crítico documentado (revertir puntos/crédito/total_orders
// al autocancelar un pedido pagado, para que no se pueda farmear puntos con
// "pedir con crédito → cancelar → repetir") — sin este test, nada protege ese arreglo de
// una regresión futura.

const MOCK_ORDER = {
  id: 'ord-cancel-1',
  ref: 'ORD-CANCEL01-AAAA',
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'credit',
  created_at: new Date().toISOString(),
  date: '21/07/2026',
};

test('cliente cancela un pedido RECIBIDO pagado con crédito antes de que cocina lo empiece', async ({ page }) => {
  let cancelCalled = false;
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Cliente de Prueba', points: 50, credit_balance: 0 }, isAdmin: false, token: 'tok-cust' },
    'my-orders': { orders: [MOCK_ORDER] },
    'cancel-my-order': (body: any) => {
      cancelCalled = true;
      return { success: true, order: { ...MOCK_ORDER, status: 'CANCELADO' } };
    },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sc=\'p_orders\';loadMyOrders()"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('text=' + MOCK_ORDER.ref).click();

  await expect(page.getByRole('button', { name: /Cancelar pedido/ })).toBeVisible();
  await page.getByRole('button', { name: /Cancelar pedido/ }).click();

  // Modal de confirmación propio de la app (no window.confirm).
  await expect(page.locator('text=CONFIRMAR //')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=Pedido cancelado.')).toBeVisible({ timeout: 10000 });
  expect(cancelCalled).toBe(true);

  const cancelCall = calls.find((c) => c.action === 'cancel-my-order');
  expect(cancelCall).toBeTruthy();
  expect(cancelCall!.body.orderId).toBe(MOCK_ORDER.id);
});
