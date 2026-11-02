import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature, ponerRecibe, ponerDireccion } from './helpers';

// EL «ATRÁS» DEL CELULAR SE QUEDA EN LA APP (dueño, 2026-11-02: «Sí, arregla todo»).
// Promesa: el botón atrás del teléfono hace lo mismo que el ← de la pantalla: cierra lo que está
// abierto o vuelve un paso, sin sacar al cliente de la app a mitad de su pedido.
// Modo de fallo: silencioso y caro — el cliente toca atrás, la app desaparece y el pedido se pierde.

test('atrás desde el carrito vuelve a la carta, no sale de la app', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await pedirUnSignature(page);
  await page.goBack();
  await expect(page.locator('.m15')).toBeVisible();
  expect(page.url()).toContain('index.html');
  // Y el carrito sigue lleno.
  expect(await page.evaluate(() => (window as any).cart.length)).toBe(1);
});

test('atrás desde Pagar vuelve al pedido, y otra vez atrás a la carta', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await pedirUnSignature(page);
  await ponerDireccion(page);
  await ponerRecibe(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31').waitFor();
  await page.goBack();
  await expect(page.locator('.m30')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.m15')).toBeVisible();
});

test('atrás con un diálogo abierto lo cancela, sin confirmar nada', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  const r = page.evaluate(() => (window as any).showConfirm('¿Seguro?'));
  await page.locator('.ov-barra .no').waitFor();
  await page.goBack();
  expect(await r).toBe(false);
  await expect(page.locator('.m15')).toBeVisible();
});

test('atrás desde la carta vuelve paso a paso hasta la puerta', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  for (let i = 0; i < 3 && !(await page.locator('.pta').isVisible()); i++) await page.goBack();
  await expect(page.locator('.pta')).toBeVisible();
});

// El caso del dueño: con la ventana de Culqi abierta, atrás la cierra y deja pagar de nuevo.
test('atrás con la ventana de Culqi abierta la cierra y no sale de Pagar', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w._cerradas = 0;
    w.Culqi = { settings() {}, options() {},
      open() { const f = document.createElement('iframe'); f.src = 'about:blank#culqi'; f.id = 'culqi-falso'; f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9999'; document.body.appendChild(f); },
      close() { w._cerradas++; document.getElementById('culqi-falso')?.remove(); } };
  });
  await gotoApp(page, { 'prepare-order': () => ({ success: true }), '*': { success: true } });
  await pedirUnSignature(page);
  await ponerDireccion(page);
  await ponerRecibe(page);
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31').waitFor();
  await page.evaluate(() => { const w = window as any; w.selectPayMethod('culqi'); w.render(); });
  await page.locator('.m31.t').waitFor();
  await page.locator('.m30-go .oro').click();
  await page.locator('#culqi-falso').waitFor();
  const antes = await page.evaluate(() => (window as any)._cerradas);
  await page.goBack();
  await expect(page.locator('#culqi-falso')).toHaveCount(0);
  await expect(page.locator('.m31.t')).toBeVisible();
  expect(await page.evaluate(() => (window as any)._cerradas)).toBeGreaterThan(antes);
  expect(await page.evaluate(() => (window as any)._payingInProgress)).toBe(false);
});
