import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Extiende el mismo criterio de AU JUS (S13, chicago-exclusive-sauce.spec.ts) y POLLO
// CAJÚN (P03, vault-exclusive-protein.spec.ts) a los ingredientes que el subagente de
// menú marcó como candidatos y el dueño confirmó tratar igual: GIARDINIERA (T07, solo
// aparecía en THE CHICAGO/SIG07) y JALAPEÑO (T04) + SPICY MAYO/PICANTE MIEL (S02/S12,
// solo aparecían en THE VAULT/SIG05) — sigOnly/vaultOnly en TOPS/SAUCES (src/app.ts) +
// SIG_ONLY_TOPS/VAULT_ONLY_TOPS/VAULT_ONLY_SAUCES en el backend (catalog.ts).

test('GIARDINIERA (topping exclusivo de THE CHICAGO) no aparece en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Otros toppings siguen disponibles normalmente.
  await expect(page.locator('text=Tomate').first()).toBeVisible();
  // Giardiniera es exclusiva de THE CHICAGO — no debe listarse como opción de ARMA EL TUYO.
  await expect(page.locator('text=Giardiniera')).not.toBeVisible();
});

test('JALAPEÑO + SPICY MAYO/PICANTE MIEL (exclusivos de THE VAULT) no aparecen en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Paso de toppings: Jalapeño no debe listarse.
  await expect(page.locator('text=Jalapeño')).not.toBeVisible();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // toppings -> queso
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // queso -> salsas

  // Otras salsas siguen disponibles normalmente; el encabezado "Picantes //" ya no debe
  // aparecer (ambas salsas picantes del catálogo eran S02/S12, ahora vaultOnly).
  await expect(page.locator('text=Aioli').first()).toBeVisible();
  await expect(page.locator('text=Picantes //')).not.toBeVisible();
  await expect(page.locator('text=Spicy').first()).not.toBeVisible();
  await expect(page.locator('text=Picante').first()).not.toBeVisible();
});
