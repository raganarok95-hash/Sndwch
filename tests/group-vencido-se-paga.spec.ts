import { test, expect } from '@playwright/test';
import { gotoApp, APP_FILE } from './helpers';

// VENCER NO MATA EL PEDIDO GRUPAL (2026-09-23, decisión del dueño).
//
// El defecto que esta prueba fija era doble y silencioso. `get-group-order` marca 'closed'
// en cuanto la ventana de 15 minutos vence —al LEERLO—, y la pantalla solo pintaba el botón
// de pagar mientras `status==='open'`. Resultado: pasados los 15 minutos el organizador
// abría la pantalla del grupo, lo que por sí solo lo cerraba, y se quedaba mirando "este
// pedido grupal ya se cerró" sin ninguna forma de cobrar lo que los demás habían sumado.
// Todo el pedido se perdía, y se perdía porque él lo había mirado.
//
// Sobre el pedido que más deja del negocio: un grupal vale ~6x un pedido normal.
//
// Ahora los 15 minutos significan "ya no entra nadie más": se paga con los que alcanzaron,
// y la pantalla explica ahí mismo por qué no hubo sándwich gratis.

const VENCIDO = {
  code: 'ABC123', status: 'closed', organizerName: 'Ana Cliente',
  expiresAt: new Date(Date.now() - 60000).toISOString(),
  items: [
    { id: 1, contributorName: 'Beto', label: 'The Original 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
    { id: 2, contributorName: 'Cami', label: 'The Original 15CM', qty: 2, unitPrice: 20.9, isSandwich: true },
  ],
  total: 62.7, isOrganizer: true, sandwichQty: 3, organizerFreeAt: 5,
  canPay: true, freeApplies: false, missingForFree: 2,
};

test('un grupo vencido todavía se puede pagar, y dice por qué no hubo gratis', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'get-group-order': VENCIDO,
    'close-group-order': { success: true, items: [] },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  // Lo que el organizador perdía: enterarse de que todavía puede cobrar.
  await expect(page.locator('text=Se acabó el tiempo para sumarse')).toBeVisible();
  // Y el motivo, DERIVADO del conteo que manda el servidor — nunca escrito a mano.
  await expect(page.locator('text=No llegaron a 5 sándwiches')).toBeVisible();
  await expect(page.locator('text=faltaron 2')).toBeVisible();

  // El botón es lo que de verdad se había perdido.
  const pagar = page.getByRole('button', { name: /PAGAR CON LOS QUE HAY/i });
  await expect(pagar).toBeVisible();
  await pagar.click();
  // Cerrar y pagar siempre pasa por una confirmación — no se cobra un grupo de varias
  // personas por un toque accidental.
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect.poll(() => calls.some((c) => c.action === 'close-group-order'), { timeout: 10000 }).toBe(true);
  expect(calls.find((c) => c.action === 'close-group-order')!.body.code).toBe('ABC123');
});

test('un grupo ya pagado no ofrece pagar de nuevo', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    // canPay:false es lo que el servidor devuelve para un grupo en estado terminal — la
    // pantalla NO lo deduce de status, que fue justamente el error original.
    'get-group-order': { ...VENCIDO, status: 'paid', canPay: false },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await expect(page.locator('text=Este pedido grupal ya se pagó')).toBeVisible();
  await expect(page.getByRole('button', { name: /PAGAR CON LOS QUE HAY/i })).toHaveCount(0);
});
