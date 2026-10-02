import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// EL CLIENTE PUEDE OPONERSE A LA MEDICIÓN PUBLICITARIA (Ley 29733), 2026-10-02.
// Promesa: desde «Tu cuenta · Avisos» se apaga la medición, y el interruptor muestra lo que el
// SERVIDOR guardó. Modo de fallo: el silencio legal — al rehacer «Tu cuenta» el interruptor
// desapareció y toggleAdTracking quedó sin botón: el derecho existía en el código y en ninguna
// pantalla. Nada revienta; la Privacidad promete algo que nadie puede ejercer.
test('el interruptor de medición de anuncios existe, llama al servidor y muestra su respuesta', async ({ page }) => {
  const llamadas: any[] = [];
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0, ad_tracking_opt_out: false }, isAdmin: false, token: 't' },
    'set-ad-tracking': (b: any) => { llamadas.push(b); return { customer: { phone: '900000001', name: 'Prueba', points: 0, ad_tracking_opt_out: b.optOut } }; },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(() => { const w = window as any; w.sndScreen = 'p_avisos'; w.render(); });
  const llave = page.locator('[data-accion="medicion-anuncios"]');
  await expect(llave).toHaveAttribute('aria-checked', 'true');
  await llave.click();
  await expect.poll(() => llamadas.length).toBe(1);
  expect(llamadas[0].optOut).toBe(true);
  await expect(llave).toHaveAttribute('aria-checked', 'false');
});
