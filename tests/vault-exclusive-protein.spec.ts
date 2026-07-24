import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// THE VAULT (SIG05, menú secreto) usa POLLO CAJÚN (P03) como su proteína — para que el
// desbloqueo (ver SIG_GATES en catalog.ts) valga la pena, esa proteína NO debe poder
// armarse más barata en ARMA EL TUYO (antes sí se podía, lo que hacía que el "premio"
// costara más que hacerlo tú mismo). Este test cubre que el cliente ya no puede elegirla ahí.
// (ARMA EL TUYO es el nombre en español de lo que el código interno sigue llamando "byo"/
// BUILD YOUR OWN — renombrado en la pasada de identidad visual "Prada Caffè".)

test('POLLO CAJÚN (proteína exclusiva de THE VAULT) no aparece en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  // El home ahora muestra Signatures/Arma el tuyo como tabs (fase 2 de fidelidad al
  // mockup) — Signatures es la tab activa por defecto, hay que cambiar a Arma el tuyo
  // antes de que el panel BYO (y su botón "Ver el paso a paso completo") exista en el DOM.
  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  // ARMA EL TUYO es un asistente de 5 pasos (tamaño+pan, proteína, toppings, queso,
  // salsas) — hay que elegir un pan y avanzar antes de llegar al paso de proteína.
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Otras proteínas del catálogo siguen disponibles normalmente.
  await expect(page.locator('text=TERIYAKI').first()).toBeVisible();
  // CAJUN es exclusiva de THE VAULT — no debe listarse como opción de ARMA EL TUYO.
  await expect(page.locator('text=CAJUN')).not.toBeVisible();
});
