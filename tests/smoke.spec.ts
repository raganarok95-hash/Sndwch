import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Prueba mínima de humo — antes no existía NINGUNA prueba automatizada versionada en el
// repo (los scripts de Playwright de sesiones anteriores se escribían y se descartaban).
// Esto no reemplaza pruebas manuales antes de un cambio grande, pero atrapa el tipo de
// regresión más básica: que la app ni siquiera cargue o que el flujo de login/registro
// esté roto por un error de sintaxis en index.html.
//
// USA gotoApp COMO LOS OTROS 21 SPECS (corregido 2026-08-27). Antes hacía `page.goto()`
// pelado, sin mockBackend, así que era el ÚNICO test que salía a la red real: pegaba
// get-catalog / get-store-hours / session-check contra el Supabase de PRODUCCIÓN en cada
// PR. El runner de GitHub sí tiene salida a internet — es la misma razón por la que el
// script real de Culqi pisaba el stub y rompía weekly-plan.spec.ts solo en CI. El test
// más básico de la suite no puede depender de que producción esté arriba.
//
// Cómo correrla: npm install && npx playwright install chromium && npm test

test('la app carga y muestra el home de pedido', async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator('text=SIGNATURE').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=BUILD').first()).toBeVisible();
});

test('la pestaña de puntos muestra el formulario de login/registro para un invitado', async ({ page }) => {
  await gotoApp(page);
  await page.locator('text=PUNTOS').first().click();
  await expect(page.locator('input#l-phone, input#r-phone').first()).toBeVisible({ timeout: 10000 });
});
