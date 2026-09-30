import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA APP EN PC Y LAPTOP (dueño, 2026-09-30): «sale recortada como si fuera en cel». Desde 900 px
// de ancho las pantallas del camino de compra ocupan la pantalla entera, y las de elegir se
// parten en foto (izquierda) y texto (derecha). Modo de fallo: SILENCIO — si el bloque de
// escritorio del shell se pierde o otra regla lo pisa (pasó al escribirlo: quedó antes de las
// reglas de cada pantalla y no se aplicó ninguna), todo sigue funcionando en una columna de
// 480 px y ninguna otra prueba lo nota, porque todas corren a ancho de celular.
test.use({ viewport: { width: 1440, height: 900 } });

test('en PC el Mundo SANDO y la ficha usan todo el ancho: foto a la izquierda, texto a la derecha', async ({ page }) => {
  await gotoApp(page, {});
  const app = await page.locator('#app').boundingBox();
  expect(app!.width).toBeGreaterThan(1400);

  const plato = page.locator('.m15 .plato').first();
  const foto = await plato.locator('.foto').boundingBox();
  const ficha = await plato.locator('.ficha').boundingBox();
  expect(foto!.x + foto!.width).toBeLessThanOrEqual(721);
  expect(foto!.height).toBeGreaterThan(850);
  expect(ficha!.x).toBeGreaterThanOrEqual(720);

  await plato.locator('button.b').click();
  await page.locator('.f01').waitFor();
  const f = await page.locator('.f01 .foto').boundingBox();
  const cuerpo = await page.locator('.f01 .cuerpo').boundingBox();
  const pie = await page.locator('.f01 .pie').boundingBox();
  expect(f!.x + f!.width).toBeLessThanOrEqual(721);
  expect(cuerpo!.x).toBeGreaterThanOrEqual(720);
  expect(pie!.x).toBeGreaterThanOrEqual(720);
  // En escritorio la ficha carga la foto vertical, que muestra el sándwich entero.
  const src = await page.locator('.f01 .foto img').evaluate((i: HTMLImageElement) => i.currentSrc);
  expect(src).toMatch(/_v\.webp$/);
});

test('en celular sigue la columna de siempre', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, {});
  const foto = await page.locator('.m15 .plato .foto').first().boundingBox();
  expect(foto!.width).toBeGreaterThan(380);
});
