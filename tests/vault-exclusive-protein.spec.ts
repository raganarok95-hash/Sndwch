import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// THE VAULT (SIG05, menú secreto) usa POLLO CAJÚN (P03) como su proteína — para que el
// desbloqueo (ver SIG_GATES en catalog.ts) valga la pena, esa proteína NO debe poder
// armarse más barata en BUILD YOUR OWN (antes sí se podía, lo que hacía que el "premio"
// costara más que hacerlo tú mismo). Este test cubre que el cliente ya no puede elegirla ahí.

test('POLLO CAJÚN (proteína exclusiva de THE VAULT) no aparece en BUILD YOUR OWN', async ({ page }) => {
  await gotoApp(page, {});

  await page.locator('[onclick*="startOrder(\'byo\')"]').click();
  await expect(page.locator('text=BUILD YOUR OWN')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  // BUILD YOUR OWN es un asistente de 5 pasos (tamaño+pan, proteína, toppings, queso,
  // salsas) — hay que elegir un pan y avanzar antes de llegar al paso de proteína.
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Otras proteínas del catálogo siguen disponibles normalmente.
  await expect(page.locator('text=TERIYAKI').first()).toBeVisible();
  // CAJUN es exclusiva de THE VAULT — no debe listarse como opción de BUILD YOUR OWN.
  await expect(page.locator('text=CAJUN')).not.toBeVisible();
});
