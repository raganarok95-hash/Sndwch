import { test, expect } from '@playwright/test';
import { gotoApp, irAlArmador, siguientePaso } from './helpers';

// el menú secreto (SIG05) usa, en su semilla actual, POLLO CAJÚN (P03) como su proteína — para que el
// desbloqueo (ver SIG_GATES en catalog.ts) valga la pena, esa proteína NO debe poder
// armarse más barata en ARMA EL TUYO (antes sí se podía, lo que hacía que el "premio"
// costara más que hacerlo tú mismo). Este test cubre que el cliente ya no puede elegirla ahí.
// (ARMA EL TUYO es el nombre en español de lo que el código interno sigue llamando "byo"/
// BUILD YOUR OWN — renombrado en la pasada de identidad visual "Prada Caffè".)

test('POLLO CAJÚN (proteína exclusiva del menú secreto) no aparece en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  // El armador es el lado de WICHO (se entra por la puerta) y arranca en el TAMAÑO; el paso
  // de proteína, que es el que mira esta prueba, es el tercero: tamaño → pan → proteína.
  await irAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguientePaso(page);
  await page.locator('[onclick^="base="]').first().click();
  await siguientePaso(page);
  await expect(page.locator('[aria-label="PROTEÍNA (aquí)"]')).toHaveCount(1);

  // Otras proteínas del catálogo siguen disponibles normalmente.
  await expect(page.locator('text=TERIYAKI').first()).toBeVisible();
  // CAJUN es exclusiva del menú secreto (semilla actual, ver secret_signature) — no debe listarse como opción de ARMA EL TUYO.
  await expect(page.locator('text=CAJUN')).not.toBeVisible();
});
