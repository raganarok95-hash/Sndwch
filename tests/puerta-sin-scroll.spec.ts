import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA PUERTA NO SE DESPLAZA (dueño, 2026-10-01, captura de Chrome Android: «se puede subir en la
// página de puerta y se ve verde abajo»). La puerta mide 100dvh; si algo que la envuelve mide
// 100vh, en Chrome Android sobra el alto de la barra de URL (~56px) y asoma el fondo verde.
// Playwright no tiene barra de URL (ahí vh == dvh), así que se prueban las dos cosas que sí se
// ven: ningún contenedor de la puerta se queda en vh a secas, y la página no es más alta que
// la pantalla.
test('ningún contenedor de la puerta usa 100vh sin 100dvh, y no hay nada que desplazar', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 780 });
  await gotoApp(page, {});
  await page.evaluate(() => (window as any).volverALaPuerta());
  await page.locator('.pta').waitFor();
  const malos = await page.evaluate(() => {
    const out: string[] = [];
    let e: HTMLElement | null = document.querySelector('.pta');
    while (e && e !== document.documentElement) {
      const mh = e.style.minHeight || '';
      if (/\dvh$/.test(mh) && !/dvh$/.test(mh)) out.push((e.id || e.className || e.tagName) + ' → min-height:' + mh);
      e = e.parentElement;
    }
    return out;
  });
  expect(malos, 'un contenedor mide 100vh y en Android deja ver una franja bajo la puerta').toEqual([]);
  const sobra = await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight);
  expect(sobra).toBeLessThanOrEqual(0);
});
