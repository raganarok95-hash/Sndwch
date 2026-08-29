import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Cancelar es la única acción de la cola admin que DESHACE cosas ya hechas: libera el
// stock reservado, revierte puntos/crédito y avisa al cliente que su comida no va a
// llegar. Hasta ahora era también la única sin ninguna prueba, pese a arrastrar tres
// defectos reales ya corregidos (se restockeaba dos veces con doble-tap, no se revertía
// nada de lo ganado, y el cliente no se enteraba). Lo que este test fija:
//
//  · un pedido YA PAGADO avisa explícitamente que el reembolso lo coordina el dueño a
//    mano — el servidor exige `acknowledgeRefund` justamente para que esa advertencia no
//    se pueda saltar;
//  · el motivo que escribe el operador viaja al servidor (es lo que alimenta el resumen
//    semanal: antes solo se podía contar CUÁNTOS se cancelaban, nunca POR QUÉ);
//  · salir del prompt NO cancela el pedido;
//  · el pedido cancelado desaparece de la cola.

const MOCK_ORDER = {
  id: 'ord-cancel-1',
  ref: 'ORD-TEST99-ZZZZ',
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100, Víctor Larco Herrera',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 27.25,
  delivery_fee: 6.35,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

async function entrarAlPanel(page: any, calls: any[]) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
}

test('admin cancela un pedido pagado reconociendo el reembolso y con motivo', async ({ page }) => {
  let cancelado = false;
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: cancelado ? [] : [MOCK_ORDER], truncated: false }),
    'admin-cancel-order': () => {
      cancelado = true;
      return { success: true };
    },
  });

  await entrarAlPanel(page, calls);
  await page.getByRole('button', { name: /cancelar pedido/i }).first().click();

  // La advertencia del reembolso no es opcional: es lo que separa "liberar el stock" de
  // "el cliente ya pagó y hay que devolverle la plata por fuera de la app".
  await expect(page.locator('#ui-prompt-input')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('YA FUE PAGADO');
  await expect(page.getByRole('dialog')).toContainText(/reembolso/i);

  await page.locator('#ui-prompt-input').fill('Se acabó la res a media preparación');
  await page.getByRole('button', { name: 'Aceptar //' }).click();

  await expect.poll(() => calls.filter((c) => c.action === 'admin-cancel-order').length).toBeGreaterThan(0);
  const cancelCall = calls.find((c) => c.action === 'admin-cancel-order');
  expect(cancelCall!.body.orderId).toBe(MOCK_ORDER.id);
  expect(cancelCall!.body.acknowledgeRefund).toBe(true);
  expect(cancelCall!.body.reason).toBe('Se acabó la res a media preparación');

  // Y sale de la cola sin necesidad de recargar: si siguiera ahí, el operador lo
  // cancelaría dos veces.
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toHaveCount(0);
});

test('salir del prompt no cancela el pedido', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-cancel-order': () => ({ success: true }),
  });

  await entrarAlPanel(page, calls);
  await page.getByRole('button', { name: /cancelar pedido/i }).first().click();
  await expect(page.locator('#ui-prompt-input')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();

  await expect(page.locator('#ui-prompt-input')).toHaveCount(0);
  expect(calls.find((c) => c.action === 'admin-cancel-order')).toBeFalsy();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible();
});

test('un pedido Yape sin confirmar avisa que el cliente nunca transfirió, no que hay reembolso', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({
      orders: [{ ...MOCK_ORDER, payment_method: 'yape', payment_status: 'pending' }],
      truncated: false,
    }),
    'admin-cancel-order': () => ({ success: true }),
  });

  await entrarAlPanel(page, calls);
  await page.getByRole('button', { name: /cancelar pedido/i }).first().click();
  await expect(page.locator('#ui-prompt-input')).toBeVisible();
  // Decirle "coordina el reembolso" al operador por un pedido que nunca se pagó lo
  // llevaría a devolver plata que nunca recibió.
  await expect(page.getByRole('dialog')).toContainText('nunca transfirió');
  await expect(page.getByRole('dialog')).not.toContainText('YA FUE PAGADO');
});
