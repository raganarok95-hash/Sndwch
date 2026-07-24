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

// SIG07 "THE CHICAGO" es el caso más raro del menú: p15===p30 (precio único de
// S/25, sin split real de tamaño). El selector 15CM/30CM sigue existiendo en la pantalla
// (es genérico para todos los Signature) — este test confirma que elegirlo, cambiar de
// tamaño y completar el pago no rompe nada aunque el precio no cambie entre 15 y 30.
test('invitado pide THE CHICAGO (SIG07, precio único 15CM=30CM) y paga con Yape/Plin', async ({ page }) => {
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
  await expect(page.locator('text=S/25').first()).toBeVisible();

  // Cambiar a 30CM no debe cambiar el precio (p15===p30) ni desmarcar el Signature
  // elegido — el caso raro que este test existe para cubrir.
  await page.locator('[onclick*="size=\'30\'"]').click();
  await expect(page.locator('text=S/25').first()).toBeVisible();

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
  // p15===p30 para SIG07 — el total no depende del tamaño elegido, solo confirma que
  // llegó el precio único (S/25) + el delivery por defecto (zona 'media', S/8), no que
  // se haya calculado con la fórmula de split real.
  expect(placeOrderCall2!.body.total).toBe(33);
});
