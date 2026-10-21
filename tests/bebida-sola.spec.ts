import { test, expect, type Page } from '@playwright/test';
import { gotoApp, pedirUnSignature } from './helpers';
import { unaBebida } from './carta';

const BEBIDA = unaBebida();

// SIN SÁNDWICH, LAS BEBIDAS SE PIDEN DESDE 2 (dueño, 2026-10-21: «si es sin sándwich, se venden a
// partir de dos latas»). Del 2026-09-30 a esa fecha no se vendían solas. El mínimo vive en
// `BEBIDAS_SIN_SANDWICH_DESDE` (_shared/reglas.ts) y el servidor lo exige igual
// (assertSandwichOBebidas en orders.ts, probado en tests-api/solo-bebidas.test.ts).
//
// Modo de fallo: silencio en los dos sentidos. Si el aviso desaparece, un pedido de una sola lata
// llega al servidor y rebota ahí, al final; si el aviso salta con el mínimo cumplido, se pierde la
// venta de bebidas solas sin que nadie lo note.
//
// Busca por función: el aviso se compara con FALTA_SANDWICH del propio código, no con el texto.

const MIN = (page: Page) => page.evaluate(() => (window as any).BEBIDAS_SIN_SANDWICH_DESDE as number);

async function bebidasSolas(page: Page, n: number) {
  // La entrada directa a las bebidas: a la pantalla de bebidas, sin armar nada.
  await page.evaluate(() => (window as any).irABebidas('o_home'));
  for (let i = 0; i < n; i++) await page.evaluate((id) => (window as any).addSideToCart(id), BEBIDA);
  await page.evaluate(() => (window as any).go('o_cart'));
  await page.locator('.m30').waitFor();
}

// El aviso sale en el renglón de error del carrito o, si no está, en el toast.
const avisoDeBebidas = (page: Page) => page.evaluate(() => {
  const w = window as any;
  const visto = document.getElementById('o-err')?.textContent || w.toastMsg || '';
  return visto === w.FALTA_SANDWICH;
});

test('sin sándwich y con menos bebidas que el mínimo, no se llega a pagar', async ({ page }) => {
  const calls = await gotoApp(page, {});
  await bebidasSolas(page, (await MIN(page)) - 1);
  await page.locator('.m30-go .oro').click();
  // Se queda en la 30G con el aviso: ni la 34 (dirección) ni la hoja de datos, ni un pedido.
  await expect.poll(() => avisoDeBebidas(page)).toBe(true);
  await expect(page.locator('.m34')).toHaveCount(0);
  await expect(page.locator('.m31')).toHaveCount(0);
  expect(calls.find((c) => c.action === 'place-order' || c.action === 'prepare-order')).toBeFalsy();
});

test('sin sándwich, con el mínimo de bebidas el carrito no frena', async ({ page }) => {
  await gotoApp(page, {});
  await bebidasSolas(page, await MIN(page));
  await page.locator('.m30-go .oro').click();
  // Pasa a pedir la dirección (la 34), sin el aviso de las bebidas.
  await expect(page.locator('.m34')).toBeVisible();
  expect(await avisoDeBebidas(page)).toBe(false);
});

test('con un sándwich, una sola bebida sí pasa', async ({ page }) => {
  await gotoApp(page, {});
  await pedirUnSignature(page, { size: '15' });
  await page.evaluate((id) => (window as any).addSideToCart(id), BEBIDA);
  await page.locator('.m30-go .oro').click();
  await expect(page.locator('.m34')).toBeVisible();
  expect(await avisoDeBebidas(page)).toBe(false);
});
