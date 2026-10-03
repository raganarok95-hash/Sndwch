import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature, ponerRecibe, ponerDireccion } from './helpers';

// UN FALLO CON TARJETA NUNCA ES MUDO (dueño, 2026-10-01: «Pagar con culqi no funciona»).
//
// Promesa: si el pago con tarjeta falla antes de cobrar (prepare-order lo rechaza), el motivo
// QUEDA escrito en la pantalla Pagar y llega al registro de errores (report-client-error).
// Modo de fallo: el silencio. Así pasó: en producción no había ni una reserva ni un error, el
// motivo salía en un aviso de segundos y nadie, ni el dueño ni el resumen diario, se enteraba.

test('si prepare-order falla, el motivo se queda en Pagar y se reporta', async ({ page }) => {
  await page.addInitScript(() => { (window as any).Culqi = { settings() {}, options() {}, open() {} }; });
  const calls = await gotoApp(page, {
    'prepare-order': () => { throw new Error('Motivo de prueba del servidor.'); },
    '*': { success: true },
  });
  await pedirUnSignature(page);
  await ponerRecibe(page);
  await ponerDireccion(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31').waitFor();
  await page.evaluate(() => { (window as any).selectPayMethod('culqi'); (window as any).render(); });
  await page.locator('.m31.t').waitFor();
  await page.locator('.m30-go .oro').click();

  await expect(page.locator('.m31.t [role="alert"]')).toContainText('Motivo de prueba del servidor.');
  await expect.poll(() => calls.filter((c) => c.action === 'report-client-error').map((c) => c.body.donde))
    .toContain('tarjeta:prepare-order');
});

// Promesa: si la ventana de Culqi no aparece (dueño, 2026-10-02: «no veo nada, no carga Niubiz
// ni nada»), a los segundos Pagar lo dice y llega al registro con lo que había en la página.
// Modo de fallo: el silencio — Culqi.open() no avisa nada si su ventana no se muestra.
test('si la ventana de Culqi no aparece, Pagar lo dice y se reporta', async ({ page }) => {
  await page.addInitScript(() => { (window as any).Culqi = { settings() {}, options() {}, open() {} }; });
  const calls = await gotoApp(page, { '*': { success: true } });
  await pedirUnSignature(page);
  await ponerRecibe(page);
  await ponerDireccion(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31').waitFor();
  await page.evaluate(() => { (window as any).selectPayMethod('culqi'); (window as any).render(); });
  await page.locator('.m31.t').waitFor();
  await page.locator('.m30-go .oro').click();
  await expect.poll(() => calls.filter((c) => c.action === 'report-client-error').map((c) => c.body.donde), { timeout: 12000 })
    .toContain('tarjeta:no-abrio');
  await expect(page.locator('.m31.t [role="alert"]')).not.toBeEmpty();
});

// Promesa: un invitado (o una cuenta sin correo) que paga con tarjeta llega al cobro con el
// correo que escribió en la ventana de Culqi.
// Modo de fallo: la app mandaba a create-charge el correo de la cuenta; vacío para un invitado,
// y create-charge lo rechaza («Faltan datos») DESPUÉS de que el cliente escribió su tarjeta. No
// se cobra, no hay pedido, y el cliente cree que la tarjeta no funciona.
test('un invitado paga con tarjeta con el correo que dio en Culqi', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Culqi = { settings() {}, options() {}, open() { setTimeout(() => {
      (window as any).Culqi.token = { id: 'tkn_prueba', email: 'invitado@correo.pe' };
      (window as any).culqi();
    }, 50); } };
  });
  const cobros: any[] = [];
  await page.route('**/functions/v1/create-charge', async (route) => {
    cobros.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, chargeId: 'chr_prueba' }) });
  });
  const calls = await gotoApp(page, {
    'prepare-order': { success: true },
    'place-order': { success: true, order: { id: 'o1', ref: 'X' } },
    '*': { success: true },
  });
  await pedirUnSignature(page);
  await ponerRecibe(page);
  await ponerDireccion(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31').waitFor();
  await page.evaluate(() => { (window as any).selectPayMethod('culqi'); (window as any).render(); });
  await page.locator('.m31.t').waitFor();
  await page.locator('.m30-go .oro').click();

  await expect.poll(() => cobros.length).toBe(1);
  expect(cobros[0].email).toBe('invitado@correo.pe');
  expect(cobros[0].token).toBe('tkn_prueba');
  await expect.poll(() => calls.some((c) => c.action === 'place-order')).toBe(true);
});
