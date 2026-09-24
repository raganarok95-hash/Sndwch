import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// «RECUPERAR MI PIN» TIENE QUE FUNCIONAR SIN EL PANEL (2026-09-24).
//
// La pantalla ya vivía en el cliente, pero la función de su botón (`doRecover`) se había
// quedado en 10-admin-negocio.ts, que solo se descarga cuando el dueño abre el panel. Para
// cualquier cliente el botón no hacía nada: justo la persona que perdió su acceso. Esta prueba
// corre la app como la ve un cliente —sin cargar admin.js— y exige que el toque llegue al
// servidor.

test('recuperar el PIN llega al servidor sin haber cargado el panel', async ({ page }) => {
  const calls = await gotoApp(page, {
    recover: { success: true, emailSent: true, emailMasked: 'a***@correo.com' },
  });
  // `loadAdminMgr` solo existe en admin.js: si estuviera, la prueba no probaría nada.
  expect(await page.evaluate(() => typeof (window as any).loadAdminMgr)).not.toBe('function');
  await page.evaluate(() => { (window as any).sndScreen = 'p_recover'; (window as any).render(); });
  await page.locator('#rec-phone').fill('900000001');
  await page.locator('#rec-dni').fill('12345678');
  await page.locator('#rec-bday').fill('01/02/1990');
  await page.getByRole('button', { name: /Recuperar mi PIN/i }).click();
  await expect.poll(() => calls.some((c) => c.action === 'recover'), { timeout: 5000 }).toBe(true);
  expect(calls.find((c) => c.action === 'recover')!.body.phone).toBe('900000001');
});
