import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// EL PAGO SE REGISTRA AL EMBAJADOR QUE SE TOCÓ (dueño, 2026-10-16: «Sí, amé los embajadores»;
// docs/META_Y_PRESENCIAL.md). Cuánto se le debe lo calcula el servidor (tests-api/embajadores);
// el panel solo dice A QUIÉN se le pagó.
// Promesa: tocar «Ya le pagué» en la tarjeta de un embajador registra el pago de ESE embajador,
// después de confirmarlo; quien no tiene deuda no muestra el botón.
// Modo de fallo: el silencio — el pago queda anotado a otra persona: a uno le aparece saldada una
// deuda que nadie le pagó y al otro se le vuelve a pagar. Nadie lo nota hasta que reclaman.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};
const embajador = (id: number, debe: number) => ({
  id, nombre: 'Embajador ' + id, telefono: '91111111' + id, activo: true,
  enlace: 'https://sndwch.app/?src=emb-e' + id, invitados: 2, primeros: 2, segundos: 0,
  ganado: debe, pagado: 0, debe, ultimoPago: null,
});

test('«Ya le pagué» registra el pago del embajador de esa tarjeta, y solo si se confirma', async ({ page }) => {
  const calls = await gotoApp(page, {
    ...ADMIN,
    'admin-embajadores': { porPrimero: 5, porSegundo: 5, totalDebe: 30, embajadores: [embajador(1, 10), embajador(2, 20), embajador(3, 0)] },
    'admin-embajador-pagar': (body: any) => ({ success: true, monto: body.id === 2 ? 20 : 10 }),
    '*': { success: true },
  });
  await entrarConTelefono(page, '900000099', '1234');
  await page.waitForFunction(() => (window as any).isAdmin);
  // El panel viaja aparte (admin.js) y se pide al abrir una pantalla de admin.
  await page.evaluate(async () => { const w = window as any; await w.loadAdminBundle(); w.loadEmbajadores(); });
  await page.locator('[data-embajador="2"]').waitFor();

  await expect(page.locator('[data-embajador="3"] [data-accion="pagar-embajador"]'), 'sin deuda no hay botón').toHaveCount(0);

  page.once('dialog', (d) => d.dismiss());
  await page.locator('[data-embajador="2"] [data-accion="pagar-embajador"]').click();
  await expect(page.locator('[data-embajador="2"]')).toBeVisible();
  expect(calls.filter((c) => c.action === 'admin-embajador-pagar'), 'sin confirmar no se registra nada').toHaveLength(0);

  page.once('dialog', (d) => d.accept());
  await page.locator('[data-embajador="2"] [data-accion="pagar-embajador"]').click();
  await expect.poll(() => calls.filter((c) => c.action === 'admin-embajador-pagar').length, { timeout: 10000 }).toBe(1);
  const pago = calls.find((c) => c.action === 'admin-embajador-pagar')!;
  expect(pago.body.id, 'el pago se anotó a otro embajador').toBe(2);
});
