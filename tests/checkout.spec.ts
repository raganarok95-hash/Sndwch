import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo prioritario #1: invitado arma un Signature, va al carrito, paga con Yape/Plin
// (el único método 100% mockeable sin el widget externo de Culqi) y ve la confirmación.

test('invitado arma un Signature y paga con Yape/Plin', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  // El home ahora muestra la lista de Signatures directamente (fase 2 de fidelidad al
  // mockup) — tocar cualquier fila ya entra a SIGNATURE BUILDS con ese Signature
  // preseleccionado, en vez de una tarjeta genérica "arrancar flujo".
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  await page.locator('[onclick*="size=\'15\'"]').click();
  // Primer Signature de la lista — cualquiera sirve para probar el flujo.
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Con el carrito vacío, el primer sándwich entra en modo "pago rápido"
  // (quickPayEligible, ver enterConfirm() en index.html): el checkout completo se
  // muestra inline en la misma pantalla de confirmación, sin pasar por TU CARRITO.
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Invitado');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();

  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.paymentMethod).toBe('yape');
  expect(placeOrderCall!.body.name).toBe('Cliente Invitado');
  expect(placeOrderCall!.body.address).toContain('Trujillo');
});

// SIG07 "THE CHICAGO" usa el corte exclusivo P07 y es el Signature con el salto de tamaño
// más grande del menú (15CM S/22 → 30CM S/29.90). Hasta el 2026-08-15 cobraba S/25 en
// AMBOS tamaños — el cliente pedía el doble de sándwich sin pagar nada extra, y la tarjeta
// de upsell ni se mostraba porque el delta era cero. Este test cubre que elegirlo, cambiar
// de tamaño (que ahora SÍ cambia el precio) y completar el pago funcione.
test('invitado pide THE CHICAGO (SIG07) y el cambio de tamaño sí cambia el precio', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-3', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG07\'"]').click();
  await expect(page.locator('text=S/22').first()).toBeVisible();

  // Cambiar a 30CM ahora SÍ sube el precio (S/22 → S/29.90) sin desmarcar el Signature
  // elegido — antes ambos tamaños costaban lo mismo y esa fuga es lo que este test evita
  // que vuelva.
  await page.locator('[onclick*="size=\'30\'"]').click();
  await expect(page.locator('text=S/29.9').first()).toBeVisible();

  // Vuelve a 15CM antes de continuar, para no depender de cuál tamaño quedó seleccionado.
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Carrito vacío → modo "pago rápido" inline (ver checkout.spec.ts arriba).
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Chicago');
  await page.locator('#o-phone').fill('987654322');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();

  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall2 = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall2).toBeTruthy();
  expect(placeOrderCall2!.body.items).toHaveLength(1);
  expect(placeOrderCall2!.body.items[0].sigId).toBe('SIG07');
  expect(placeOrderCall2!.body.items[0].size).toBe('15');
  // SIG07 15CM (S/22) + delivery por defecto (zona 'media', S/8) = S/30.
  expect(placeOrderCall2!.body.total).toBe(30);
});

// Regresión del bug crítico de esta sesión: un cliente que nunca toca el selector
// "¿Cómo pagas?" (ni Yape/Plin ni Tarjeta) sigue cayendo por el camino rápido de Culqi
// (ver doOrder()) — antes, el total que el cliente mandaba a prepare-order no incluía el
// recargo de tarjeta que el servidor SIEMPRE calcula para cualquier pedido que va a
// Culqi (deliveryFeeForZoneCard en orders.ts), así que el servidor rechazaba el pedido
// con "El total no coincide con los productos del pedido." en su camino más común. Este
// test no puede ejercer el rechazo real del servidor (prepare-order está mockeado), pero
// sí confirma que el cliente ya calcula y manda el total inflado sin que el cliente haya
// elegido nada — que es la mitad que de verdad se rompió.
test('invitado paga sin tocar el selector de método (camino rápido) y el total ya incluye el recargo de tarjeta', async ({ page }) => {
  const calls = await gotoApp(page, {
    'prepare-order': () => ({ success: true }),
  });

  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await expect(page.locator('text=SIGNATURE BUILDS')).toBeVisible();

  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG07\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Camino Rápido');
  await page.locator('#o-phone').fill('987654323');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');

  // Nunca toca "Yape / Plin" ni "Tarjeta" — pasa directo a pagar.
  await page.getByRole('button', { name: 'Pagar ahora //' }).click();

  await expect
    .poll(() => calls.find((c) => c.action === 'prepare-order'), { timeout: 10000 })
    .toBeTruthy();
  const prepareOrderCall = calls.find((c) => c.action === 'prepare-order')!;
  // SIG07 15CM = S/22, zona 'media' = S/8 reales, pero engordado para tarjeta:
  // 8/(1-0.055) = 8.47 → total = 30.47, no 30 (el fee sin engordar).
  expect(prepareOrderCall.body.total).toBe(30.47);
  expect(prepareOrderCall.body.deliveryZone).toBe('media');
});
