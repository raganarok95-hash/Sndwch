import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, pedirUnSignature, ponerRecibe, ponerDireccion, subirCapturaAlPagar } from './helpers';

// EL PEDIDO SIMPLE (dueño, 2026-11-02: «Sí a todo»; docs/maquetas/aprobadas/pedido-simple-*.png).
// Promesa: elegir la captura en la 31 crea el pedido, la sube con SU referencia y la lee sola; la
// pantalla dice «en la cocina» solo si el servidor confirmó el pago.
// ⚠ MODO DE FALLO: SILENCIO. Si la captura no viaja con el pedido, el pedido queda pendiente sin
// que nadie lo note y se cancela solo; si se dice «en la cocina» sin pago, el cliente espera algo
// que nadie está cocinando.

async function hastaLa31(page: any, confirmado: boolean, motivo: any = null) {
  await page.addInitScript(() => { (window as any).Tesseract = { recognize: async () => ({ data: { text: 'Yapeaste S/ 27.90' } }) }; });
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({ success: true, order: { id: '55555555-5555-4555-8555-555555555555', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total } }),
    'upload-receipt': { success: true },
    'cliente-lee-captura': { success: true, confirmado, motivo },
    '*': { success: true },
  });
  await pedirUnSignature(page, { size: '15' });
  await ponerDireccion(page);
  await ponerRecibe(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31.y').waitFor();
  return calls;
}

test('subir la captura en la 31 crea el pedido, la sube con su referencia y, si cuadra, dice «en la cocina»', async ({ page }) => {
  const calls = await hastaLa31(page, true);
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="en-la-cocina"]')).toBeVisible();
  const po = calls.find((c) => c.action === 'place-order');
  expect(po, 'la captura no creó el pedido').toBeTruthy();
  const up = calls.find((c) => c.action === 'upload-receipt');
  expect(up, 'la captura no se subió').toBeTruthy();
  expect(up!.body.ref).toBe(po!.body.ref);
  expect(calls.find((c) => c.action === 'cliente-lee-captura')!.body.ref).toBe(po!.body.ref);
});

test('si la captura no cuadra, no dice «en la cocina»: queda en revisión', async ({ page }) => {
  await hastaLa31(page, false);
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="revisando"]')).toBeVisible();
  await expect(page.locator('.m06 [data-estado-pago="en-la-cocina"]')).toHaveCount(0);
});

// Promesa (dueño, 2026-11-02: yapeó S/23.90 por un pedido de S/24.90 y la app solo decía «la
// revisamos»): si la captura no cuadra por algo que el cliente puede corregir, se le dice qué y puede
// subir la correcta ahí mismo. Fallo silencioso: el pedido espera horas y se cancela solo.
test('si la captura no cuadra por el monto, lo dice y deja subir otra', async ({ page }) => {
  const calls = await hastaLa31(page, false, { codigo: 'monto', leido: 23.9, pedido: 24.9 });
  await subirCapturaAlPagar(page);
  await expect(page.locator('.m06 [data-estado-pago="captura-no-cuadra"]')).toBeVisible();
  await expect(page.locator('.m06 [data-motivo-captura="monto"]')).toBeVisible();
  const antes = calls.filter((c) => c.action === 'upload-receipt').length;
  const { CAPTURA_PNG } = await import('./helpers');
  await page.locator('[data-accion="subir-otra-captura"] input').setInputFiles({ name: 'otra.png', mimeType: 'image/png', buffer: CAPTURA_PNG });
  await expect.poll(() => calls.filter((c) => c.action === 'upload-receipt').length).toBe(antes + 1);
});

test('un toque: el botón de 30CM agrega el de 30 sin pasar por la ficha', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.locator('.m15 .plato').first().locator('[data-accion="agregar-30"]').click();
  await expect(page.locator('.f01')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).cart.map((it: any) => it.size))).toEqual(['30']);
});

// Promesa: «Avísame» de la puerta antes de abrir anota el celular. Fallo silencioso: el cliente
// cree que le van a escribir y nadie lo tiene.
test('antes de abrir, «Avísame» anota el celular en la lista de espera', async ({ page }) => {
  const calls = await mockBackend(page, { 'get-store-hours': { hours: {}, businessLaunched: false }, 'waitlist-join': { success: true } } as any);
  await stubWindowOpen(page);
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.locator('[data-accion="avisame-al-abrir"]').click();
  await page.locator('#ui-prompt-input').fill('987654321');
  await page.locator('#ui-prompt-input').press('Enter');
  await expect.poll(() => calls.find((c: any) => c.action === 'waitlist-join')?.body.phone).toBe('987654321');
  await expect(page.locator('[data-accion="avisame-al-abrir"]')).toHaveCount(0);
});
