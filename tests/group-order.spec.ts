import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, APP_FILE } from './helpers';

// Pedido grupal: quien organiza necesita cuenta (crea/cierra), pero contribuir NO
// (solo un nombre) — dos flujos separados que valen la pena cubrir por separado.

test('alguien sin cuenta se une por link y agrega su pedido', async ({ page }) => {
  const calls = await mockBackend(page, {
    'get-group-order': { code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: false },
    'add-group-item': { success: true },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');
  await expect(page.locator('text=Organiza Ana Cliente')).toBeVisible();
  // Countdown de 15 min (ventana corta a propósito, ver GROUP_ORDER_WINDOW_MINUTES) —
  // el mock expira en 1h así que alcanza a mostrar minutos de sobra sin acercarse a 0.
  await expect(page.locator('text=CIERRA EN')).toBeVisible();

  await page.locator('#grp-name').fill('Beto');
  await page.getByRole('button', { name: 'AGREGAR' }).first().click();

  await expect(page.locator('text=¡Listo! Tu pedido se agregó.')).toBeVisible({ timeout: 10000 });

  const addCall = calls.find((c) => c.action === 'add-group-item');
  expect(addCall).toBeTruthy();
  expect(addCall!.body.code).toBe('ABC123');
  expect(addCall!.body.contributorName).toBe('Beto');
  expect(addCall!.body.item.type).toBe('sig');
  expect(addCall!.body.item.size).toBe('15');
  // Invitado sin cuenta manda token vacío — el servidor lo usa solo para distinguir si
  // quien agrega es quien organizó (y así no notificarle su propio pedido a sí mismo).
  expect(addCall!.body.token).toBe('');
});

test('el organizador también puede agregar su propio sándwich al pedido grupal', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'ABC123', expiresAt: new Date(Date.now() + 3600000).toISOString() },
    'get-group-order': { code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: true },
    'add-group-item': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  await expect(page.locator('text=Organiza Ana Cliente')).toBeVisible();

  // Antes esta sección (agregar mi pedido) solo aparecía para quien NO organizaba —
  // el organizador solo veía CERRAR Y PAGAR / CANCELAR y nunca podía sumar su propio
  // sándwich. El nombre viene pre-rellenado con el de su cuenta.
  await expect(page.locator('#grp-name')).toHaveValue('Ana Cliente');
  await expect(page.getByRole('button', { name: 'CERRAR Y PAGAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'AGREGAR' }).first().click();

  await expect(page.locator('text=¡Listo! Tu pedido se agregó.')).toBeVisible({ timeout: 10000 });

  const addCall = calls.find((c) => c.action === 'add-group-item');
  expect(addCall).toBeTruthy();
  expect(addCall!.body.contributorName).toBe('Ana Cliente');
});

test('organizador cierra el pedido grupal y paga todo junto con Yape/Plin', async ({ page }) => {
  const groupItems = [
    { type: 'sig', sigId: 'SIG01', size: '15', doubleProt: false, extraSauce: false, qty: 1 },
    { type: 'sig', sigId: 'SIG02', size: '15', doubleProt: false, extraSauce: false, qty: 1 },
  ];
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'ABC123', expiresAt: new Date(Date.now() + 3600000).toISOString() },
    'get-group-order': {
      code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(),
      items: [
        { id: '1', contributorName: 'Beto', label: 'THE ORIGINAL // SIGNATURE 15CM', qty: 1, unitPrice: 18 },
        { id: '2', contributorName: 'Caro', label: 'THE FIRE // BUILD 15CM', qty: 1, unitPrice: 19 },
      ],
      total: 37, isOrganizer: true,
    },
    'close-group-order': { success: true, items: groupItems },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  await expect(page.locator('text=Organiza Ana Cliente')).toBeVisible();
  await expect(page.locator('text=Beto')).toBeVisible();
  await expect(page.locator('text=Caro')).toBeVisible();

  await page.getByRole('button', { name: 'CERRAR Y PAGAR //' }).click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  // De aquí en adelante es el checkout normal — confirma que el carrito trae los 2 items
  // del grupo, no que reimplemente el pago (eso ya lo cubre checkout.spec.ts).
  await expect(page.locator('text=TU CARRITO')).toBeVisible();
  // S/42.80 de comida (SIG01 20.90 + SIG02 21.90, ambos 15CM) + delivery de zona 'media'.
  // Sin método de pago elegido todavía, el fee va engordado para tarjeta (8.47) → S/51.27.
  await expect(page.locator('text=S/51.27').first()).toBeVisible();

  await page.locator('#o-nom').fill('Ana Cliente');
  await page.locator('#o-phone').fill('900000001');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const closeCall = calls.find((c) => c.action === 'close-group-order');
  expect(closeCall).toBeTruthy();
  expect(closeCall!.body.code).toBe('ABC123');
  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall!.body.items).toHaveLength(2);
});

// Antes solo se podían agregar Signatures al pedido grupal (SIGS.filter en sGroupOrder) —
// quien solo quería sumar una bebida sin sándwich no tenía forma de hacerlo (hallazgo de
// auditoría UX). Cubre la nueva sección BEBIDAS Y SIDES // y doAddGroupSide().
test('alguien sin cuenta agrega solo una bebida al pedido grupal, sin sándwich', async ({ page }) => {
  const calls = await mockBackend(page, {
    'get-group-order': { code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: false },
    'add-group-item': { success: true },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');
  await expect(page.locator('text=BEBIDAS Y SIDES //')).toBeVisible();

  await page.locator('#grp-name').fill('Beto');
  await page.getByRole('button', { name: 'AGREGAR' }).last().click();

  await expect(page.locator('text=¡Listo! Tu bebida se agregó.')).toBeVisible({ timeout: 10000 });

  const addCall = calls.find((c) => c.action === 'add-group-item');
  expect(addCall).toBeTruthy();
  expect(addCall!.body.code).toBe('ABC123');
  expect(addCall!.body.contributorName).toBe('Beto');
  expect(addCall!.body.item.type).toBe('side');
  expect(addCall!.body.item.code).toBeTruthy();
});
