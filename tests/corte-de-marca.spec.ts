import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// El corte del menú ES el "//" de marca, no un separador cualquiera: dos barras idénticas
// con el mismo skew y proporción que `.wm-mark i`, el wordmark que ya está en producción.
//
// ⚠ SU MODO DE FALLO ES QUE EXISTE Y NO SE VE. Al implementarlo aparecieron DOS defectos
// seguidos, ninguno de los cuales rompe nada ni sale en el typecheck:
//   1. El panel celeste va después en el DOM y pintaba ENCIMA del corte (faltaba z-index).
//   2. Las barras llevan `height:100%` y su contenedor tenía altura automática, así que el
//      porcentaje resolvía a 0: el corte medía 29px de ancho por CERO de alto.
// En los dos casos la app se veía perfectamente bien, solo que sin la marca. Por eso esta
// prueba mide GEOMETRÍA REAL y no la presencia del elemento.
test('el corte del menú se ve de verdad: dos barras idénticas con alto real', async ({ page }) => {
  await gotoApp(page, {});

  const cut = page.locator('.sw-cut').first();
  await expect(cut).toBeAttached();

  const geo = await cut.evaluate((el) => {
    const bars = Array.from(el.querySelectorAll('i')) as HTMLElement[];
    return bars.map((b) => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), skew: getComputedStyle(b).transform };
    });
  });

  expect(geo).toHaveLength(2);
  // Alto real, no 0. Es el defecto que se coló al implementarlo.
  expect(geo[0].h).toBeGreaterThan(40);
  // IDÉNTICAS. El dueño ya corrigió una ronda de logo donde las dos barras salieron de
  // alturas distintas: "son dos del mismo tamaño".
  expect(geo[0].h).toBe(geo[1].h);
  expect(geo[0].w).toBe(geo[1].w);
  // Y las dos inclinadas, que es lo que las vuelve el glifo y no dos rectángulos.
  expect(geo[0].skew).toBe(geo[1].skew);
  expect(geo[0].skew).not.toBe('none');
});

// El corte no decora: marca de qué lado estás. Al cambiar de lado tiene que MOVERSE, o
// deja de significar algo y vuelve a ser un adorno.
test('el corte se desplaza al cambiar de lado', async ({ page }) => {
  await gotoApp(page, {});
  const cut = page.locator('.sw-cut').first();

  const x1 = (await cut.boundingBox())!.x;
  await page.getByRole('button', { name: 'Arma el tuyo' }).click();
  await page.waitForTimeout(600);
  const x2 = (await cut.boundingBox())!.x;

  // Se va a la izquierda: el lado celeste creció y se quedó con la pantalla.
  expect(x2).toBeLessThan(x1 - 30);
});

// Los dos lados siguen siendo <button>. No es un detalle de implementación: un panel que
// cambia la pantalla tiene que ser alcanzable con teclado y anunciable por un lector de
// pantalla, y además es lo que hace que el resto de la suite los pueda localizar por rol.
test('los dos lados del corte siguen siendo botones accesibles', async ({ page }) => {
  await gotoApp(page, {});
  await expect(page.getByRole('button', { name: 'Signatures' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Arma el tuyo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bebidas' })).toBeVisible();

  // aria-pressed dice cuál está activo, que es la única forma de saberlo sin ver el color.
  await expect(page.getByRole('button', { name: 'Signatures' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Arma el tuyo' }).click();
  await expect(page.getByRole('button', { name: 'Arma el tuyo' })).toHaveAttribute('aria-pressed', 'true');
});
