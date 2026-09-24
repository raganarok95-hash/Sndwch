import { test, expect } from '@playwright/test';
import { gotoApp, irAlArmador, siguientePaso } from './helpers';

// el menú secreto (SIG05) usa, en su semilla actual, POLLO CAJÚN (P03) como su proteína — para que el
// desbloqueo (ver SIG_GATES en catalog.ts) valga la pena, esa proteína NO debe poder
// armarse más barata en ARMA EL TUYO (antes sí se podía, lo que hacía que el "premio"
// costara más que hacerlo tú mismo). Este test cubre que el cliente ya no puede elegirla ahí.
// (ARMA EL TUYO es el nombre en español de lo que el código interno sigue llamando "byo"/
// BUILD YOUR OWN — renombrado en la pasada de identidad visual "Prada Caffè".)

test('la proteína exclusiva del menú secreto no aparece en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  // El armador es el lado de WICHO (se entra por la puerta) y arranca en el TAMAÑO; el paso
  // de proteína, que es el que mira esta prueba, es el tercero: tamaño → pan → proteína.
  await irAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguientePaso(page);
  await page.locator('[onclick^="base="]').first().click();
  await siguientePaso(page);
  await expect(page.locator('[aria-label="PROTEÍNA (aquí)"]')).toHaveCount(1);

  // Qué es exclusivo del secreto y qué es del armador se pregunta a la carta de la app, no se
  // escribe: el menú secreto rota cada mes y el armador cambia con la carta.
  const { exclusivas, delArmador } = await page.evaluate(() => {
    const w = window as any;
    return {
      exclusivas: w.PROTS.filter((p: any) => p.vaultOnly).map((p: any) => p.id),
      delArmador: w.PROTS.filter((p: any) => !p.vaultOnly && !p.sigOnly).map((p: any) => p.id),
    };
  });
  expect(exclusivas.length, 'la carta no marca ninguna proteína como exclusiva del secreto').toBeGreaterThan(0);
  // Las del armador siguen disponibles normalmente…
  for (const id of delArmador) await expect(page.locator(`[onclick^="prot='${id}'"]`).first()).toBeVisible();
  // …y la del secreto no se lista como opción de ARMA EL TUYO.
  for (const id of exclusivas) await expect(page.locator(`[onclick^="prot='${id}'"]`)).toHaveCount(0);
});
