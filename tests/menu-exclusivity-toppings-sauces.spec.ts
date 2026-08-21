import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Extiende el mismo criterio de AU JUS (S13, chicago-exclusive-sauce.spec.ts) y POLLO
// CAJÚN (P03, vault-exclusive-protein.spec.ts) a los ingredientes que el subagente de
// menú marcó como candidatos y el dueño confirmó tratar igual: GIARDINIERA (T07, solo
// aparecía en THE CHICAGO/SIG07) y JALAPEÑO (T04) + SPICY MAYO/PICANTE MIEL (S02/S12,
// solo aparecían en el menú secreto/SIG05) — sigOnly/vaultOnly en TOPS/SAUCES (src/app.ts) +
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

test('JALAPEÑO + SPICY MAYO/PICANTE MIEL (exclusivos del menú secreto) no aparecen en ARMA EL TUYO', async ({ page }) => {
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

  // Otras salsas siguen disponibles normalmente.
  await expect(page.locator('text=Aioli').first()).toBeVisible();

  // Desde 2026-08-21 la sección "Picantes //" SÍ debe aparecer: S09 (Chimichurri // Piña
  // y Ají) volvió al catálogo marcada como picante y es pública. Hasta esa fecha las 2
  // únicas salsas picantes eran S02/S12, ambas exclusivas del menú secreto, así que la
  // sección nunca se renderizaba y ARMA EL TUYO no tenía NINGUNA opción picante para el
  // público general — el hueco más grave que encontró el council de salsas.
  await expect(page.locator('text=Picantes //')).toBeVisible();
  await expect(page.locator('text=Chimichurri').first()).toBeVisible();

  // Pero las dos del menú secreto siguen ocultas: que exista picante público no debe
  // filtrar las exclusivas.
  await expect(page.locator('text=Spicy').first()).not.toBeVisible();
  await expect(page.locator('text=Picante // Miel')).not.toBeVisible();
});
