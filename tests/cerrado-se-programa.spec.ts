import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// CON EL LOCAL CERRADO, EL PEDIDO SE PROGRAMA SOLO (dueño, 2026-10-02 a las 5 a.m.: «no me deja
// porque me pide programar pero no hay dónde programar o no me deriva a ese proceso»).
// Promesa: fuera de horario, el carrito queda programado para la primera hora libre y «Pagar»
// avanza. Modo de fallo: el silencio — un aviso en rojo que manda a buscar «Programar» y un
// «Llega 5:24 a.m.» falso; el cliente no encuentra cómo pagar y se va.
test('fuera de horario el carrito se programa para la primera hora libre y Pagar avanza', async ({ page }) => {
  // Viernes 2 de octubre de 2026, 5:00 a.m. en Lima (cerrado; abre a las 11).
  await page.clock.setFixedTime(new Date('2026-10-02T10:00:00Z'));
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0 }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [{ id: 1, label: 'Casa', address: 'Av Prolongación Cesar Vallejo 2670', reference: null, lat: -8.0912, lon: -79.0101 }] },
    // El horario real: 11 a 22 todos los días.
    'get-store-hours': { hours: Array.from({ length: 7 }, () => ({ open: 11, close: 22, closed: false })), businessLaunched: true },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust && (window as any).myAddresses.length);
  await page.evaluate(() => {
    const w = window as any;
    w._mLat = null; w._mLon = null;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, size: '15', qty: 1 }];
    w.initCheckoutFields();
    w.sndScreen = 'o_cart'; w.render();
  });
  const r = await page.evaluate(() => { const w = window as any; return { abierto: w.storeStatus().open, modo: w.scheduleMode, hora: w.schedSlot, problema: w.problemaDelPedido() }; });
  expect(r.abierto).toBe(false);
  expect(r.modo, 'no se programó solo').toBe('later');
  expect(r.hora).toBe('11:00');
  expect(r.problema).toBeNull();
  await page.locator('.m30-go .oro').click();
  await expect.poll(() => page.evaluate(() => (window as any).sndScreen)).toBe('o_pagar');
});

// EN PAUSA, EL PEDIDO SE PROGRAMA PARA CUANDO VUELVES (dueño, 2026-10-15: atiende desde su casa en
// home office y pausa la app en una reunión; «que se programe para cuando vuelva»). Promesa: con la
// pausa puesta, el carrito queda programado para la primera franja desde que termina y «Pagar»
// avanza. Modo de fallo: el silencio — antes la pausa rechazaba todo y el cliente se iba.
test('en pausa el carrito se programa para cuando termina la pausa y Pagar avanza', async ({ page }) => {
  // Martes 20 de octubre de 2026, 1:00 p.m. en Lima (abierto), en pausa hasta las 2:00 p.m.
  await page.clock.setFixedTime(new Date('2026-10-20T18:00:00Z'));
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0 }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [{ id: 1, label: 'Casa', address: 'Av Prolongación Cesar Vallejo 2670', reference: null, lat: -8.0912, lon: -79.0101 }] },
    'get-store-hours': { hours: Array.from({ length: 7 }, () => ({ open: 11, close: 22, closed: false })), businessLaunched: true, pausedUntil: '2026-10-20T19:00:00.000Z' },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust && (window as any).myAddresses.length);
  await page.evaluate(() => {
    const w = window as any;
    w._mLat = null; w._mLon = null;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, size: '15', qty: 1 }];
    w.initCheckoutFields();
    w.sndScreen = 'o_cart'; w.render();
  });
  await page.locator('.m30-go .oro').click();
  const r = await page.evaluate(() => { const w = window as any; return { modo: w.scheduleMode, hora: w.schedSlot, problema: w.problemaDelPedido() }; });
  expect(r.modo, 'no se programó solo').toBe('later');
  expect(r.hora, 'se programó dentro de la pausa').toBe('14:00');
  expect(r.problema).toBeNull();
  await expect.poll(() => page.evaluate(() => (window as any).sndScreen)).toBe('o_pagar');
});
