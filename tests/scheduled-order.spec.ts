import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Flujo prioritario #2: "pedir para más tarde" — el cliente programa una hora en vez de
// pedir "AHORA". get-store-hours se mockea abierto 24/7 (ver helpers.ts) para que la
// validación de horario del cliente nunca sea la causa de un fallo del test.
//
// El picker ya NO es un <input type="datetime-local"> nativo (se rendía como una caja
// vacía y enorme en varios navegadores/webviews móviles — ver app.ts, scheduleTimePickerHTML)
// sino franjas horarias propias (HOY/MAÑANA + cada 30 min). Al tocar "PROGRAMAR" ya queda
// seleccionada automáticamente la primera franja disponible (initSchedDefault en app.ts),
// así que basta con confirmar que #o-sched (input oculto) trae un valor futuro válido.

test('invitado programa un pedido para más tarde', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Carrito vacío → modo "pago rápido" inline (ver checkout.spec.ts).
  await page.locator('#o-nom').fill('Cliente Programado');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Jr. Pizarro 456, Trujillo');

  // El método de pago se elige ANTES de tocar el horario: seleccionarlo dispara
  // confirmRerender() (ver index.html), que reconstruye el DOM del formulario y
  // borraría cualquier valor ya tipeado en #o-sched (ese input no tiene una variable de
  // estado que lo preserve entre renders, a diferencia de nombre/teléfono/dirección).
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();

  await page.locator('[onclick*="scheduleMode=\'later\'"]').click();
  const schedValue = await page.locator('#o-sched').inputValue();
  expect(schedValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.scheduledFor).toBeTruthy();
  // scheduledFor viaja como ISO (UTC) — el datetime-local que llenamos es hora local del
  // navegador, así que solo confirmamos que el cliente lo convirtió a un ISO parseable
  // en el futuro, no un valor literal exacto.
  expect(new Date(placeOrderCall!.body.scheduledFor).getTime()).toBeGreaterThan(Date.now());
});
