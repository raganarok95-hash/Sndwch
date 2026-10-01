import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA CARTA DEL LADO SANDO · EL TAROT (aprobado 2026-10-01). Modo de fallo: SILENCIO — una carta
// que abre el plato de OTRO sándwich, o la ✕ del plato que saca a la puerta en vez de volver.
// En el celular de cada carta se ve una franja: el PRIMER toque la levanta y dice cuál es, el
// segundo la abre. La estrella llega levantada.
async function alTarot(page: any) {
  await gotoApp(page, {});
  await page.evaluate(() => (window as any).volverALaPuerta());
  await page.getByRole('button', { name: /Ya está resuelto/ }).click();
  await page.locator('.mtarot').waitFor();
}
const visibles = (page: any) => page.evaluate(() => {
  const w = window as any;
  return w.sigsEnOrden(w.SIGS.filter((x: any) => !x.secret && w.sigAvailable(x))).map((s: any) => s.n);
});

test('al entrar al lado SANDO se ven todas las cartas y la del secreto boca abajo', async ({ page }) => {
  await alTarot(page);
  const nombres = await visibles(page);
  await expect(page.locator('.mtarot .k:not(.x)')).toHaveCount(nombres.length);
  for (const n of nombres) await expect(page.locator('.mtarot .k', { hasText: n })).toHaveCount(1);
  await expect(page.locator('.mtarot .k.x')).toHaveCount(1);
  await expect(page.locator('.m15')).toHaveCount(0);
});

test('cada carta abre SU plato, y la ✕ del plato vuelve a las cartas', async ({ page }) => {
  await alTarot(page);
  const nombres = await visibles(page);
  for (const n of [nombres[0], nombres[nombres.length - 1]]) {
    const carta = page.locator('.mtarot .k', { hasText: n });
    if ((await carta.getAttribute('aria-pressed')) !== 'true') {
      await carta.dispatchEvent('click');
      // El primer toque NO abre: levanta la carta y dice cuál es.
      await expect(page.locator('.mtarot')).toBeVisible();
      await expect(page.locator('.mtarot .elegida')).toContainText(n);
      await expect(carta).toHaveAttribute('aria-pressed', 'true');
    }
    await carta.dispatchEvent('click');
    await page.locator('.m15').waitFor();
    await page.waitForTimeout(150);
    const enPantalla = await page.evaluate(() => {
      const p = document.querySelector('.m15 .pistas') as HTMLElement;
      const s = Array.from(document.querySelectorAll('.m15 .pistas > section')) as HTMLElement[];
      const actual = s.find((x) => Math.abs(x.offsetTop - p.scrollTop) < 4);
      return actual ? actual.getAttribute('aria-label') : null;
    });
    expect(enPantalla, `la carta «${n}» abrió otro plato`).toBe(n);
    await page.getByRole('button', { name: 'Volver a las cartas' }).click();
    await expect(page.locator('.mtarot')).toBeVisible();
  }
});

test('la carta boca abajo abre el plato del secreto', async ({ page }) => {
  await alTarot(page);
  await page.locator('.mtarot .k.x').dispatchEvent('click');
  await expect(page.locator('.mtarot .elegida')).toContainText('secreto');
  await page.locator('.mtarot .elegida button').click();
  await page.locator('.m15').waitFor();
  await page.waitForTimeout(150);
  const label = await page.evaluate(() => {
    const p = document.querySelector('.m15 .pistas') as HTMLElement;
    const s = Array.from(document.querySelectorAll('.m15 .pistas > section')) as HTMLElement[];
    const a = s.find((x) => Math.abs(x.offsetTop - p.scrollTop) < 4);
    return a ? a.getAttribute('aria-label') : null;
  });
  expect(label).toBe('El sándwich secreto');
});

test('la estrella llega levantada: un solo toque y ya se abre', async ({ page }) => {
  await alTarot(page);
  const estrella = await page.evaluate(() => { const w = window as any; const s = w.SIGS.find((x: any) => x.recommended && !x.secret); return s ? s.n : null; });
  test.skip(!estrella, 'la carta no tiene estrella');
  await expect(page.locator('.mtarot .k.sel')).toContainText(estrella!);
  await expect(page.locator('.mtarot .elegida button')).toContainText(estrella!);
});
