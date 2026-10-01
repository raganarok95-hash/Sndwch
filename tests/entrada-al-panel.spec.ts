import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// La cuenta de admin tiene que poder llegar al panel (dueño, 2026-10-01: «no tengo como entrar a
// admin»). El rediseño de la cuenta borró la única entrada y nada lo avisó: acceso perdido en
// silencio. Y una cuenta normal no la ve.
for (const admin of [true, false]) {
  test(`la cuenta ${admin ? 'de admin SÍ' : 'normal NO'} muestra la entrada al panel`, async ({ page }) => {
    await gotoApp(page, {
      login: { customer: { phone: '900000001', name: 'Prueba', points: 0 }, isAdmin: admin, token: 't' },
      'addresses-list': { addresses: [] },
      '*': { success: true },
    });
    await entrarConTelefono(page);
    await page.waitForFunction(() => (window as any).cust);
    await page.evaluate(() => { const w = window as any; w.sndScreen = 'p_home'; w.render(); });
    const fila = page.getByRole('button', { name: /Panel de admin/ });
    if (admin) await expect(fila).toBeVisible(); else await expect(fila).toHaveCount(0);
  });
}
