import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// «ABRO CON N PORCIONES» (dueño, 2026-10-02: «4 al máximo, aprobado»).
// Promesa: lo que el dueño cuenta al abrir llega al servidor tal cual, una llamada por
// proteína que CAMBIA, y lo que deja vacío no se toca. Desde ahí el servidor descuenta y agota.
// Modo de fallo: dinero en silencio — si el número no llega, se venden porciones que no hay y
// el pedido se cancela con el cliente esperando (devolución, cliente perdido).
test('las porciones contadas al abrir llegan al servidor, una por proteína, y lo vacío no se toca', async ({ page }) => {
  const stock: any[] = [];
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Dueño', points: 0 }, isAdmin: true, token: 't' },
    'admin-orders': { orders: [], truncated: false },
    'admin-batch-plan': { reliable: false, items: [] },
    'admin-inventory-set-stock': (b: any) => { stock.push(b); return { success: true }; },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { try { localStorage.removeItem('sw_abro_con'); } catch (e) {} (window as any).loadAdmin(); });
  await page.waitForFunction(() => typeof (window as any).abrirCocina === 'function');
  const prots = await page.evaluate(() => { const w = window as any; w.invQty = {}; w.abrirCocina(); return w.proteinasParaContar().map((p: any) => p.id); });
  await page.locator('[data-accion="abro-con"]').click();
  await page.locator(`#abro-${prots[0]}`).fill('12');
  await page.locator(`#abro-${prots[1]}`).fill('0');
  await page.locator('[data-accion="abro-guardar"]').click();
  await expect.poll(() => stock.length).toBe(2);
  expect(stock.map((b) => [b.code, b.qty])).toEqual([[prots[0], 12], [prots[1], 0]]);
  // Hecho por hoy: el aviso ya no aparece.
  await expect(page.locator('[data-accion="abro-con"]')).toHaveCount(0);
  expect(await page.evaluate((id) => (window as any).quedanHoy(id), prots[0])).toBeNull();
  expect(await page.evaluate((id) => (window as any).invStock[id], prots[1])).toBe(false);
});
