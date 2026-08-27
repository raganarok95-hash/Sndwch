import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo de dinero sin ningún test de regresión (hallazgo de auditoría de código, ALTO):
// actAdminConfirmPayment reclama atómicamente payment_status pending->paid (con guard
// payment_status=neq.paid en el propio UPDATE) para que un doble tap/reintento de red no
// pueda otorgar los puntos/bono de referido dos veces — sin este test, nada protege ese
// arreglo de una regresión futura.

const MOCK_ORDER = {
  id: 'ord-confirm-1',
  ref: 'ORD-CONFIRM01-AAAA',
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'pending',
  payment_method: 'yape',
  created_at: new Date().toISOString(),
};

test('admin confirma un pago Yape sin avanzar el pedido todavía', async ({ page }) => {
  let confirmCalled = false;
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-confirm-payment': (body: any) => {
      confirmCalled = true;
      return { success: true, order: { ...MOCK_ORDER, payment_status: 'paid' } };
    },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=PAGO YAPE/PLIN SIN CONFIRMAR')).toBeVisible();

  await page.locator('text=solo confirmar el pago, sin avanzar todavía').click();

  // El clic dispara un fetch. Leer `calls` en el tick siguiente es una CARRERA: no hay nada
  // que garantice que la petición ya se registró. Los demás specs (checkout, cancel-order,
  // restock-notify) se salvan por accidente porque antes esperan un texto que solo aparece
  // DESPUÉS de la respuesta, y esa espera hace de barrera; acá no había ninguna.
  // Se hizo visible en CI, donde este test corre en ~2s contra los ~14s de un entorno local:
  // no es un test "flaky", es que el timing relativo cambia y destapa el defecto.
  // Se espera explícitamente a la llamada, igual que en admin-catalog-items.spec.ts.
  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-confirm-payment').length)
    .toBeGreaterThan(0);
  const confirmCall = calls.find((c) => c.action === 'admin-confirm-payment');
  expect(confirmCall).toBeTruthy();
  expect(confirmCall!.body.orderId).toBe(MOCK_ORDER.id);
  expect(confirmCalled).toBe(true);
});
