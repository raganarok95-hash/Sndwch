import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo prioritario #3: un operador inicia sesión (misma pantalla de login que un
// cliente — el backend decide isAdmin), entra al panel y avanza un pedido RECIBIDO ya
// pagado a PREPARANDO.

const MOCK_ORDER = {
  id: 'ord-admin-1',
  ref: 'ORD-TEST01-AAAA',
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

test('admin confirma un pedido pagado y lo pasa a PREPARANDO', async ({ page }) => {
  let currentStatus = 'RECIBIDO';
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [{ ...MOCK_ORDER, status: currentStatus }], truncated: false }),
    'admin-update-status': (body: any) => {
      currentStatus = body.status;
      return { success: true, order: { ...MOCK_ORDER, status: currentStatus } };
    },
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=RECIBIDO').first()).toBeVisible();

  await page.getByRole('button', { name: /MARCAR COMO PREPARANDO/ }).click();

  const updateCall = calls.find((c) => c.action === 'admin-update-status');
  expect(updateCall).toBeTruthy();
  expect(updateCall!.body.orderId).toBe(MOCK_ORDER.id);
  expect(updateCall!.body.status).toBe('PREPARANDO');
  await expect(page.locator('text=PREPARANDO').first()).toBeVisible();
});
