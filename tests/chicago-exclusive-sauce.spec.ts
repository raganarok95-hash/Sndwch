import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// AU JUS (S13) es la salsa exclusiva de THE CHICAGO (SIG07, Italian Beef) — el caldo de
// la cocción de la res mechada no tiene sentido como salsa suelta fuera de ese sándwich
// (hallazgo del dueño: antes se podía elegir en cualquier build sin relación con el
// Chicago). Mismo criterio que POLLO CAJÚN/THE VAULT (ver vault-exclusive-protein.spec.ts):
// sigOnly en SAUCES (src/app.ts) + SIG_ONLY_SAUCES en el backend (catalog.ts).

test('AU JUS (salsa exclusiva de THE CHICAGO) no aparece en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  // ARMA EL TUYO es un asistente de 5 pasos (tamaño+pan, proteína, toppings, queso,
  // salsas) — hay que avanzar los 4 primeros para llegar al paso de salsas.
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Otras salsas siguen disponibles normalmente.
  await expect(page.locator('text=Aioli').first()).toBeVisible();
  // Au Jus es exclusiva de THE CHICAGO — no debe listarse como opción de ARMA EL TUYO.
  await expect(page.locator('text=Au Jus')).not.toBeVisible();
});
