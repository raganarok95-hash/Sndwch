import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// PROMESA: después del día de apertura, quien entra NO ve «Abrimos el 20 de noviembre · Te avisamos el
// día que abramos» mientras la app espera el horario del servidor.
// MODO DE FALLO (visto el 2026-11-22, 0 pedidos desde la apertura): businessLaunched arrancaba en false
// y get-store-hours tarda hasta 4 s; en ese rato el cliente leía que todavía no abríamos y se iba.
test('después de abrir, mientras carga el horario no se ve el aviso de «todavía no abrimos»', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-22T17:00:00Z'));
  await mockBackend(page, {});
  let soltar: () => void = () => {};
  const horario = new Promise<void>((r) => { soltar = r; });
  await page.route('**/functions/v1/api', async (route) => {
    if (route.request().postDataJSON()?.action !== 'get-store-hours') return route.fallback();
    await horario;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ businessLaunched: true }) });
  });
  await page.goto(APP_FILE);
  await page.locator('body').waitFor();
  await expect(page.locator('#app')).not.toBeEmpty();
  expect(await page.locator('[data-accion="aviso-antes-de-abrir"]').count()).toBe(0);
  soltar();
});
