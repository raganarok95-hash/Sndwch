import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// 29 · TUS PUNTOS (maqueta aprobada 29-tus-puntos.png). Modo de fallo: SILENCIO — una meta que
// no cuadra con la carta, o una cuenta en pedidos que no sale de los puntos reales.
async function aLosPuntos(page: any, points: number) {
  await gotoApp(page, { 'my-orders': { orders: [] }, 'addresses-list': { addresses: [] }, 'my-history': { transactions: [] } });
  await page.evaluate((p: number) => { const w = window as any; w.cust = { id: 'c1', name: 'Ana', phone: '900000001', points: p, total_orders: 2 }; w.token = 'tok'; w.volverALaPuerta(); }, points);
  await page.locator('.pta .yo').click();
  await page.locator('.mcu .cifras button', { hasText: 'Puntos' }).click();
  await page.locator('.mpt').waitFor();
}
const carta = (page: any) => page.evaluate(() => {
  const w = window as any;
  const est = w.SIGS.filter((s: any) => s.estrella)[0] || w.SIGS[0];
  return { rw: w.RWDS.slice().sort((a: any, b: any) => a.pts - b.pts), ppp: Math.round(est.p15) };
});

test('la meta es la recompensa más grande que falta, y lo que falta se cuenta en pedidos', async ({ page }) => {
  const pts = 10;
  await aLosPuntos(page, pts);
  const { rw, ppp } = await carta(page);
  const meta = rw[rw.length - 1];
  await expect(page.locator('.mpt h1')).toContainText(await page.evaluate((r: any) => (window as any).metaEnPalabras(r), meta));
  await expect(page.locator('.mpt .dice .pts')).toContainText(`te faltan ${meta.pts - pts}`);
  const n = Math.ceil((meta.pts - pts) / ppp);
  // Faltan más de 7 pedidos: no se dibujan marcas, basta la frase.
  if (n > 7) await expect(page.locator('.mpt .marcas')).toHaveCount(0);
  await expect(page.locator('.mpt .frase')).toContainText(n <= 1 ? 'Un pedido más' : 'pedidos más');
  await expect(page.locator('.mpt .go')).toHaveText(/Pedir y sumar/i);
});

test('lo que ya alcanza dice «ya la tienes» y el botón invita a canjear', async ({ page }) => {
  await aLosPuntos(page, 170);
  const { rw } = await carta(page);
  const alcanzables = rw.filter((r: any) => r.pts <= 170);
  expect(alcanzables.length).toBeGreaterThan(0);
  await expect(page.locator('.mpt .otras .g.ya')).toHaveCount(alcanzables.length);
  await expect(page.locator('.mpt .go')).toHaveText(/Canjear algo ahora/i);
  await page.locator('.mpt .go').click();
  await expect(page.locator('.mpt')).toHaveCount(0);
});

test('«de dónde salió cada punto» abre el historial y se vuelve', async ({ page }) => {
  await aLosPuntos(page, 20);
  await page.locator('.mpt .hist').click();
  await expect(page.locator('.mph')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  await page.locator('.mph .sal').click();
  await expect(page.locator('.mpt .hist')).toBeVisible();
});

test('en el tramo final, las marcas cuentan los pedidos que faltan', async ({ page }) => {
  await gotoApp(page, {});
  const { rw, ppp } = await carta(page);
  const meta = rw[rw.length - 1];
  const pts = meta.pts - 3 * ppp;
  await aLosPuntos(page, pts);
  const hechos = Math.min(Math.floor(pts / ppp), 8 - 3);
  await expect(page.locator('.mpt .marcas')).toHaveAttribute('aria-label', `${hechos} de ${hechos + 3} pedidos`);
  await expect(page.locator('.mpt .marcas i.ok')).toHaveCount(hechos);
  await expect(page.locator('.mpt .frase')).toContainText('tres pedidos más');
});
