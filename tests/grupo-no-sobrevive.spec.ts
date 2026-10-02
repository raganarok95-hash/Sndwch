import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// UN CARRITO VACIADO NO ARRASTRA EL CÓDIGO DEL GRUPO (2026-10-02).
// Promesa: quitar la última línea olvida el groupCode, el pedido fijo y la hora apartada.
// Modo de fallo: dinero en silencio — el organizador que no pagó el grupo arma OTRO pedido de 5
// y el groupCode sigue viajando: el servidor regala el 15CM del grupo en un pedido ajeno.
test('quitar la última línea del carrito olvida el código del grupo', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(() => {
    const w = window as any;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, sigId: w.SIGS[0].id, size: '15', qty: 1 }];
    w.pendingGroupCode = 'GRP999';
    w.hoja30 = 'linea'; w.hojaLinea = 0;
    w.sndScreen = 'o_cart'; w.render();
  });
  await page.locator('[data-accion="quitar-linea"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).cart.length)).toBe(0);
  expect(await page.evaluate(() => (window as any).pendingGroupCode)).toBeNull();
});
