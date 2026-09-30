import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';
import { unSignature } from './carta';

// TUS PEDIDOS · LOS SELLOS (maqueta aprobada tus-pedidos-los-sellos.png). Modo de fallo:
// SILENCIO — «Pedir lo mismo» que no carga nada, un sello que no abre su pedido, o cifras
// escritas en vez de contadas («14 veces», «los jueves») que mienten con otros datos.
const SIG = unSignature();
const JUEVES = ['2026-09-17T19:00:00-05:00', '2026-09-10T19:00:00-05:00', '2026-09-03T19:00:00-05:00'];
const pedido = (i: number, fecha: string, status = 'ENTREGADO') => ({
  id: 'o' + i, ref: 'SW-' + i, created_at: fecha, total: 30, status, summary: '1x Un Signature 15CM',
  items: [{ type: 'sig', sigId: SIG, size: '15', qty: 1, doubleProt: false, extraSauce: false, cheese: null }],
});
const PEDIDOS = [pedido(1, JUEVES[0]), pedido(2, JUEVES[1]), pedido(3, '2026-09-05T13:00:00-05:00'), pedido(4, JUEVES[2]), pedido(5, '2026-08-20T19:00:00-05:00', 'CANCELADO')];

async function aTusPedidos(page: any) {
  await gotoApp(page, { 'my-orders': { orders: PEDIDOS } });
  await page.evaluate(() => { const w = window as any; w.cust = { name: 'Ana', points: 0, total_orders: 4 }; w.token = 'tok'; w.loadMyOrders(); });
  await page.locator('.msl .sellos').waitFor();
}

test('un sello por pedido, las veces contadas sin los cancelados, y el día que se repite', async ({ page }) => {
  await aTusPedidos(page);
  await expect(page.locator('.msl .sello')).toHaveCount(5);
  await expect(page.locator('.msl .veces')).toContainText('4 veces');
  await expect(page.locator('.msl .pie')).toContainText('Los jueves son 3 de los 4');
});

test('«Pedir lo mismo» carga el último pedido en el carrito', async ({ page }) => {
  await aTusPedidos(page);
  await page.locator('.msl .repetir').click();
  await page.locator('.m30').waitFor();
  expect(await page.evaluate(() => (window as any).cart.map((x: any) => x.sigId))).toEqual([SIG]);
});

test('tocar un sello abre ese pedido', async ({ page }) => {
  await aTusPedidos(page);
  await page.locator('.msl .sello').nth(2).click();
  expect(await page.evaluate(() => [(window as any).sndScreen, (window as any)._sndOd])).toEqual(['p_ord_detail', 'o3']);
});

test('sin pedidos, el estado vacío invita a pedir', async ({ page }) => {
  await gotoApp(page, { 'my-orders': { orders: [] } });
  await page.evaluate(() => { const w = window as any; w.cust = { name: 'Ana', points: 0 }; w.token = 'tok'; w.loadMyOrders(); });
  await expect(page.getByRole('button', { name: 'Pedir ahora' })).toBeVisible();
});
