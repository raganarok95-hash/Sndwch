import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// «Mis Pedidos» separaba activos de anteriores con `status!=='ENTREGADO'`. Un pedido
// CANCELADO no es ENTREGADO, así que caía entre los ACTIVOS —con el rótulo parpadeante— y su
// detalle decía «Toca Actualizar», como si todavía pudiera llegar. Para siempre: no hay
// estado siguiente que lo saque de ahí. Nada fallaba; solo mentía.

const base = {
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  payment_status: 'paid',
  payment_method: 'yape',
  created_at: new Date().toISOString(),
  date: '21/09/2026',
};
const CANCELADO = { ...base, id: 'ord-c', ref: 'ORD-CANC-0001', status: 'CANCELADO' };
const EN_CURSO = { ...base, id: 'ord-a', ref: 'ORD-ACTV-0002', status: 'PREPARANDO' };

test('un pedido cancelado va a «Anteriores», no a «Activos», y no pide actualizar', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Cliente de Prueba', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok' },
    'my-orders': { orders: [CANCELADO, EN_CURSO] },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page);
  await page.locator('[onclick*="sndScreen=\'p_orders\';loadMyOrders()"]').click();
  await expect(page.locator('text=' + CANCELADO.ref)).toBeVisible({ timeout: 10000 });

  // Activos cuenta UNO (el que se está preparando), no dos.
  await expect(page.getByText('● Activos // 1')).toBeVisible();
  await expect(page.getByText('Anteriores // 1')).toBeVisible();

  await page.locator('text=' + CANCELADO.ref).click();
  await expect(page.getByText('Este pedido se canceló.')).toBeVisible();
  await expect(page.getByText('Toca Actualizar en Mis Pedidos')).toHaveCount(0);
});
