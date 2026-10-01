import { test, expect } from '@playwright/test';
import { gotoApp, irAlArmador } from './helpers';

// «Y ADEMÁS» EN LOS DOS MUNDOS (maqueta aprobada 2026-10-01).
//
// Promesas, con su modo de fallo silencioso:
//   · el Libro de Reclamaciones se alcanza desde los dos mundos (es obligatorio por ley; si el
//     enlace se pierde no revienta nada: simplemente deja de estar);
//   · «Tus favoritos» abre la pantalla que los lista (antes se guardaban y nadie podía verlos).
// Se busca por data-accion y por la pantalla a la que se llega, no por textos.

const pantalla = (page: any) => page.evaluate(() => (window as any).sndScreen);

test('desde la última carta de SANDO se llega al Libro de Reclamaciones', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(() => { const w = window as any; w.sandoEnPlatos = false; w.render(); });
  const idx = await page.locator('[data-accion="carta-y-ademas"]').getAttribute('data-plato');
  await page.evaluate((i) => (window as any).abrirPlato(Number(i)), idx);
  await page.locator('.plato.yademas [data-accion="libro-de-reclamaciones"]').click();
  await expect.poll(() => pantalla(page)).toBe('p_complaints');
});

test('desde la hoja de WICHO se llega al Libro y a Tus favoritos', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(() => { (window as any).cust = { phone: '900000001', name: 'Ana', points: 0 }; });
  await irAlArmador(page);
  await page.locator('[data-accion="abrir-y-ademas"]').click();
  await page.locator('.ya-hoja [data-accion="y-ademas-favoritos"]').click();
  await expect.poll(() => pantalla(page)).toBe('p_favs');
  await page.evaluate(() => { const w = window as any; w.sndScreen = 'o_build'; w.render(); });
  await page.locator('[data-accion="abrir-y-ademas"]').click();
  await page.locator('.ya-hoja [data-accion="libro-de-reclamaciones"]').click();
  await expect.poll(() => pantalla(page)).toBe('p_complaints');
});
