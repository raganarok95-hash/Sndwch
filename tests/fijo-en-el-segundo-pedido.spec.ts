import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono, elegirSando, pedirUnSignature, pagarConYape } from './helpers';

// EL PEDIDO FIJO SE OFRECE AL TERMINAR EL SEGUNDO PEDIDO (dueño, 2026-10-15: «1 sí»; docs/
// META_6000.md: que los clientes vuelvan es lo que decide si se llega a la meta).
// Promesa: quien ya había pedido una vez y termina su segundo pedido ve, en la losa, «¿Lo dejamos
// fijo los miércoles a la 1 p.m.?», y con un toque queda guardado ESE pedido ese día de la semana
// y a esa hora. En el primer pedido no se ofrece.
// Modo de fallo: el silencio — que la oferta no salga o que guarde otro día u otra hora: el aviso
// de cada semana llegaría cuando el cliente no lo pide y dejaría de volver sin que nadie lo note.

const DIRECCION = { id: 1, label: 'Casa', address: 'Av. España 123, Trujillo', reference: null, lat: -8.1120, lon: -79.0290 };

async function pedirConCuenta(page: any, pedidosAntes: number) {
  // Miércoles 21 de octubre de 2026, 1:10 p.m. en Lima.
  await page.clock.setFixedTime(new Date('2026-10-21T18:10:00Z'));
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0, total_orders: pedidosAntes }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [DIRECCION] },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-f1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: { phone: '900000001', name: 'Prueba', points: 0, total_orders: pedidosAntes + 1 },
    }),
    'recurring-add': { success: true },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust && (window as any).myAddresses.length);
  // Sin pin: la app toma la dirección guardada (con su pin), como un cliente con cuenta.
  // Después de entrar se vuelve a la puerta (lo mismo que el «←» de la cuenta).
  await page.evaluate(() => { const w = window as any; w._mLat = null; w._mLon = null; w.volverALaPuerta(); });
  await elegirSando(page);
  await pedirUnSignature(page, { size: '15' });
  await pagarConYape(page);
  await page.locator('.m06').waitFor();
  return calls;
}

test('en el segundo pedido se ofrece dejarlo fijo el mismo día y hora, y se guarda con un toque', async ({ page }) => {
  const calls = await pedirConCuenta(page, 1);
  await page.locator('[data-accion="dejar-fijo"]').click();
  await expect.poll(() => calls.find((x) => x.action === 'recurring-add'), { timeout: 10000 }).toBeTruthy();
  const add = calls.find((x) => x.action === 'recurring-add')!;
  const po = calls.find((x) => x.action === 'place-order')!;
  expect(add.body.weekday, 'otro día de la semana').toBe(3);
  expect(add.body.slot, 'otra hora').toBe('13:00');
  expect(add.body.items.length).toBe(po.body.items.length);
  expect(add.body.items[0].sigId ?? add.body.items[0].code).toBe(po.body.items[0].sigId ?? po.body.items[0].code);
  await expect(page.locator('[data-accion="dejar-fijo"]'), 'la oferta sigue después de guardarlo').toHaveCount(0);
});

test('en el primer pedido no se ofrece el fijo', async ({ page }) => {
  await pedirConCuenta(page, 0);
  await expect(page.locator('[data-accion="dejar-fijo"]')).toHaveCount(0);
});
