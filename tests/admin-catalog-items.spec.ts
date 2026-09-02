import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// PANEL DE SIGNATURES (2026-08-27) — la contraparte de escritura de `catalog_items`.
// Cubre el flujo que hace que B valga la pena: abrir el panel, cambiar el nombre de un
// Signature y publicarlo, sin tocar código ni desplegar.
//
// Lo que de verdad se verifica es el PAYLOAD que sale hacia el servidor: que lleve el
// itemId correcto, el nombre nuevo, la receta completa y el flag `active`. Si eso viaja
// mal, el panel diría "publicado" y la carta no cambiaría — el fallo silencioso que este
// proyecto ya sufrió con los precios.

const FILA_SIG01 = {
  id: 1, item_id: 'SIG01', name: 'The Original', subtitle: 'Signature', badge: 'Clásico',
  pitch: 'Pitch original.', base: 'B01', protein_id: 'P01',
  tops: ['T01', 'T02', 'T03'], sauces: ['S01', 'S04'],
  price_15: 20.9, price_30: 26.9, fixed_cheese: null, cheese_optional: false,
  image_path: 'img/sig01.jpg', active: true, created_at: new Date().toISOString(),
};

const MOCK_ORDER = {
  id: 'ord-ci-1', ref: 'ORD-CI000001-AAAA', customer_name: 'Cliente', customer_address: 'Av. Test 1',
  contact_phone: '987654321', summary: '1x SIGNATURE', total: 22, status: 'RECIBIDO',
  payment_status: 'paid', payment_method: 'culqi', created_at: new Date().toISOString(),
};

test('el admin renombra un Signature y lo publica desde el panel', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-catalog-items-get': { current: { SIG01: FILA_SIG01 }, history: [] },
    'admin-catalog-items-set': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });

  await page.locator('[onclick*="loadCatalogItemsAdmin"]').first().click();
  await expect(page.locator('#ci-name')).toHaveValue('The Original');

  await page.locator('#ci-name').fill('The Original Renombrado');
  await page.getByRole('button', { name: 'PUBLICAR CAMBIOS //' }).click();

  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-catalog-items-set').length)
    .toBeGreaterThan(0);
  const set = calls.find((c) => c.action === 'admin-catalog-items-set')!;
  expect(set.body.itemId).toBe('SIG01');
  expect(set.body.name).toBe('The Original Renombrado');
  // La receta viaja completa aunque no se haya tocado: publicar es insertar una fila
  // nueva ENTERA (append-only), no un parche de los campos editados. Si solo viajara el
  // nombre, la fila nueva quedaría sin receta y el sándwich dejaría de poder tasarse.
  expect(set.body.base).toBe('B01');
  expect(set.body.proteinId).toBe('P01');
  expect(set.body.tops).toEqual(['T01', 'T02', 'T03']);
  expect(set.body.sauces).toEqual(['S01', 'S04']);
  expect(set.body.price15).toBe(20.9);
  expect(set.body.price30).toBe(26.9);
  expect(set.body.active).toBe(true);
});

test('apagar Activo viaja como active:false para retirar el Signature de la carta', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-catalog-items-get': { current: { SIG01: FILA_SIG01 }, history: [] },
    'admin-catalog-items-set': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });

  await page.locator('[onclick*="loadCatalogItemsAdmin"]').first().click();
  await expect(page.locator('#ci-name')).toHaveValue('The Original');

  // Retirar un Signature es apagar este toggle — lo que con THE CHICAGO costó una sesión
  // de código entera.
  await page.locator('[onclick*="ciActive=!ciActive"]').click();
  await page.getByRole('button', { name: 'PUBLICAR CAMBIOS //' }).click();

  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-catalog-items-set').length)
    .toBeGreaterThan(0);
  expect(calls.find((c) => c.action === 'admin-catalog-items-set')!.body.active).toBe(false);
});
