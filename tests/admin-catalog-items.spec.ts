import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';
import { signaturesDeLaCarta } from '../supabase/functions/_shared/carta.ts';

// PANEL DE SIGNATURES (2026-08-27) — la contraparte de escritura de `catalog_items`.
// Cubre el flujo que hace que B valga la pena: abrir el panel, cambiar el nombre de un
// Signature y publicarlo, sin tocar código ni desplegar.
//
// Lo que de verdad se verifica es el PAYLOAD que sale hacia el servidor: que lleve el
// itemId correcto, el nombre nuevo, la receta completa y el flag `active`. Si eso viaja
// mal, el panel diría "publicado" y la carta no cambiaría — el fallo silencioso que este
// proyecto ya sufrió con los precios.

// La fila que devuelve la base, armada con el primer Signature de la carta vigente: el panel
// abre ese, y la prueba no depende de qué sándwich haya este mes.
const SIG = signaturesDeLaCarta()[0]!;
const FILA = {
  id: 1, item_id: SIG.id, name: SIG.nombre, subtitle: SIG.tipo, badge: '',
  pitch: 'Pitch de prueba.', base: SIG.pan, protein_id: SIG.prot,
  tops: [...SIG.vegetales], sauces: [...SIG.salsas],
  price_15: SIG.p15, price_30: SIG.p30, fixed_cheese: SIG.queso ?? null, cheese_optional: false,
  image_path: SIG.foto ?? null, active: true, created_at: new Date().toISOString(),
};
const RENOMBRADO = `${FILA.name} renombrado`;

const MOCK_ORDER = {
  id: 'ord-ci-1', ref: 'ORD-CI000001-AAAA', customer_name: 'Cliente', customer_address: 'Av. Test 1',
  contact_phone: '987654321', summary: '1x SIGNATURE', total: 22, status: 'RECIBIDO',
  payment_status: 'paid', payment_method: 'culqi', created_at: new Date().toISOString(),
};

test('el admin renombra un Signature y lo publica desde el panel', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-catalog-items-get': { current: { [FILA.item_id]: FILA }, history: [] },
    'admin-catalog-items-set': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000000', '1234');
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });

  await page.locator('[onclick*="loadCatalogItemsAdmin"]').first().click();
  await expect(page.locator('#ci-name')).toHaveValue(FILA.name);

  await page.locator('#ci-name').fill(RENOMBRADO);
  await page.getByRole('button', { name: 'PUBLICAR CAMBIOS //' }).click();

  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-catalog-items-set').length)
    .toBeGreaterThan(0);
  const set = calls.find((c) => c.action === 'admin-catalog-items-set')!;
  expect(set.body.itemId).toBe(FILA.item_id);
  expect(set.body.name).toBe(RENOMBRADO);
  // La receta viaja completa aunque no se haya tocado: publicar es insertar una fila
  // nueva ENTERA (append-only), no un parche de los campos editados. Si solo viajara el
  // nombre, la fila nueva quedaría sin receta y el sándwich dejaría de poder tasarse.
  expect(set.body.base).toBe(FILA.base);
  expect(set.body.proteinId).toBe(FILA.protein_id);
  expect(set.body.tops).toEqual(FILA.tops);
  expect(set.body.sauces).toEqual(FILA.sauces);
  expect(set.body.price15).toBe(FILA.price_15);
  expect(set.body.price30).toBe(FILA.price_30);
  expect(set.body.active).toBe(true);
});

test('apagar Activo viaja como active:false para retirar el Signature de la carta', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-catalog-items-get': { current: { [FILA.item_id]: FILA }, history: [] },
    'admin-catalog-items-set': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000000', '1234');
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });

  await page.locator('[onclick*="loadCatalogItemsAdmin"]').first().click();
  await expect(page.locator('#ci-name')).toHaveValue(FILA.name);

  // Retirar un Signature es apagar este toggle — lo que con un Signature retirado costó una sesión
  // de código entera.
  await page.locator('[onclick*="ciActive=!ciActive"]').click();
  await page.getByRole('button', { name: 'PUBLICAR CAMBIOS //' }).click();

  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-catalog-items-set').length)
    .toBeGreaterThan(0);
  expect(calls.find((c) => c.action === 'admin-catalog-items-set')!.body.active).toBe(false);
});
