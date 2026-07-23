import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Antes rankName() era puramente informativo — cruzar un umbral de rango (ej. de REGULAR
// a INICIADO, que desbloquea THE VAULT) no generaba ningún aviso ni celebración
// (hallazgo de auditoría UX/diseño). Cubre finalizeOrderSuccess() comparando el rango
// antes/después del pedido y la tarjeta "¡SUBISTE DE RANGO!" en sOSent(), además de que
// ahora se muestra la referencia del pedido en esa misma pantalla.

test('cliente sube de rango a INICIADO al pagar el 5to pedido y ve la celebración', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0, total_orders: 4 }, isAdmin: false, token: 'tok-ana' },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      // El servidor es la fuente real de total_orders tras confirmar este pedido —
      // pasa de 4 a 5, cruzando el umbral de INICIADO (minOrders:5).
      customer: { phone: '900000001', name: 'Ana Cliente', points: body.total, credit_balance: 0, total_orders: 5 },
    }),
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrder(\'sig\')"]').click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=¡SUBISTE DE RANGO! //')).toBeVisible();
  await expect(page.locator('text=INICIADO')).toBeVisible();
  await expect(page.locator('text=Ya puedes ver THE VAULT')).toBeVisible();
  // Referencia del pedido visible — antes esta pantalla nunca la mostraba.
  await expect(page.locator('text=Pedido ORD-')).toBeVisible();
});

test('cliente que no cruza ningún umbral de rango no ve la celebración', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000002', name: 'Beto Cliente', points: 0, credit_balance: 0, total_orders: 2 }, isAdmin: false, token: 'tok-beto' },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: { phone: '900000002', name: 'Beto Cliente', points: body.total, credit_balance: 0, total_orders: 3 },
    }),
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000002');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrder(\'sig\')"]').click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=¡SUBISTE DE RANGO!')).not.toBeVisible();
});
