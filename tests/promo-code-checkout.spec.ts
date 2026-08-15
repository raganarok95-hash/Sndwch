import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Sistema de códigos promocionales (validate-promo-code/prepare-order/place-order,
// computePromoDiscount en orders.ts): cubre que aplicar un código en el checkout (1)
// resta el descuento del total mostrado y (2) manda `promoCode` al backend en el pedido
// real — sin este test, nada protege el wiring cliente↔servidor de una regresión futura.

test('cliente aplica un código promocional y el descuento se refleja en el total y el pedido', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000005', name: 'Cliente Promo', points: 0, credit_balance: 30, total_orders: 1 }, isAdmin: false, token: 'tok-promo' },
    'validate-promo-code': (body: any) => {
      expect(body.code).toBe('PROMO10');
      return { valid: true, code: 'PROMO10', discount: 3 };
    },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-promo-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'paid', payment_method: 'credit', total: body.total },
      customer: { phone: '900000005', name: 'Cliente Promo', points: body.total, credit_balance: 30 - body.total, total_orders: 2 },
    }),
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000005');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  // SIG01 (THE ORIGINAL) 15CM = S/18.90 — primer Signature del catálogo, precio conocido.
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG01\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  // El campo de código arranca colapsado en el checkout (evita recordarle un cupón a
  // quien no tiene ninguno) — hay que abrirlo antes de escribir.
  await page.getByText('¿Tienes un código?').click();
  await page.locator('#o-promo').fill('PROMO10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.locator('text=PROMO10 aplicado')).toBeVisible();

  // 18.90 (comida) - 3 (promo) = 15.90, más el delivery de zona 'media'. Todavía no se
  // eligió método de pago, así que el fee va engordado para tarjeta (8/(1-0.055)=8.47):
  // total mostrado = 24.37. Prueba de que el descuento ya se restó client-side.
  await expect(page.locator('text=S/24.37').first()).toBeVisible({ timeout: 10000 });

  await page.locator('[onclick*="useCredit=!useCredit"]').click();
  await expect(page.getByRole('button', { name: 'Confirmar con crédito //' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar con crédito //' }).click();

  // Pagado con crédito (a diferencia de Yape/Plin, que queda "pending") — la confirmación
  // dice "Pago confirmado", no "PEDIDO REGISTRADO" (ese título es para pagos pendientes).
  await expect(page.locator('text=Pago confirmado')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Monto cobrado')).toBeVisible();
  // Al pagar con crédito el pedido deja de ir por Culqi, así que el delivery vuelve a
  // su fee real (S/8) y el cobro baja a 15.90 + 8 = 23.90.
  await expect(page.locator('text=S/23.90').first()).toBeVisible();

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.promoCode).toBe('PROMO10');
  expect(placeOrderCall!.body.total).toBe(23.9);
  expect(placeOrderCall!.body.useCredit).toBe(true);
});

test('código promocional inválido muestra el error del servidor sin bloquear el checkout', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000006', name: 'Cliente Promo Malo', points: 0, credit_balance: 0, total_orders: 1 }, isAdmin: false, token: 'tok-promo2' },
    'validate-promo-code': () => {
      throw new Error('Ese código promocional no existe o ya no está activo.');
    },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-promo-2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: { phone: '900000006', name: 'Cliente Promo Malo', points: body.total, credit_balance: 0, total_orders: 2 },
    }),
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000006');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG01\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  // El campo de código arranca colapsado en el checkout (evita recordarle un cupón a
  // quien no tiene ninguno) — hay que abrirlo antes de escribir.
  await page.getByText('¿Tienes un código?').click();
  await page.locator('#o-promo').fill('NOEXISTE');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.locator('text=Ese código promocional no existe o ya no está activo.')).toBeVisible();

  // El checkout sigue funcionando con el total normal (sin descuento) — el error del
  // código no debe dejar el flujo bloqueado.
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });
});
