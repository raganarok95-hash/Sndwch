import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// RESPONDER UN RECLAMO DESDE EL PANEL (2026-09-24).
//
// `complaints.id` es bigint: la API lo devuelve como NÚMERO. El botón «Responder» lo guardaba
// como TEXTO (`cmplRespondingId='5'`) y la pantalla comparaba `'5' === 5`: la caja para escribir
// la respuesta no se abría nunca. Es el Libro de Reclamaciones, que por ley hay que responder, y
// ninguna prueba lo tocaba — la del panel solo comprueba que cada herramienta ABRA.
//
// El id va como número, como lo manda la base.

test('el dueño puede escribir y guardar la respuesta a un reclamo', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [], truncated: false }),
    'admin-list-complaints': () => ({
      complaints: [{
        id: 5, claim_code: 'RC-2026-0005', kind: 'reclamo', status: 'pendiente',
        consumer_name: 'Mafe', consumer_phone: '900000001', consumer_email: 'm@correo.com',
        detail: 'Llegó frío', consumer_request: 'Reposición', order_ref: null,
        provider_response: null, created_at: new Date().toISOString(),
      }],
    }),
    'admin-respond-complaint': () => ({ success: true }),
    '*': () => ({ ok: true }),
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000000', '1234');
  await page.locator('[onclick*="admin_home"]').click();
  // El panel vive en admin.js, que se descarga aparte recién al entrar (08-router): llamar a la
  // función antes de que llegue fallaba una de cada dos corridas con «no es una función».
  await page.waitForFunction(() => typeof (window as any).loadAdminComplaints === 'function');
  await page.evaluate(() => (window as any).loadAdminComplaints());
  await page.getByRole('button', { name: /Responder/ }).click();

  const caja = page.locator('#cq-resp-5');
  await expect(caja).toBeVisible();
  await caja.fill('Le reponemos el pedido hoy.');
  await page.getByRole('button', { name: /Guardar respuesta/ }).click();
  await expect.poll(() => calls.some((c: any) => c.action === 'admin-respond-complaint')).toBe(true);
  const b = calls.find((c: any) => c.action === 'admin-respond-complaint')!.body;
  expect(b.id).toBe(5);
  expect(b.response).toBe('Le reponemos el pedido hoy.');
});
