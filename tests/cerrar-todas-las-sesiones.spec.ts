import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// «CERRAR SESIÓN EN TODOS LOS DISPOSITIVOS» NO PUEDE DECIR QUE LO HIZO SI NO LO HIZO (2026-09-24).
//
// Antes el error del servidor se tragaba: la sesión local se cerraba igual y el cliente creía
// haber cerrado todas, mientras un teléfono perdido seguía con la suya abierta. Es seguridad, y
// su modo de fallo es el silencio.

const CLIENTE = { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 1 };

async function pedirCerrarTodas(page: any) {
  await page.evaluate(() => {
    const w = window as any;
    w.token = 'tok';
    w.cust = { phone: '900000001', name: 'Ana', total_orders: 1 };
    w.showConfirm = async () => true;
  });
  await page.evaluate(async () => { await (window as any).doLogoutEverywhere(); });
}

test('si el servidor no confirma, la sesión NO se cierra y se dice que no se pudo', async ({ page }) => {
  await gotoApp(page, {
    'logout-everywhere': () => { throw Object.assign(new Error('sin conexión'), { status: 503 }); },
  });
  await pedirCerrarTodas(page);
  expect(await page.evaluate(() => (window as any).token)).toBe('tok');
  await expect(page.locator('text=/No se pudieron cerrar las otras sesiones/')).toBeVisible();
});

test('si el servidor confirma, la sesión se cierra', async ({ page }) => {
  const calls = await gotoApp(page, { 'logout-everywhere': { success: true } });
  await pedirCerrarTodas(page);
  expect(calls.some((c: any) => c.action === 'logout-everywhere')).toBe(true);
  expect(await page.evaluate(() => (window as any).token)).toBe('');
});
