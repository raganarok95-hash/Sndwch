import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// Flujo prioritario #5: Libro de Reclamaciones — público por ley, no requiere sesión.
// Se llega por «Lo legal» (con cuenta) o por el enlace directo ?legal=reclamaciones; aquí se
// abre la pantalla directo.
//
// Promesa: lo que el consumidor escribe en cada uno de los tres pasos (maqueta aprobada
// 2026-10-03) llega ENTERO a `submit-complaint`.
// Modo de fallo: cada paso vuelve a pintar la pantalla; si lo tecleado no se guarda antes de
// pasar, el reclamo sale sin nombre o sin DNI, o el servidor lo rechaza y el consumidor —que
// llegó molesto— lo abandona. Es una obligación legal: un reclamo perdido es una multa.

async function abrirLibro(page: any) {
  await page.evaluate(() => { const w = window as any; w.cmplStep = 'form'; w.sndScreen = 'p_complaints'; w.render(); });
}
const siguiente = (page: any) => page.locator('[data-accion="libro-siguiente"]').click();

test('invitado presenta un reclamo en tres pasos y llega todo lo que escribió', async ({ page }) => {
  const calls = await gotoApp(page, {
    'submit-complaint': () => ({ success: true, claimCode: 'REC-2026-000123' }),
  });
  await abrirLibro(page);

  await page.locator('#cq-name').fill('Consumidor de Prueba');
  await page.locator('#cq-dni').fill('12345678');
  await page.locator('#cq-addr').fill('Av. Larco 500, Trujillo');
  await page.locator('#cq-phone').fill('987654321');
  await page.locator('#cq-email').fill('consumidor@example.com');
  await siguiente(page);

  await expect(page.locator('[data-accion="libro-tipo-reclamo"]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('#cq-ref').fill('SND-1234');
  await page.locator('#cq-amount').fill('25');
  await siguiente(page);

  await page.locator('#cq-detail').fill('El pedido llegó frío y más de una hora tarde.');
  await page.locator('#cq-request').fill('Solicito el reembolso del pedido.');
  await page.locator('[data-accion="libro-enviar"]').click();

  await expect(page.locator('text=REC-2026-000123')).toBeVisible();
  const call = calls.find((c) => c.action === 'submit-complaint');
  expect(call!.body).toMatchObject({
    kind: 'reclamo', consumerName: 'Consumidor de Prueba', consumerDni: '12345678',
    consumerAddress: 'Av. Larco 500, Trujillo', consumerPhone: '987654321', consumerEmail: 'consumidor@example.com',
    orderRef: 'SND-1234', claimedAmount: 25,
    detail: 'El pedido llegó frío y más de una hora tarde.', consumerRequest: 'Solicito el reembolso del pedido.',
  });
});

test('invitado presenta una queja, y volver atrás no borra lo escrito', async ({ page }) => {
  const calls = await gotoApp(page, {
    'submit-complaint': { success: true, claimCode: 'REC-2026-000124' },
  });
  await abrirLibro(page);

  await page.locator('#cq-name').fill('Consumidor Dos');
  await page.locator('#cq-dni').fill('87654321');
  await page.locator('#cq-addr').fill('Jr. Bolívar 200, Trujillo');
  await page.locator('#cq-phone').fill('912345678');
  await page.locator('#cq-email').fill('otro@example.com');
  await siguiente(page);
  await page.locator('[data-accion="libro-tipo-queja"]').click();
  await page.locator('[data-accion="libro-atras"]').click();
  await expect(page.locator('#cq-dni')).toHaveValue('87654321');
  await siguiente(page);
  await expect(page.locator('[data-accion="libro-tipo-queja"]')).toHaveAttribute('aria-checked', 'true');
  await siguiente(page);

  await page.locator('#cq-detail').fill('La atención fue muy demorada.');
  await page.locator('#cq-request').fill('Solicito una disculpa formal.');
  await page.locator('[data-accion="libro-enviar"]').click();
  await expect(page.locator('text=REC-2026-000124')).toBeVisible();

  const call = calls.find((c) => c.action === 'submit-complaint');
  expect(call!.body).toMatchObject({ kind: 'queja', consumerName: 'Consumidor Dos', consumerDni: '87654321' });
});

test('sin datos completos no avanza del primer paso', async ({ page }) => {
  const calls = await gotoApp(page, { 'submit-complaint': { success: true, claimCode: 'X' } });
  await abrirLibro(page);
  await page.locator('#cq-name').fill('Solo Nombre');
  await siguiente(page);
  await expect(page.locator('#cq-err')).not.toBeEmpty();
  await expect(page.locator('#cq-dni')).toBeVisible();
  expect(calls.some((c) => c.action === 'submit-complaint')).toBe(false);
});

test('con cuenta, los datos llegan llenos en la tarjeta y se envían los de la cuenta', async ({ page }) => {
  // Promesa: quien tiene cuenta confirma con un toque, y lo que se manda son SUS datos.
  const calls = await gotoApp(page, {
    login: { customer: { phone: '987000111', name: 'Ana Pérez', dni: '44556677', email: 'ana@correo.pe', last_address: 'Av. España 123', points: 0, total_orders: 1 }, token: 'tok-ana' },
    'my-orders': { orders: [{ id: 'o1', ref: 'ORD-AAA-111', summary: 'Pedido de prueba', total: 22.9, status: 'ENTREGADO', created_at: '2026-10-02T15:00:00Z', items: [] }] },
    'submit-complaint': { success: true, claimCode: 'REC-2026-000125' },
  });
  await entrarConTelefono(page, '987000111');
  await abrirLibro(page);

  await expect(page.locator('[data-accion="libro-cambiar-datos"]')).toBeVisible();
  await expect(page.locator('#cq-name')).toHaveCount(0);
  await siguiente(page);
  await page.locator('[data-accion="libro-pedido"]').first().click();
  await siguiente(page);
  await page.locator('#cq-detail').fill('Faltó la bebida.');
  await page.locator('#cq-request').fill('Reposición.');
  await page.locator('[data-accion="libro-enviar"]').click();
  await expect(page.locator('text=REC-2026-000125')).toBeVisible();

  const call = calls.find((c) => c.action === 'submit-complaint');
  expect(call!.body).toMatchObject({
    consumerName: 'Ana Pérez', consumerDni: '44556677', consumerAddress: 'Av. España 123',
    consumerPhone: '987000111', consumerEmail: 'ana@correo.pe', orderRef: 'ORD-AAA-111',
  });
});
