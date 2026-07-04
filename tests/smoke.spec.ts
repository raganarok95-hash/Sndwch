import { test, expect } from '@playwright/test';
import path from 'path';

// Prueba mínima de humo — antes no existía NINGUNA prueba automatizada versionada en el
// repo (los scripts de Playwright de sesiones anteriores se escribían y se descartaban).
// Esto no reemplaza pruebas manuales antes de un cambio grande, pero atrapa el tipo de
// regresión más básica: que la app ni siquiera cargue o que el flujo de login/registro
// esté roto por un error de sintaxis en index.html.
//
// Cómo correrla: npm install && npx playwright install chromium && npm test

const APP_FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

test('la app carga y muestra el home de pedido', async ({ page }) => {
  await page.goto(APP_FILE);
  await expect(page.locator('text=SIGNATURE').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=BUILD').first()).toBeVisible();
});

test('la pestaña de puntos muestra el formulario de login/registro para un invitado', async ({ page }) => {
  await page.goto(APP_FILE);
  await page.locator('text=PUNTOS').first().click();
  await expect(page.locator('input#l-phone, input#r-phone').first()).toBeVisible({ timeout: 10000 });
});
