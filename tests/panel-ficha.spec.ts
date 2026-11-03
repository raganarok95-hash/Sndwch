import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA FICHA DE UN PRODUCTO SE GUARDA SOLA (dueño, 2026-11-03: eligió «B con los avisos de C»).
//
// Promesa: en Carta, cambiar un precio de la ficha manda AL SERVIDOR los cuatro precios de la
// proteína (15CM, 30CM y los dos dobles), y tocar «+» deja guardado cuántos quedan.
// Modo de fallo: silencio. El servidor reemplaza los valores de la categoría: si la ficha
// mandara solo el campo cambiado, los otros precios quedarían vacíos o en cero y el cliente
// pagaría otra cosa sin que nadie lo note. Y un «+» que no llega al servidor deja la app
// vendiendo una proteína que ya se acabó.

async function abrirLaFichaDeUnaProteina(page: any) {
  const calls = await gotoApp(page, {
    'admin-catalog-set-price': { success: true },
    'admin-inventory-set-stock': { success: true },
    'admin-health': { signals: [] },
  });
  await page.evaluate(() => (window as any).loadAdminBundle());
  await page.waitForFunction(() => typeof (window as any).ADMIN_SCREENS?.admin_carta === 'function');
  const prot = await page.evaluate(() => {
    const w = window as any;
    w.isAdmin = true;
    w.token = 'tok-admin';
    w.sndScreen = 'admin_home';
    w.render();
    const p = w.PROTS[0];
    return { id: p.id, p15: p.p15, p30: p.p30, pDbl: p.pDbl, pDbl30: p.pDbl30 };
  });
  await page.locator('[data-accion="abrir-carta"]').click();
  await page.locator(`[data-ficha="${prot.id}"]`).click();
  return { calls, prot };
}

test('cambiar un precio en la ficha guarda los cuatro precios de la proteína', async ({ page }) => {
  const { calls, prot } = await abrirLaFichaDeUnaProteina(page);
  await page.locator('#fi-p15').fill('21.5');
  await page.locator('#fi-p15').dispatchEvent('change');
  await expect.poll(() => calls.filter((c) => c.action === 'admin-catalog-set-price').length).toBe(1);
  const enviada = calls.find((c) => c.action === 'admin-catalog-set-price')!.body;
  expect(enviada.code).toBe(prot.id);
  expect(enviada.category).toBe('protein');
  expect(enviada.values).toEqual({ p15: 21.5, p30: prot.p30, pDbl: prot.pDbl, pDbl30: prot.pDbl30 });
});

test('tocar «+» deja guardado cuántos quedan', async ({ page }) => {
  const { calls, prot } = await abrirLaFichaDeUnaProteina(page);
  await page.locator('[data-accion="mas"]').click();
  await page.locator('[data-accion="mas"]').click();
  await expect.poll(() => calls.filter((c) => c.action === 'admin-inventory-set-stock').length).toBe(1);
  const enviada = calls.find((c) => c.action === 'admin-inventory-set-stock')!.body;
  expect(enviada.code).toBe(prot.id);
  expect(enviada.qty).toBe(2);
});
