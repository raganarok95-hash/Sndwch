import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Antes rankName() era puramente informativo — cruzar un umbral de rango no generaba ningún
// aviso ni celebración (hallazgo de auditoría UX/diseño). Cubre finalizeOrderSuccess()
// comparando el rango antes/después del pedido y la tarjeta "¡SUBISTE DE RANGO!" en sOSent().
//
// Desde el 2026-08-26 estos dos tests cubren además algo que ANTES ERA EL MISMO EVENTO y ya
// no lo es: subir de rango y desbloquear el menú secreto. Coincidían de casualidad porque el
// umbral del secreto era 5, igual que INICIADO. Al bajarlo a 3 se separaron, y cada uno tiene
// que avisar por su cuenta — si no, quien pasa de 2 a 3 pedidos desbloquea el menú secreto y
// no se entera por ningún lado.

test('cliente sube de rango a INICIADO al 5to pedido, sin repetir el aviso del menú secreto', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0, total_orders: 4 }, isAdmin: false, token: 'tok-ana' },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      // El servidor es la fuente real de total_orders tras confirmar este pedido —
      // pasa de 4 a 5, cruzando el umbral de INICIADO (RANKS, minOrders:5). El menú secreto
      // ya estaba desbloqueado desde el 3er pedido, así que acá NO debe volver a anunciarse.
      customer: { phone: '900000001', name: 'Ana Cliente', points: body.total, credit_balance: 0, total_orders: 5 },
    }),
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
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
  // El menú secreto se desbloqueó dos pedidos antes: repetir el aviso acá sería mentirle al
  // cliente sobre qué acaba de ganar.
  await expect(page.locator('text=Ya puedes ver el menú secreto')).not.toBeVisible();
  // Referencia del pedido visible — antes esta pantalla nunca la mostraba.
  await expect(page.locator('text=Pedido ORD-')).toBeVisible();
});

test('al 3er pedido se desbloquea el menú secreto aunque no haya subida de rango', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000002', name: 'Beto Cliente', points: 0, credit_balance: 0, total_orders: 2 }, isAdmin: false, token: 'tok-beto' },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: { phone: '900000002', name: 'Beto Cliente', points: body.total, credit_balance: 0, total_orders: 3 },
    }),
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000002');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
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
  // De 2 a 3 pedidos no se cruza ningún rango: sigue siendo REGULAR (RANKS pasa de 1 a 5).
  await expect(page.locator('text=¡SUBISTE DE RANGO!')).not.toBeVisible();
  // Pero SÍ se cruza el umbral del menú secreto (3). Este es el caso que el aviso viejo se
  // perdía por completo: vivía dentro de la tarjeta de rango, que acá no se muestra.
  await expect(page.locator('text=¡Desbloqueaste algo! //')).toBeVisible();
  await expect(page.locator('text=Ya puedes ver el menú secreto')).toBeVisible();
});
