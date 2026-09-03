import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, APP_FILE } from './helpers';

// INCENTIVO AL ORGANIZADOR (2026-08-22). Quien junta un pedido grupal de 5 o más
// sándwiches se lleva gratis el 15CM más barato del grupo. Es el motor del canal de
// oficinas: el dueño no puede vender puerta a puerta porque sus mañanas están cocinando,
// así que el que vende es el propio cliente que insiste a un compañero más.
//
// Estos tests cubren el lado del CLIENTE (lo que se muestra y el total que se manda).
// Quien de verdad decide si el descuento corresponde es el servidor, que lo verifica
// contra la base (organizerFreeSandwichApplies): que el código exista, que quien paga sea
// quien organizó, que haya 5+ sándwiches y que ese grupo no se haya cobrado ya. Nada de
// eso se puede ejercer acá porque el backend está mockeado — pero el total que el cliente
// manda SÍ tiene que coincidir con el que el servidor va a recalcular, y eso es
// exactamente lo que se verifica abajo.

const enOchoMinutos = () => new Date(Date.now() + 3600000).toISOString();

// 5 sándwiches: cuatro THE ORIGINAL 15CM (S/20.90) y uno THE TERIYAKI 15CM (S/19.90),
// que es el más barato y por lo tanto el que debe salir gratis.
const CINCO_SANDWICHES = [
  { id: 1, contributorName: 'Ana', label: 'THE ORIGINAL // 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  { id: 2, contributorName: 'Beto', label: 'THE ORIGINAL // 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  { id: 3, contributorName: 'Caro', label: 'THE ORIGINAL // 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  { id: 4, contributorName: 'Dani', label: 'THE ORIGINAL // 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  { id: 5, contributorName: 'Eli', label: 'THE TERIYAKI // 15CM', qty: 1, unitPrice: 19.9, isSandwich: true },
];

const ITEMS_CARRITO = [
  { type: 'sig', sigId: 'SIG01', size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false },
  { type: 'sig', sigId: 'SIG01', size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false },
  { type: 'sig', sigId: 'SIG01', size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false },
  { type: 'sig', sigId: 'SIG01', size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false },
  { type: 'sig', sigId: 'SIG06', size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false },
];

test('el grupo muestra cuántos sándwiches faltan para que uno vaya gratis', async ({ page }) => {
  // 3 de 5: todavía falta. El aviso es lo que le da al organizador una razón concreta
  // para insistirle a un compañero más — sin él, el incentivo existe pero nadie lo sabe.
  await mockBackend(page, {
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES.slice(0, 3), total: 62.7, isOrganizer: false,
      sandwichQty: 3, organizerFreeAt: 5,
    },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=OFI001');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await expect(page.locator('text=Faltan 2 sándwiches para que uno vaya gratis')).toBeVisible();
});

test('al llegar a 5 sándwiches el grupo anuncia que uno va gratis', async ({ page }) => {
  await mockBackend(page, {
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES, total: 103.5, isOrganizer: false,
      sandwichQty: 5, organizerFreeAt: 5,
    },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=OFI001');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await expect(page.locator('text=¡Un sándwich va gratis!')).toBeVisible();
  await expect(page.locator('text=Faltan')).not.toBeVisible();
});

test('el organizador cierra un grupo de 5 y el total descuenta el 15CM más barato', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'OFI001', expiresAt: enOchoMinutos() },
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES, total: 103.5, isOrganizer: true,
      sandwichQty: 5, organizerFreeAt: 5,
    },
    'close-group-order': { success: true, items: ITEMS_CARRITO },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-ofi', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });
  // Fuera de la ventana 3pm-6pm de "bebida gratis hora valle": este carrito no tiene
  // bebidas, así que la promo no aplicaría igual, pero fijar la hora deja el test
  // determinista sin importar cuándo corra.
  await page.clock.setFixedTime(new Date('2026-01-15T15:00:00Z'));

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  await expect(page.locator('text=¡Un sándwich va gratis!')).toBeVisible();

  await page.getByRole('button', { name: 'CERRAR Y PAGAR //' }).click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=TU CARRITO')).toBeVisible();
  // 4 × SIG01 (20.90) + 1 × SIG06 (19.90) = S/103.50 de comida.
  // El 15CM más barato del carrito es SIG06 (19.90) y va gratis → S/83.60.
  await expect(page.locator('text=sándwich del organizador: ahorras S/19.90')).toBeVisible();

  await page.locator('#o-nom').fill('Ana Cliente');
  await page.locator('#o-phone').fill('900000001');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrder = calls.find((c) => c.action === 'place-order');
  expect(placeOrder).toBeTruthy();
  // 83.60 de comida + delivery de zona 'media' (S/8, sin engordar porque paga con
  // Yape/Plin) = S/91.60. Si el descuento del organizador no se hubiera aplicado el
  // total sería S/111.50 y el servidor rechazaría el pedido por no coincidir.
  expect(placeOrder!.body.total).toBe(91.6);
  // El código del grupo viaja con el pedido: es lo que le permite al servidor verificar
  // el descuento contra la base y, además, medir el canal de oficinas.
  expect(placeOrder!.body.groupCode).toBe('OFI001');
});

test('un grupo de 4 sándwiches todavía no descuenta nada', async ({ page }) => {
  // El umbral tiene que morder de verdad: si el descuento se aplicara con 4, el
  // incentivo dejaría de empujar hacia el quinto sándwich, que es todo su propósito.
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'OFI002', expiresAt: enOchoMinutos() },
    'get-group-order': {
      code: 'OFI002', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES.slice(0, 4), total: 83.6, isOrganizer: true,
      sandwichQty: 4, organizerFreeAt: 5,
    },
    'close-group-order': { success: true, items: ITEMS_CARRITO.slice(0, 4) },
  });
  await page.clock.setFixedTime(new Date('2026-01-15T15:00:00Z'));

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  await expect(page.locator('text=Faltan 1 sándwich para que uno vaya gratis')).toBeVisible();

  await page.getByRole('button', { name: 'CERRAR Y PAGAR //' }).click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=TU CARRITO')).toBeVisible();
  await expect(page.locator('text=sándwich del organizador')).not.toBeVisible();
  // 4 × SIG01 (20.90) = S/83.60 de comida, sin ningún descuento, más S/8 de delivery →
  // S/91.60. Con el descuento indebido serían S/70.70.
  // Era S/92.07 hasta el 2026-09-03, cuando el fee iba engordado para tarjeta
  // (8/(1-0.055)=8.47) porque el método por defecto era la tarjeta. Hoy el default es
  // Yape/Plin, que no paga comisión (ver tests/yape-por-defecto.spec.ts).
  await expect(page.locator('text=S/91.60').first()).toBeVisible();
  expect(calls.length).toBeGreaterThan(0);
});
